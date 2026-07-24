import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/actions/auth";
import { NavLink } from "@/components/ui/NavLink";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="flex w-60 shrink-0 flex-col bg-navy-dark px-4 py-6">
        <div className="mb-8 px-2">
          <Image src="/brand/michels-logo-white.png" alt="Michels Catering & Events" width={160} height={58} priority />
        </div>

        <Link
          href="/quotes/new"
          className="mb-6 rounded-md bg-copper px-3 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-copper-dark"
        >
          + New Quote
        </Link>

        <nav className="flex flex-col gap-1">
          <NavLink href="/" exact>
            Dashboard
          </NavLink>
          <NavLink href="/clients">Clients</NavLink>
          <NavLink href="/archive">Archive</NavLink>
        </nav>

        <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
          <p className="px-2 text-xs text-white/60">Signed in as</p>
          <p className="px-2 text-sm font-medium text-white">{profile?.full_name ?? user.email}</p>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full rounded-md px-3 py-2 text-left text-sm text-white/70 transition-colors hover:bg-navy-light hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-background">
        <div className="mx-auto max-w-7xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
