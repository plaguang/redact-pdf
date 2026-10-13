import type { Metadata } from "next";
import Landing from "@/components/Landing";

export const metadata: Metadata = {
  title: "Black Out Text in PDF – Free Online, No Upload",
  description: "Black out text in a PDF for free. Drag a box over any words, images or signatures and download a permanently blacked-out PDF. Runs in your browser.",
  alternates: { canonical: "/black-out-text-in-pdf" },
};

export default function Page() {
  return (
    <Landing
      path="/black-out-text-in-pdf"
      h1="Black Out Text in PDF — Free"
      lede="Draw black boxes over any text, image or signature in your PDF. The text underneath is permanently removed, not just hidden. No upload, no sign-up."
      steps={[
        "Drop your PDF into the box above.",
        "Drag a rectangle over each word, line, image or signature you want to hide.",
        "Click a box to remove it if you made a mistake.",
        "Click Download redacted PDF to save the blacked-out file.",
      ]}
      faqs={[
        ["Can someone remove the black box and read the text?", "No. Many editors only draw a shape on top, leaving the text selectable underneath. This tool flattens each page into an image with the box burned in, so the original text is gone."],
        ["Can I black out text in a PDF without Adobe Acrobat?", "Yes. This free tool works in any modern browser on Windows, Mac, Linux, iPhone and Android, with no software to install."],
        ["Will the rest of my PDF stay the same?", "Pages keep their layout and appearance. Because pages are flattened for safety, the remaining text is no longer selectable in the output."],
        ["Is there a page or file size limit?", "No fixed limit. Very large files depend on your device's memory, since everything runs locally."],
      ]}
    />
  );
}
