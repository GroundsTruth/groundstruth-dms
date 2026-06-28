import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit/service";
import { validateReceive, type ReceiveInput } from "./logic";

/**
 * Receive stock (M12) — server-side. Validates, then calls the atomic
 * `receive_stock` RPC (batch upsert + inward movement in ONE txn), then writes a
 * non-blocking audit row. Returns a typed result; never throws to the caller.
 *
 * Auth: actorUserId is null until M05–M09 land (then pass the session user).
 */
export type ReceiveResult =
  | { ok: true; batchId: string }
  | { ok: false; error: string };

export async function receiveStock(input: ReceiveInput): Promise<ReceiveResult> {
  const invalid = validateReceive(input);
  if (invalid) return { ok: false, error: invalid };

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("receive_stock", {
      p_sku_id: input.skuId,
      p_batch_no: input.batchNo.trim(),
      p_qty: input.qty,
      p_mfg_date: input.mfgDate ?? null,
      p_expiry_date: input.expiryDate ?? null,
      p_actor: input.actorUserId ?? null,
    });

    if (error) {
      console.error("receiveStock: rpc error —", error.message);
      return { ok: false, error: "Could not receive stock. Please try again." };
    }

    const batchId = data as string;
    // Side-effect: audit must never block or fail the receive (CLAUDE.md rule 4).
    await logAudit({
      actorUserId: input.actorUserId ?? null,
      action: "stock.receive",
      entityTable: "stock_batches",
      entityId: batchId,
      after: { skuId: input.skuId, batchNo: input.batchNo.trim(), qty: input.qty },
    });

    return { ok: true, batchId };
  } catch (err) {
    console.error("receiveStock: unexpected error —", err);
    return { ok: false, error: "Unexpected error receiving stock." };
  }
}
