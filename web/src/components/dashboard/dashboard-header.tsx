"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, Key, LineChart, LayoutGrid, Building2, LogOut } from "lucide-react";
import { Logo } from "@/components/logo";
import type { DashboardSession } from "@/lib/dashboard/session";

export function DashboardHeader({ session }: { session: DashboardSession }) {
  const router = useRouter();
  const canViewProperties =
    session.permissions.includes("view_properties") || session.permissions.includes("manage_properties");

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="site-container flex h-16 items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <Link href="/" className="flex items-center gap-1.5 hover:text-primary">
            <Home className="h-3.5 w-3.5" /> Home
          </Link>
          {canViewProperties && (
            <Link href="/dashboard/properties" className="flex items-center gap-1.5 hover:text-primary">
              <Building2 className="h-3.5 w-3.5" /> Properties
            </Link>
          )}
          <Link href="/property-management" className="flex items-center gap-1.5 hover:text-primary">
            <Key className="h-3.5 w-3.5" /> Owner Program
          </Link>
          <Link href="/investor-program" className="flex items-center gap-1.5 hover:text-primary">
            <LineChart className="h-3.5 w-3.5" /> Investor Program
          </Link>
          <span className="flex items-center gap-1.5 text-primary">
            <LayoutGrid className="h-3.5 w-3.5" /> Dashboard
          </span>
        </nav>
        <div className="flex items-center gap-4">
          <span className="hidden text-xs font-medium text-muted-foreground sm:block">{session.roleLabel}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </div>
      </div>
    </header>
  );
}
