

## Plan: Legal Compliance — Cookies, Privacy & Terms

### What You Need (Swedish/EU perspective)

For a Swedish app collecting personal data and processing payments, you need:

1. **Cookie-banner (GDPR + ePrivacy)** — Inform users about cookies, get consent before non-essential cookies are set. Supabase auth uses essential cookies (no consent needed), but Stripe and any analytics would require consent.

2. **Integritetspolicy (Privacy Policy)** — Required by GDPR. Describes what data you collect, why, how long you keep it, and user rights (access, deletion, portability). Must be accessible before signup.

3. **Användarvillkor (Terms of Service)** — Covers acceptable use, subscription terms, cancellation, liability limitations. Required for Stripe and app store compliance.

### Implementation

#### 1. Cookie Consent Banner
- New component `CookieBanner.tsx` — shown at bottom of screen on first visit
- Stores consent in `localStorage` (no DB needed)
- Two buttons: "Godkänn alla" and "Bara nödvändiga"
- Only essential cookies (auth session) are used without consent; Stripe loads only after consent
- Shown on all pages via `App.tsx`

#### 2. Legal Pages
- New page `src/pages/PrivacyPage.tsx` — Swedish privacy policy covering:
  - Data controller (your info)
  - What data is collected (email, name, child usernames, homework data)
  - Legal basis (contract + consent)
  - Data processors (Stripe for payments, hosting provider)
  - Retention periods
  - User rights (radera konto, exportera data, etc.)
  - Contact information
- New page `src/pages/TermsPage.tsx` — Swedish terms covering:
  - Tjänstebeskrivning
  - Konton och familjer
  - Prenumeration, priser, förnyelse, avbokning
  - Gratis vs betald plan
  - Användarens ansvar
  - Uppsägning
  - Ansvarsbegränsning

#### 3. Links & Integration
- Footer links on `LandingPage.tsx`: "Integritetspolicy" and "Användarvillkor"
- Link on `AuthPage.tsx` signup: "Genom att skapa konto godkänner du våra villkor och integritetspolicy"
- Routes added in `App.tsx` (public, no auth required)
- Cookie banner rendered globally in `App.tsx`

### Files to Create/Modify
- `src/components/CookieBanner.tsx` — new
- `src/pages/PrivacyPage.tsx` — new
- `src/pages/TermsPage.tsx` — new
- `src/App.tsx` — add routes + cookie banner
- `src/pages/LandingPage.tsx` — add footer links
- `src/pages/AuthPage.tsx` — add consent text with links

### Important Note
The legal texts will be solid templates in Swedish, but you should review them with a legal advisor before going live, especially the privacy policy which needs your actual company/contact details filled in.

