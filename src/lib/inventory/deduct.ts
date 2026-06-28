import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit/service";
import { validateDeduct, type DeductInput, type Allocation } from "./fifo-logic";

/**
 * FIFO stock deduction (M13) — server-side. Validates, then calls the atomic
 * `deduct_stock` RPC (oldest-expiry batch first, all-or-nothing), then writes a
 * non-blocking audit row. Returns the per-batch allocations on success so the
 * money path (confirmAndInvoice, M22) can stamp invoice_lines.batch_id.
 *
 * Insufficient stock surfaces as { ok:false } — the RPC rolls the whole deduct back,
 * so stock is never left negative or partially deducted.
 */
export type DeductResult =
  | { ok: true; allocations: Allocation[] }
  | { ok: false; error: string };

export async function deductStock(input: DeductInput): Promise<DeductResult> {
  const invalid = validateDeduct(input);
  if (invalid) return { ok: false, error: invalid };

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("deduct_stock", {
      p_sku_id: input.skuId,
      p_qty: input.qty,
      p_actor: input.actorUserId ?? null,
      p_ref_type: input.refType ?? null,
      p_ref_id: input.refId ?? null,
    });

    if (error) {
      // The RPC raises on insufficient stock — surface a clean caller-facing message.
      const insufficient = /insufficient stock/i.test(error.message);
      console.error("deductStock: rpc error —", error.message);
      return {
        ok: false,
        error: insufficient
          ? "Not enough stock on hand for this SKU."
          : "Could not deduct stock. Please try again.",
      };
    }

    const allocations: Allocation[] = (data ?? []).map(
      (row: { batch_id: string; qty: number }) => ({
        batchId: row.batch_id,
        qty: Number(row.qty),
      }),
    );

    // Side-effect: audit must never block or fail the deduct (CLAUDE.md rule 4).
    await logAudit({
      actorUserId: input.actorUserId ?? null,
      action: "stock.deduct",
      entityTable: "stock_batches",
      entityId: input.refId ?? null,
      after: { skuId: input.skuId, qty: input.qty, allocations },
    });

    return { ok: true, allocations };
  } catch (err) {
    console.error("deductStock: unexpected error —", err);
    return { ok: false, error: "Unexpected error deducting stock." };
  }
}
