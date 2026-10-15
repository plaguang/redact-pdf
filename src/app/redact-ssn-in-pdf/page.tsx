import type { Metadata } from "next";
import Landing from "@/components/Landing";

export const metadata: Metadata = {
  title: "Redact SSN in PDF Online Free – Black Out Social Security Numbers Locally",
  description:
    "Automatically detect and permanently black out Social Security Numbers (SSN), EINs and Tax IDs in W-2, 1099 and tax return PDFs. 100% local in-browser processing.",
  alternates: { canonical: "/redact-ssn-in-pdf" },
};

export default function RedactSsnInPdfPage() {
  return (
    <Landing
      path="/redact-ssn-in-pdf"
      h1="Redact SSN in PDF — Auto-Detect & Permanently Remove Tax IDs"
      lede="Need to send a W-2, 1099, 1040 tax return or background check without exposing your Social Security Number? Automatically find and permanently destroy every XXX-XX-XXXX pattern in your browser without uploading your tax files to the cloud."
      steps={[
        "Drop your tax return, W-2, 1099 or application PDF into the box above (or click Load Sample Confidential PDF to test).",
        "Verify that the 'SSN' auto-detect toggle is checked — every XXX-XX-XXXX Social Security Number is boxed automatically.",
        "Use the 'Find & redact word/name' bar or drag on the page to mask unformatted 9-digit Tax IDs or Employer IDs (EIN).",
        "Click Download redacted PDF to save a flattened PDF with zero recoverable underlying text.",
      ]}
      faqs={[
        [
          "Is it safe to redact my tax return or W-2 online?",
          "With cloud-based PDF editors, your tax return is uploaded to a remote server. TrueRedact PDF runs 100% locally inside your browser tab — your SSN never leaves your computer.",
        ],
        [
          "Can someone copy-paste or uncover my SSN after I redact it here?",
          "No. When you click Download redacted PDF, each page is rasterized into a flattened image with the blackout burned into the pixels, completely stripping the original PDF text layer.",
        ],
        [
          "What if my SSN is written without dashes?",
          "Simply type the 9 digits (or last 4 digits) into the 'Find & redact word/name' search box and click '+ Redact All Matches', or drag a box directly over the number.",
        ],
      ]}
    />
  );
}
