"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Search } from "lucide-react";

import type { Sku } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/kit/status-badge";
import { EmptyState } from "@/components/kit/empty-state";
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

export function CatalogTable({
  skus,
  categories,
}: {
  skus: Sku[];
  categories: string[];
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [formOpen, setFormOpen] = useState(false);
  const [editSku, setEditSku] = useState<Sku | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return skus.filter((s) => {
      const inCat = cat === "All" || s.category === cat;
      const inQ =
        !needle ||
        s.name.toLowerCase().includes(needle) ||
        s.code.toLowerCase().includes(needle) ||
        s.category.toLowerCase().includes(needle);
      return inCat && inQ;
    });
  }, [skus, q, cat]);

  const cats = ["All", ...categories];

  function openAdd() {
    setEditSku(null);
    setFormOpen(true);
  }
  function openEdit(s: Sku) {
    setEditSku(s);
    setFormOpen(true);
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

      <p className="text-xs text-muted-foreground">
        {filtered.length} of {skus.length} SKUs
      </p>

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
                    <TableHead className="text-right">Rate/case</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10">
                      <span className="sr-only">Edit</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.code}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {s.code}
                      </TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-muted-foreground">{s.category}</TableCell>
                      <TableCell className="tabular-nums">{s.packLabel}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {s.ratePerCase != null ? (
                          rupees(s.ratePerCase)
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {s.ratePerCase != null ? (
                          <StatusBadge tone="ok">Priced</StatusBadge>
                        ) : (
                          <StatusBadge tone="warn">Needs rate</StatusBadge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(s)}
                          aria-label={`Edit ${s.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
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
              <Card key={s.code}>
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
                    </p>
                    <div className="mt-1.5">
                      {s.ratePerCase != null ? (
                        <StatusBadge tone="ok">Priced</StatusBadge>
                      ) : (
                        <StatusBadge tone="warn">Needs rate</StatusBadge>
                      )}
                    </div>
                  </button>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className="text-base font-semibold tabular-nums">
                      {s.ratePerCase != null ? rupees(s.ratePerCase) : "—"}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(s)}
                      aria-label={`Edit ${s.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <SkuFormSheet open={formOpen} editSku={editSku} onOpenChange={setFormOpen} />
    </div>
  );
}
