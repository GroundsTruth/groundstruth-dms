"use client";

import { forwardRef, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { digitsOnly, PHONE_DIGITS } from "@/lib/form/validators";

type InputProps = ComponentProps<typeof Input>;

/**
 * Validated input primitives (client bug round 2026-07-02). Two rules the whole app
 * follows now: phone fields take digits only (10 max, numeric keypad on mobile) and
 * quantity fields take whole numbers only — no letters, no exponents, no paste-junk.
 * Both emit the SANITIZED string through onValueChange (not the raw event), so form
 * state can never hold junk in the first place.
 */

type ValueProps = Omit<InputProps, "onChange" | "type"> & {
  value: string;
  onValueChange: (clean: string) => void;
};

/** 10-digit Indian mobile input: numeric keypad, digits only, hard cap at 10. */
export const PhoneInput = forwardRef<HTMLInputElement, ValueProps>(
  function PhoneInput({ value, onValueChange, ...rest }, ref) {
    return (
      <Input
        {...rest}
        ref={ref}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={PHONE_DIGITS}
        placeholder={rest.placeholder ?? "10-digit"}
        value={value}
        onChange={(e) => onValueChange(digitsOnly(e.target.value, PHONE_DIGITS))}
      />
    );
  },
);

/** Whole-number input (case quantities, counts): digits only, numeric keypad. */
export const IntInput = forwardRef<HTMLInputElement, ValueProps & { maxDigits?: number }>(
  function IntInput({ value, onValueChange, maxDigits = 6, ...rest }, ref) {
    return (
      <Input
        {...rest}
        ref={ref}
        type="text"
        inputMode="numeric"
        maxLength={maxDigits}
        value={value}
        onChange={(e) => onValueChange(digitsOnly(e.target.value, maxDigits))}
      />
    );
  },
);

/** Sanitize to a decimal money string: digits + one dot, max 2 decimals, 8 int digits. */
function decimalOnly(s: string): string {
  const cleaned = (s ?? "").replace(/[^0-9.]/g, "");
  const [intPart = "", ...restParts] = cleaned.split(".");
  const frac = restParts.join(""); // collapse extra dots
  const int = intPart.slice(0, 8);
  return restParts.length > 0 ? `${int}.${frac.slice(0, 2)}` : int;
}

/** Money/rate input: digits + one decimal point, decimal keypad on mobile. */
export const DecimalInput = forwardRef<HTMLInputElement, ValueProps>(
  function DecimalInput({ value, onValueChange, ...rest }, ref) {
    return (
      <Input
        {...rest}
        ref={ref}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onValueChange(decimalOnly(e.target.value))}
      />
    );
  },
);
