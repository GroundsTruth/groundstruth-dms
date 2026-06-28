"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmAndInvoice } from "@/lib/sales/invoice-actions";
import { Button } from "@/components/ui/button";

/** Confirm & invoice a draft order (M22). Navigates to the new invoice on success. */
export function ConfirmInvoiceButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function go() {
    setError(null);
    startTransition(async () => {
      const res = await confirmAndInvoice(orderId);
      if (res.ok) {
        router.push(`/invoices/${res.invoiceId}`);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="text-right">
      <Button size="sm" variant="outline" onClick={go} disabled={pending}>
        {pending ? "Invoicing…" : "Confirm & invoice"}
      </Button>
      {error ? <p className="mt-1 text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
