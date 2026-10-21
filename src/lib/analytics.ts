"use client";

import { track } from "@vercel/analytics";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

// 统一识别自动化测试（Playwright / Headless / WebDriver）与站长自检流量（?internal=1 / localStorage.ignore_analytics=1）
export function isAutomatedOrInternalSession(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return true;
  }
  try {
    if (navigator.webdriver === true) return true;
    const ua = navigator.userAgent || "";
    if (/HeadlessChrome|Playwright|Puppeteer|PhantomJS|Cypress|Lighthouse/i.test(ua)) {
      return true;
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("e2e") === "1" || params.get("internal") === "1" || params.get("no_track") === "1") {
      try {
        window.localStorage.setItem("ignore_analytics", "1");
      } catch {
        // ignore
      }
      return true;
    }
    try {
      if (window.localStorage.getItem("ignore_analytics") === "1") {
        return true;
      }
    } catch {
      // ignore
    }
  } catch {
    return false;
  }
  return false;
}

export type PdfEventName =
  | "pdf_file_upload"
  | "pdf_demo_load"
  | "keyword_redact_add"
  | "manual_box_add"
  | "download_redacted_pdf"
  | "user_feedback";

export const trackToolEvent = trackPdfEvent;

export function trackPdfEvent(
  event: PdfEventName,
  props?: Record<string, string | number | boolean>
) {
  if (isAutomatedOrInternalSession()) return;
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
      if (props) {
        for (const [k, v] of Object.entries(props)) {
          window.clarity("set", k, String(v));
        }
      }
    }
  } catch {
    // ignore
  }
}
