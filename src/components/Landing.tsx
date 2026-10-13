import Redactor from "@/components/Redactor";
import Link from "next/link";

export type LandingProps = {
  h1: string;
  lede: string;
  steps: string[];
  faqs: [string, string][];
  path: string;
};

// 关键词落地页通用模板：工具 + 步骤 + FAQ（含结构化数据）+ 内链
export default function Landing({ h1, lede, steps, faqs, path }: LandingProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebApplication", name: h1, url: path, applicationCategory: "UtilitiesApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } },
      { "@type": "HowTo", name: h1, step: steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, text: s })) },
      { "@type": "FAQPage", mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
    ],
  };
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{h1}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">{lede}</p>
      </header>
      <Redactor />
      <section>
        <h2 className="text-2xl font-bold">How it works</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-6 text-slate-700">
          {steps.map((s) => <li key={s}>{s}</li>)}
        </ol>
      </section>
      <section>
        <h2 className="text-2xl font-bold">FAQ</h2>
        <div className="mt-4 divide-y rounded-xl bg-white shadow-sm">
          {faqs.map(([q, a]) => (
            <details key={q} className="p-4">
              <summary className="cursor-pointer font-medium">{q}</summary>
              <p className="mt-2 text-slate-600">{a}</p>
            </details>
          ))}
        </div>
      </section>
      <nav className="flex flex-wrap justify-center gap-4 text-sm text-slate-600">
        <Link href="/" className="underline">Redact PDF</Link>
        <Link href="/black-out-text-in-pdf" className="underline">Black out text in PDF</Link>
        <Link href="/remove-personal-information-from-pdf" className="underline">Remove personal info from PDF</Link>
      </nav>
      <footer className="border-t pt-6 text-center text-sm text-slate-500">© 2026 Redact PDF · Files are processed locally and never stored.</footer>
    </main>
  );
}
