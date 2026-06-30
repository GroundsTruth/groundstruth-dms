"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ClipboardList } from "lucide-react";
import { createOrder } from "@/lib/sales/orders-actions";
import { ROUTES, type OrderableSku } from "@/lib/sales/orders-data";
import { FormField, FormActions } from "@/components/kit/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Line = { key: number; skuId: string; qty: string; rate: string };

const selectCls = cn(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
);

function inr(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function PunchForm({ skus }: { skus: OrderableSku[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [route, setRoute] = useState<string>("");
  const [lines, setLines] = useState<Line[]>([{ key: 1, skuId: "", qty: "", rate: "" }]);

  const priceById = useMemo(
    () => new Map(skus.map((s) => [s.id, s.basePrice])),
    [skus],
  );

  function chargedOf(l: Line): number | null {
    const list = priceById.get(l.skuId) ?? null;
    return l.rate ? Number(l.rate) : list;
  }
  function belowList(l: Line): boolean {
    const list = priceById.get(l.skuId);
    return l.rate !== "" && list != null && Number(l.rate) < list;
  }
  function lineTotal(l: Line): number | null {
    const charged = chargedOf(l);
    const qty = Number(l.qty);
    if (charged == null || !qty) return null;
    return charged * qty;
  }

  const subtotal = lines.reduce((acc, l) => acc + (lineTotal(l) ?? 0), 0);

  function setLine(key: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((ls) => [...ls, { key: Math.max(0, ...ls.map((l) => l.key)) + 1, skuId: "", qty: "", rate: "" }]);
  }
  function removeLine(key: number) {
    setLines((ls) => (ls.length === 1 ? ls : ls.filter((l) => l.key !== key)));
  }
  function reset() {
    setLines([{ key: 1, skuId: "", qty: "", rate: "" }]);
    setRoute("");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    const payload = lines
      .filter((l) => l.skuId && Number(l.qty) > 0)
      .map((l) => ({ skuId: l.skuId, qty: Number(l.qty), chargedPrice: l.rate ? Number(l.rate) : null }));
    if (payload.length === 0) {
      setError("Add at least one line with a SKU and quantity.");
      return;
    }
    startTransition(async () => {
      const res = await createOrder({ route: route || null, lines: payload });
      if (res.ok) {
        setOk(
          res.needsApproval
            ? `Order ${res.orderNo} punched below list — sent for admin approval.`
            : `Order ${res.orderNo} punched (${inr(subtotal)}).`,
        );
        reset();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <ClipboardList className="h-4 w-4 text-muted-foreground" aria-hidden />
        Punch order
      </h2>

      <div className="mb-4 max-w-xs">
        <FormField label="Route">
          {(p) => (
            <select {...p} value={route} onChange={(e) => setRoute(e.target.value)} className={selectCls}>
              <option value="">No route</option>
              {ROUTES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          )}
        </FormField>
      </div>

      <div className="space-y-2">
        {lines.map((l) => {
          const price = priceById.get(l.skuId);
          const unpriced = l.skuId !== "" && price == null;
          const lt = lineTotal(l);
          return (
            <div key={l.key} className="flex items-start gap-2">
              <div className="flex-1">
                <select
                  aria-label="SKU"
                  value={l.skuId}
                  onChange={(e) => setLine(l.key, { skuId: e.target.value })}
                  className={selectCls}
                >
                  <option value="">Select SKU…</option>
                  {skus.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                      {s.basePrice == null ? " (no price)" : ` · ${inr(s.basePrice)}`}
                    </option>
                  ))}
                </select>
                {unpriced ? (
                  <p className="mt-1 text-xs font-medium text-destructive">
                    No price set for this SKU — it can&apos;t be ordered yet.
                  </p>
                ) : null}
              </div>
              <Input
                aria-label="Quantity"
                type="number"
                min={1}
                step="any"
                value={l.qty}
                onChange={(e) => setLine(l.key, { qty: e.target.value })}
                placeholder="Qty"
                className="w-20"
              />
              <div className="w-24">
                <Input
                  aria-label="Rate"
                  type="number"
                  min={0}
                  step="any"
                  value={l.rate}
                  onChange={(e) => setLine(l.key, { rate: e.target.value })}
                  placeholder={price != null ? inr(price) : "Rate"}
                />
                {belowList(l) ? (
                  <p className="mt-1 text-[11px] font-medium text-amber-600">below list → approval</p>
                ) : null}
              </div>
              <div className="w-24 pt-2 text-right text-sm tabular-nums">
                {lt != null ? inr(lt) : "—"}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeLine(l.key)}
                aria-label="Remove line"
                disabled={lines.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addLine}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        <Plus className="h-4 w-4" /> Add line
      </button>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm text-muted-foreground">Subtotal</span>
        <span className="text-base font-semibold tabular-nums">{inr(subtotal)}</span>
      </div>

      {error ? <p className="mt-3 text-sm font-medium text-destructive">{error}</p> : null}
      {ok ? <p className="mt-3 text-sm font-medium text-emerald-600">{ok}</p> : null}

      <FormActions>
        <Button type="submit" disabled={pending || skus.length === 0}>
          {pending ? "Punching…" : "Punch order"}
        </Button>
      </FormActions>
    </form>
  );
}
