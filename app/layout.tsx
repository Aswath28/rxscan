import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "RxScan — Scan your prescription. Know your medicines.",
  description: "AI reads your doctor's handwriting, identifies medicines, shows generic alternatives with savings, and flags drug interactions. Free, no signup.",
  openGraph: {
    title: "RxScan — Stop overpaying for medicines",
    description: "Scan any handwritten prescription → AI identifies medicines, shows generic alternatives with 50–90% savings, flags drug interactions. Free.",
    siteName: "RxScan",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "RxScan — Stop overpaying for medicines",
    description: "Scan any handwritten prescription → AI identifies medicines, shows generic alternatives with 50–90% savings, flags drug interactions.",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
