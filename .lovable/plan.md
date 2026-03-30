

## Plan: Gör läxuppläggningen roligare och smartare

### Problem idag
1. **Uppgiftstiteln ("Vad ska du göra?") är onödig** — den blir alltid "Plugga" och varje studieuppgift får samma namn. Det ger inget värde.
2. **Formuläret känns som ett tråkigt vuxen-formulär** — inte anpassat för barn/tonåringar.
3. **Ingen smart hjälp** — barnet måste själv räkna ut vilka dagar som passar att plugga.

### Förändringar

#### 1. Ta bort manuell uppgiftstitel
Generera titeln automatiskt: `"Plugga {ämne}"` (t.ex. "Plugga Matte", "Öva Engelska"). Bort med textfältet i steg 2. Förhör får "Plugga inför förhör", inlämningar får "Jobba med {titel}".

#### 2. Gör steg 1 mer visuellt och snabbt
- **Snabbval-templates** högst upp: Tre knappar med emoji — "📖 Läsläxa", "✍️ Prov/Förhör", "📄 Inlämning" — som förfyller typ + föreslår ämne.
- **Större, roligare ämnesväljare** med animerade emojis vid val.
- **Uppmuntrande mikro-copy**: Byt "Fyll i titel" till "Vad handlar läxan om? 🤔", "Anteckningar" till "Vill du skriva något mer? 💭".

#### 3. Smartare pluggschema (steg 2)
- **Auto-föreslå dagar** baserat på arbetsbelastning: Markera automatiskt de dagar som har lägst belastning. Barnet kan justera men slipper börja från noll.
- **Visuell belastningsindikator** med färger och text: "Lugnt 😎", "Lite att göra 📚", "Fullt schema! 🔥".
- **Föreslå antal dagar**: "Du har 5 dagar på dig. Vi föreslår att plugga 3 av dem!" med en slider.

#### 4. Roligare interaktion
- **Konfetti-burst** när man väljer ämne.
- **Animerad progress** mellan steg med en liten karaktär/emoji som "vandrar" framåt.
- **Uppmuntrande slutmeddelande** efter sparande: "Bra jobbat! Du har planerat {X} pluggdagar 💪"

### Filer att ändra

| Fil | Åtgärd |
|---|---|
| `src/components/AddHomework.tsx` | Stor refaktorering: ta bort taskTitle-fält, lägg till templates, smart auto-schema, roligare copy och animationer |

### Teknisk sammanfattning
- `taskTitle` state och fältet tas bort. Genereras automatiskt vid `handleSubmit` baserat på `homeworkType` + `subject`.
- Ny funktion `suggestStudyDays(availableDays, taskCountsByDate)` som returnerar optimalt fördelade dagar.
- Templates-knapparna sätter `homeworkType`, `subject` och fokuserar titel-fältet i ett klick.
- Framer Motion-animationer för ämnesval och stegbyte.

