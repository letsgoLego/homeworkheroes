
# Lov-läge (Holiday Mode)

Ett nytt läge per barn där vanliga läx-notifikationer pausas och barnet istället jobbar mot 1–3 personliga lovmål med visuella staplar och en delbar veckosammanfattning.

## 1. Aktivering & avslutning

- **Manuell toggle** på barnets profil/Idag-sida: "Starta lov" / "Avsluta lov".
- **Valfritt slutdatum** vid start (datepicker). När slutdatum passeras avslutas läget automatiskt nästa gång appen öppnas (samt via cron-jobb varje natt).
- När aktivt:
  - Visas en tydlig banner: "🌴 Lovläge aktivt – tom [datum]".
  - **Veckovyn** byts ut mot en Lov-vy (staplar/progress).
  - **Idag-vyn** visar bara dagens lovmål (läxor/aktiviteter göms men raderas inte).
  - **Push-notifikationer** för vanliga läxor (14:30/15:30/18:30) hoppas över för barn i lovläge.
- Både förälder och barn kan starta/avsluta lovet.

## 2. Lovmål (1–3 st)

Förälder eller barn kan skapa upp till 3 mål. Varje mål har:

- **Namn** + **emoji** (t.ex. "📖 Läsa", "🎸 Gitarr", "🧮 Matte").
- **Typ** (välj en):
  - `count_per_day` – antal per dag (t.ex. 10 sidor)
  - `minutes_per_day` – minuter per dag (t.ex. 20 min)
  - `checkbox_per_day` – klart/ej klart
  - `total_for_holiday` – totalmål för hela lovet (t.ex. 200 sidor)
- **Dagligt mål / totalmål** (numeriskt, utom checkbox).
- **Färg** (auto från en palett: turkos, gul, rosa, lila).

## 3. Daglig ifyllning

Lov-vyn (ersätter veckovyn när lov är aktivt) visar per mål:

- **Stapel** som fylls upp mot dagens mål (eller mot totalmålet).
- **+ knappar** (t.ex. +1, +5, +10 sidor / +5, +15 min) och fritt sifferfält.
- **Checkbox** för checkbox-typ.
- **Streak-räknare** (antal dagar i rad där dagsmål nåtts).
- **Konfetti + haptik** när dagsmål nås (återanvänder befintlig `confetti.ts`).

Historik per dag sparas så veckosammanfattningen kan byggas.

## 4. Anpassade lov-notifikationer

- Befintlig `send-notifications` edge function utökas: om barnet är i lovläge skickas istället en **lov-påminnelse** kl. 10:00 och 17:00:
  - "🌴 Dags för [emoji] [målnamn]! Du har gjort [X/Y] idag."
  - Hoppas över om dagens mål redan är uppnått.

## 5. Veckosammanfattning (delbar bild)

- Söndag kväll (eller när man trycker "Visa veckan"): genereras en snygg sammanfattningsvy:
  - Barnets namn + vecknummer
  - Per mål: stapeldiagram över de 7 dagarna, total summa, antal dagar målet nåddes
  - Streak, total tid/sidor/etc.
  - Liten brand-footer "Läxhjälpen"
- **Delning**: knapp "Dela bild" använder `html-to-image` för att rendera vyn till PNG → Web Share API (`navigator.share` med `files`) på iOS, fallback till nedladdning.

## 6. Översikt – databas & teknik

### Tekniska detaljer

**Nya tabeller (migration):**

- `holiday_modes`
  - `child_id` (FK children, unique), `active` bool, `started_at`, `ends_at` nullable, `created_by` user_id
- `holiday_goals`
  - `child_id` FK, `name`, `emoji`, `type` enum (`count_per_day`/`minutes_per_day`/`checkbox_per_day`/`total_for_holiday`), `daily_target` int nullable, `total_target` int nullable, `color`, `sort_order`, `archived` bool
  - max 3 aktiva per barn (validerings­trigger)
- `holiday_goal_entries`
  - `goal_id` FK, `entry_date` date, `value` int (0/1 för checkbox), unique(goal_id, entry_date)

Alla med standard GRANTs (`authenticated`, `service_role`), RLS via `user_belongs_to_family` på barnets familj.

**Edge functions:**
- Utöka `send-notifications`: kolla `holiday_modes.active`, byt meddelande.
- Utöka `cleanup-old-homework` (eller nytt cron): avsluta lov där `ends_at < today`.

**Frontend:**
- `src/hooks/useHolidayMode.ts` – läser status, mål, dagsentries (react-query).
- `src/pages/HolidayPage.tsx` – ersätter `WeekPage` när lov aktivt (route `/week` renderar villkorligt, eller egen `/holiday`).
- `src/components/HolidayGoalCard.tsx` – stapel + +knappar.
- `src/components/HolidayToggle.tsx` – start/avsluta-dialog med datepicker (på `ChildProfilePage`).
- `src/components/HolidayWeekSummary.tsx` – delbar vy.
- `src/components/HolidayBanner.tsx` – global banner i `TodayPage`.
- `TodayPage` & `WeekView`: filtrera bort vanliga homework/activities när `holidayMode.active`.
- Installera `html-to-image` för PNG-export.

**Svenska UI-texter** genomgående. Återanvänd teal-palett och befintliga design tokens.

**Memory:** Spara `mem://features/holiday-mode` med reglerna ovan, och lägg till en rad i `mem://index.md`.
