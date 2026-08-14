import Link from "next/link";
import { Mail, Phone, MapPin, ShieldCheck, Zap, Tag, Headset, MessageCircle } from "lucide-react";
import { Logo } from "@/components/logo";
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
    <footer className="bg-emerald-950 text-white relative border-t border-white/10">
      {/* Floating WhatsApp Action */}
      <a
        href="https://wa.me/917483270264?text=Hello%20Everloft,%20I%20would%20like%20to%20inquire%20about%20a%20stay"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Everloft Concierge on WhatsApp"
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl transition-all hover:scale-110 active:scale-95"
      >
        <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7" />
      </a>

      {/* Main Footer Links */}
      <div className="site-container py-10 sm:py-12">
        <div className="grid gap-8 sm:gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          <div>
            <Logo variant="light" />
            <p className="mt-4 max-w-xs text-xs sm:text-sm leading-relaxed text-white/70">
              Premium Stays. Thoughtfully Managed. Everloft offers carefully selected,
              professionally managed homestays combining hotel-grade standards with the
              warmth of a home.
            </p>
            <div className="mt-5 flex gap-3">
              {SOCIAL_LINKS.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-amber-400 hover:text-amber-400"
                  aria-label={label}
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold tracking-wider text-white/50 uppercase">
              Explore
            </h4>
            <ul className="space-y-2.5">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-xs sm:text-sm text-white/80 transition-colors hover:text-amber-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold tracking-wider text-white/50 uppercase">
              Partner With Us
            </h4>
            <ul className="space-y-2.5">
              {PARTNER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-xs sm:text-sm text-white/80 transition-colors hover:text-amber-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h4 className="mt-6 mb-3 text-xs font-bold tracking-wider text-white/50 uppercase">
              Legal
            </h4>
            <ul className="space-y-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-xs text-white/70 transition-colors hover:text-amber-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold tracking-wider text-white/50 uppercase">
              Contact & Headquarters
            </h4>
            <div className="space-y-3">
              <a href="tel:+917483270264" className="flex items-center gap-2.5 text-xs sm:text-sm text-white/80 hover:text-amber-400 transition-colors">
                <Phone className="h-4 w-4 text-amber-400 shrink-0" />
                <span>(+91) 748-327-0264</span>
              </a>
              <a href="mailto:everloft.business@gmail.com" className="flex items-center gap-2.5 text-xs sm:text-sm text-white/80 hover:text-amber-400 transition-colors">
                <Mail className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="truncate">everloft.business@gmail.com</span>
              </a>
              <div className="flex items-start gap-2.5 text-xs sm:text-sm text-white/80 leading-relaxed">
                <MapPin className="h-4 w-4 shrink-0 translate-y-0.5 text-amber-400" />
                <span>1st Floor, Bose Nagar, Kadavanthara, Ernakulam, Kerala 682020</span>
              </div>
            </div>
          </div>
        </div>

        {/* Guarantees Strip */}
        <div className="mt-8 border-t border-white/10 pt-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {GUARANTEES.map((g) => {
              const Icon = g.icon;
              return (
                <div key={g.title} className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-amber-400">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{g.title}</p>
                    <p className="text-[10px] text-white/60">{g.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-4 text-xs text-white/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Everloft Hospitality. All rights reserved.</p>
          <p>Handled with Purpose.</p>
        </div>
      </div>
    </footer>
  );
}
