# Databasoptimering — utan att påverka UX

Alla ändringar är bakgrunds-/infrastrukturarbete. Inga API-kontrakt, RLS-policies eller UI ändras. Användare märker bara att sidor laddar snabbare.

## Vad data visar

Topp 3 långsamma frågor står för ~75% av total DB-tid:

| # | Tabell | Total tid | Anrop | Orsak |
|---|--------|-----------|-------|-------|
| 1 | `study_tasks WHERE homework_id = ANY(...)` | 130 s | 22 027 | Saknar index på `homework_id` → seq scan 16,1 M rader |
| 2 | `homework WHERE child_id = ANY(...)` | 39 s | 20 699 | Saknar index på `child_id` → seq scan 945 k rader |
| 3 | `app_config WHERE key = ...` | 23 s | **205 285** | Frågas om och om — kan cachas i klienten |

`push_subscriptions` har också 103 k seq scans (n_live_tup=2 så liten i absoluta tal, men onödigt).

## Föreslagna ändringar

### 1. Lägg till saknade index (störst vinst)

```sql
CREATE INDEX idx_study_tasks_homework_id ON public.study_tasks(homework_id);
CREATE INDEX idx_homework_child_id       ON public.homework(child_id);
CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions(user_id);
```

Förväntad effekt: dagens-vyn, vecko-vyn och pushflödet svarar märkbart snabbare när familjen växer. Påverkar inga skrivningar nämnvärt (tabellerna är små).

### 2. Klient-cache av `app_config`

`app_config` läses 205 k gånger för samma nycklar (t.ex. feature flags, AdSense-id). Lägg en in-memory cache i `src/lib/appConfig.ts` med 5 min TTL + en `BroadcastChannel`-invalidering vid skrivning.

Effekt: ~99% färre DB-anrop, snabbare första render på alla skärmar.

### 3. Städa funktioner (lintervarningar, säkerhet)

Linter flaggar 31 issues. Säkra åtgärder:
- Sätt `SET search_path = public` på de 4 funktioner som saknar det (`enqueue_email`, `read_email_batch`, `delete_email`, `move_to_dlq`).
- Revoke `EXECUTE ... FROM anon, public` på SECURITY DEFINER-funktioner som bara ska köras av inloggade (alla utom `lookup_family_by_invite_code` som måste vara öppen för inbjudningsflödet).

Effekt: inga funktionsändringar — bara hårdare scope. Lintervarningar försvinner.

### 4. Ta bort oanvända index (valfritt)

Dessa har 0 scans sedan boot och kostar bara skrivlatens + plats:
- `idx_children_username` (täcks redan av `children_username_key`)
- `idx_homework_reminder`, `idx_homework_recurring`, `idx_study_tasks_snoozed_until`

Behåll dem om de används av cron-jobb som ännu inte hunnit köra (kolla efter en vecka). Markeras som "kandidat", görs i nästa pass.

## Det jag medvetet INTE rör

- RLS-policyer och GRANTs — kräver UX-validering.
- `holiday_modes`, `holiday_goal_entries` — låg trafik.
- Edge functions — separat optimeringspass.
- Databas-/disk-storlek — bara 10% disk, 55% RAM, 8/60 connections; ingen uppgradering behövs.

## Implementationsordning

1. Migration: 3 nya index + search_path fix + revoke EXECUTE.
2. Klientcache för `app_config` (ren TS-modul, ingen UI-ändring).
3. Verifiera med ny `slow_queries`-körning.

Vill du att jag kör allt detta eller bara delmängder?
