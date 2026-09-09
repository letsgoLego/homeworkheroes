# Förbered inför imorgon + Ta med till skolan idag

Två nya block på Idag-sidan som gör kvällens packning och morgonens avfärd tydlig.

## 1. Förbered inför imorgon

Visas på Idag-fliken från kl. 12 dagen före och ligger kvar till kl. 12 nästa dag – sedan försvinner det.

Innehåller checkbockar för allt som ska fixas till imorgon:
- Läxor som ska lämnas in imorgon och det som hör till dem ("Ta med mattebok").
- Sakerna från packlistan som gäller imorgons veckodag (t.ex. gympapåse på onsdagar).
- Aktiviteter imorgon där man sparat saker att ta med, visas som "Packa pingisväskan".

Rubriken visar dag och datum ("Förbered inför imorgon – torsdag 10 sept") och en räknare, t.ex. 2/4. När allt är bockat blir kortet grönt.

## 2. Ta med till skolan idag

Visas på morgonen (fram till kl. 12) och listar det som ska med idag: skolväskan/läxorna som ska lämnas in, dagens packlistesaker och det man packat till dagens aktivitet. Har man bockat av något redan i kvällsläget syns det som klart här.

## 3. Saker att ta med till en aktivitet

I formuläret för aktivitet (både ny och redigera) läggs ett fält "Ta med till aktiviteten" där man skriver in saker en och en (samma stil som läxans "Ta med"-lista). Fältet gäller hela serien. Endast föräldrakonton kan redigera, som idag.

## Teknik

- Migration: `alter table public.activities add column pack_items text[] not null default '{}'`. Befintliga RLS-policyer och grants täcker kolumnen.
- `Activity`-typen i `src/hooks/queries/useHomeworkData.ts` utökas med `pack_items: string[]`.
- `src/hooks/useFamily.ts`: `addActivity`/`updateActivity` tar emot `packItems`; ny hjälpfunktion `getPrepItemsForDate(childId, date)` som slår samman läxor med `bring_to_school` som ska in det datumet, `recurring_pack_items` för veckodagen och `getActivitiesForDate(...)` med `pack_items`, till en lista av `{ id, label, source: 'homework' | 'recurring' | 'activity', context }`.
- Ny komponent `src/components/PrepChecklist.tsx` – återanvänds för båda blocken via props `date`, `title`, `items`. Bockningen sparas i localStorage per datum och nyckel (`prep-checked-yyyy-MM-dd`), samma mönster som `BringToSchool`. Samma nyckelrymd används av båda blocken så kvällens bock syns på morgonen. Bockningen är per enhet, inte delad mellan familjemedlemmar (som dagens packlista).
- `src/pages/TodayPage.tsx`: renderar `PrepChecklist` för imorgon när `hour >= 12` och för idag när `hour < 12`, placerat efter aktiviteter och före "Dagens uppgifter". Packa-fliken lämnas orörd men får aktivitetssakerna med sig via samma hjälpfunktion.
- `src/components/AddActivity.tsx`: fält för `packItems` (input + lista med ta-bort), skickas i `ActivityFormData`.
- `src/components/ActivityCard.tsx`: liten rad "🎒 2 saker att packa" när `pack_items` finns.
