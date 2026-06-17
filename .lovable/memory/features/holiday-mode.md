---
name: Holiday Mode (Lov-läge)
description: Per-child holiday mode that pauses regular homework view and replaces the Week tab with 1–3 personal goals, daily progress bars, and a shareable weekly summary image.
type: feature
---

# Lov-läge

## Aktivering
- Per barn. Toggle finns på Min profil och på Vecka-vyn (när inaktivt).
- Frivilligt slutdatum (datepicker) — lov gäller t.o.m. det datumet.
- Både förälder och barn kan starta/avsluta.

## Mål (1–3 st per barn, max enforced via DB-trigger)
Fyra typer:
- `count_per_day` (t.ex. 10 sidor/dag)
- `minutes_per_day` (t.ex. 20 min/dag)
- `checkbox_per_day` (klart/inte klart)
- `total_for_holiday` (totalt för hela lovet)

Varje mål har namn, emoji, färg (från `GOAL_COLORS`).

## Daglig ifyllning
- Lov-vyn ersätter `/week` (`WeekPage` → `HolidayPage` när `isActive`).
- Stapel som fylls upp mot dagsmål (eller totalmål för `total_for_holiday`).
- Snabbknappar +1/+5/+10 (eller +5/+15/+30 för minuter) + fritt sifferfält som sätter totalvärde.
- `celebrateTask()` + `haptic('medium')` när dagsmålet nås.

## Veckosammanfattning
- Knapp "Veckosammanfattning" öppnar dialog med renderad gradient-kortvy.
- `html-to-image` → `toPng` → Web Share API med `files` (iOS PWA), annars nedladdning.
- Visar per mål: stapeldiagram över 7 dagar, total, antal dagar målet nåddes.

## Banner
- `<HolidayBanner>` på `/` (TodayPage) när aktivt → länkar till `/week` (= HolidayPage).
- Banner visar slutdatum.

## DB-tabeller
- `holiday_modes` (1 rad per child, unique, `active` bool, `ends_at` date)
- `holiday_goals` (max 3 aktiva per child via `enforce_max_holiday_goals` trigger)
- `holiday_goal_entries` (en rad per goal+date, unique)

RLS: alla policies kollar `user_belongs_to_family` via `children.family_id`.

## Frontend filer
- `src/hooks/useHolidayMode.ts` — React Query hook med optimistic updates
- `src/components/HolidayToggle.tsx`
- `src/components/HolidayGoalEditor.tsx`
- `src/components/HolidayGoalCard.tsx`
- `src/components/HolidayBanner.tsx`
- `src/components/HolidayWeekSummary.tsx`
- `src/pages/HolidayPage.tsx`

## Kvar att göra
- Push-notifikationer: `send-notifications` edge function bör hoppa över barn där `holiday_modes.active = true` och istället skicka lov-påminnelse 10:00/17:00. Inte implementerat i första versionen.
- Auto-cleanup av utgångna lov via pg_cron.
