# Förhörsmallen byggd på Skolverkets inlärningsforskning

## Vad forskningen (via Skolverket/lärosäten på Skolverkets uppdrag) säger

Fyra saker återkommer i de forskningssammanställningar Skolverket sprider:

1. **Testbaserat lärande (retrieval practice)** – att försöka minnas är effektivare än att läsa om. Det gynnar alla elever, men få väljer det själva.
2. **Spridd repetition** – flera korta tillfällen över tid slår ett långt pluggpass. Procedurkunskap (t.ex. grammatik, räknefärdighet) behöver många upprepningar.
3. **Interfoliering** – att blanda områden/uppgiftstyper i stället för att köra ett block i taget ger bättre långtidsminne.
4. **Självreglering och metakognition** – att planera, genomföra och utvärdera sitt lärande, plus positivt självprat, är en del av strategin.

Källor: [3](https://www.skolporten.se/forskning/avhandling/retrieval-practice-and-individual-differences-exploring-factors-relevant-to-the-benefit-and-use-of-retrieval-practice/), [1](https://www.su.se/download/18.1f09f4df19a7bbe0dfd205/1763043940010/Tr%C3%A4ning%20av%20minnesstrategier%20gynnar%20spr%C3%A5kinl%C3%A4rning.pdf), [2](https://www.skolporten.se/app/uploads/2020/12/utveckla-skolan-nummer-8-2020.pdf), [5](https://www.umu.se/nyheter/testbaserat-larande-effektivt_11846680/)

## Vad vi ändrar i appen

### 1. Momenten får en tydlig ordning i tre faser
`src/lib/studyTechniques.ts` byggs om så varje teknik får en `phase`:

- **Förstå** – läsa igenom och markera nyckelord, sammanfatta med egna ord, tankekarta
- **Träna** – testa dig själv, lucktext, räkna gamla uppgifter, glosförhör, minnesregel
- **Repetera & visa** – blanda områden (interfoliering), förklara för någon, sista koll dagen före

Nya/omformulerade tekniker: "Testa dig själv utan att titta", "Blanda gamla och nya delar", "Sista koll – vad är svårast?".
Varje teknik får en kort *varför*-text i forskningsspråk barn förstår ("Att försöka minnas gör att du kommer ihåg längre").

### 2. Mallen föreslår ett helt upplägg, inte bara chips
`StudyPlanTemplate.tsx` får en knapp **"Föreslå upplägg"** som fyller i moment i faseordning och fördelar dem över de tillgängliga dagarna med spridning: förstå tidigt, träna mitten, repetera nära deadline, och minst en repetition efter minst en dags mellanrum.

Momentlistan grupperas visuellt per fas (Förstå / Träna / Repetera) med samma färg- och nummerlogik som i dag.

### 3. Nudge mot testbaserat lärande
Om planen saknar minst ett moment i fasen **Träna** visas ett vänligt tips: "Lägg till ett moment där du testar dig själv – det är den teknik som ger mest." Ingen blockering av sparning.

Om ett moment bara har en dag visas "Lägg gärna till en dag längre fram – repetition med mellanrum fastnar bäst."

### 4. Utvärdering efteråt (självreglering)
Sista momentet i föreslaget upplägg blir "Sista koll – vad är svårast?" så barnet får reflektera innan provet. Ingen ny databastabell; det är en vanlig studieuppgift som i dag.

### 5. Förklara varifrån det kommer
- Kort rad i mallen: "Upplägget bygger på forskning om testbaserat lärande och spridd repetition."
- Ny/uppdaterad SEO-text på `/tips/studieteknik-barn` med samma tre faser och länkar till källorna, samt en rad i `FEATURES.md`.

## Teknisk sammanfattning

- `src/lib/studyTechniques.ts`: lägg till `phase: 'understand' | 'practice' | 'review'` och `why`-text på `StudyTechnique`; behåll `getStudyTechniqueSuggestions` men sortera per fas; ny hjälpfunktion `buildSuggestedPlan(days, suggestions)` som returnerar `StudyPlanRow[]` med spridda datum.
- `src/components/StudyPlanTemplate.tsx`: fasgrupperade förslagschips, knappen "Föreslå upplägg", tips-rader (saknad träningsfas, moment med bara en dag), källrad.
- `src/components/AddHomework.tsx` och `src/components/PlanHomeworkSheet.tsx`: skickar in `days` till förslagsbyggaren och använder den vid val av mall-läge i stället för nuvarande `slice(0, 5)`.
- `src/lib/analytics.ts`: utöka `study_techniques_used` med `phases` och `suggested_plan_used`.
- Text/innehåll: `src/pages/seo/StudieteknikBarnPage.tsx`, `FEATURES.md`, `README.md`.
- Inga databasändringar.

## Verifiering
- `npx tsgo --noEmit`
- Playwright: skapa en läxa av typen Förhör → välj "Följ en mall" → "Föreslå upplägg" → kontrollera faser, spridda dagar och tips-raderna, i både desktop- och mobilbredd.
