import type { Metadata } from "next";
import Landing from "@/components/Landing";

export const metadata: Metadata = {
  title: "Remove Personal Information from PDF – Free PII Redaction Tool",
  description: "Automatically find and remove emails, phone numbers, SSNs and card numbers from PDFs before sharing. Free, private, runs entirely in your browser.",
  alternates: { canonical: "/remove-personal-information-from-pdf" },
};

export default function Page() {
  return (
    <Landing
      path="/remove-personal-information-from-pdf"
      h1="Remove Personal Information from PDF"
      lede="Scan your PDF for emails, phone numbers, Social Security numbers and card numbers, then redact them in one click. Your document never leaves your device."
      steps={[
        "Drop the PDF you want to share into the box above.",
        "Personal information is detected and boxed automatically. Toggle each type on or off.",
        "Drag extra boxes over names, addresses or signatures.",
        "Download the redacted copy and share it safely.",
      ]}
      faqs={[
        ["What personal information is detected automatically?", "Email addresses, phone numbers, US Social Security numbers and payment card numbers. Names and street addresses vary too much to detect reliably, so add boxes for those manually."],
        ["Is this a safe PII redaction tool for sensitive documents?", "Yes. Processing happens locally in your browser, nothing is uploaded or stored, and the exported PDF contains no hidden text layer."],
        ["Which documents is this useful for?", "Bank statements, pay stubs, tax forms, medical records, leases, invoices, resumes and any document you need to send by email or upload to a third party."],
        ["Does it detect information in scanned PDFs?", "Auto-detection needs selectable text. For scanned pages, drag boxes over the information manually."],
      ]}
    />
  );
}
