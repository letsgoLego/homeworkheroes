# Barnet får redigera läxan du skickar

## Idén
Som förälder ska du kunna skicka en läxa även när du bara vet ungefär vad det handlar om ("spanska läxa"). Barnet fyller i resten: rätt titel, ämne, typ, deadline och vilka delar som ska göras – i samma vy där hen planerar dagarna.

## Så blir det för dig som förälder
- Bara ämne behövs. Titel, deadline, meddelande och delmoment blir valfria.
- Ny knapp vid deadline: "Vet inte – barnet fyller i". Då sätts ett förslag en vecka fram och läxan markeras som "deadline ej bekräftad".
- I inkorgen (din vy) står det "Väntar på planering – barnet fyller i detaljerna" och deadline visas som "ej bekräftad" när du hoppat över den.
- Du kan fortfarande ta bort läxan innan barnet planerat.

## Så blir det för barnet
Planeringsvyn får ett litet redigeringsavsnitt högst upp, ovanför momenten:
- Titel – redigerbart textfält (t.ex. "Spanska – glosor kap 3").
- Ämne – samma ämnesknappar som i vanliga läx-formuläret.
- Typ – Inlämning / Förhör (byter också förslagen på studiemoment).
- Deadline – datumväljare. Om föräldern inte satt någon visas en tydlig gul rad: "När ska den vara klar?" och barnet måste välja datum innan hen kan spara.
- Meddelande från föräldern visas som text (barnet ändrar inte det), men barnet kan lägga till en egen anteckning.
- Dagknapparna räknas om direkt när deadline ändras, så man bara kan välja dagar fram till den nya deadlinen.
- Delmomenten är redan redigerbara (lägga till/ta bort/ordna) och behåller det – plus att momentens namn nu går att skriva om.

När barnet trycker "Klart – planera!" sparas både ändringarna på läxan och dagplaneringen i ett steg.

## Teknisk sammanfattning
- `SendHomeworkToChild.tsx`: titel/deadline blir valfria; ny "Vet inte"-toggle för deadline som sätter `due_date` till +7 dagar och skickar `dueDateConfirmed: false`.
- `sendHomeworkToChild` i `useFamily.ts`: nytt fält skrivs till en ny kolumn `due_date_confirmed boolean not null default true` på `homework` (migration). Titel faller tillbaka till ämnesnamnet som idag.
- `PlanHomeworkSheet.tsx`: lokal state för `title`, `subject`, `homeworkType`, `dueDate`, `note`; `days`-beräkningen använder lokala `dueDate`; spara-knappen kräver bekräftad deadline. Vid sparning anropas `updateHomework(id, { title, subject, homeworkType, dueDate, description })` före `planHomework(...)`, och `due_date_confirmed` sätts till `true`.
- `updateHomework` utökas med `dueDateConfirmed`.
- `HomeworkInbox.tsx`: visar "ej bekräftad" i stället för datum när `due_date_confirmed` är false, och räknar inte ner dagar då.
- Studieteknik-förslagen räknas om från barnets valda ämne/typ i stället för förälderns.
- Analytics: `homework_planned_by_child` får `edited: true` när barnet ändrat titel, ämne, typ eller deadline.
- RLS: barn har redan uppdateringsrätt på `homework` inom familjen, ingen policyändring behövs.
