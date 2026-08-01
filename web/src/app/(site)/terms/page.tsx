import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  robots: { index: false },
};

export default function TermsPage() {
  return (
    <div className="site-container max-w-3xl pt-32 pb-24">
      <h1 className="heading-display text-3xl sm:text-4xl">Terms of Service</h1>
      <p className="mt-4 text-sm text-muted-foreground">Last updated: placeholder — replace with counsel-reviewed copy before launch.</p>
      <div className="prose mt-10 max-w-none space-y-6 text-sm leading-relaxed text-foreground/80">
        <p>
          These placeholder terms govern your use of the Everloft website and booking service.
          By making a booking, you agree to pay the total shown at checkout, arrive and depart
          within the check-in/check-out windows stated on the property page, and abide by the
          house rules listed for your chosen property.
        </p>
        <p>
          Cancellations and refunds follow the policy described on our{" "}
          <a href="/faq" className="text-primary underline">FAQ page</a>, which forms part of
          these terms. Everloft reserves the right to cancel a reservation in cases of
          suspected fraud or policy violation, with a full refund issued in such cases.
        </p>
        <p>
          This is placeholder content generated during development. A complete, legally
          reviewed terms of service — covering liability limitations, dispute resolution, and
          jurisdiction — should replace this page before the site goes live.
        </p>
      </div>
    </div>
  );
}
