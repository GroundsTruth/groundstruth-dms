"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { recordCollection } from "@/lib/collections/actions";
import type { CollectionRow } from "@/lib/collections/data";
import type { CollectionMode } from "@/lib/collections/logic";
import { FormField } from "@/components/kit/form-field";
import { DecimalInput } from "@/components/kit/validated-inputs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/kit/status-badge";
import { cn } from "@/lib/utils";

function inr(n: number): string {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const selectCls = cn(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
);

export function PaymentPanel({
  invoiceId,
  total,
  collections,
  collected,
}: {
  invoiceId: string;
  total: number;
  collections: CollectionRow[];
  collected: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<CollectionMode>("cash");
  const [reference, setReference] = useState("");

  const owed = total - collected;
  const settled = owed <= 0;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await recordCollection(invoiceId, {
        amount: Number(amount),
        mode,
        reference: reference || null,
      });
      if (res.ok) {
        setAmount("");
        setReference("");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="mt-6 rounded-lg border border-border bg-card p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Wallet className="h-4 w-4 text-muted-foreground" aria-hidden />
          Payments
        </h2>
        {settled ? (
          <StatusBadge tone="ok">Settled</StatusBadge>
        ) : (
          <StatusBadge tone="warn">Outstanding {inr(owed)}</StatusBadge>
        )}
      </div>

      <dl className="mb-4 grid grid-cols-3 gap-2 text-sm">
        <div><dt className="text-muted-foreground">Invoice</dt><dd className="tabular-nums">{inr(total)}</dd></div>
        <div><dt className="text-muted-foreground">Collected</dt><dd className="tabular-nums">{inr(collected)}</dd></div>
        <div><dt className="text-muted-foreground">Outstanding</dt><dd className="tabular-nums font-semibold">{inr(owed)}</dd></div>
      </dl>

      {collections.length > 0 ? (
        <ul className="mb-4 space-y-1 text-sm">
          {collections.map((c) => (
            <li key={c.id} className="flex justify-between border-b border-border/60 py-1">
              <span className="text-muted-foreground">
                {c.collectedAt.slice(0, 10)} · {c.mode.toUpperCase()}
                {c.reference ? ` · ${c.reference}` : ""}
              </span>
              <span className="tabular-nums">{inr(c.amount)}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {!settled ? (
        <form onSubmit={onSubmit} className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr_auto]">
          <FormField label="Amount">
            {(p) => (
              <DecimalInput {...p} value={amount}
                onValueChange={setAmount} placeholder="0" />
            )}
          </FormField>
          <FormField label="Mode">
            {(p) => (
              <select {...p} value={mode} onChange={(e) => setMode(e.target.value as CollectionMode)} className={selectCls}>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
              </select>
            )}
          </FormField>
          <FormField label="Reference" hint="UPI UTR / receipt no (optional)">
            {(p) => (
              <Input {...p} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="—" />
            )}
          </FormField>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Record"}
          </Button>
        </form>
      ) : null}

      {error ? <p className="mt-3 text-sm font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
