## Gamifiera Lov-läget – gör progress roligare

Målet: göra det belönande att fylla i sina lovmål varje dag, så barnet vill komma tillbaka och se sina framsteg växa.

### 1. Streak per mål (🔥 dagar i rad)
- Visa en liten flam-ikon + antal dagar i rad målet uppnåtts på `HolidayGoalCard`.
- Beräknas från `holiday_goal_entries` (sammanhängande dagar där value ≥ daily_target, eller value > 0 för checkbox).
- Mjuk "rekord"-text när nytt personligt rekord slås.

### 2. Visuell stapelhistorik (sista 7 dagarna)
- Under progress-baren på varje goal card: 7 små vertikala mini-staplar (mån–sön), fyllda i målets färg, höjd = % av dagsmål.
- Dagens stapel pulserar mjukt. Tomma dagar = ljusgrå.
- Direkt visuell feedback: "kolla vad jag gjort hela veckan!".

### 3. Totalsumma & milstolpar
- Stor siffra högst upp på `HolidayPage`: "📖 142 sidor lästa · 🎸 85 min spelat · ✅ 6 dagar i rad".
- Milstolpe-pop när man passerar runda tal (50, 100, 500, 1000) – konfetti + toast: "🎉 Du har läst 100 sidor!".
- Lagras i state via beräkning från entries (inget nytt i DB).

### 4. Lov-XP & nivåer (separat från vanliga XP)
- Varje ifyllt mål = 10 XP, fullt dagsmål = 25 XP, perfekt dag (alla mål nådda) = 50 XP + konfetti.
- Egen nivå-titel skala för lov ("🌴 Lovstartare → ☀️ Solpiraten → 🏆 Lov-legend").
- Liten XP-bar överst på `HolidayPage` (samma stil som `StreakStats`-kortet).

### 5. "Perfekt dag"-firande
- När alla aktiva mål nåtts samma dag: fullskärms `PerfectDaySplash`-variant ("🌴 Perfekt lovdag!") + heavy haptic + stjärnregn (`celebrateStars`).
- Trigger 1 gång/dag, flagga i localStorage per child+datum.

### 6. Kalender-heatmap (lov-översikt)
- Liten grid längst ner på `HolidayPage`: en ruta per dag sedan lovet startade, färgmättnad = hur stor andel av målen som nåddes.
- Inspirerat av GitHub contributions. Gör det visuellt mätbart att man "fyllt i lovet".

### 7. Förbättrad veckosammanfattning (PNG)
- Lägg till streak-flammor, totalsumma och "veckans hjälte"-rubrik baserat på största förbättring.
- Bättre delningsmotivation till föräldrar/kompisar.

### Tekniska detaljer
- Allt beräknas frontend från befintliga `holiday_goal_entries` – ingen schemaändring krävs.
- Nya hjälpfunktioner i `useHolidayMode.ts`: `getGoalStreak(goalId)`, `getLast7Days(goalId)`, `getPerfectDays()`, `getHolidayXp()`.
- Ny komponent: `HolidayProgressHeader.tsx` (totalsumma + XP-bar + perfekta dagar).
- Ny komponent: `HolidayHeatmap.tsx`.
- Utöka `HolidayGoalCard.tsx` med streak-badge + 7-dagars mini-staplar.
- Milstolpe-logik i `setEntryValue`-callback (jämför före/efter totalsumma mot trösklar).
- Återanvänd `celebrateTask`, `celebrateStars`, `celebrateAssignment`, `haptic` från `lib/confetti.ts`.

### Vad jag INTE rör
- Databasstruktur, vanliga läxor/notiser, andra sidor än `HolidayPage` + `HolidayGoalCard` + `HolidayWeekSummary`.

### Vill du att jag bygger allt, eller börjar med ett urval?
Förslag på minsta paket som ger störst effekt: **1 (streak) + 2 (7-dagars staplar) + 3 (milstolpar) + 5 (perfekt dag)**. 4 (XP) och 6 (heatmap) kan komma i steg två.