# Tydligare dagval för förhör

## Problem idag
- När du väljer "Välj dagar själv" ser det andra alternativet ("Följ en mall") rött/varnande ut, vilket känns som ett fel.
- Valet mellan de två sätten ligger kvar högst upp och tar plats, så dagvalet hamnar långt ner och blir svårt att nå.
- Belastningen per dag visas bara som en enda liten färgprick och det syns inte tydligt hur många läxor eller vilka aktiviteter dagen har. Gäller både manuellt dagval och mallen.

## Vad som ändras

1. **Neutralt val, inget rött**
   - Det icke-valda alternativet blir dämpat/neutralt, aldrig rött.
   - Det valda alternativet markeras med teal ram och bock.

2. **Valet fälls ihop när du valt**
   - Efter att du valt planeringssätt krymper rutorna till en smal rad: "Planeringssätt: Välj dagar själv · Byt".
   - Tryck på "Byt" öppnar valet igen. Inga ifyllda uppgifter försvinner.
   - Dagvalet hamnar därmed direkt högt upp och listan får mer höjd (ingen trång inre skrollruta på mobil).

3. **Tydliga prickar för belastning – både manuellt och i mallen**
   - Varje dag visar en prick per redan planerad läxa (max 3 prickar, sedan "+2"), i grön/gul/röd nivå.
   - Aktiviteter visas som emoji-märken med tid, t.ex. "⚽ 17:00", på samma rad.
   - Kort text bredvid: "Inga läxor" / "2 läxor".
   - Samma prick- och aktivitetsmarkering i mallens dagsrutor som i den manuella listan, så det ser likadant ut båda vägarna.
   - Förklaringsraden "Grön = lugn dag · Gul = några läxor · Röd = full dag" visas i båda lägena.

4. **Samma sak i barnets planeringsvy**
   - Barnets inkorgsplanering får identiskt utseende: ihopfällt val, neutrala alternativ, prickar och aktivitetsemoji.

## Teknik
- `src/components/StudyPlanningModeChoice.tsx`: neutral styling för ovalt kort, ny ihopfälld variant med "Byt"-knapp (`collapsed` + `onReset`).
- Ny liten delkomponent för dagsbelastning (prickar + aktivitetsmärken) som återanvänds i `AddHomework.tsx`, `PlanHomeworkSheet.tsx` och `StudyPlanTemplate.tsx`.
- `AddHomework.tsx`: ta bort `max-h-72 overflow-y-auto` på daglistan i malläge/helskärm, rendera ihopfällt val, visa legend även i malläge.
- Endast presentation – ingen ändring i hur `study_tasks` skapas och ingen databasändring.
