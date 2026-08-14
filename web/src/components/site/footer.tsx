import Link from "next/link";
import { Mail, Phone, MapPin, ShieldCheck, Zap, Tag, Headset, MessageCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import { NewsletterForm } from "@/components/site/newsletter-form";
import { InstagramIcon, FacebookIcon } from "@/components/icons/social-icons";

const SOCIAL_LINKS = [
  { Icon: FacebookIcon, href: "https://www.facebook.com/share/182zDazKm4/?mibextid=wwXIfr", label: "Facebook" },
  { Icon: InstagramIcon, href: "https://www.instagram.com/everloft.co.in", label: "Instagram" },
];

const EXPLORE_LINKS = [
  { href: "/properties", label: "Our Collection" },
  { href: "/about", label: "About Everloft" },
  { href: "/contact", label: "Contact Us" },
  { href: "/faq", label: "FAQ" },
];

const PARTNER_LINKS = [
  { href: "/property-management", label: "Property Management" },
  { href: "/investor-program", label: "Investor Program" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
];

const GUARANTEES = [
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    subtitle: "100% safe & encrypted",
  },
  {
    icon: Zap,
    title: "Instant Confirmation",
    subtitle: "Book in seconds",
  },
  {
    icon: Tag,
    title: "No Hidden Charges",
    subtitle: "What you see is what you pay",
  },
  {
    icon: Headset,
    title: "24/7 Guest Support",
    subtitle: "We're here anytime",
  },
];

export function Footer() {
  return (
    <footer className="bg-emerald-950 text-white relative">
      {/* Floating WhatsApp Action */}
      <a
        href="https://wa.me/917483270264?text=Hello%20Everloft,%20I%20would%20like%20to%20inquire%20about%20a%20stay"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Everloft Concierge on WhatsApp"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl transition-transform hover:scale-110 active:scale-95"
      >
        <MessageCircle className="h-7 w-7" />
      </a>

      {/* Main Footer Links */}
      <div className="site-container section-padding-tight">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo variant="light" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/70">
              Premium Stays. Thoughtfully Managed. Everloft offers carefully selected,
              professionally managed homestays combining hotel-grade standards with the
              warmth of a home.
            </p>
            <div className="mt-6 flex gap-3">
              {SOCIAL_LINKS.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-amber-400 hover:text-amber-400"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-5 text-xs font-bold tracking-wider text-white/50 uppercase">
              Explore
            </h4>
            <ul className="space-y-3">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/80 transition-colors hover:text-amber-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-xs font-bold tracking-wider text-white/50 uppercase">
              Partner With Us
            </h4>
            <ul className="space-y-3">
              {PARTNER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/80 transition-colors hover:text-amber-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h4 className="mt-8 mb-5 text-xs font-bold tracking-wider text-white/50 uppercase">
              Legal
            </h4>
            <ul className="space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/80 transition-colors hover:text-amber-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-xs font-bold tracking-wider text-white/50 uppercase">
              Stay in the loop
            </h4>
            <p className="mb-4 text-sm text-white/70">
              New properties, direct booking offers, and Everloft stories.
            </p>
            <NewsletterForm />

            <div className="mt-8 space-y-3">
              <a href="tel:+917483270264" className="flex items-center gap-2.5 text-sm text-white/80 hover:text-amber-400 transition-colors">
                <Phone className="h-4 w-4 text-amber-400" /> (+91) 748-327-0264
              </a>
              <a href="mailto:everloft.business@gmail.com" className="flex items-center gap-2.5 text-sm text-white/80 hover:text-amber-400 transition-colors">
                <Mail className="h-4 w-4 text-amber-400" /> everloft.business@gmail.com
              </a>
              <div className="flex items-start gap-2.5 text-sm text-white/80">
                <MapPin className="h-4 w-4 shrink-0 translate-y-0.5 text-amber-400" />
                1st Floor, Bose Nagar, Kadavanthara, Ernakulam, Kerala 682020
              </div>
            </div>
          </div>
        </div>

        {/* Guarantees Strip */}
        <div className="mt-14 border-t border-white/10 pt-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {GUARANTEES.map((g) => {
              const Icon = g.icon;
              return (
                <div key={g.title} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-amber-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{g.title}</p>
                    <p className="text-[11px] text-white/60">{g.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Everloft Hospitality. All rights reserved.</p>
          <p>Handled with Purpose.</p>
        </div>
      </div>
    </footer>
  );
}
