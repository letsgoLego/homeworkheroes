## Mål

Göra Läxhjälp till en riktig native-app (iOS/Android) med äkta vibrationer (haptik) och notiser – både lokala påminnelser direkt och server-push via APNs/FCM när certifikaten finns på plats. Webb/PWA-versionen fortsätter fungera exakt som idag.

## 1. Capacitor-grund

- Lägg till `@capacitor/core`, `@capacitor/cli` (dev), `@capacitor/ios`, `@capacitor/android`.
- Skapa `capacitor.config.ts` med appId `app.lovable.35a2792688ca43f9806912710e01c9f1`, appName `homeworkheroes`, `webDir: "dist"` och `server.url` mot sandbox-URL:en för hot reload under utveckling.
- Ny hjälpmodul `src/lib/platform.ts` som exponerar `isNative()` (Capacitor-plattform ≠ web) så all ny kod kan välja native- eller webbväg.

## 2. Vibrationer (haptik) – både native och visuellt

- Lägg till `@capacitor/haptics`.
- Bygg ut `src/lib/confetti.ts`:
  - I native-appen: `Haptics.impact({ style: Light/Medium/Heavy })` respektive `Haptics.notification()` för `success`.
  - Kvarhåll den visuella pulsen som komplement på alla plattformar (ditt val: "både haptik och visuell effekt").
  - Webbläge oförändrat: `navigator.vibrate` där det stöds, annars visuell puls.
- Ingen ändring i anropande komponenter – de använder redan `haptic()`.

## 3. Lokala notiser (fungerar direkt, utan Apple/Google-setup)

- Lägg till `@capacitor/local-notifications`.
- Ny hook `src/hooks/useLocalNotifications.ts` som i native-appen:
  - begär tillstånd,
  - schemalägger dagliga återkommande notiser kl. 14:30 (nya läxor), 15:30 (ogjorda uppgifter) och 18:30 (kvällspåminnelse) – samma tider som dagens serverpush,
  - respekterar samma tre inställningar som redan finns (`notify_new_homework`, `notify_unfinished`, `notify_reminder`) och avbokar/omschemalägger när en toggle ändras,
  - hoppar över notiser när Lov-läge är aktivt (samma regel som idag).
- `NotificationSettings.tsx` får en native-gren: samma UI och togglar, men texten förklarar att påminnelserna kommer från telefonen.

## 4. Native push (APNs/FCM)

- Lägg till `@capacitor/push-notifications`.
- Databas: utöka `push_subscriptions` med `platform` ('web' | 'ios' | 'android') och `device_token` (nullable), och gör `endpoint`/`p256dh`/`auth_key` nullable så native-tokens kan sparas i samma tabell med befintliga RLS-policyer.
- Klient: i native-appen registreras enheten via `PushNotifications` och token sparas som en rad med `platform` + `device_token`; på webben används dagens VAPID-flöde oförändrat.
- Edge function `send-notifications` utökas med en FCM v1-gren (HTTP v1 med service-account-JWT) för native-rader, medan webbraderna fortsätter gå via befintlig Web Push-kod. Notisinnehåll, dedupe-fälten (`last_*_notify`) och tidszonlogik återanvänds.
- Ett service account-JSON från Firebase behövs som secret innan native push kan skickas skarpt; jag lägger in koden och ber om värdet när vi är där. Fram till dess ger lokala notiser full funktion i appen.

## 5. iOS/Android-specifikt

- iOS: `Info.plist`-noteringar för push-behörighet och background modes dokumenteras i README (filerna skapas när du kör `npx cap add ios` lokalt).
- Android: `google-services.json` placeras i `android/app/` – dokumenteras i README.
- README får ett avsnitt "Native app (App Store / Play Store)" med exakta steg: exportera till GitHub, `npm install`, `npx cap add ios/android`, `npm run build`, `npx cap sync`, `npx cap run ios`.

## Tekniska detaljer

- Ingen befintlig webbfunktionalitet tas bort: service worker, VAPID-push och PWA-manifest lämnas intakta.
- All native-kod ligger bakom `isNative()`-guards så webbbygget inte påverkas och tester fortsätter gå igenom.
- Migrationen är additiv (nya nullable-kolumner + default `'web'`), så inga befintliga prenumerationer går sönder.

Efter implementationen: `git pull` i ditt repo och kör `npx cap sync` innan du bygger i Xcode.
