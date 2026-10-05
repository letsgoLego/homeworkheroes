# Erbjudande: 3 månaders gratis Premium mot feedback

## Utskicket via Resend
Erbjudandet är marknadsföring och skickas därför via en separat tjänst (Resend), så appens vanliga mejl inte påverkas.
- Du skapar ett gratis Resend-konto och kopplar det till appen när jag ber om det (ett kopplingskort visas här i chatten).
- Avsändare från en egen adress, t.ex. `elias@hej.laxhjalp.app`. Resend visar några domäninställningar som du lägger in hos din domänleverantör. Svar går till din Gmail.
- I adminvyn: förhandsgranska mottagarlistan och tryck "Skicka erbjudandet". Varje familj får sitt mejl med personlig länk, och ingen familj får det två gånger.
- Varje mejl har en länk för att avregistrera sig, och den som avregistrerar sig får inga fler erbjudanden.
- Erbjudandet visas även **inne i appen** för berättigade familjer (ruta på dagsvyn).

## Vem får det
Alla familjer utom familjen Nordblad och vuxna kopplade dit. Familjer som redan har Premium hoppas över. Du granskar listan i adminvyn först.

## Så fungerar det för familjen
1. Familjen klickar på länken i ditt mejl eller rutan i appen: "Testa Premium gratis i 3 månader".
2. En kort sida med förklaring (inget kort, förnyas inte automatiskt) och 3 startfrågor:
   - Vad fick dig att börja använda Läxhjälp?
   - Var fastnade du eller vad var krångligt?
   - Vad saknar du för att använda appen varje vecka?
3. "Aktivera Premium" slår på Premium direkt i 90 dagar. I appen visas "Premium till och med [datum]".
4. Efter 3 månader blir familjen gratisversion igen; data finns kvar. Ingen debitering.

## Feedback under perioden
- **Avstämningar i appen** efter ca 2, 6 och 11 veckor: en liten ruta på dagsvyn med 1–2 frågor, t.ex. "Hur har veckan med Läxhjälp fungerat?" (1–5) + "Vad skulle göra appen bättre?". Kan skjutas upp eller hoppas över.
- **Feedback-knapp alltid tillgänglig** under perioden ("Tyck till") – familjen kan skriva när något dyker upp.
- **Slutfråga** sista veckan: "Vill du fortsätta med Premium? Varför/varför inte?" plus länk till vanliga uppgraderingen.
- Allt kopplas till familjen så du ser hela resan, och du ser även hur aktiva de varit (inloggningar, läxor) bredvid svaren.

## För dig i adminvyn
- Sektion "Premiumerbjudande": mottagarlista med personliga länkar, mejltext att kopiera, antal aktiverade, och alla feedbacksvar per familj i tidsordning.
- Nya svar mejlas till dig, precis som hjälpfrågorna.

## Förslag på mejl (skickas från din Gmail)

**Ämne:** En gåva till er familj – 3 månader Premium gratis

Hej!

Vad roligt att ni hittade Läxhjälp! Vi har märkt att ni inte varit inne så mycket på sistone – och det vill vi gärna lära oss av. Läxhjälp är byggt av en förälder som själv ville ha bättre koll på läxor, prov och packning, och vi vill att det ska bli lika enkelt för er.

Därför vill vi bjuda er på **3 månader Premium helt gratis** – i utbyte mot att ni berättar vad vi kan göra bättre, både nu och under tiden ni använder appen. Vad saknade ni? Var blev det krångligt? Era svar går direkt till mig och påverkar vad vi bygger härnäst.

[ Ja tack – aktivera Premium gratis ] (personlig länk)

- Inget kort behövs
- Förnyas inte automatiskt – efter 3 månader väljer ni själva om ni vill fortsätta
- Några korta frågor i appen då och då, max en minut

Tips: Lägg Läxhjälp på hemskärmen så öppnas den som en app – på iPhone/iPad: Dela → Lägg till på hemskärmen; på Android: menyn → Lägg till på startskärmen.

Varma hälsningar,
Elias, Läxhjälp

## Teknisk sektion
- `families`: ny override `trial` + `trial_ends_at`; `check-subscription` ger Premium när trial är aktiv och ignorerar den efter slutdatum.
- Tabell `premium_offers` (family_id, token, created_at, accepted_at) och `offer_feedback` (family_id, user_id, stage: start/check_2w/check_6w/check_11w/adhoc/final, rating, svar, created_at). RLS: föräldrar i familjen läser/skapar egna, admin läser allt. GRANTs ingår.
- RPC `accept_premium_offer(token, svar)` (security definer, en gång per familj, sätter 90 dagar).
- Admin-RPC skapar erbjudanden för berättigade familjer (exkluderar Nordblad + dess vuxna) och returnerar lista med e-post och länk.
- Sida `/erbjudande?token=...` (noindex), token sparas inför inloggning.
- Avstämningsrutan beräknar vilket steg som är aktuellt utifrån `accepted_at` och vilka steg som redan besvarats.
- Notismejl till Elias vid ny feedback via befintlig funktion för hjälpfrågor (en mottagare, utlöst av händelsen).

## Frågor att bekräfta
- OK att du skickar mejlet själv från Gmail (rekommenderas)? Alternativt kan vi koppla en separat tjänst för utskick, t.ex. Resend.
- Alla familjer, eller bara de med minst ett barn tillagt?
