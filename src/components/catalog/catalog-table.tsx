"use client";

import { useMemo, useState } from "react";
import { Ban, Pencil, Plus, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";

import type { Sku } from "@/lib/catalog/types";
import { setSkuActive } from "@/lib/catalog/actions";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/kit/status-badge";
import { EmptyState } from "@/components/kit/empty-state";
import { useConfirm } from "@/components/kit/confirm-dialog";
import { SkuFormSheet } from "@/components/catalog/sku-form-sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function rupees(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

/** "GST 5%" / "GST 28% +12% cess", or null when the tax slab isn't set yet. */
function taxLabel(s: Sku): string | null {
  if (s.taxSlabPct == null) return null;
  const cess = s.cessPct != null && s.cessPct > 0 ? ` +${s.cessPct}% cess` : "";
  return `GST ${s.taxSlabPct}%${cess}`;
}

function TaxCell({ s }: { s: Sku }) {
  const tax = taxLabel(s);
  if (!s.hsn && !tax) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className="leading-tight">
      {s.hsn ? <span className="font-mono text-xs">{s.hsn}</span> : null}
      {tax ? <p className="text-xs text-muted-foreground">{tax}</p> : null}
    </div>
  );
}

function StatusCell({ s }: { s: Sku }) {
  if (s.isActive === false) return <StatusBadge tone="neutral">Inactive</StatusBadge>;
  if (s.ratePerCase != null) return <StatusBadge tone="ok">Priced</StatusBadge>;
  return <StatusBadge tone="warn">Needs rate</StatusBadge>;
}

function RowActions({
  s,
  onEdit,
  onToggle,
}: {
  s: Sku;
  onEdit: (s: Sku) => void;
  onToggle: (s: Sku) => void;
}) {
  const active = s.isActive !== false;
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onEdit(s)}
        aria-label={`Edit ${s.name}`}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      {active ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onToggle(s)}
          aria-label={`Deactivate ${s.name}`}
        >
          <Ban className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
          onClick={() => onToggle(s)}
          aria-label={`Reactivate ${s.name}`}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function CatalogTable({
  skus,
  categories,
}: {
  skus: Sku[];
  categories: string[];
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [showInactive, setShowInactive] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editSku, setEditSku] = useState<Sku | null>(null);
  const { confirm, dialog } = useConfirm();

  const inactiveCount = useMemo(
    () => skus.filter((s) => s.isActive === false).length,
    [skus],
  );

  const { filtered, scopeTotal } = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const scoped = skus.filter((s) => showInactive || s.isActive !== false);
    const list = scoped.filter((s) => {
      const inCat = cat === "All" || s.category === cat;
      const inQ =
        !needle ||
        s.name.toLowerCase().includes(needle) ||
        s.code.toLowerCase().includes(needle) ||
        s.category.toLowerCase().includes(needle);
      return inCat && inQ;
    });
    return { filtered: list, scopeTotal: scoped.length };
  }, [skus, q, cat, showInactive]);

  const cats = ["All", ...categories];

  function openAdd() {
    setEditSku(null);
    setFormOpen(true);
  }
  function openEdit(s: Sku) {
    setEditSku(s);
    setFormOpen(true);
  }

  async function toggleActive(s: Sku) {
    const active = s.isActive !== false;
    if (active) {
      const ok = await confirm({
        title: `Deactivate ${s.name}?`,
        description:
          "It will be hidden from the active catalog. You can reactivate it anytime via “Show inactive”.",
        confirmLabel: "Deactivate",
        variant: "destructive",
      });
      if (!ok) return;
    }
    const res = await setSkuActive(s.code, !active);
    if (!res.ok) {
      toast.error("Couldn't update", { description: res.error });
      return;
    }
    toast.success(active ? "SKU deactivated" : "SKU reactivated");
  }

  return (
    <div className="space-y-4">
      {/* toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search SKUs…"
            className="pl-9"
          />
        </div>
        <Button onClick={openAdd} className="sm:shrink-0">
          <Plus className="mr-1.5 h-4 w-4" /> Add SKU
        </Button>
      </div>

      {/* category pills */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {cats.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-sm font-medium transition-colors",
              cat === c
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {filtered.length} of {scopeTotal} SKUs
        </p>
        {inactiveCount > 0 ? (
          <button
            type="button"
            onClick={() => setShowInactive((v) => !v)}
            className={cn(
              "text-xs font-medium underline-offset-2 hover:underline",
              showInactive ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {showInactive ? "Hide inactive" : `Show inactive (${inactiveCount})`}
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={skus.length === 0 ? "No SKUs yet" : "No SKUs match your search"}
          description={
            skus.length === 0
              ? "Add your first product to start the catalog."
              : "Try a different name, or clear the filters to see all products."
          }
          action={
            skus.length === 0 ? (
              <Button size="sm" onClick={openAdd}>
                <Plus className="mr-1.5 h-4 w-4" /> Add SKU
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* desktop: table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Code</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Pack</TableHead>
                    <TableHead className="text-right">MRP</TableHead>
                    <TableHead className="text-right">Rate/case</TableHead>
                    <TableHead>HSN / Tax</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20 text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.code} className={cn(s.isActive === false && "opacity-60")}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {s.code}
                      </TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-muted-foreground">{s.category}</TableCell>
                      <TableCell className="tabular-nums">
                        {s.packLabel}
                        {s.unitsPerCase != null ? (
                          <span className="block text-xs text-muted-foreground">
                            {s.unitsPerCase}/case
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {s.mrp != null ? (
                          rupees(s.mrp)
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {s.ratePerCase != null ? (
                          rupees(s.ratePerCase)
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <TaxCell s={s} />
                      </TableCell>
                      <TableCell>
                        <StatusCell s={s} />
                      </TableCell>
                      <TableCell>
                        <RowActions s={s} onEdit={openEdit} onToggle={toggleActive} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* mobile: cards */}
          <div className="space-y-2.5 md:hidden">
            {filtered.map((s) => (
              <Card key={s.code} className={cn(s.isActive === false && "opacity-60")}>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <button
                    type="button"
                    onClick={() => openEdit(s)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate font-medium">{s.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <span className="font-mono">{s.code}</span> · {s.category} ·{" "}
                      {s.packLabel}
                      {s.unitsPerCase != null ? ` · ${s.unitsPerCase}/case` : ""}
                    </p>
                    {s.hsn || taxLabel(s) ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {s.hsn ? <span className="font-mono">{s.hsn}</span> : null}
                        {s.hsn && taxLabel(s) ? " · " : null}
                        {taxLabel(s)}
                      </p>
                    ) : null}
                    <div className="mt-1.5">
                      <StatusCell s={s} />
                    </div>
                  </button>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <div className="text-right leading-tight">
                      <p className="text-base font-semibold tabular-nums">
                        {s.ratePerCase != null ? rupees(s.ratePerCase) : "—"}
                      </p>
                      {s.mrp != null ? (
                        <p className="text-xs text-muted-foreground tabular-nums">
                          MRP {rupees(s.mrp)}
                        </p>
                      ) : null}
                    </div>
                    <RowActions s={s} onEdit={openEdit} onToggle={toggleActive} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <SkuFormSheet open={formOpen} editSku={editSku} onOpenChange={setFormOpen} />
      {dialog}
    </div>
  );
}
