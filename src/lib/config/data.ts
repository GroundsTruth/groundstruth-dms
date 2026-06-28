import { createAdminClient } from "@/lib/supabase/admin";
import {
  CONFIG_DEFAULTS,
  CONFIG_KEYS,
  coerceConfigValue,
  type ConfigKey,
  type ConfigShape,
} from "./defaults";

/**
 * Config access (M03). Reads the `config` table (server-side, service role) and
 * falls back to CONFIG_DEFAULTS per key, so a missing row or unreachable DB never
 * breaks a flow. Same seed-fallback contract as catalog `getSkus`.
 *
 * Pure default logic lives in ./defaults (unit-tested); this file is the thin
 * DB wrapper (integration-only, like data.ts in catalog).
 */

/** One typed config value. Falls back to the default if missing/unreachable. */
export async function getConfig<K extends ConfigKey>(
  key: K,
): Promise<ConfigShape[K]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("config")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      console.error(`getConfig(${key}): Supabase error, using default —`, error.message);
      return CONFIG_DEFAULTS[key];
    }
    return coerceConfigValue(key, data?.value as ConfigShape[K] | null | undefined);
  } catch (err) {
    console.error(`getConfig(${key}): unexpected error, using default —`, err);
    return CONFIG_DEFAULTS[key];
  }
}

/** All config as a typed object; every key resolved (DB value or default). */
export async function getAllConfig(): Promise<ConfigShape> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("config").select("key,value");
    if (error) {
      console.error("getAllConfig: Supabase error, using defaults —", error.message);
      return { ...CONFIG_DEFAULTS };
    }
    const rows = new Map((data ?? []).map((r) => [r.key as ConfigKey, r.value]));
    const out = {} as ConfigShape;
    for (const key of CONFIG_KEYS) {
      // @ts-expect-error key indexes ConfigShape; value is the matching shape.
      out[key] = coerceConfigValue(key, rows.get(key) ?? null);
    }
    return out;
  } catch (err) {
    console.error("getAllConfig: unexpected error, using defaults —", err);
    return { ...CONFIG_DEFAULTS };
  }
}
