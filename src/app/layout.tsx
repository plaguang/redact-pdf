import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
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
        <Analytics />
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="lazyOnload" />
            <Script id="ga4-init" strategy="lazyOnload">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}
        {CLARITY_ID && (
          <Script id="clarity-init" strategy="lazyOnload">
            {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`}
          </Script>
        )}
      </body>
    </html>
  );
}
