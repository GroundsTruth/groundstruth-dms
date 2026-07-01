"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit/service";

/**
 * Confirm & invoice an order (M22) — server action over the atomic confirm_and_invoice
 * RPC (invoice + FIFO deduct + numbering, all-or-nothing). Audited. Returns the new
 * invoice id so the caller can navigate to it.
 * TODO(auth): stamp actor from session once M05–M09 land.
 */
export type ConfirmInvoiceResult =
  | { ok: true; invoiceId: string }
  | { ok: false; error: string };

export async function confirmAndInvoice(orderId: string): Promise<ConfirmInvoiceResult> {
  try {
    const supabase = createAdminClient();

    // #5: a below-list order must be approved before it can be invoiced.
    const { data: ord } = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .maybeSingle();
    if (ord?.status === "pending_approval") {
      return { ok: false, error: "This order is below list price and needs admin approval first." };
    }

    const { data, error } = await supabase.rpc("confirm_and_invoice", {
      p_order_id: orderId,
      p_actor: null,
    });

    if (error) {
      const insufficient = /insufficient stock/i.test(error.message);
      const already = /already invoiced/i.test(error.message);
      console.error("confirmAndInvoice: rpc error —", error.message);
      return {
        ok: false,
        error: insufficient
          ? "Not enough stock on hand to invoice this order."
          : already
            ? "This order is already invoiced."
            : "Could not invoice the order. Please try again.",
      };
    }

    const invoiceId = data as string;
    await logAudit({
      action: "order.invoice",
      entityTable: "invoices",
      entityId: invoiceId,
      after: { orderId },
    });

    revalidatePath("/orders");
    revalidatePath("/invoices");
    return { ok: true, invoiceId };
  } catch (err) {
    console.error("confirmAndInvoice: unexpected error —", err);
    return { ok: false, error: "Unexpected error invoicing the order." };
  }
}
