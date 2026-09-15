# Tydligare planering av förhör

## Mål
När typen **Prov/Förhör** väljs ska användaren först välja hur pluggdagarna planeras:

- **Välj dagar själv** – dagens enkla manuella dagval.
- **Följ en mall** – en fokuserad helskärmsplanering med föreslagna moment.

Samma val ska finnas både när en förälder skapar en läxa och när ett barn planerar en skickad läxa.

## Flöde
1. Efter att uppgifter och deadline fyllts i visas två tydliga alternativ för Prov/Förhör.
2. **Välj dagar själv** öppnar en ren dagsväljare med befintlig belastning, aktiviteter och färgmarkeringar.
3. **Följ en mall** öppnar en helskärmsvy där användaren arbetar stegvis:
   - Granska ämnesanpassade föreslagna moment.
   - Ändra namn, ta bort, lägga till och ordna momenten.
   - Välja en eller flera dagar per moment i en rymlig kalenderliknande översikt.
   - Granska planen innan den sparas.
4. Användaren kan gå tillbaka och byta planeringssätt utan att läxans grunduppgifter försvinner.

## Gränssnitt för mallen
- Ett moment i taget får tydligt fokus, med föregående/nästa moment.
- Alla möjliga dagar visas med veckodag, datum, antal befintliga läxor och aktiviteter.
- Valda dagar markeras tydligt och samma moment kan läggas på flera dagar.
- Momentens ordning visas numrerad och kan ändras.
- En fast sammanfattning visar antal moment, pluggtillfällen och eventuella moment som saknar dag.
- På iPad används ytan med momentlista och dagsöversikt sida vid sida; på iPhone visas de stegvis.

## Befintligt beteende som bevaras
- Manuellt dagval och knappen för föreslagna dagar finns kvar i det manuella alternativet.
- Läxbelastning och aktiviteter fortsätter visas vid varje dag.
- Sparade uppgifter får fortsatt namnet **Läxans namn – momentnamn**.
- För inlämningar används nuvarande planeringsflöde utan det nya valet.

## Teknisk omfattning
- Dela upp planeringen i återanvändbara vyer för val av planeringssätt, manuella dagar och helskärmsmall.
- Använd samma mallkomponent i både skapaflödet och barnets inkorgsflöde.
- Behåll nuvarande datamodell: den stödjer redan flera dagar per moment och momentens ordning genom den ordning de sparas i.
- Lägg till validering så att alla mallmoment måste ha minst en dag innan planen sparas.
- Anpassa dialogen till helskärm i malläge och återställ normal storlek när användaren lämnar mallen.

## Kontroll
- Testa båda planeringssätten i föräldra- och barnflödet.
- Kontrollera flera dagar per moment, omordning, tillägg, borttagning och byte mellan lägen.
- Kontrollera iPhone, stående/liggande iPad och att inga val försvinner vid bakåtnavigering.
