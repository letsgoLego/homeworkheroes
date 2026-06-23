// Google Analytics 4 event helper.
// gtag.js is loaded in index.html with measurement ID G-02P90ZJSNH.
// Safe no-op when gtag is unavailable (e.g. during SSR or if blocked).

type GtagParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function track(eventName: string, params: GtagParams = {}) {
  try {
    if (typeof window === 'undefined') return;
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push(['event', eventName, params]);
    }
  } catch {
    // ignore analytics errors
  }
}
