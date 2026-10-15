import type { Metadata } from "next";
import Landing from "@/components/Landing";

export const metadata: Metadata = {
  title: "Redact Bank Statement PDF Online Free – Hide Account Numbers & Amounts",
  description:
    "Safely redact bank statement PDFs for mortgage, rental or visa applications. Black out account numbers, card digits and dollar amounts 100% locally in your browser.",
  alternates: { canonical: "/redact-bank-statement-pdf" },
};

export default function RedactBankStatementPdfPage() {
  return (
    <Landing
      path="/redact-bank-statement-pdf"
      h1="Redact Bank Statement PDF — Hide Account Numbers & Dollar Amounts"
      lede="Submitting a bank statement for a rental application, proof of address or mortgage? Automatically mask 13–16 digit card/account numbers, toggle 'Amount ($)' to hide balances and transactions, or search specific merchant names — 100% locally in your browser."
      steps={[
        "Drop your bank or credit card statement PDF above (your financial document stays 100% on your device).",
        "Check the 'Card' and 'Amount' auto-detect toggles to automatically black out card/account digits and dollar amounts ($).",
        "Type your bank account number or specific transaction keywords into the 'Find & redact' bar to mask every occurrence across all pages.",
        "Choose Solid Blackout, Whiteout, or [REDACTED] Stamp and click Download redacted PDF.",
      ]}
      faqs={[
        [
          "How do I hide dollar amounts on a bank statement for proof of address?",
          "Once you load your bank statement PDF, simply click the 'Amount' pill in the top bar. Every dollar figure ($XX.XX) across all pages will be covered automatically.",
        ],
        [
          "Can I use Whiteout instead of black bars on my statement?",
          "Yes! Switch the Style toggle in the toolbar from 'Solid Blackout' to 'Whiteout / Erase' before downloading.",
        ],
        [
          "Does this remove hidden PDF metadata from my bank statement?",
          "Yes. Exporting rebuilds the document from flattened page bitmaps, stripping all original text streams, annotations, and embedded PDF metadata.",
        ],
      ]}
    />
  );
}
