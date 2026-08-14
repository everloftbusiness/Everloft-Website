"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Search", href: "/properties", icon: Search },
  { label: "Wishlist", href: "/properties?saved=true", icon: Heart },
  { label: "Bookings", href: "/dashboard", icon: Calendar },
  { label: "Account", href: "/login", icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  // Hide on onboarding wizard pages
  const isDashboardEditor = pathname.includes("/setup") || pathname.includes("/properties/new");
  if (isDashboardEditor) return null;

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 inset-x-0 z-40 flex h-16 items-center justify-around border-t border-border/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl px-2 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] lg:hidden"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          tab.href === "/"
            ? pathname === "/"
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-1 text-center transition-colors",
              isActive
                ? "text-emerald-800 dark:text-emerald-400 font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition-transform active:scale-90",
                isActive && "text-emerald-800 dark:text-emerald-400"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "stroke-[2.5]" : "stroke-[1.75]")} />
            </div>
            <span className="text-[10px] tracking-tight">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
