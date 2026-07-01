"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit/service";

/** Scheme admin actions (S2). Campa pushes schemes dynamically; owner configures them. */
export type SchemeActionResult = { ok: true } | { ok: false; error: string };

export type SchemeInput = {
  name: string;
  triggerSkuId: string;
  triggerQty: number;
  freeSkuId: string;
  freeQty: number;
};

export async function createScheme(input: SchemeInput): Promise<SchemeActionResult> {
  if (!input.name?.trim()) return { ok: false, error: "Name is required." };
  if (!input.triggerSkuId || !input.freeSkuId) return { ok: false, error: "Pick both SKUs." };
  if (!(input.triggerQty > 0) || !(input.freeQty > 0)) return { ok: false, error: "Quantities must be > 0." };
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("schemes")
      .insert({
        name: input.name.trim(),
        trigger_sku_id: input.triggerSkuId,
        trigger_qty: input.triggerQty,
        free_sku_id: input.freeSkuId,
        free_qty: input.freeQty,
      })
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: "Could not create the scheme." };
    await logAudit({ action: "scheme.create", entityTable: "schemes", entityId: data.id, after: input });
    revalidatePath("/schemes");
    return { ok: true };
  } catch {
    return { ok: false, error: "Unexpected error creating the scheme." };
  }
}

export async function setSchemeActive(id: string, active: boolean): Promise<SchemeActionResult> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("schemes").update({ is_active: active }).eq("id", id);
    if (error) return { ok: false, error: "Could not update the scheme." };
    await logAudit({ action: "scheme.active", entityTable: "schemes", entityId: id, after: { active } });
    revalidatePath("/schemes");
    return { ok: true };
  } catch {
    return { ok: false, error: "Unexpected error updating the scheme." };
  }
}
