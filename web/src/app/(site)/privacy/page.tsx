import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  robots: { index: false },
};

export default function PrivacyPage() {
  return (
    <div className="site-container max-w-3xl pt-32 pb-24">
      <h1 className="heading-display text-3xl sm:text-4xl">Privacy Policy</h1>
      <p className="mt-4 text-sm text-muted-foreground">Last updated: placeholder — replace with counsel-reviewed copy before launch.</p>
      <div className="prose mt-10 max-w-none space-y-6 text-sm leading-relaxed text-foreground/80">
        <p>
           Everloft Hospitality Pvt. Ltd. (&ldquo;Everloft&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) respects your privacy. This
          placeholder policy outlines, at a high level, the categories of information we collect
          when you use this website and make a booking: contact details you provide (name,
          email, phone), booking details (dates, guests, property selected), and payment
          confirmation metadata from our payment partner — we do not store full card details.
        </p>
        <p>
          We use this information to process bookings, communicate with you about your stay,
          and improve our services. We do not sell personal information to third parties.
        </p>
        <p>
          This is placeholder content generated during development. A complete, legally reviewed
          privacy policy — covering data retention, cookies, third-party processors, and your
          rights under applicable law — should replace this page before the site goes live.
        </p>
      </div>
    </div>
  );
}
