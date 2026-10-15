import Landing from "@/components/Landing";

export default function Home() {
  return (
    <Landing
      path="/"
      h1="Redact PDF Online — Free, Permanent & 100% Private"
      lede="Permanently black out or white out text, Social Security Numbers (SSN), bank account details, emails and phone numbers in any PDF. Runs 100% locally in your browser — your confidential documents are never uploaded."
      steps={[
        "Drop your PDF into the box above (or click Load Sample Confidential PDF to test instant PII detection).",
        "Review the automatically boxed Emails, Phone Numbers, SSNs, Credit Cards, Dates and Dollar Amounts ($).",
        "Use the 'Find & redact word/name' search box to mask specific names across all pages, or drag anywhere on a page to draw a manual box.",
        "Choose Solid Blackout, Whiteout, or [REDACTED] Stamp and click Download redacted PDF — the underlying text layer is permanently destroyed.",
      ]}
      faqs={[
        [
          "Is my PDF uploaded to a remote server?",
          "No. Everything runs locally inside your browser tab using JavaScript and WebAssembly. Your document never leaves your device, making it safe for tax returns, W-2s, bank statements, NDAs and medical records.",
        ],
        [
          "Is the redaction truly permanent and unrecoverable?",
          "Yes. Unlike basic PDF editors that merely place a black rectangle over selectable text, TrueRedact flattens each page into a rasterized bitmap with your redactions burned directly into the pixels. The original text stream and metadata are completely stripped.",
        ],
        [
          "Can it find personal information and keywords automatically?",
          "Yes. It automatically scans every page for email addresses, phone numbers, US Social Security Numbers (SSN), credit card numbers, dates and dollar amounts ($), plus lets you search and redact any custom word or name across all pages at once.",
        ],
        [
          "Does it work on scanned PDFs?",
          "Yes. Manual drag-to-redact boxes work on any PDF page, including scanned images and signatures.",
        ],
      ]}
    />
  );
}
