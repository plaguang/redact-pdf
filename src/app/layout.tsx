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

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://redact-pdf.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Redact PDF Online Free – Black Out Text & PII, No Upload",
  description:
    "Free online PDF redaction tool. Black out text, emails, phone numbers and SSNs permanently. Runs 100% in your browser — your file is never uploaded.",
  alternates: { canonical: "/" },
  openGraph: { title: "Redact PDF Online Free & Private", description: "Permanently black out sensitive info in PDFs. No upload.", type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
