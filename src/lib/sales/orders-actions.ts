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
  lines: { skuId: string; qty: number }[];
};

export type CreateOrderResult =
  | { ok: true; orderId: string; orderNo: string }
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

    // Resolve a price for each line in this order's context.
    const priced: OrderLineInput[] = await Promise.all(
      input.lines.map(async (l) => ({
        skuId: l.skuId,
        qty: l.qty,
        unitPrice: await priceFor({
          skuId: l.skuId,
          retailerId: input.retailerId ?? null,
          route: input.route ?? null,
        }),
      })),
    );

    const invalid = validateOrderLines(priced);
    if (invalid) return { ok: false, error: invalid };

    const totals = computeOrderTotals(priced);
    const orderNo = await nextOrderNo(supabase);

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        order_no: orderNo,
        retailer_id: input.retailerId ?? null,
        route: input.route ?? null,
        status: "draft",
        subtotal: totals.subtotal,
        tax_total: totals.taxTotal,
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
        unit_price: l.unitPrice,
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
      after: { orderNo, route: input.route ?? null, total: totals.total, lines: totals.lines.length },
    });

    revalidatePath("/orders");
    return { ok: true, orderId: order.id, orderNo };
  } catch (err) {
    console.error("createOrder: unexpected error —", err);
    return { ok: false, error: "Unexpected error creating the order." };
  }
}
