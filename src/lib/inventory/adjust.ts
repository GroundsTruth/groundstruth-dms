"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit/service";

/**
 * Stock adjustment (audit #15/#16) — wastage/expiry (negative delta), found/count-up
 * (positive), or a physical-count correction (delta = counted − system). Calls the
 * atomic adjust_stock RPC + audits. Server-only.
 */
export type AdjustResult = { ok: true } | { ok: false; error: string };

export async function adjustStock(
  batchId: string,
  qtyDelta: number,
  reason: string,
): Promise<AdjustResult> {
  if (!batchId) return { ok: false, error: "Pick a batch." };
  if (typeof qtyDelta !== "number" || Number.isNaN(qtyDelta) || qtyDelta === 0) {
    return { ok: false, error: "Enter a non-zero adjustment." };
  }
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.rpc("adjust_stock", {
      p_batch_id: batchId,
      p_qty_delta: qtyDelta,
      p_reason: reason || "adjustment",
      p_actor: null,
    });
    if (error) {
      const below = /below 0/i.test(error.message);
      console.error("adjustStock: rpc error —", error.message);
      return { ok: false, error: below ? "Adjustment would take stock below 0." : "Could not adjust stock." };
    }
    await logAudit({
      action: "stock.adjust",
      entityTable: "stock_batches",
      entityId: batchId,
      after: { qtyDelta, reason },
    });
    revalidatePath("/inventory");
    return { ok: true };
  } catch (err) {
    console.error("adjustStock: unexpected error —", err);
    return { ok: false, error: "Unexpected error adjusting stock." };
  }
}
