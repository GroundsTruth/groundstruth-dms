"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit/service";
import { validateLoad, formatLoadNo, type LoadInput } from "./load-logic";

/**
 * Van load-out (M24) — server action. Validates, generates a load number, then calls
 * the atomic load_van RPC (FIFO van_out across batches, all-or-nothing). Audited.
 * TODO(auth): stamp created_by / driver from session once M05–M09 land.
 */
export type LoadVanResult =
  | { ok: true; vanLoadId: string; loadNo: string }
  | { ok: false; error: string };

type AdminClient = ReturnType<typeof createAdminClient>;

async function nextLoadNo(supabase: AdminClient): Promise<string> {
  const { data } = await supabase.from("van_loads").select("load_no");
  const max = (data ?? []).reduce((m, r) => {
    const n = Number(String(r.load_no).replace(/\D/g, ""));
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return formatLoadNo(max + 1);
}

export async function loadVan(input: LoadInput): Promise<LoadVanResult> {
  const invalid = validateLoad(input);
  if (invalid) return { ok: false, error: invalid };

  try {
    const supabase = createAdminClient();
    const loadNo = await nextLoadNo(supabase);

    const { data, error } = await supabase.rpc("load_van", {
      p_load_no: loadNo,
      p_vehicle: input.vehicle ?? null,
      p_driver: input.driverUserId ?? null,
      p_route: input.route ?? null,
      p_load_date: null,
      p_lines: input.lines.map((l) => ({ sku_id: l.skuId, qty: l.qty })),
      p_actor: null,
    });

    if (error) {
      const insufficient = /insufficient stock/i.test(error.message);
      console.error("loadVan: rpc error —", error.message);
      return {
        ok: false,
        error: insufficient
          ? "Not enough stock on hand to load this van."
          : "Could not load the van. Please try again.",
      };
    }

    const vanLoadId = data as string;
    await logAudit({
      action: "van.load",
      entityTable: "van_loads",
      entityId: vanLoadId,
      after: { loadNo, route: input.route ?? null, lines: input.lines.length },
    });

    revalidatePath("/vans");
    return { ok: true, vanLoadId, loadNo };
  } catch (err) {
    console.error("loadVan: unexpected error —", err);
    return { ok: false, error: "Unexpected error loading the van." };
  }
}
