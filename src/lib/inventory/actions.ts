"use server";

import { revalidatePath } from "next/cache";
import { receiveStock, type ReceiveResult } from "./receive";
import type { ReceiveInput } from "./logic";

/**
 * Server action: receive stock from the /inventory form. Delegates to receiveStock
 * (validation + atomic RPC + audit) and revalidates the page on success.
 * TODO(auth): pass the session user as actorUserId once M05–M09 land.
 */
export async function receiveStockAction(input: ReceiveInput): Promise<ReceiveResult> {
  const res = await receiveStock(input);
  if (res.ok) revalidatePath("/inventory");
  return res;
}
