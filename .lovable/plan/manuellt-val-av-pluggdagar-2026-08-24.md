# Manuellt val av pluggdagar

Idag väljs pluggdagarna åt dig: när du kommer till steg 2 fylls dagar i automatiskt och en skjutreglage-slider ("Antal pluggdagar") skriver om valet varje gång du rör den. Rutorna visar bara en liten emoji eller ett aktivitets-emoji, så det är svårt att se hur full en dag faktiskt är.

## Vad som ändras

1. **Inget autoval, ingen slider**
   - Steg 2 öppnas med noll valda dagar. Du trycker själv på de dagar du vill plugga.
   - Slidern "Antal pluggdagar" tas bort.
   - Rubriken blir informativ istället för förslagsstyrd: "Du har X dagar på dig till [deadline] – välj själv vilka dagar du pluggar."
   - En liten knapp "Föreslå dagar" finns kvar som frivillig hjälp (fyller i lugnaste dagarna), men gör inget av sig själv.

2. **Tydlig belastning per dag**
   - Dagsrutorna blir en lista/större kort per dag istället för trånga 3-kolumnsrutor, med:
     - Veckodag + datum (helg markerad).
     - Läxbelastning i klartext: "Inga läxor" / "1 läxa" / "3 läxor" plus färgprick (grön/gul/röd).
     - Aktiviteter i klartext: emoji + namn + tid, t.ex. "⚽ Fotboll 17:00".
   - Dagar som redan är tunga får tydlig varningsfärg så man ser att man bör välja en annan dag – men de går fortfarande att välja.
   - Valda dagar markeras med bock som idag.

3. **Samma tydlighet i barnets planeringsvy**
   - I inkorgens planeringsvy (där barnet lägger ut delmoment på dagar) får dagknapparna samma belastningsindikator: antal läxor och aktivitetsemoji per dag.

4. **Förklaring**
   - Legenden byts till text: "Grön = lugn dag · Gul = några läxor · Röd = full dag".

## Teknik

- `src/components/AddHomework.tsx`: ta bort `useEffect`-autovalet och `Slider`/`suggestedDayCount`; behåll `suggestStudyDays` men kör den bara via knappen "Föreslå dagar". Ersätt dagrutnätet med en vertikal lista av dagkort som använder `taskCountsByDate` och `getActivitiesForDate` för klartext-etiketter.
- `src/components/PlanHomeworkSheet.tsx`: hämta `homework` + `getActivitiesForDate` från `useFamily` för att räkna belastning per dag och rendera den under varje dagknapp.
- Ingen databasändring; logiken för att skapa `study_tasks` är oförändrad.
