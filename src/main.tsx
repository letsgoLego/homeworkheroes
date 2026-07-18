import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// Guard: unregister service workers in iframe/preview contexts
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((registrations) => {
    registrations.forEach((r) => r.unregister());
  });
}

// Canonical host redirect: send visitors on the published Lovable domain
// or the www subdomain to the canonical apex laxhjalp.app. Skip iframe/preview
// so in-editor development keeps working.
if (!isInIframe && !isPreviewHost) {
  const host = window.location.hostname;
  const shouldRedirect =
    host === "homeworkheroes.lovable.app" || host === "www.laxhjalp.app";
  if (shouldRedirect) {
    const target =
      "https://laxhjalp.app" +
      window.location.pathname +
      window.location.search +
      window.location.hash;
    window.location.replace(target);
  }
}


createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
