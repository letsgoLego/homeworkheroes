## Problem

`/` är just nu noindex eftersom den renderar `TodayPage` (appen bakom auth) för alla. Det gör att domänens starkaste URL inte indexeras — dåligt för brand-sök och intern länkkraft till `/tips/*`.

## Lösning

Låt `/` bete sig olika beroende på inloggningsstatus:

- **Oinloggad besökare (inkl. Googlebot)** → rendera `LandingPage` direkt på `/` (indexerbar).
- **Inloggad användare** → rendera `TodayPage` som idag.

Googlebot är alltid oinloggad, så den ser landing-sidan och kan indexera `/` korrekt. Riktiga användare märker ingen skillnad.

## Ändringar

**`src/App.tsx`**
- Byt ut `<Route path="/" element={<ProtectedRoute><TodayPage /></ProtectedRoute>} />` mot en ny wrapper `HomeRoute` som:
  - visar loading-spinner medan auth laddar,
  - renderar `<LandingPage />` om `!user`,
  - renderar `<TodayPage />` om `user` finns.
- `/landing` kan behållas som alias (samma komponent) eller redirectas till `/` — förslag: behåll `/landing` som redirect till `/` för att undvika duplicate content.

**`src/components/SeoNoIndex.tsx`**
- Ta bort `'/'` från `NON_INDEXABLE_EXACT`. Root ska vara indexerbar igen.

**`public/robots.txt`**
- Ingen ändring (root är redan `Allow: /`).

**`public/sitemap.xml`**
- Kontrollera att `https://laxhjalp.app/` finns med (den bör redan göra det, då pekar den nu mot rätt innehåll).

**Canonical**
- `LandingPage` behöver ha `<link rel="canonical" href="https://laxhjalp.app/" />` via Helmet (inte `/landing`), så Google inte tror det är duplicate.

## Effekt

- `/` indexeras med landing-sidans innehåll → brand-sökningar hittar startsidan.
- Intern länkkraft från `/` flödar till `/tips/*`.
- Inloggade användare får samma Today-vy som förut — ingen UX-förändring.
- `/landing` blir redundant och redirectar till `/`.
