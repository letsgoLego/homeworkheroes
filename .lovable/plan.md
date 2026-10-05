# Erbjudande: 3 månaders gratis Premium mot feedback

## Vem får det
Alla familjer utom familjen Nordblad och vuxna kopplade dit (Elias, Sandra m.fl.). Familjer som redan har Premium hoppas över. Innan något skickas visar jag listan i adminvyn så du kan granska den.

## Så fungerar det för familjen
1. Familjen får ett mejl med en knapp: "Ja tack, jag vill testa Premium gratis".
2. Knappen öppnar en kort sida i appen (man loggas in om det behövs) med:
   - Kort förklaring: 3 månader gratis, inget kort krävs, förnyas inte automatiskt.
   - Enkel feedback, 3 frågor (minst en måste fyllas i):
     - Vad fick dig att börja använda Läxhjälp?
     - Var fastnade du eller vad var krångligt?
     - Vad saknar du för att använda appen varje vecka?
   - Knapp "Aktivera Premium".
3. Premium slås på direkt i 3 månader. I appen visas "Premium till och med [datum]".
4. ca 7 dagar innan slutet får de ett vänligt mejl: "Din gratisperiod tar slut snart – vill du fortsätta?" med länk till vanliga uppgraderingen. Ingen automatisk debitering.
5. Efter 3 månader blir familjen automatiskt gratisversion igen (läxor och data finns kvar).

## För dig i adminvyn
- Ny sektion "Premiumerbjudande": antal mejl skickade, öppnade/aktiverade, och alla feedbacksvar med familj och datum.
- Knapp "Skicka erbjudandet" (skickas bara en gång per familj).
- Nya svar mejlas också till dig, precis som hjälpfrågorna.

## Förslag på mejl

**Ämne:** En gåva till er familj – 3 månader Premium gratis

Hej!

Vad roligt att ni hittade Läxhjälp! Vi har märkt att ni inte varit inne så mycket på sistone – och det vill vi gärna lära oss av. Läxhjälp är byggt av en förälder som själv ville ha bättre koll på läxor, prov och packning, och vi vill att det ska bli lika enkelt för er.

Därför vill vi bjuda er på **3 månader Premium helt gratis** – i utbyte mot att ni berättar vad vi kan göra bättre. Vad saknade ni? Var blev det krångligt? Era svar går direkt till mig och påverkar vad vi bygger härnäst.

[ Ja tack – aktivera Premium gratis ]

- Inget kort behövs
- Förnyas inte automatiskt – efter 3 månader väljer ni själva om ni vill fortsätta
- Tar ungefär 2 minuter

Tips: Lägg Läxhjälp på hemskärmen så öppnas den som en app (instruktioner för iPhone, Android och iPad).

Varma hälsningar,
Elias, Läxhjälp

Svaret går att besvara direkt – mejlet når mig.

## Teknisk sektion
- Ny familjestatus `trial` med slutdatum (`subscription_override = 'trial'`, `trial_ends_at`) i `families`; `check-subscription` behandlar aktiv trial som Premium och ignorerar den efter slutdatum.
- Ny tabell `premium_offers` (family_id, token, sent_at, accepted_at, feedback-fält) med RLS: föräldrar läser/svarar för sin familj, admin läser allt. GRANTs inkluderade.
- Säker RPC `accept_premium_offer(token, svar)` som validerar familj, sparar feedback och sätter trial 90 dagar (en gång per familj).
- Sida `/erbjudande?token=...` (noindex), sparar token inför inloggning.
- Edge functions: `send-premium-offer` (admin-only, exkluderar Nordblad-familjen + dess vuxna, idempotent) och påminnelse 7 dagar före slut via befintlig cron.
- Mejlmallar via befintlig managed email, med hemskärmsinstruktioner.

## Frågor att bekräfta
- Avsändarnamn "Elias, Läxhjälp" och att svar går till din Gmail – OK?
- Ska vi skicka till alla (även de som aldrig lagt till barn) eller bara familjer med minst ett barn?
