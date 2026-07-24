import { Suspense } from "react";
import Image from "next/image";
import { SetPasswordForm } from "@/components/auth/SetPasswordForm";

export default function SetPasswordPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-navy px-4">
      <div className="w-full max-w-md rounded-xl bg-cream p-10 shadow-2xl">
        <div className="mb-8 flex justify-center">
          <Image src="/brand/michels-logo-navy.png" alt="Michels Catering & Events" width={220} height={80} priority />
        </div>
        <h1 className="mb-6 text-center text-lg font-semibold text-navy-dark">Set Your Password</h1>
        <Suspense fallback={<p className="text-center text-sm text-navy-dark/70">Loading…</p>}>
          <SetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
