

## Plan: Aktiviteter i dagsplanering och studieplanering

### Koncept
En ny tabell `activities` för återkommande och engångsaktiviteter (fotboll, piano, simskola etc.) som visas i dagsvyn och påverkar smart schemaläggning av pluggdagar.

### Databasändring

Ny tabell `activities`:
```sql
CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL,
  title text NOT NULL,
  emoji text DEFAULT '⚽',
  weekdays integer[] DEFAULT '{}',  -- för återkommande (0=sön, 1=mån...)
  specific_date date,                -- för engångshändelser
  start_time time,                   -- valfri starttid
  end_time time,                     -- valfri sluttid
  created_at timestamptz DEFAULT now()
);
```
RLS-policies som speglar `recurring_pack_items` (familjemedlemmar via `children`).

### UI-ändringar

| Fil | Ändring |
|---|---|
| `src/components/AddActivity.tsx` | **Ny** — dialog för att lägga till aktivitet med emoji-väljare, dag-väljare (återkommande) eller datum (engångs), valfria tider |
| `src/components/ActivityCard.tsx` | **Ny** — visar aktivitet i dagsvyn med emoji, titel och tid |
| `src/pages/TodayPage.tsx` | Visa dagens aktiviteter i en egen sektion ovanför läxor |
| `src/components/WeekView.tsx` | Visa aktiviteter per dag i veckovyn |
| `src/components/AddHomework.tsx` | I steg 2 (dagväljare) — visa aktiviteter som belastningsindikator så barnet ser "Fotboll 16-17" på tisdagar och väljer andra dagar |
| `src/hooks/useFamily.ts` | Lägg till CRUD för activities + `getActivitiesForDate()` |
| `src/hooks/queries/useHomeworkData.ts` | Hämta activities tillsammans med övrig data |
| `src/pages/AddPage.tsx` | Lägg till knapp "Lägg till aktivitet" |

### Flöde

1. **Lägg till aktivitet**: Barnet trycker "+" → väljer "Aktivitet" → fyller i titel, väljer emoji (⚽🎹🏊‍♂️🎭🏀), väljer dagar/tid → sparar
2. **Dagsvyn**: Aktiviteter visas som färgglada kort med emoji och tid, tydligt separerade från läxor
3. **Pluggplanering**: När barnet väljer studiedagar i AddHomework visas aktiviteter under varje dag — dagar med aktiviteter rankas lägre i auto-förslaget

### Smart schemaläggning
Funktionen `suggestStudyDays` utökas så att dagar med aktiviteter får högre "belastning", vilket gör att appen automatiskt föreslår lugnare dagar först. Aktiviteter visas visuellt: "⚽ Fotboll 16:00" under varje dag i dagväljaren.

