import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

/**
 * Login screen (M05/M08). Phone → OTP → verify, to Hardik's `requestOtp`/`verifyOtp`
 * contract. Sits OUTSIDE the (app) shell — a bare, centered, mobile-first card. Already
 * signed in → straight to the dashboard. Real SMS delivery is gated on the Supabase OTP
 * provider (MISSING_INPUTS #12); the flow is complete and works the moment it's enabled.
 */
export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <main className="grid min-h-screen place-items-center bg-muted/30 px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <LoginForm />
      </div>
      <p className="pointer-events-none fixed bottom-4 left-0 right-0 text-center text-[11px] text-muted-foreground">
        Campa DMS · GroundsTruth
      </p>
    </main>
  );
}
