import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://redact-pdf-phi.vercel.app";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-8764ZP2KQ1";
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID || "yxcpqk8xbw";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Redact PDF Online Free – Black Out Text, SSN & Bank Statements Locally",
  description:
    "Free online PDF redaction tool. Permanently black out or white out text, emails, phone numbers, SSNs and bank account details. 100% in-browser — zero file upload.",
  alternates: { canonical: "/" },
  verification: { google: "OzbbXwBKIAGRAIV-NCTTfkOO6b3YAXZjqWxCrmygypM" },
  openGraph: {
    title: "Redact PDF Online Free & Private – True Rasterized Sanitization",
    description: "Permanently black out sensitive info, SSNs and bank statements in PDFs. 100% local in-browser.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {children}
        <AnalyticsProvider gaId={GA_ID} clarityId={CLARITY_ID} />
      </body>
    </html>
  );
}
