"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

type ControlProps = {
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
};

/**
 * Form field wrapper: label (+ required mark), the control, an optional hint, and an
 * error message. Pass the control via a render prop so the generated id wires
 * label ↔ control and `aria-invalid` / `aria-describedby` automatically — spread the
 * props onto the control: `<FormField label="Rate" error={err}>{(p) => <Input {...p} />}</FormField>`.
 * Our `Input` turns its border red on `aria-invalid`, so the error styling is automatic.
 */
export function FormField({
  label,
  required,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  children: (props: ControlProps) => ReactNode;
  className?: string;
}) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="flex items-center gap-1">
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden>
            *
          </span>
        ) : null}
      </Label>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Right-aligned action row for forms (e.g. Cancel · Save). */
export function FormActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-end gap-2 pt-2", className)}>
      {children}
    </div>
  );
}
