"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit/service";
import { validateSetPrice, type SetPriceInput } from "./pricing";

/**
 * Set a price rule (M18) — server action. Inserts a new row into price_list; the
 * resolver (priceFor) picks the most specific, latest-effective active rule, so
 * adding a row supersedes an older one without deletes (price history is kept).
 * TODO(auth): gate to owner once M05–M09 land.
 */
export type SetPriceResult = { ok: true; id: string } | { ok: false; error: string };

export async function setPrice(input: SetPriceInput): Promise<SetPriceResult> {
  const invalid = validateSetPrice(input);
  if (invalid) return { ok: false, error: invalid };

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("price_list")
      .insert({
        sku_id: input.skuId,
        retailer_id: input.retailerId ?? null,
        route: input.route ?? null,
        price: input.price,
        effective_from: input.effectiveFrom ?? new Date().toISOString().slice(0, 10),
      })
      .select("id")
      .single();

    if (error) {
      console.error("setPrice: insert error —", error.message);
      return { ok: false, error: "Could not save the price. Please try again." };
    }

    await logAudit({
      action: "price.set",
      entityTable: "price_list",
      entityId: data.id,
      after: input,
    });

    revalidatePath("/inventory");
    return { ok: true, id: data.id };
  } catch (err) {
    console.error("setPrice: unexpected error —", err);
    return { ok: false, error: "Unexpected error saving the price." };
  }
}
