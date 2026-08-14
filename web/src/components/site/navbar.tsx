"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, LayoutDashboard, Phone } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/properties", label: "Properties" },
  { href: "/property-management", label: "Property Management" },
  { href: "/investor-program", label: "Investor Program" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

type DisplaySession = { name: string; role: string; roleSlug: string };

function readDisplaySession(): DisplaySession | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )everloft_display=([^;]*)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [session] = useState<DisplaySession | null>(readDisplaySession);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isHomePage = pathname === "/";
  const solid = !isHomePage || scrolled || open;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        solid
          ? "bg-background/95 backdrop-blur-md border-b border-border/80 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]"
          : "bg-transparent"
      )}
    >
      <div className="site-container flex h-18 items-center justify-between py-3.5">
        <Link href="/" className="shrink-0 transition-opacity hover:opacity-90">
          <Logo variant={solid ? "dark" : "light"} />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors",
                solid ? "text-foreground/80 hover:text-emerald-800 dark:hover:text-emerald-400" : "text-white/85 hover:text-white",
                pathname === link.href && (solid ? "text-emerald-800 dark:text-emerald-400 font-bold" : "text-white font-bold")
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <a
            href="tel:+917483270264"
            className={cn(
              "flex items-center gap-2 text-xs font-semibold tracking-wide transition-colors",
              solid ? "text-foreground hover:text-emerald-800 dark:hover:text-emerald-400" : "text-white/90 hover:text-white"
            )}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
              <Phone className="h-3.5 w-3.5" />
            </span>
            (+91) 748-327-0264
          </a>

          {session ? (
            <>
              <Link
                href={`/dashboard/${session.roleSlug}`}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors",
                  solid ? "text-foreground/80 hover:text-emerald-800 dark:hover:text-emerald-400" : "text-white/85 hover:text-white"
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                {session.name}
              </Link>
              <Button asChild size="lg" className="rounded-full px-6 bg-emerald-800 hover:bg-emerald-900 text-white font-bold shadow-sm">
                <Link href={`/dashboard/${session.roleSlug}`}>Dashboard</Link>
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(
                  "text-sm font-medium transition-colors",
                  solid ? "text-foreground/80 hover:text-emerald-800 dark:hover:text-emerald-400" : "text-white/85 hover:text-white"
                )}
              >
                Login
              </Link>
              <Button asChild size="lg" className="rounded-full px-6 bg-emerald-800 hover:bg-emerald-900 text-white font-bold shadow-sm">
                <Link href="/properties">Explore Stays</Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 lg:hidden">
          <a
            href="tel:+917483270264"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
              solid ? "text-primary hover:bg-slate-100" : "text-white hover:bg-white/10"
            )}
            aria-label="Call Everloft Concierge"
          >
            <Phone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </a>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                  solid ? "text-primary" : "text-white"
                )}
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[340px] p-0 flex flex-col justify-between bg-white">
            <div>
              <SheetHeader className="p-6 border-b border-border/80 text-left">
                <SheetTitle className="text-left">
                  <Logo variant="dark" />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-4">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-3.5 py-3 text-sm font-semibold text-foreground/90 transition-colors hover:bg-slate-100 hover:text-emerald-900"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/faq"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3.5 py-3 text-sm font-semibold text-foreground/90 transition-colors hover:bg-slate-100 hover:text-emerald-900"
                >
                  FAQs
                </Link>
                {session ? (
                  <Link
                    href={`/dashboard/${session.roleSlug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3.5 py-3 text-sm font-semibold text-emerald-900 bg-emerald-50"
                  >
                    <LayoutDashboard className="h-4 w-4 text-emerald-700" />
                    Dashboard ({session.name})
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-3.5 py-3 text-sm font-semibold text-foreground/90 transition-colors hover:bg-slate-100 hover:text-emerald-900"
                  >
                    Login
                  </Link>
                )}
              </nav>
            </div>

            {/* Bottom Support & CTA in Mobile Sheet */}
            <div className="p-5 border-t border-border/80 space-y-3 bg-slate-50">
              <a
                href="tel:+917483270264"
                className="flex items-center justify-center gap-2 text-xs font-semibold text-foreground py-2"
              >
                📞 (+91) 748-327-0264
              </a>
              <Button asChild size="lg" className="w-full rounded-full bg-emerald-900 hover:bg-emerald-950 text-white font-bold shadow-md">
                <Link href="/properties" onClick={() => setOpen(false)}>
                  Explore Stays
                </Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      </div>
    </header>
  );
}
