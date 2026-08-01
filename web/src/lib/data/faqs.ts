export type FaqCategory = {
  slug: string;
  label: string;
  items: { question: string; answer: string }[];
};

export const faqCategories: FaqCategory[] = [
  {
    slug: "booking",
    label: "Booking",
    items: [
      {
        question: "How do I book a stay with Everloft?",
        answer:
          "Choose your property, select your dates and guest count, and complete checkout in three simple steps. Every booking is confirmed instantly and directly with Everloft — there's no third-party host to coordinate with.",
      },
      {
        question: "Can I modify my dates after booking?",
        answer:
          "Yes. Reach out to our support team via chat, phone, or WhatsApp at least 48 hours before check-in and we'll do our best to accommodate a date change, subject to availability.",
      },
      {
        question: "Is there a minimum stay requirement?",
        answer:
          "Most properties require a 1-night minimum on weekdays and a 2-night minimum on weekends and holidays. Exact minimums are shown on each property page before you book.",
      },
    ],
  },
  {
    slug: "payments",
    label: "Payments",
    items: [
      {
        question: "What payment methods are accepted?",
        answer:
          "We accept all major credit and debit cards, UPI, net banking, and popular wallets through our secure payment partner, Razorpay. All transactions are encrypted end to end.",
      },
      {
        question: "Do you offer flexible payment plans?",
        answer:
          "For bookings over 5 nights, we offer a split payment option — 50% at booking and 50% seven days before check-in. This is shown automatically at checkout when eligible.",
      },
      {
        question: "Will I get an invoice for my stay?",
        answer:
          "Yes, a GST-compliant invoice is emailed immediately after payment and is also downloadable anytime from your booking confirmation page.",
      },
    ],
  },
  {
    slug: "cancellation",
    label: "Cancellation",
    items: [
      {
        question: "What is Everloft's cancellation policy?",
        answer:
          "Standard bookings are fully refundable up to 7 days before check-in, 50% refundable up to 3 days before, and non-refundable within 72 hours of check-in. Peak-season and festive bookings may follow a stricter policy shown at checkout.",
      },
      {
        question: "How long do refunds take to process?",
        answer:
          "Approved refunds are processed within 5–7 business days back to your original payment method.",
      },
    ],
  },
  {
    slug: "check-in",
    label: "Check-in",
    items: [
      {
        question: "What time is check-in and check-out?",
        answer:
          "Standard check-in is 1:00–3:00 PM depending on the property, and check-out is by 11:00 AM. Early check-in and late check-out can be requested and are confirmed based on availability.",
      },
      {
        question: "Is contactless check-in available?",
        answer:
          "Most Everloft properties offer smart-lock, contactless check-in with digital access codes sent the morning of arrival. Villas with a resident host will greet you in person.",
      },
    ],
  },
  {
    slug: "property",
    label: "Property",
    items: [
      {
        question: "Are all properties professionally managed?",
        answer:
          "Yes. Every property in our collection is directly owned, leased, or professionally managed by Everloft — never a third-party individual host — and held to the same hotel-grade cleaning and maintenance standard.",
      },
      {
        question: "Are the photos and amenities accurate?",
        answer:
          "Our properties are inspected and re-verified quarterly by our operations team so that what you see is what you get, down to the amenity list.",
      },
    ],
  },
  {
    slug: "guests",
    label: "Guests",
    items: [
      {
        question: "Can I bring more guests than listed?",
        answer:
          "Each listing shows a maximum occupancy for safety and comfort reasons. Additional guests beyond that limit are not permitted, though children under 5 are usually not counted — check the specific property page.",
      },
      {
        question: "Are pets allowed?",
        answer:
          "Select villas and holiday homes are pet-friendly — look for the 'Pet friendly' amenity tag. Please inform us in advance so we can prepare the property accordingly.",
      },
    ],
  },
  {
    slug: "owners",
    label: "Owners",
    items: [
      {
        question: "How does Everloft's property management work?",
        answer:
          "We handle everything — professional photography, dynamic pricing, guest communication, housekeeping, maintenance, and legal compliance — while you receive transparent monthly reports and payouts.",
      },
      {
        question: "What commission does Everloft charge?",
        answer:
          "Our management fee is discussed during your consultation and depends on the scope of services and property type. Book a free consultation from the Property Management page for a tailored quote.",
      },
    ],
  },
  {
    slug: "investors",
    label: "Investors",
    items: [
      {
        question: "How can I invest with Everloft?",
        answer:
          "We offer structured investment opportunities in our managed hospitality portfolio. Visit the Investor Program page to review our model and submit an interest form — our investment team will follow up within 2 business days.",
      },
      {
        question: "What returns can investors expect?",
        answer:
          "Returns vary by investment structure and property mix. Our investor deck, shared after an initial call, outlines historical performance and projected return ranges in detail.",
      },
    ],
  },
];

export const homepageFaqs = faqCategories.flatMap((c) => c.items).slice(0, 6);
