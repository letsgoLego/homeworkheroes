# Tydligare dagsmarkering i förhörsmallen

## Problem
I mallen kan samma dag väljas för flera moment, men när man planerar ett moment syns inte vilka dagar som redan är valda för andra moment. Man ser bara en bock för det aktiva momentet och tappar överblicken.

## Lösning

### 1. Varje moment får ett nummer och en färg
- Varje moment i listan har redan ett nummer (1, 2, 3 …). Numret får dessutom en egen färg som följer momentet överallt i mallen (fast palett med 6 tydliga färger som upprepas om man har fler moment).

### 2. Dagkorten visar vilka moment de tillhör
- På varje dag i dagsväljaren visas små numrerade färgprickar, en per moment som valt den dagen.
- Det aktiva momentets prick är större/tjockare så man ser vad man just nu redigerar.
- En dag som bara tillhör andra moment får en mjuk bakgrund i det aktiva momentets färg först när man väljer den — annars syns bara prickarna, så man ser att dagen är upptagen av ett annat moment men fortfarande kan välja den.
- Dagens egen bock/ram i det aktiva momentets färg behålls.

### 3. Momentlistan visar valda datum i klartext
- Under varje momentnamn står datumen utskrivna, t.ex. "tis 16, tor 18", i stället för bara "2 dagar valda".
- Texten får momentets färg som accent för att knyta ihop med prickarna i dagsväljaren.

### 4. Sammanfattningsraden uppe till vänster oförändrad
- Räknarna (Moment / Pluggtillfällen / Saknar dag) behålls som de är.

## Berörda filer
- `src/components/StudyPlanTemplate.tsx` — nummerprickar per dag, färger per moment, datumlista under momentnamnen.
- Ingen ändring i datastruktur (`StudyPlanRow`), sparning eller `AddHomework.tsx` / `PlanHomeworkSheet.tsx` — färgen härleds från momentets position.

## Tekniska detaljer
- Fast färgpalett i komponenten: `['bg-teal-500', 'bg-orange-500', 'bg-violet-500', 'bg-pink-500', 'bg-amber-500', 'bg-sky-500']` med matchande text-/ramvarianter via `cn()`; index = momentposition % 6.
- Dagskortet får en rad under `DayLoadIndicator` med prickarna: aktiv moments prick fylld med vit siffra, andra moment konturprick med siffra i sin färg.
- Datumlista i momentlistan: `row.dates.map(d => format(parseISO(d), 'EEE d', { locale: sv })).join(', ')`.
- Verifiering: `npx tsgo --noEmit` + Playwright-test på iPhone- och iPad-storlek där två moment delar en dag och prickarna syns korrekt.
