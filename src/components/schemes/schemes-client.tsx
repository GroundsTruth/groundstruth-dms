"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Gift, Plus } from "lucide-react";
import { createScheme, setSchemeActive } from "@/lib/schemes/actions";
import type { SchemeRow } from "@/lib/schemes/data";
import type { SkuOption } from "@/lib/inventory/data";
import { FormField, FormActions } from "@/components/kit/form-field";
import { IntInput } from "@/components/kit/validated-inputs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/kit/status-badge";
import { EmptyState } from "@/components/kit/empty-state";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const selectCls = cn(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
);

export function SchemesClient({ schemes, skus }: { schemes: SchemeRow[]; skus: SkuOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [d, setD] = useState({ name: "", triggerSkuId: "", triggerQty: "", freeSkuId: "", freeQty: "" });

  function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createScheme({
        name: d.name,
        triggerSkuId: d.triggerSkuId,
        triggerQty: Number(d.triggerQty),
        freeSkuId: d.freeSkuId,
        freeQty: Number(d.freeQty),
      });
      if (res.ok) {
        setD({ name: "", triggerSkuId: "", triggerQty: "", freeSkuId: "", freeQty: "" });
        setOpen(false);
        router.refresh();
      } else setError(res.error);
    });
  }
  function toggle(id: string, active: boolean) {
    startTransition(async () => { await setSchemeActive(id, active); router.refresh(); });
  }

  const skuSelect = (value: string, onChange: (v: string) => void) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
      <option value="">Select SKU…</option>
      {skus.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
    </select>
  );

  return (
    <>
      <div className="mb-4 flex justify-end">
        {!open ? <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New scheme</Button> : null}
      </div>

      {open ? (
        <form onSubmit={save} className="mb-6 rounded-lg border border-border bg-card p-4 sm:p-5">
          <h2 className="mb-4 text-sm font-semibold">New scheme (buy X → get Y)</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Name" required>{(p) => <Input {...p} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder="e.g. 10+1 Water" />}</FormField>
            <div />
            <FormField label="Buy (trigger SKU)" required>{() => skuSelect(d.triggerSkuId, (v) => setD({ ...d, triggerSkuId: v }))}</FormField>
            <FormField label="Trigger qty (cases)" required>{(p) => <IntInput {...p} value={d.triggerQty} onValueChange={(v) => setD({ ...d, triggerQty: v })} />}</FormField>
            <FormField label="Get free (SKU)" required>{() => skuSelect(d.freeSkuId, (v) => setD({ ...d, freeSkuId: v }))}</FormField>
            <FormField label="Free qty (cases)" required>{(p) => <IntInput {...p} value={d.freeQty} onValueChange={(v) => setD({ ...d, freeQty: v })} />}</FormField>
          </div>
          {error ? <p className="mt-3 text-sm font-medium text-destructive">{error}</p> : null}
          <FormActions>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>Create</Button>
          </FormActions>
        </form>
      ) : null}

      {schemes.length === 0 ? (
        <EmptyState icon={Gift} title="No schemes yet" description="Add a buy-X-get-Y scheme; freebies auto-apply on matching orders." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scheme</TableHead>
                <TableHead>Buy</TableHead>
                <TableHead>Get free</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schemes.map((s) => (
                <TableRow key={s.id} className={s.isActive ? "" : "opacity-50"}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.triggerQty} × {s.triggerName}</TableCell>
                  <TableCell>{s.freeQty} × {s.freeName}</TableCell>
                  <TableCell>{s.isActive ? <StatusBadge tone="ok">Active</StatusBadge> : <StatusBadge tone="neutral">Off</StatusBadge>}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => toggle(s.id, !s.isActive)}>
                      {s.isActive ? "Turn off" : "Turn on"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
