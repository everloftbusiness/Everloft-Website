import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NavigationProgress } from "@/components/navigation-progress";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://everloft.co.in";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#064e3b",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Everloft | Premium Stays. Thoughtfully Managed.",
    template: "%s | Everloft",
  },
  description:
    "Everloft offers premium, professionally managed homestays with hotel-grade comfort, privacy, and seamless hospitality for modern travelers.",
  keywords: [
    "Everloft",
    "premium homestays India",
    "managed villas Kerala",
    "professionally managed stays",
    "boutique stays Kochi",
    "Everloft owner program",
    "Everloft investor program",
  ],
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Everloft",
    title: "Everloft | Premium Stays. Thoughtfully Managed.",
    description:
      "Premium, professionally managed stays with comfort, privacy, and seamless hospitality.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Everloft | Premium Stays. Thoughtfully Managed.",
    description:
      "Premium, professionally managed stays with comfort, privacy, and seamless hospitality.",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Everloft",
  url: siteUrl,
  logo: `${siteUrl}/favicon.png`,
  description:
    "Everloft offers premium, professionally managed homestays with hotel-grade comfort, privacy, and seamless hospitality for modern travelers.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "1st Floor, Bose Nagar, Kadavanthara",
    addressLocality: "Ernakulam",
    addressRegion: "Kerala",
    postalCode: "682020",
    addressCountry: "IN",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+91-74832-70264",
    email: "everloft.business@gmail.com",
    contactType: "customer service",
    areaServed: "IN",
  },
  sameAs: [
    "https://www.facebook.com/share/182zDazKm4/?mibextid=wwXIfr",
    "https://www.instagram.com/everloft.co.in",
  ],
};

import { MobileBottomNav } from "@/components/site/mobile-bottom-nav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col bg-background text-foreground pb-16 lg:pb-0">
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
        <MobileBottomNav />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
