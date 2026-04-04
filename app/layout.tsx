import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "LoL Pool Optimizer",
  description:
    "Champion pool optimizer — matchup matrix, coverage gaps & champion suggestions",
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
        {children}
        {process.env.NODE_ENV === "development" && <InspectOverlay />}
      </body>
    </html>
  );
}
