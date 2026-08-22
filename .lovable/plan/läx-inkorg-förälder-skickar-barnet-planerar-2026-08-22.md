# Läx-inkorg: förälder skickar, barnet planerar

## Idé
Föräldern skapar läxans "steg 1" (titel, ämne, deadline, ev. delmoment) och skickar den till barnet. Läxan landar i barnets **Inkorg** utan planerade dagar. Barnet gör "steg 2": fördelar delmomenten på dagar fram till deadline. Först då dyker läxan upp i Idag/Vecka som vanligt.

## Flöde
```text
Förälder: Skicka läxa  ->  Barnets inkorg (oplanerad)  ->  Barnet planerar dagar  ->  Vanlig läxa
```

## Vad som byggs

### 1. Förälderns "Skicka läxa"
- Ny flik/knapp i formuläret för att lägga till läxa: "Skicka till barnet att planera".
- Fält: titel, ämne, beskrivning, deadline och en valfri lista med delmoment (t.ex. "Läs s. 12-18", "Öva glosor").
- Föräldern väljer inga dagar. Läxan sparas som "väntar på planering".

### 2. Barnets inkorg
- Ny sektion högst upp på Idag-sidan: "📥 Inkorg (2)" med kort per oplanerad läxa (ämne, deadline, antal delmoment, dagar kvar).
- Barnet öppnar kortet och får en planeringsvy: en rad per delmoment där man väljer dag (endast dagar fram till deadline). Kan lägga till egna delmoment och slå ihop flera på samma dag.
- "Klart – planera!" skapar studieuppgifterna och tar bort läxan från inkorgen. Kort konfetti/haptik som belöning.
- Om inga delmoment finns skickade väljer barnet själv en eller flera studiedagar.

### 3. Påminnelser och förälderns status
- Barnet påminns om oplanerade läxor: badge i navigeringen + notis (samma push/lokala notiser som idag) så länge något ligger i inkorgen.
- Föräldern ser status på läxan: "Väntar på planering" (gul) vs "Planerad av barnet" med vilka dagar barnet valt.
- Barn kan fortsätta skapa egna läxor precis som idag – inkorgen gäller bara det föräldern skickar.

## Teknisk sammanfattning
- **Migration** på `homework`: `planning_status text not null default 'planned'` ('pending' | 'planned'), `created_by uuid`, `planned_at timestamptz`. Befintliga rader blir 'planned' så inget ändras retroaktivt.
- **Ny tabell** `homework_plan_items` (förslag på delmoment från föräldern innan barnet lagt ut dem): `homework_id`, `title`, `sort_order`. GRANT till authenticated/service_role, RLS via `user_belongs_to_family` på barnets familj, samma mönster som `study_tasks`.
- **Filtrering**: `useHomeworkData`/`useFamily` exponerar `inboxHomework` (planning_status = 'pending') och exkluderar dem från Idag/Vecka-listor, streaks, XP och workload-punkter.
- **Nya komponenter**: `SendHomeworkToChild.tsx` (förälderläge i `AddHomework`), `HomeworkInbox.tsx` (lista på TodayPage), `PlanHomeworkSheet.tsx` (barnets dagfördelning).
- **Hook**: `planHomework(homeworkId, [{title, date}])` skapar `study_tasks`, sätter `planning_status='planned'` + `planned_at`, rensar plan-items, invalidate.
- **Notiser**: nytt fall i `send-notifications` + lokala notiser för "oplanerad läxa", hoppas över under Lov-läge.
- **Analytics**: `homework_sent_to_child`, `homework_planned_by_child`.
