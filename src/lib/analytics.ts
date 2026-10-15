"use client";

import { track } from "@vercel/analytics";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

export type PdfEventName =
  | "pdf_file_upload"
  | "pdf_demo_load"
  | "keyword_redact_add"
  | "manual_box_add"
  | "download_redacted_pdf";

export function trackPdfEvent(
  event: PdfEventName,
  props?: Record<string, string | number | boolean>
) {
  try {
    track(event, props);
  } catch {
    // ignore
  }
  try {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", event, props ?? {});
    }
  } catch {
    // ignore
  }
  try {
    if (typeof window !== "undefined" && typeof window.clarity === "function") {
      window.clarity("event", event);
    }
  } catch {
    // ignore
  }
}
