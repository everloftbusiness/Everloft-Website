import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
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

export function Footer() {
  return (
    <footer className="bg-primary text-white">
      <div className="site-container section-padding-tight">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo variant="light" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/60">
              Premium Stays. Thoughtfully Managed. Everloft offers carefully selected,
              professionally managed homestays that combine hotel-grade comfort with the
              warmth of a home.
            </p>
            <div className="mt-6 flex gap-3">
              {SOCIAL_LINKS.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-gold hover:text-gold"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-5 text-sm font-semibold tracking-wide text-white/50 uppercase">
              Explore
            </h3>
            <ul className="space-y-3">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/75 transition-colors hover:text-gold">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-sm font-semibold tracking-wide text-white/50 uppercase">
              Partner With Us
            </h3>
            <ul className="space-y-3">
              {PARTNER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/75 transition-colors hover:text-gold">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className="mt-8 mb-5 text-sm font-semibold tracking-wide text-white/50 uppercase">
              Legal
            </h3>
            <ul className="space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/75 transition-colors hover:text-gold">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-sm font-semibold tracking-wide text-white/50 uppercase">
              Stay in the loop
            </h3>
            <p className="mb-4 text-sm text-white/60">
              New properties, seasonal offers, and Everloft stories — every couple of weeks.
            </p>
            <NewsletterForm />

            <div className="mt-8 space-y-3">
              <a href="tel:+917483270264" className="flex items-center gap-2.5 text-sm text-white/75 hover:text-gold">
                <Phone className="h-4 w-4 text-gold" /> (+91) 748-327-0264
              </a>
              <a href="mailto:everloft.business@gmail.com" className="flex items-center gap-2.5 text-sm text-white/75 hover:text-gold">
                <Mail className="h-4 w-4 text-gold" /> everloft.business@gmail.com
              </a>
              <div className="flex items-start gap-2.5 text-sm text-white/75">
                <MapPin className="h-4 w-4 shrink-0 translate-y-0.5 text-gold" />
                1st Floor, Bose Nagar, Kadavanthara, Ernakulam, Kerala 682020
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-white/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Everloft. All rights reserved.</p>
          <p>Handled with Purpose.</p>
        </div>
      </div>
    </footer>
  );
}
