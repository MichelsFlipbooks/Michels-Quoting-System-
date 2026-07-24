"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

export function NavLink({
  href,
  children,
  exact = false,
}: {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={clsx(
        "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-copper text-white" : "text-white/80 hover:bg-navy-light hover:text-white",
      )}
    >
      {children}
    </Link>
  );
}
