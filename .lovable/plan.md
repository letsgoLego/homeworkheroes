## Redigera mål, firande, och trophy-vy

### 1. Redigera befintliga mål
Återanvänd `HolidayGoalEditor.tsx` i edit-läge.

- Lägg till "Redigera"-knapp (penna-ikon) på `HolidayGoalCard.tsx`, bredvid soptunnan.
- Utöka `HolidayGoalEditor` med valfri `goal?: HolidayGoal` prop. När den finns: prefyll fält, ändra rubrik till "Redigera mål", spara via UPDATE istället för INSERT.
- Redigerbara fält: **namn, emoji, färg, dagsmål/totalmål, måltyp**.
- Vid byte av måltyp: visa varning ("Tidigare ifyllda värden behålls men kan se konstiga ut"). Historik (`holiday_goal_entries`) rörs inte.
- Ny funktion i `useHolidayMode.ts`: `updateGoal(goalId, partial)` som gör `UPDATE holiday_goals SET ... WHERE id = ...`.
- Streaks och progress beräknas automatiskt om mot nya target (befintlig logik i `getGoalStreak` läser alltid aktuellt `daily_target`).

### 2. Firande när mål nås (fortsätt räkna)
Behåller nuvarande beteende — barnet kan fortsätta fylla i efter måluppfyllelse.

- **Daily-mål nått första gången idag**: redan implementerat (`celebrateTask` + medium haptic). Lägg till liten toast: "🎯 Dagsmål klart! Fortsätt gärna."
- **Daily-mål överträffat 2x på samma dag** (t.ex. 30 min när målet är 15): extra liten celebrate ("🔥 Dubbelt upp!"), trigger 1 gång/dag/mål via localStorage-flagga.
- **Totalmål nått**: behåll konfetti, lägg till permanent grön "✓ Mål uppnått!"-badge överst på kortet, men input-fältet ligger kvar (kan fortsätta läsa även efter 100 sidor).
- **Milstolpar** (befintliga 25/50/100/...): oförändrat.
- Visuellt: när `currentValue >= target` på totalmål, byt progress-barens färg till grön-gradient och visa "X över målet!" om man fortsätter.

### 3. Trophy-vy efter avslutat lov
Ny komponent `HolidayTrophyView.tsx` som visas när `mode.active === false` men det finns mål med historik, ELLER när `ends_at` passerat.

- **Visas på `HolidayPage`** i stället för "Lov-läge ej aktivt"-tomma tillståndet, om barnet just avslutat ett lov (senaste 14 dagarna).
- För varje mål, beräkna måluppfyllnadsgrad:
  - **Total-mål**: `totalValue / total_target`
  - **Daily-mål**: andel dagar målet nåddes / antal lovdagar
  - **Checkbox**: andel dagar markerade
- Medalj-trösklar: **🥇 Guld** ≥90%, **🥈 Silver** ≥60%, **🥉 Brons** ≥30%, **🎗️ Deltagit** <30%.
- Layout: stora medaljer per mål + total summa ("📖 142 sidor · 🎸 85 min · 7 perfekta dagar") + längsta streak + Lov-XP/nivå-titel.
- Knappar: "📤 Dela trophy-bild" (PNG via samma html2canvas-flöde som `HolidayWeekSummary`) och "Starta nytt lov".
- Trofén är "permanent" tills nytt lov startas.

### 4. Tekniska detaljer
- **Inga DB-ändringar.** All logik frontend.
- Filer som ändras: `HolidayGoalCard.tsx`, `HolidayGoalEditor.tsx`, `HolidayPage.tsx`, `useHolidayMode.ts`.
- Nya filer: `HolidayTrophyView.tsx`, ev. `HolidayShareTrophyCard.tsx` (PNG-mall).
- localStorage-nycklar: `holiday-double-{childId}-{goalId}-{date}` för dubbelt-upp-firandet.
- Återanvänd `celebrateTask`, `celebrateStars`, `celebrateAssignment`, `haptic` från `lib/confetti.ts`.

### 5. Vad jag INTE rör
Databasstruktur, andra sidor än `HolidayPage`/`HolidayGoalCard`/`HolidayGoalEditor`, befintlig veckosammanfattning.
