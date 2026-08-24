# Smart studieteknik för förhör/prov

## Mål
När användaren väljer typen **Förhör/Prov** ska appen föreslå forskningsbaserade studietekniker som namngivna deluppgifter, så att ett prov inte bara blir "massa pluggdagar" utan ett tydligt upplägg (t.ex. *Läsa igenom → Sammanfatta → Gör delförhör*). Förslagen ska vara ämnesanpassade och användaren väljer själv vilka som används.

## Var det ska synas
Båda flödena:
1. **Förälder skapar läxa** (`AddHomework.tsx`, steg 2)
2. **Barn planerar inkorg-läxa** (`PlanHomeworkSheet.tsx`)

## Förslag på studietekniker (forskningbaserade)
Generella tekniker som alltid kan föreslås:
- Läsa igenom och markera nyckelord
- Sammanfatta med egna ord
- Gör delförhör / testa dig själv
- Repetera med lucktext
- Förklara för någon annan (lär någon annan)
- Gör en tankekarta / visualisera
- Skapa minnesregler

Ämnesanpassade tillägg:
- **Matte**: Räkna gamla uppgifter, Skriv formler för hand, Gör övningsuppgifter
- **Engelska / Svenska**: Repetera glosor, Gör glosförhör, Läs högt, Skriv stilövning
- **NO / SO**: Gör tankekarta, Sammanfatta fakta, Förklara för någon annan

## Teknisk plan

### 1. Ny konfigurationsfil
Skapa `src/lib/studyTechniques.ts` som exporterar:
- `StudyTechnique` interface (`id`, `label`, `description`, `subjects?`, `icon?`)
- `GENERAL_TECHNIQUES`: generella tekniker
- `SUBJECT_TECHNIQUES`: ämnesspecifika tekniker
- `getStudyTechniqueSuggestions(subject: Subject, homeworkType: HomeworkType): StudyTechnique[]`
  - Returnerar tomt för `inlamning`
  - Returnerar generella + ämnesspecifika för `forhor`, utan dubbletter

### 2. Uppdatera `AddHomework.tsx`
- I steg 2, när `homeworkType === 'forhor'`:
  - Visa en ny sektion **"Dela upp förhöret i delar"** med förslags-chips.
  - Varje chip kan klickas för att lägga till en rad i en `studyParts`-lista.
  - Användaren kan ta bort rader och redigera titeln.
  - Varje rad får en dag-väljare som endast visar de dagar användaren redan valt i steg 2.
  - Default: fördela valda tekniker jämnt över valda dagar (första på tidigaste dagen).
- När läxan sparas skapas en `study_task` per rad med rätt `title` och `task_date`.
- Om inga tekniker väljs, fall tillbaka på nuvarande beteende (en task per vald dag med autoTitle).

### 3. Uppdatera `PlanHomeworkSheet.tsx`
- När `homework.homework_type === 'forhor'` och det inte finns sparade `planItems`:
  - Förslås rader från `getStudyTechniqueSuggestions(subject, 'forhor')` istället för en enda rad med läxans titel.
- Barnet kan lägga till/ta bort/radera rader som vanligt och välja dag för varje del.

### 4. UX-detaljer
- Chips ska vara tydligt av/på med semantiska färgtokens (ingen hårdkodad färg).
- Kort beskrivning av varför tekniken fungerar, t.ex. en liten info-text under sektionen.
- Håll språket på svenska och tonen uppmuntrande ("Bryt ner provet i små delar").

### 5. Spårning
- Lägg till GA4-event `study_techniques_used` med antal valda tekniker, ämne och om det är förälder eller barn.

### 6. Dokumentation
- Uppdatera `FEATURES.md` och `README.md` med ett stycke om smarta studietekniker för förhör.

## Filer som ändras
- `src/lib/studyTechniques.ts` (ny)
- `src/components/AddHomework.tsx`
- `src/components/PlanHomeworkSheet.tsx`
- `src/lib/analytics.ts` (nytt event)
- `FEATURES.md`
- `README.md`

## Verifiering
- Byggkontroll (`bun run build`) ska passera.
- Manuell test i preview:
  1. Skapa en läxa av typen Förhör/Prov → se förslagschips.
  2. Välj tekniker och dagar → kontrollera att tasks får rätt titlar.
  3. Skicka en förhör-läxa till barnets inkorg → kontrollera att barnet får teknikförslag vid planering.
