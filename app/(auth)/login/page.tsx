import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

function LoginFallback() {
  return (
    <div className="w-full max-w-md rounded-card border border-card-border bg-surface p-8 text-center text-muted">
      Loading…
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <Link
        href="/"
        className="absolute left-4 top-4 text-[13px] text-[#888880] transition hover:opacity-80"
      >
        ← Back
      </Link>
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
