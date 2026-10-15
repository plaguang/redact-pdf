import Redactor from "@/components/Redactor";
import Link from "next/link";

export type LandingProps = {
  h1: string;
  lede: string;
  steps: string[];
  faqs: [string, string][];
  path: string;
};

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://redact-pdf-phi.vercel.app";

const NAV_LINKS = [
  { href: "/", label: "Redact PDF" },
  { href: "/black-out-text-in-pdf", label: "Black Out Text" },
  { href: "/remove-personal-information-from-pdf", label: "Remove PII" },
  { href: "/redact-ssn-in-pdf", label: "Redact SSN / Tax ID" },
  { href: "/redact-bank-statement-pdf", label: "Redact Bank Statement" },
];

// 关键词落地页通用模板：吸顶导航 + 工具 + 安全对比表 + 步骤 + FAQ（含结构化数据）+ 内链
export default function Landing({ h1, lede, steps, faqs, path }: LandingProps) {
  const fullUrl = `${SITE}${path === "/" ? "" : path}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: h1,
        url: fullUrl,
        applicationCategory: "SecurityApplication",
        operatingSystem: "Any (Web Browser)",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        featureList: [
          "True rasterized flatten PDF redaction (zero recoverable text layer)",
          "Automatic SSN, Email, Phone, Credit Card, Date and Dollar Amount detection",
          "Bulk keyword search and redact across all PDF pages",
          "Solid Blackout, Whiteout/Erase, and [REDACTED] Stamp styles",
          "100% local in-browser WebAssembly/Canvas processing",
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "RedactPDF", item: SITE },
          ...(path !== "/" ? [{ "@type": "ListItem", position: 2, name: h1, item: fullUrl }] : []),
        ],
      },
      {
        "@type": "HowTo",
        name: h1,
        step: steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, text: s })),
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map(([q, a]) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-xs text-white">
              █
            </span>
            <span>TrueRedact PDF</span>
          </Link>
          <nav aria-label="PDF redaction tools" className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
            {NAV_LINKS.map((l) => {
              const active = l.href === path;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-lg px-2.5 py-1.5 font-medium transition ${
                    active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-10">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <div className="text-center">
          <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
            <span>🔒 100% Local In-Browser Sanitization · Underlying Text Layer Permanently Destroyed</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{h1}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">{lede}</p>
        </div>

        <Redactor />

        <section className="grid gap-5 sm:grid-cols-3">
          {[
            [
              "🛡️ Unrecoverable Flattening",
              "Drawing a black rectangle in standard PDF editors leaves the secret text copy-pasteable underneath. We burn redactions into a flattened bitmap so removed text is physically gone.",
            ],
            [
              "🔍 Auto-PII + Keyword Search",
              "Automatically flags SSNs, Emails, Phones, Credit Cards, Dates and Dollar Amounts ($), plus lets you search and redact any name or account number across all pages at once.",
            ],
            [
              "💻 Zero Cloud Upload",
              "Never upload tax returns, W-2s, bank statements or court filings to a third-party server. Everything runs locally inside your browser tab.",
            ],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-900">{title}</h2>
              <p className="mt-1 text-sm text-slate-600">{desc}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">How it works</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-6 text-slate-700">
            {steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
          <div className="mt-4 divide-y rounded-xl border border-slate-200 bg-white shadow-sm">
            {faqs.map(([q, a]) => (
              <details key={q} className="p-4" open>
                <summary className="cursor-pointer font-semibold text-slate-900">{q}</summary>
                <p className="mt-2 text-sm text-slate-600">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <nav className="flex flex-wrap justify-center gap-4 border-t border-slate-200 pt-6 text-sm text-slate-600">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="underline hover:text-slate-900">
              {l.label}
            </Link>
          ))}
        </nav>

        <footer className="text-center text-xs text-slate-400">
          © 2026 TrueRedact PDF · All PDF sanitization runs locally in your browser. Files are never uploaded or stored.
        </footer>
      </main>
    </div>
  );
}
