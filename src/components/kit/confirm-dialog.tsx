"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type ConfirmOptions = {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "destructive" turns the confirm button red (Campa Red = alerts). */
  variant?: "default" | "destructive";
};

/**
 * Controlled confirm modal. Prefer the `useConfirm()` hook below for the
 * Promise-based flow; use this directly only if you own the open state.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
}: ConfirmOptions & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Promise-based confirm. Returns `{ confirm, dialog }`: `await confirm({...})`
 * resolves to a boolean, and you render `{dialog}` once in the component.
 *
 *   const { confirm, dialog } = useConfirm();
 *   const ok = await confirm({ title: "Deactivate SKU?", variant: "destructive" });
 *   return (<>…{dialog}</>);
 *
 * Reuse this for every destructive action (deactivate, cancel invoice, delete) so
 * confirmations look + behave the same everywhere — never a bare window.confirm().
 */
export function useConfirm() {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions>({ title: "" });
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    setOpts(options);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOpen(false);
  }, []);

  const dialog = (
    <ConfirmDialog
      {...opts}
      open={open}
      onOpenChange={(o) => {
        if (!o) settle(false);
      }}
      onConfirm={() => settle(true)}
    />
  );

  return { confirm, dialog };
}
