# Hjälpknapp med frågor direkt till dig

## Mål
Nya användare som kör fast ska kunna trycka på en **?-knapp**, skriva sin fråga och få den skickad till dig (Elias) — utan att lämna appen.

## Vad användaren ser

1. **Flytande ?-knapp** (rund, teal) i nedre högra hörnet, ovanför bottenmenyn — synlig för inloggade **föräldrar** under deras första 30 dagar (nya användare), på alla huvudsidor. Därefter hittar man samma funktion via Familj-sidan ("Fråga oss").
2. Tryck öppnar en liten ruta: *"Kör du fast? Skriv din fråga så svarar vi så snart vi kan."* — ett textfält + Skicka-knapp.
3. Efter skick: bekräftelse *"Tack! Vi återkommer till din e-post."* och rutan stängs.

## Vad du får
- Frågan landar som ett **mejl till elias.nordblad@gmail.com** via Lovables e-postleverans, med användarens e-post i svar-till-fältet så du kan svara direkt från din vanliga mejl.
- Frågan sparas också i databasen så inget tappas bort och så att du kan se dem i adminvyn.

## Tekniskt

1. **Ny tabell `help_questions`**: id, user_id, email, message, created_at, answered (bool). RLS: användare kan bara skapa och läsa sina egna; GRANT till authenticated + service_role.
2. **Edge function `send-help-question`** (JWT-verifierad): tar emot frågan, sparar i tabellen och skickar mejl till dig via den hanterade e-post-API:et. Mottagare och ämne hårdkodas server-side — klienten kan inte styra vart mejlet går.
3. **Ny komponent `HelpQuestionButton.tsx`**: flytande knapp + dialog, renderas i `AppShell.tsx`. Villkor: inloggad förälder, konto yngre än 30 dagar → flytande knapp. Äldre konton: en rad på `FamilyPage.tsx` ("Har du frågor? Kontakta oss") som öppnar samma dialog.
4. **Adminvyn** (`AdminPage.tsx`): ny liten sektion "Senaste frågorna" med de 10 senaste hjälpfrågorna (namn/e-post, fråga, datum) via en enkel admin-kontrollerad läsning.
5. Analytics-event `help_question_sent` för att se hur ofta funktionen används.

Ingen påverkan på befintliga flöden; allt på svenska och i teal-design.
