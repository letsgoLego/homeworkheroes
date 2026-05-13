## Mål

1. **Spridning** – fler personer hittar och klickar in på Homework Heroes.
2. **Konvertering** – färre tappas bort mellan "klickar Skapa konto" och "första läxan inlagd".

Förslagen nedan är prioriterade så att vi börjar med snabba vinster (mätning + förenkling) innan vi bygger nya funktioner.

---

## Del 1 – Mätning först (annars gissar vi)

Innan vi optimerar måste vi se *var* trichten läcker.

- **Lägg in en lättviktig, GDPR-vänlig analytics** (t.ex. Plausible eller Umami via skript-tagg, alternativt en egen `events`-tabell i Lovable Cloud).
- **Spåra fyra steg som "funnel events":**
  1. `landing_view` – någon ser /landing
  2. `signup_started` – klick på "Kom igång gratis" eller fokus i e-postfältet
  3. `signup_submitted` – formulär skickat (eller Google/Apple-popup öppnad)
  4. `onboarding_completed` – familj + minst ett barn skapat
- **Koppla in Google Search Console** (finns redan som SEO-finding) för att se vilka sökord som drar folk in och vilka som inte gör det.

Detta tar ~30 min att sätta upp och ger oss den siffra vi faktiskt behöver: *var* trillar de av.

---

## Del 2 – Minska bortfall i signup-flödet (snabba vinster)

Granskning av `AuthPage.tsx` och `OnboardingPage.tsx` visar flera kända friktionsmoment:

### 2a. Auth-sidan
- **Lyft fram Google/Apple ovanför e-postformuläret.** Sociala inloggningar konverterar typiskt 2–3× bättre än e-post + lösenord. Idag ligger de under "eller".
- **Visa lösenordskrav direkt** (t.ex. "minst 6 tecken") istället för att kasta toast-error efter klick.
- **Lägg till "visa lösenord"-öga** i lösenordsfältet.
- **Inline-validering** av e-postfältet (rött bara efter blur, inte medan man skriver).
- **Tydligare felmeddelande när användaren redan finns** med en direktknapp "Logga in istället" som förfyller e-posten.
- **E-postbekräftelse-fälla:** efter `signUp()` navigerar vi direkt till `/onboarding`, men om e-postverifiering är på har användaren ingen session där och fastnar. Lägg till ett tydligt mellansteg "Kolla din inkorg" + möjlighet att skicka om mejlet.

### 2b. Onboarding
- **Visa progressindikator** ("Steg 2 av 3") så folk vet att det snart är klart.
- **Tillåt att hoppa över "lägg till barn"-steget** med en "Lägg till senare"-knapp – många vill bara titta in först.
- **Spara delvis ifyllda värden i localStorage** så att en refresh inte nollar allt.
- **Direkt värde efter onboarding:** visa en förifylld exempel-läxa första gången så att Today-vyn inte är tom (kan tas bort med ett klick).

### 2c. Landningssidan
- **Två CTA:er ovan vikten:** primär "Kom igång gratis" + sekundär "Logga in" finns redan – bra. Lägg till en mindre "Fortsätt med Google" direkt under hero-CTA:n så att den som vill starta med ett klick inte behöver via /auth först.
- **Trust-rad direkt under hero:** "Gratis att börja • Ingen kortuppgift • Avregistrera när som helst".
- **Föräldra-citat / social proof** (även 2–3 korta är bättre än inga) ovan första pris-sektionen.

---

## Del 3 – Spridning (få in fler i toppen av tratten)

### 3a. Inbyggd viralitet via familje-koden
Familje-invites finns redan (`/join-family-start`), men användarna har ingen anledning att bjuda in *andra* familjer.

- **Lägg till "Bjud in en kompisfamilj"** på Familj-sidan. En unik delningslänk per förälder leder till /landing?ref=XYZ.
- **Liten morot:** den som bjuder in 1 familj som registrerar sig får t.ex. 1 månad Pro gratis (kräver ett enkelt `referrals`-table + räknare).
- **Pre-fyllt delningsmeddelande** för iOS Share Sheet ("Vi använder Homework Heroes för läxorna – funkar grymt. Testa: …").

### 3b. SEO & innehåll (utöka det som redan funkar)
- Du har redan 7 tips-artiklar. **Lägg till 2–3 till per månad** på högtrafikerade sökord (jag kan köra Semrush-research för att hitta dem – t.ex. "läxhjälp åk 4", "läxor utan bråk").
- **Lägg interna länkar från artiklar → /landing** med tydlig CTA-banner längst ner i varje artikel ("Slipp läxbråken – testa Homework Heroes gratis").
- **Submit sitemap till Google Search Console** (förutsatt att GSC kopplas).

### 3c. App Store-presence
PWA är installerbar men osynlig i AppStore/Play. **Överväg en TWA (Trusted Web Activity)** för Play Store och en tunn iOS-wrapper – det är dock ett separat större projekt, lägg det som "framtid".

### 3d. Sociala kanaler
- **Skapa en Instagram-/TikTok-närvaro** med korta klipp av appen i bruk (kan göras manuellt, men koden behöver bara säkerställa att OG-image är vass när någon delar länken – done i förra sessionen).
- **Lägg in delningsknappar** ("dela till en förälder du känner") på `/landing` och i appen efter en avklarad streak ("Vi har klarat läxorna 7 dagar i rad! 🎉").

---

## Föreslagen ordning

1. **Vecka 1** – Analytics + funnel-events + GSC-koppling. *(Utan data optimerar vi blint.)*
2. **Vecka 1–2** – Auth-sidan: Google/Apple högst upp, lösenordskrav inline, "kolla inkorgen"-mellansteg.
3. **Vecka 2** – Onboarding: progressindikator, hoppa-över-knapp, exempel-läxa.
4. **Vecka 3** – Referral-flöde + delningsknappar.
5. **Vecka 3+** – Innehållsmotor (2–3 nya tips-artiklar/mån) + Semrush-driven keyword-research.

---

## Tekniskt (om du säger ja)

- Ny tabell `analytics_events` i Lovable Cloud (RLS: insert public, select admin) eller integration mot Plausible.
- Ny tabell `referrals` med kolumner `id, referrer_user_id, code, signed_up_user_id, signed_up_at`.
- Edge function `track-event` för att inte exponera servicekey i klienten.
- Edits i `AuthPage.tsx`, `OnboardingPage.tsx`, `LandingPage.tsx`, `FamilyPage.tsx`.
- Nytt komponent: `<EmailSentScreen />` för verifierings-mellansteget.

---

## Vad jag behöver veta för att börja

1. Vill du att jag börjar med **mätning + auth-fixarna** (snabbast effekt) eller **referral-systemet** (störst potentiell viralitet)?
2. Är e-postverifiering påslagen i Lovable Cloud just nu? (Det avgör om "kolla inkorgen"-skärmen är akut eller inte.)
3. Vill du att jag använder **Plausible/Umami via skript** eller bygger en egen liten `analytics_events`-tabell? Egen tabell ger full kontroll men kräver lite mer kod.
