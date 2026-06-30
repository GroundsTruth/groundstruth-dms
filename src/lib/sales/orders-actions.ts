"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit/service";
import { priceFor } from "./data";
import {
  validateOrderLines,
  computeOrderTotals,
  type OrderLineInput,
} from "./order-logic";

/**
 * Punch an order (M19). Resolves each line's price via priceFor (route/retailer
 * context), guards unpriced SKUs, computes totals, then writes order + order_lines.
 * Order is a DRAFT — no stock/money impact yet; that's confirmAndInvoice (M22).
 * Atomicity: order is inserted first; if the lines fail, the order is rolled back
 * (deleted) so we never persist a header without lines.
 * TODO(auth): gate to owner/rep + stamp created_by once M05–M09 land.
 */
export type CreateOrderInput = {
  retailerId?: string | null;
  route?: string | null;
  listType?: "retail" | "wholesale";
  lines: { skuId: string; qty: number; chargedPrice?: number | null }[];
};

export type CreateOrderResult =
  | { ok: true; orderId: string; orderNo: string; needsApproval: boolean }
  | { ok: false; error: string };

type AdminClient = ReturnType<typeof createAdminClient>;

/** Next "ORD0001" code = highest existing numeric suffix + 1. */
async function nextOrderNo(supabase: AdminClient): Promise<string> {
  const { data } = await supabase.from("orders").select("order_no");
  const max = (data ?? []).reduce((m, r) => {
    const n = Number(String(r.order_no).replace(/\D/g, ""));
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `ORD${String(max + 1).padStart(4, "0")}`;
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  try {
    const supabase = createAdminClient();

    const listType = input.listType ?? "retail";
    // Resolve the LIST price per line; the rep may charge below it (→ approval).
    const priced: OrderLineInput[] = await Promise.all(
      input.lines.map(async (l) => ({
        skuId: l.skuId,
        qty: l.qty,
        listPrice: await priceFor({
          skuId: l.skuId,
          retailerId: input.retailerId ?? null,
          route: input.route ?? null,
          listType,
        }),
        chargedPrice: l.chargedPrice ?? null,
      })),
    );

    const invalid = validateOrderLines(priced);
    if (invalid) return { ok: false, error: invalid };

    const totals = computeOrderTotals(priced);
    const orderNo = await nextOrderNo(supabase);
    // #5: any below-list line → the whole order waits for admin approval.
    const status = totals.needsApproval ? "pending_approval" : "draft";

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        order_no: orderNo,
        retailer_id: input.retailerId ?? null,
        route: input.route ?? null,
        status,
        subtotal: totals.subtotal,
        tax_total: 0, // tax extracted at invoice time (inclusive pricing)
        total: totals.total,
      })
      .select("id")
      .single();

    if (orderErr || !order) {
      console.error("createOrder: order insert error —", orderErr?.message);
      return { ok: false, error: "Could not create the order. Please try again." };
    }

    const { error: linesErr } = await supabase.from("order_lines").insert(
      totals.lines.map((l) => ({
        order_id: order.id,
        sku_id: l.skuId,
        qty: l.qty,
        unit_price: l.unitPrice, // charged (GST-inclusive)
        list_price: l.listPrice,
        discount_pct: l.discountPct,
        line_total: l.lineTotal,
      })),
    );

    if (linesErr) {
      // Roll back the header so we never leave an order without its lines.
      await supabase.from("orders").delete().eq("id", order.id);
      console.error("createOrder: lines insert error (order rolled back) —", linesErr.message);
      return { ok: false, error: "Could not save the order lines. Please try again." };
    }

    await logAudit({
      action: "order.create",
      entityTable: "orders",
      entityId: order.id,
      after: { orderNo, route: input.route ?? null, total: totals.total, lines: totals.lines.length, status },
    });

    revalidatePath("/orders");
    return { ok: true, orderId: order.id, orderNo, needsApproval: totals.needsApproval };
  } catch (err) {
    console.error("createOrder: unexpected error —", err);
    return { ok: false, error: "Unexpected error creating the order." };
  }
}

/**
 * Approve / reject a below-list order (audit #5). Approve → 'confirmed' (now
 * invoiceable); reject → 'cancelled'. TODO(auth): gate to owner once AUTH_ENABLED.
 */
export type OrderActionResult = { ok: true } | { ok: false; error: string };

export async function approveOrder(orderId: string): Promise<OrderActionResult> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("orders")
      .update({ status: "confirmed" })
      .eq("id", orderId)
      .eq("status", "pending_approval");
    if (error) return { ok: false, error: "Could not approve the order." };
    await logAudit({ action: "order.approve", entityTable: "orders", entityId: orderId });
    revalidatePath("/orders");
    return { ok: true };
  } catch {
    return { ok: false, error: "Unexpected error approving the order." };
  }
}

export async function rejectOrder(orderId: string): Promise<OrderActionResult> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId)
      .eq("status", "pending_approval");
    if (error) return { ok: false, error: "Could not reject the order." };
    await logAudit({ action: "order.reject", entityTable: "orders", entityId: orderId });
    revalidatePath("/orders");
    return { ok: true };
  } catch {
    return { ok: false, error: "Unexpected error rejecting the order." };
  }
}
