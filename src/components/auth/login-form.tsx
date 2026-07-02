"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Phone, KeyRound, ArrowLeft, CircleAlert } from "lucide-react";

import { requestOtp, verifyOtp } from "@/lib/auth/actions";
import { FormField } from "@/components/kit/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Step = "phone" | "otp";

/**
 * Normalize an Indian mobile number to E.164 (Supabase phone OTP needs it).
 * `+9198...` kept as-is · a bare 10-digit number → `+91` prefixed · anything else
 * is left for the server to reject with a clear error.
 */
function toE164(raw: string): string {
  const s = raw.replace(/[\s-]/g, "");
  if (s.startsWith("+")) return s;
  const digits = s.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return s.startsWith("+") ? s : `+${digits}`;
}

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const e164 = toE164(phone);

  function sendOtp() {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await requestOtp(e164);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setInfo(`Code sent to ${e164}.`);
      setStep("otp");
    });
  }

  function verify() {
    setError(null);
    startTransition(async () => {
      const res = await verifyOtp(e164, token);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Session cookie is set server-side — refresh so the shell/layout re-reads it.
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="w-full space-y-5">
      <div className="space-y-1 text-center">
        <div className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
          C
        </div>
        <h1 className="text-xl font-semibold">Sign in to Campa DMS</h1>
        <p className="text-sm text-muted-foreground">
          {step === "phone"
            ? "Enter your mobile number to get a one-time code."
            : "Enter the 6-digit code we texted you."}
        </p>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/20">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {step === "phone" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendOtp();
          }}
          className="space-y-4"
        >
          <FormField
            label="Mobile number"
            hint="Indian numbers: just the 10 digits — we add +91."
          >
            {(p) => (
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  {...p}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  autoFocus
                  placeholder="98765 43210"
                  maxLength={12}
                  value={phone}
                  onChange={(e) =>
                    // digits only; 12 allows a pasted 91-prefixed number (toE164 handles it)
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 12))
                  }
                  className="h-11 pl-9 text-base"
                />
              </div>
            )}
          </FormField>
          <Button
            type="submit"
            className="h-11 w-full text-base"
            disabled={pending || phone.trim().length < 10}
          >
            {pending ? "Sending…" : "Send OTP"}
          </Button>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            verify();
          }}
          className="space-y-4"
        >
          {info ? (
            <p className="text-center text-xs text-muted-foreground">{info}</p>
          ) : null}
          <FormField label="6-digit code">
            {(p) => (
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  {...p}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={6}
                  placeholder="123456"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                  className="h-11 pl-9 text-base tracking-[0.4em]"
                />
              </div>
            )}
          </FormField>
          <Button
            type="submit"
            className="h-11 w-full text-base"
            disabled={pending || token.length < 4}
          >
            {pending ? "Verifying…" : "Verify & sign in"}
          </Button>
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setToken("");
                setError(null);
                setInfo(null);
              }}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Change number
            </button>
            <button
              type="button"
              onClick={sendOtp}
              disabled={pending}
              className="text-primary hover:underline disabled:opacity-50"
            >
              Resend code
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
