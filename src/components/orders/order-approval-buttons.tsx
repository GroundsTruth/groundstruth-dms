"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveOrder, rejectOrder } from "@/lib/sales/orders-actions";
import { Button } from "@/components/ui/button";

/** Approve / reject a below-list order (audit #5). */
export function OrderApprovalButtons({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: (id: string) => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn(orderId);
      if (res.ok) router.refresh();
      else setError(res.error ?? "Failed.");
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1">
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run(approveOrder)}>
          Approve
        </Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(rejectOrder)}>
          Reject
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
