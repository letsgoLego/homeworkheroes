Justera trösklarna för presence-pricken (grön/gul/röd) som visas bredvid barnets namn.

## Nya regler

| Färg | Status | Tröskel |
|---|---|---|
| 🟢 Grön (pulserar) | "Aktiv nu" | Sett senast **≤ 4 timmar** sedan |
| 🟡 Gul | "Aktiv idag" | Sett tidigare **samma kalenderdag** (lokal tid) |
| 🔴 Röd | "Inte aktiv idag" | Sett en annan dag (eller aldrig, om barnet har konto) |
| ⚪ Grå | "Inget barnkonto" | Oförändrat |

## Ändring

`src/hooks/useChildPresence.ts` → byt konstanten `ONE_HOUR = 60 * 60 * 1000` till `FOUR_HOURS = 4 * 60 * 60 * 1000` och jämför `diffMs <= FOUR_HOURS` för 'online'. Övrig logik (samma-dag-koll för 'today', 'stale' annars, 'unknown' utan konto) lämnas orörd.

Inga andra filer påverkas — `PresenceDot`, etiketter och färgklasser är redan korrekta.

## Bieffekt att vara medveten om

Heartbeat pingar `last_seen_at` max var 5:e min när barnet är aktivt och igen vid `visibilitychange`/`focus`. Det innebär att grön kan visas upp till ~4 h efter att barnet stängde appen utan att öppna igen — vilket är exakt vad du bad om.