"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status = "checking" | "ready" | "invalid";

export function SetPasswordForm() {
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createClient();
    let resolved = false;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !resolved) {
        resolved = true;
        setStatus("ready");
      }
    });

    (async () => {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      if (tokenHash && type) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as "invite" | "recovery" | "email",
        });
        if (resolved) return;
        if (verifyError) {
          setStatus("invalid");
        } else {
          resolved = true;
          setStatus("ready");
        }
        return;
      }

      // No query-based token: give the client library a moment to process
      // an implicit-flow hash fragment (#access_token=...) automatically.
      setTimeout(async () => {
        if (resolved) return;
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          resolved = true;
          setStatus("ready");
        } else {
          setStatus("invalid");
        }
      }, 1000);
    })();

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setDone(true);
    setTimeout(() => router.replace("/"), 1000);
  }

  if (status === "checking") {
    return <p className="text-center text-sm text-navy-dark/70">Checking your invite link…</p>;
  }

  if (status === "invalid") {
    return (
      <p className="text-center text-sm text-red-700">
        This link has expired or already been used. Ask an admin to resend your invite.
      </p>
    );
  }

  if (done) {
    return <p className="text-center text-sm text-emerald-700">Password set — taking you to the dashboard…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-navy-dark">
          New Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-md border border-border-soft bg-white px-3 py-2 text-sm shadow-sm focus:border-copper focus:outline-none focus:ring-1 focus:ring-copper"
        />
      </div>
      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-navy-dark">
          Confirm Password
        </label>
        <input
          id="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mt-1 w-full rounded-md border border-border-soft bg-white px-3 py-2 text-sm shadow-sm focus:border-copper focus:outline-none focus:ring-1 focus:ring-copper"
        />
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-60"
      >
        {submitting ? "Setting password…" : "Set Password"}
      </button>
    </form>
  );
}
