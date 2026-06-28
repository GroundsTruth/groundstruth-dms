"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit/service";
import type { ReturnLineInput } from "./returns-logic";

/**
 * Record van returns (M26) — server action. Calls the atomic record_returns RPC
 * (qty back to batch + van_return movement + qty_returned bump, all-or-nothing).
 * Zero-qty lines are ignored. Audited. TODO(auth): stamp actor from session.
 */
export type RecordReturnsResult = { ok: true } | { ok: false; error: string };

export async function recordReturns(
  vanLoadId: string,
  returns: ReturnLineInput[],
): Promise<RecordReturnsResult> {
  const payload = returns.filter((r) => r.qty > 0);
  if (payload.length === 0) return { ok: false, error: "Enter at least one return quantity." };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.rpc("record_returns", {
      p_van_load_id: vanLoadId,
      p_returns: payload.map((r) => ({ line_id: r.lineId, qty: r.qty })),
      p_actor: null,
    });

    if (error) {
      const exceeds = /exceeds out/i.test(error.message);
      console.error("recordReturns: rpc error —", error.message);
      return {
        ok: false,
        error: exceeds
          ? "A return is more than what's still out on the van."
          : "Could not record returns. Please try again.",
      };
    }

    await logAudit({
      action: "van.returns",
      entityTable: "van_loads",
      entityId: vanLoadId,
      after: { lines: payload.length },
    });

    revalidatePath(`/vans/${vanLoadId}`);
    revalidatePath("/vans");
    return { ok: true };
  } catch (err) {
    console.error("recordReturns: unexpected error —", err);
    return { ok: false, error: "Unexpected error recording returns." };
  }
}
