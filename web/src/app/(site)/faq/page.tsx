import type { Metadata } from "next";
import { FaqPageClient } from "@/components/marketing/faq-page-client";
import { faqCategories } from "@/lib/data/faqs";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about booking, payments, cancellation, and more.",
};

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqCategories.flatMap((c) =>
      c.items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      }))
    ),
  };

  return (
    <div className="site-container max-w-4xl pt-32 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="text-center">
        <p className="eyebrow mb-4 justify-center">Support</p>
        <h1 className="heading-display text-3xl sm:text-4xl">Frequently asked questions</h1>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
          Search or browse by category — booking, payments, cancellations, and more.
        </p>
      </div>

      <FaqPageClient categories={faqCategories} />
    </div>
  );
}
