"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Truck } from "lucide-react";
import { loadVan } from "@/lib/van/loads";
import { ROUTES } from "@/lib/sales/orders-data";
import { parseCases, sanitizeVehicle, VEHICLE_MAX_CHARS } from "@/lib/form/validators";
import { FormField, FormActions } from "@/components/kit/form-field";
import { IntInput } from "@/components/kit/validated-inputs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type VanSku = { id: string; code: string; name: string; onHand: number };
type Line = { key: number; skuId: string; qty: string };

const selectCls = cn(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
);

export function LoadForm({ skus }: { skus: VanSku[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [route, setRoute] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [lines, setLines] = useState<Line[]>([{ key: 1, skuId: "", qty: "" }]);

  const onHandById = useMemo(() => new Map(skus.map((s) => [s.id, s.onHand])), [skus]);

  function setLine(key: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((ls) => [...ls, { key: Math.max(0, ...ls.map((l) => l.key)) + 1, skuId: "", qty: "" }]);
  }
  function removeLine(key: number) {
    setLines((ls) => (ls.length === 1 ? ls : ls.filter((l) => l.key !== key)));
  }

  // Client-side over-load hint (the RPC is the real guard).
  function overLoad(l: Line): boolean {
    const avail = onHandById.get(l.skuId);
    const qty = Number(l.qty);
    return avail != null && qty > 0 && qty > avail;
  }
  const anyOver = lines.some(overLoad);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    const active = lines.filter((l) => l.skuId && l.qty.trim() !== "");
    for (const l of active) {
      const parsed = parseCases(l.qty);
      if (!parsed.ok) {
        setError(parsed.error);
        return;
      }
    }
    const payload = active.map((l) => ({ skuId: l.skuId, qty: Number(l.qty) }));
    if (payload.length === 0) {
      setError("Add at least one line with a SKU and quantity.");
      return;
    }
    if (new Set(payload.map((p) => p.skuId)).size !== payload.length) {
      setError("Each SKU should appear once — merge duplicate lines.");
      return;
    }
    startTransition(async () => {
      const res = await loadVan({ route: route || null, vehicle: vehicle || null, lines: payload });
      if (res.ok) {
        setOk(`Van loaded — ${res.loadNo}.`);
        setLines([{ key: 1, skuId: "", qty: "" }]);
        setRoute("");
        setVehicle("");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <Truck className="h-4 w-4 text-muted-foreground" aria-hidden />
        Load van
      </h2>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
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
        <FormField label="Vehicle number" hint={`Optional — registration, max ${VEHICLE_MAX_CHARS} characters`}>
          {(p) => (
            <Input
              {...p}
              value={vehicle}
              onChange={(e) => setVehicle(sanitizeVehicle(e.target.value))}
              maxLength={VEHICLE_MAX_CHARS}
              placeholder="e.g. MH04AB1234"
            />
          )}
        </FormField>
      </div>

      <div className="space-y-2">
        {lines.map((l) => {
          const avail = onHandById.get(l.skuId);
          const over = overLoad(l);
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
                      {s.code} — {s.name} (on hand: {s.onHand})
                    </option>
                  ))}
                </select>
                {over ? (
                  <p className="mt-1 text-xs font-medium text-destructive">
                    Only {avail} on hand — reduce the quantity.
                  </p>
                ) : null}
              </div>
              <IntInput
                aria-label="Quantity"
                value={l.qty}
                onValueChange={(v) => setLine(l.key, { qty: v })}
                placeholder="Qty"
                className="w-24"
              />
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

      {error ? <p className="mt-3 text-sm font-medium text-destructive">{error}</p> : null}
      {ok ? <p className="mt-3 text-sm font-medium text-emerald-600">{ok}</p> : null}

      <FormActions>
        <Button type="submit" disabled={pending || anyOver || skus.length === 0}>
          {pending ? "Loading…" : "Load van"}
        </Button>
      </FormActions>
    </form>
  );
}
