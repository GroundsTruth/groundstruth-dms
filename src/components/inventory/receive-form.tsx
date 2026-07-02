"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PackagePlus } from "lucide-react";
import { receiveStockAction } from "@/lib/inventory/actions";
import type { SkuOption } from "@/lib/inventory/data";
import { parseCases, dateOrderError } from "@/lib/form/validators";
import { FormField, FormActions } from "@/components/kit/form-field";
import { IntInput } from "@/components/kit/validated-inputs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Inward stock form (M12). Picks a SKU, batch + qty (+ optional dates), calls the
 * atomic receive action, then refreshes the stock view. Field errors come back from
 * the same validateReceive used server-side, surfaced inline.
 */
export function ReceiveForm({ skus }: { skus: SkuOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [skuId, setSkuId] = useState("");
  const [batchNo, setBatchNo] = useState("");
  const [qty, setQty] = useState("");
  const [mfgDate, setMfgDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  function reset() {
    setBatchNo("");
    setQty("");
    setMfgDate("");
    setExpiryDate("");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    // Validate before the server round-trip so field mistakes get a specific message.
    const parsed = parseCases(qty);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    const dateErr = dateOrderError(mfgDate || null, expiryDate || null);
    if (dateErr) {
      setError(dateErr);
      return;
    }
    startTransition(async () => {
      const res = await receiveStockAction({
        skuId,
        batchNo,
        qty: parsed.value,
        mfgDate: mfgDate || null,
        expiryDate: expiryDate || null,
      });
      if (res.ok) {
        const label = skus.find((s) => s.id === skuId)?.code ?? "stock";
        setOk(`Received ${qty} into ${label} · batch ${batchNo.trim()}.`);
        reset();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  const disabled = pending || skus.length === 0;

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-border bg-card p-4 sm:p-5"
    >
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <PackagePlus className="h-4 w-4 text-muted-foreground" aria-hidden />
        Receive stock
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="SKU" required>
          {(p) => (
            <select
              {...p}
              value={skuId}
              onChange={(e) => setSkuId(e.target.value)}
              className={cn(
                "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              )}
            >
              <option value="">Select a SKU…</option>
              {skus.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          )}
        </FormField>

        <FormField label="Batch number" required>
          {(p) => (
            <Input
              {...p}
              value={batchNo}
              onChange={(e) => setBatchNo(e.target.value)}
              placeholder="e.g. B-2026-06"
            />
          )}
        </FormField>

        <FormField label="Quantity (cases)" required hint="Whole cases — up to 10,000 per entry">
          {(p) => (
            <IntInput
              {...p}
              value={qty}
              onValueChange={setQty}
              placeholder="0"
            />
          )}
        </FormField>

        <FormField label="Expiry date" hint="Optional — enables FIFO by expiry">
          {(p) => (
            <Input
              {...p}
              type="date"
              min={mfgDate || undefined}
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          )}
        </FormField>

        <FormField label="Manufacture date" hint="Optional — on or before expiry">
          {(p) => (
            <Input
              {...p}
              type="date"
              max={expiryDate || undefined}
              value={mfgDate}
              onChange={(e) => setMfgDate(e.target.value)}
            />
          )}
        </FormField>
      </div>

      {error ? (
        <p className="mt-3 text-sm font-medium text-destructive">{error}</p>
      ) : null}
      {ok ? (
        <p className="mt-3 text-sm font-medium text-emerald-600">{ok}</p>
      ) : null}

      <FormActions>
        <Button type="submit" disabled={disabled}>
          {pending ? "Receiving…" : "Receive stock"}
        </Button>
      </FormActions>
    </form>
  );
}
