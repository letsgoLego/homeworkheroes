// Single place that registers the app service worker (offline + push).
// Refuses in dev, iframes and Lovable previews, and supports ?sw=off.
const PREVIEW_LABEL = /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/;

function isRefusedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname.toLowerCase();
  const label = host.split(".")[0];
  const lovableHost = /\.(lovable\.app|gpt-eng\.com|gptengineer\.run)$/.test(host);
  if (lovableHost && PREVIEW_LABEL.test(label)) return true;
  if (lovableHost && /^project--.+-dev$/.test(label)) return true;
  if (/(^|\.)lovableproject(-dev)?\.com$/.test(host)) return true;
  if (/(^|\.)beta\.lovable\.dev$/.test(host)) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterAppWorkers() {
  const regs = (await navigator.serviceWorker?.getRegistrations()) ?? [];
  await Promise.all(
    regs
      .filter((r) => (r.active || r.waiting || r.installing)?.scriptURL.endsWith("/sw.js"))
      .map((r) => r.unregister())
  );
}

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (isRefusedContext()) {
    unregisterAppWorkers().catch(() => {});
    return;
  }
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        // Check for a new release whenever the home-screen app comes back.
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") reg.update().catch(() => {});
        });
      })
      .catch(() => {});
  });
}
