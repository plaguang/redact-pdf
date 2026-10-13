import Redactor from "@/components/Redactor";

const faqs = [
  ["Is my PDF uploaded to a server?", "No. Everything runs locally in your browser using JavaScript. Your document never leaves your device, so it is safe for contracts, medical records, tax forms and IDs."],
  ["Is the redaction permanent?", "Yes. When you download, every page is flattened into an image with the black boxes burned in. The original text layer is removed, so redacted text cannot be copied, searched or recovered."],
  ["Can it find personal information automatically?", "It scans the text for email addresses, phone numbers, US Social Security numbers and card numbers and boxes them for you. Always review the result and add boxes for names, addresses or signatures."],
  ["How do I black out text in a PDF?", "Drop your PDF above, drag a rectangle over any text or image you want to hide, then click Download redacted PDF. Click a box to remove it."],
  ["Is this redact PDF tool free?", "Yes, it is free with no sign-up, no watermark and no page limit."],
  ["Does it work for scanned PDFs?", "Yes. Manual boxes work on any page, including scans. Auto-detect needs real text, so scanned images need manual boxes."],
];

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebApplication", name: "Redact PDF", applicationCategory: "UtilitiesApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } },
      { "@type": "FAQPage", mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
    ],
  };
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Redact PDF Online — Free &amp; Private</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          Black out text, emails, phone numbers and SSNs in any PDF. Runs entirely in your browser — your file is never uploaded.
        </p>
      </header>

      <Redactor />

      <section className="grid gap-6 sm:grid-cols-3">
        {[
          ["🔒 100% private", "No upload, no server, no account. Works offline once loaded."],
          ["🤖 Auto-detect PII", "Finds emails, phone numbers, SSNs and card numbers in one click."],
          ["⬛ True redaction", "Text under the box is permanently removed, not just covered."],
        ].map(([t, d]) => (
          <div key={t} className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="font-semibold">{t}</h2>
            <p className="mt-1 text-sm text-slate-600">{d}</p>
          </div>
        ))}
      </section>

      <section className="prose max-w-none">
        <h2 className="text-2xl font-bold">How to redact a PDF for free</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-6 text-slate-700">
          <li>Drop your PDF into the box above (or click to choose a file).</li>
          <li>Review the automatically detected emails, phone numbers and IDs.</li>
          <li>Drag over any other text, image or signature to black it out.</li>
          <li>Click <b>Download redacted PDF</b>. Done — nothing was uploaded.</li>
        </ol>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Frequently asked questions</h2>
        <div className="mt-4 divide-y rounded-xl bg-white shadow-sm">
          {faqs.map(([q, a]) => (
            <details key={q} className="p-4">
              <summary className="cursor-pointer font-medium">{q}</summary>
              <p className="mt-2 text-slate-600">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t pt-6 text-center text-sm text-slate-500">© 2026 Redact PDF · Files are processed locally and never stored.</footer>
    </main>
  );
}
