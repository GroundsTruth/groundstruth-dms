"use server";

import { revalidatePath } from "next/cache";
import type { SkuInput } from "./types";
import { createAdminClient } from "@/lib/supabase/admin";

const CATEGORIES = [
  "Cola", "Lemon", "Orange", "Soda", "Energy", "Juice", "Water", "Other",
] as const;

function validate(input: SkuInput): string | null {
  if (!input.name?.trim()) return "Product name is required.";
  if (!(CATEGORIES as readonly string[]).includes(input.category)) {
    return "Pick a valid category.";
  }
  if (!input.packLabel?.trim()) return 'Pack label is required (e.g. "500 ML").';
  if (input.packMl != null && (!Number.isInteger(input.packMl) || input.packMl < 0)) {
    return "Pack size (ml) must be a whole number.";
  }
  if (input.ratePerCase != null && (Number.isNaN(input.ratePerCase) || input.ratePerCase < 0)) {
    return "Rate per case must be 0 or more.";
  }
  return null;
}

function toRow(input: SkuInput) {
  return {
    name: input.name.trim(),
    category: input.category,
    pack_ml: input.packMl,
    pack_label: input.packLabel.trim(),
    rate_per_case: input.ratePerCase,
  };
}

type AdminClient = ReturnType<typeof createAdminClient>;

/** Next canonical "SKUNNN" code = highest existing + 1, zero-padded to 3. */
async function nextSkuCode(supabase: AdminClient): Promise<string> {
  const { data, error } = await supabase.from("skus").select("code");
  if (error) throw new Error(error.message);
  let max = 0;
  for (const r of data ?? []) {
    const m = /^SKU(\d+)$/.exec(r.code as string);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return "SKU" + String(max + 1).padStart(3, "0");
}

// NOTE: these run server-side via the service-role client (no user gate yet).
// TODO(auth): once M05–M09 land, restrict to owner/warehouse roles here.

export async function createSku(
  input: SkuInput,
): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  const err = validate(input);
  if (err) return { ok: false, error: err };
  try {
    const supabase = createAdminClient();
    const code = await nextSkuCode(supabase);
    const { error } = await supabase.from("skus").insert({ code, ...toRow(input) });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/catalog");
    return { ok: true, code };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error." };
  }
}

export async function updateSku(
  code: string,
  input: SkuInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!code?.trim()) return { ok: false, error: "Missing SKU code." };
  const err = validate(input);
  if (err) return { ok: false, error: err };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("skus").update(toRow(input)).eq("code", code);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/catalog");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error." };
  }
}

/** Deactivate (active=false) or reactivate (active=true) a SKU — soft, reversible. */
export async function setSkuActive(
  code: string,
  active: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!code?.trim()) return { ok: false, error: "Missing SKU code." };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("skus")
      .update({ is_active: active })
      .eq("code", code);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/catalog");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error." };
  }
}
