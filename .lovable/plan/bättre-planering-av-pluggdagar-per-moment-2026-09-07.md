# Bättre planering av pluggdagar per moment

## Vad som ändras

### 1. Flera dagar per moment
Idag kan varje moment (t.ex. "Gör delförhör") bara ligga på en dag. Nytt: dagknapparna blir av/på-knappar så ett moment kan läggas på flera dagar. En uppgift skapas per moment och dag, så barnet ser "Läs igenom" både tisdag och torsdag om man vill repetera.

### 2. Ordning på moment
Varje moment får upp/ner-pilar så man kan flytta det i listan. Ordningen numreras synligt (1, 2, 3 …) och styr i vilken följd uppgifterna sparas och visas under en dag.

### 3. Läxans namn med i uppgiften
Uppgifter som skapas från moment får titeln `Läxans namn – momentnamn` (t.ex. "Prov kap 4 – Gör delförhör"), så att man i Idag/Vecka ser vilken läxa momentet hör till.

### 4. Mer intuitivt
- Momentlistan visar en liten sammanfattning: "3 moment · 5 pluggtillfällen".
- Varje moment visar antal valda dagar och varnar mjukt om inget är valt ("Välj minst en dag").
- Dagar som inte är valda som pluggdagar går att välja direkt på momentet och läggs då automatiskt till som pluggdag (slipper hoppa upp och ner i formuläret).
- Kort tips-text: "Repetera samma moment på två dagar – det ger bäst effekt."
- Samma förbättringar i barnets planeringsvy (inkorgen): flervalsdagar, ordning med pilar och läxnamn i titeln.

## Teknisk sammanfattning
- `AddHomework.tsx`: `studyParts` blir `{ id, title, dates: string[] }[]`; `setStudyPartDate` blir toggle; nya `moveStudyPart(index, dir)`; vid sparning loopas moment i ordning och `addTask(hw.id, \`${title} – ${part.title}\`, date)` per datum; dagar som väljs på ett moment läggs till i `selectedDays`.
- `PlanHomeworkSheet.tsx`: `PlanRow` får `dates: string[]`, toggle-logik, upp/ner-pilar; `planHomework` anropas med en post per (moment, dag) och titel `${homework.title} – ${row.title}`.
- Validering: "Klart – planera!" kräver att varje rad har minst en dag.
- Analytics: `study_techniques_used` får `sessions` (totalt antal skapade uppgifter) utöver `count`.
- Inga databasändringar behövs.

## Verifiering
`npx tsgo --noEmit` samt manuell test: skapa förhör med två moment på flera dagar och kontrollera titlar och ordning i Idag/Vecka.
