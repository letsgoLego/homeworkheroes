# Hantera aktivitetsserier

Idag är en återkommande aktivitet en enda post i databasen (t.ex. "Fotboll, mån + tor"). Pennan och soptunnan ändrar därför redan hela serien – men inget i gränssnittet berättar det, och det går inte att hoppa över ett enstaka tillfälle.

## Vad som byggs

1. **Tydlig serie-information**
   - Aktivitetskortet visar serien i klartext ("Varje mån, tor" / "Enstaka 12 sep").
   - I redigeringsdialogen står det att ändringen gäller alla tillfällen i serien.

2. **Bekräftelse vid borttagning av serie**
   - Klick på soptunnan öppnar en dialog: "Ta bort hela serien? Fotboll varje mån, tor försvinner från alla dagar."
   - Knappar: "Ta bort hela serien" (röd) och "Avbryt".

3. **Hoppa över en enskild dag**
   - På Idag-sidan (och i veckovyn där aktiviteter visas) får borttagningsdialogen ett extra val: "Bara denna dag".
   - Väljer man det sparas datumet som ett undantag – aktiviteten visas inte den dagen men serien lever kvar.
   - Undantag kan ångras i redigeringsläget, där hoppade datum listas med möjlighet att ta tillbaka dem.

4. **Avsluta serie istället för att radera**
   - I redigeringsläget går det att sätta ett slutdatum ("Pågår t.o.m."), så gamla aktiviteter kan avslutas utan att raderas.

Endast föräldrakonton kan redigera, hoppa över dagar och ta bort serier – precis som idag.

## Teknik

- Migration på `public.activities`: nya kolumner `excluded_dates date[] not null default '{}'` och `end_date date`. Befintliga RLS-policyer täcker redan uppdateringarna.
- `getActivitiesForDate` i `src/hooks/useFamily.ts` filtrerar bort datum som finns i `excluded_dates` och datum efter `end_date`.
- Nya hook-funktioner: `skipActivityDate(id, date)` och `unskipActivityDate(id, date)` (array-uppdatering), `updateActivity` utökas med `endDate`.
- `src/components/ActivityCard.tsx`: skickar med aktuellt datum till borttagningsflödet och visar serietext.
- Ny `src/components/DeleteActivityDialog.tsx` med valen "Bara denna dag" / "Hela serien".
- `src/components/AddActivity.tsx`: fält för slutdatum, lista över hoppade datum, informationstext om serien.
- Kopplas in i `src/pages/TodayPage.tsx` (dag-kontext) och `src/pages/AddPage.tsx` (serie-kontext, inget dagval).
