# Dela appen med kompisar

En dela-knapp som gör det enkelt att tipsa kompisar och andra föräldrar om Läxhjälp.

## Så fungerar det

- Ny knapp: "Dela med en kompis" med dela-ikon.
- På mobil (iPhone/iPad, Android) öppnas telefonens vanliga delningsmeny (iMessage, WhatsApp, mejl m.m.) med en färdig svensk text plus länken https://laxhjalp.app.
- Om delningsmenyn inte finns (desktop) kopieras länken istället och en bekräftelse visas: "Länk kopierad!".
- Delad text: kort pitch om appen + länken till startsidan (inte familjens inbjudningskod – den finns kvar separat på Familj-sidan).

## Var knappen syns

- Min profil (barn) – under "Installera Läxhjälpen".
- Familj (förälder) – i samma sektion som installations- och uppdateringsknapparna.

## Teknik

- Ny komponent `src/components/ShareAppButton.tsx`:
  - Använder `navigator.share({ title, text, url })` när tillgängligt, annars `navigator.clipboard.writeText`.
  - Ignorerar `AbortError` (användaren avbryter delningen) utan felmeddelande.
  - Toast via `sonner`, styling med befintliga design tokens och shadcn `Button` (variant `outline`).
- Renderas i `src/pages/ChildProfilePage.tsx` och `src/pages/FamilyPage.tsx`.
- GA4: nytt event `app_shared` (med `method: 'native' | 'clipboard'`) läggs till i `src/lib/analytics.ts` och skickas vid lyckad delning.
