"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, LayoutDashboard } from "lucide-react";
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

  const solid = scrolled || open;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        solid
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-[0_1px_0_0_rgba(15,23,42,0.04)]"
          : "bg-transparent"
      )}
    >
      <div className="site-container flex h-18 items-center justify-between py-3.5">
        <Link href="/" className="shrink-0">
          <Logo variant={solid ? "dark" : "light"} />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors",
                solid ? "text-foreground/80 hover:text-primary" : "text-white/85 hover:text-white",
                pathname === link.href && (solid ? "text-primary" : "text-white")
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          {session ? (
            <>
              <Link
                href={`/dashboard/${session.roleSlug}`}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors",
                  solid ? "text-foreground/80 hover:text-primary" : "text-white/85 hover:text-white"
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                {session.name}
              </Link>
              <Button asChild variant="gold" size="lg" className="rounded-full px-6">
                <Link href={`/dashboard/${session.roleSlug}`}>Dashboard</Link>
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(
                  "text-sm font-medium transition-colors",
                  solid ? "text-foreground/80 hover:text-primary" : "text-white/85 hover:text-white"
                )}
              >
                Login
              </Link>
              <Button asChild variant="gold" size="lg" className="rounded-full px-6">
                <Link href="/properties">Book Now</Link>
              </Button>
            </>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full transition-colors lg:hidden",
                solid ? "text-primary" : "text-white"
              )}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[340px]">
            <SheetHeader>
              <SheetTitle>
                <Logo variant="dark" />
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1 px-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3.5 text-base font-medium text-foreground/85 transition-colors hover:bg-muted hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/faq"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3.5 text-base font-medium text-foreground/85 transition-colors hover:bg-muted hover:text-primary"
              >
                FAQ
              </Link>
              {session ? (
                <Link
                  href={`/dashboard/${session.roleSlug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-3.5 text-base font-medium text-foreground/85 transition-colors hover:bg-muted hover:text-primary"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {session.name}
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3.5 text-base font-medium text-foreground/85 transition-colors hover:bg-muted hover:text-primary"
                >
                  Login
                </Link>
              )}
            </nav>
            <div className="mt-4 px-4">
              <Button asChild variant="gold" size="xl" className="w-full rounded-full">
                {session ? (
                  <Link href={`/dashboard/${session.roleSlug}`} onClick={() => setOpen(false)}>
                    Go to Dashboard
                  </Link>
                ) : (
                  <Link href="/properties" onClick={() => setOpen(false)}>
                    Book Now
                  </Link>
                )}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
