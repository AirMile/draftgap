import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { InspectOverlay } from "./inspect-overlay";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://draftgap.gg"),
  verification: {
    google: "7EshMgPwZpqR-_TJdRR92OqNnjtcN-mGwbpg_6p5Dc8",
  },
  title: "DraftGap — Champion Pool Optimizer for League of Legends",
  description:
    "Optimize your champion pool. Analyze matchups, find bad matchups and get data-driven suggestions.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "DraftGap — Champion Pool Optimizer",
    description:
      "Analyze matchups, find coverage gaps and get data-driven champion suggestions for League of Legends.",
    url: "/",
    siteName: "DraftGap",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "DraftGap — Champion Pool Optimizer for League of Legends",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DraftGap — Champion Pool Optimizer",
    description:
      "Analyze matchups, find coverage gaps and get data-driven champion suggestions for League of Legends.",
    images: ["/og-image.jpg"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "DraftGap",
  url: "https://draftgap.gg",
  description:
    "Champion pool optimizer for League of Legends. Analyze matchups, find coverage gaps and get data-driven suggestions.",
  applicationCategory: "GameApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <main className="flex-1">{children}</main>
        <Analytics />
        {process.env.NODE_ENV === "development" && <InspectOverlay />}
      </body>
    </html>
  );
}
