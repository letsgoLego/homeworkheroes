# Enklare mobilflöde för studieteknikguiden

## Mål

Göra flödet för prov/förhör lätt att förstå på telefon, med mindre scroll och tydligare känsla av att appen faktiskt hjälper till att planera.

## Vad som ändras

### 1. Tydligare val när man ber om hjälp

När användaren väljer hjälp/mall för ett prov eller förhör ska appen direkt visa att ett upplägg är skapat.

- Byt texten från **"Följ en mall"** till något tydligare, t.ex. **"Få hjälp att planera"**.
- Visa en kort bekräftelse direkt efter valet: **"Vi har föreslagit ett upplägg"**.
- Visa nästa konkreta steg ovanför innehållet: **"1. Kontrollera momenten"** eller **"2. Välj dagar"**.
- Undvik att samma typ av hjälpknapp känns som två separata val; knappen i mallen ska bli mer som **"Gör om förslag"** när ett upplägg redan finns.

### 2. Mobilvy som fungerar som en kort steg-för-steg-guide

På telefon delas mallen upp i mindre delar i stället för en lång sida.

Föreslagen mobilstruktur:

```text
[Sammanfattning: 4 moment · 6 pluggtillfällen]
[Stegchips: 1 Moment  2 Dagar  3 Klart]

Aktivt moment:
1. Läsa igenom
Förstå

[Välj dagar för detta moment]
[Mån 21] [Tis 22]
[Ons 23] [Tor 24]

[Föregående] [Nästa moment]
```

Det betyder:

- Bara ett aktivt moment visas i taget på telefon.
- Momentlistan blir en kompakt rad med nummer/chips, inte en lång lista som måste scrollas förbi.
- Dagarna ligger direkt under det aktiva momentet.
- Knapparna **Föregående** och **Nästa moment** gör det tydligt hur man går vidare.
- På iPad/dator kan den bredare tvåkolumnsvyn vara kvar.

### 3. Kortare och mer fokuserad topp på telefon

Den fasta sammanfattningen i mallen görs mindre på mobil.

- Visa bara det viktigaste: antal moment, antal pluggtillfällen och om något saknar dag.
- Lägg den forskningsbaserade förklaringen bakom en liten informationsrad eller dölj den i själva planeringsläget på mobil.
- Flytta längre hjälptexter längre ner eller visa dem först när de behövs.

### 4. Tydligare status efter automatisk planering

Efter att appen föreslagit ett upplägg ska användaren se vad som hände utan att behöva förstå momentlistan.

- Visa en sammanfattning: **"Förslag: förstå först, träna två gånger, repetera nära förhöret"**.
- Markera automatiskt föreslagna dagar tydligt.
- När ett moment redan har dagar: visa **"Klar"** på momentchipet.
- När ett moment saknar dag: visa **"Välj dag"** på momentchipet.

### 5. Samma förbättring i båda vägarna

Ändringen görs både när en förälder skapar en läxa och när ett barn planerar en skickad läxa.

- Förälderns flöde: **Ny läxa → Prov/Förhör → Få hjälp att planera**.
- Barnets flöde: **Inkorg → Planera läxa → Få hjälp att planera**.
- Dagsmarkeringar med läxor och aktiviteter behålls i båda vägarna.

## Teknisk sammanfattning

- `StudyPlanningModeChoice.tsx`: byt copy för mallvalet, gör valet mer handlingsorienterat och mindre kort-tungt på mobil.
- `StudyPlanTemplate.tsx`: lägg till ett mobilanpassat fokusläge med aktivt moment, kompakta momentchips, tydligare status och bottennära nästa/föregående-kontroller. Behåll dagens bredare layout från `md` och uppåt.
- `AddHomework.tsx`: när mall/hjälp väljs ska föreslaget upplägg skapas direkt, feedback visas tydligare och hjälpknappen efteråt bli "Gör om förslag".
- `PlanHomeworkSheet.tsx`: samma beteende för barnets planeringsflöde.
- Ingen databasändring.

## Verifiering

- Kontrollera på mobilbredd att flödet kräver mindre scroll: skapa prov/förhör, välj hjälp, se föreslaget upplägg och gå mellan momenten.
- Kontrollera att dagarna fortfarande visar läxor och aktiviteter.
- Kontrollera att iPad/dator fortfarande använder ytan smart.
- Kör typkontroll efter ändringen.
