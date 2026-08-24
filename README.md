# Läxhjälpen

En svensk PWA som hjälper familjer att hålla koll på läxor, prov, inlämningar och fritidsaktiviteter – designad för iPhone och iPad och anpassad för både föräldrar och barn.

**Live:** https://laxhjalp.app

## Funktioner

En komplett översikt över appens funktioner finns i [FEATURES.md](./FEATURES.md).

Kort sammanfattning:

- Läxor med inlämningar, förhör, återkommande uppgifter och extrauppgifter
- Läxinkorg: föräldern skickar läxan, barnet planerar dagarna själv
- Smart studieteknik för förhör/prov med ämnesanpassade delmoment
- Aktiviteter med krockdetektering – skapa, redigera och ta bort
- Lov-läge med 1–3 egna mål, streaks, XP, heatmap och delbar veckosammanfattning
- Barnvy med dashboard, packlista, väder och peppande animationer
- Familjehantering med upp till 6 medlemmar och separata barnkonton
- Smart schemaläggning, snooze och påminnelser
- XP-system och veckostatistik
- Push-notiser kl 14:30, 15:30 och 18:30 (samt 16:00 för oplanerade läxor)
- Native app via Capacitor med riktig haptik och lokala notiser
- Google Analytics 4 med händelser för läxor, mål och prenumeration
- Offlinestöd via PWA
- Gratis (3 läxor/barn) och Pro (39 SEK/mån) via Stripe

## Teknisk stack

- React 18 + Vite 5 + TypeScript 5
- Tailwind CSS + shadcn/ui + Framer Motion
- Lovable Cloud (Supabase) – databas, auth, storage, edge functions
- Stripe Subscriptions
- Workbox (PWA, NetworkFirst)

## Utveckling

Projektet redigeras primärt via [Lovable](https://lovable.dev). Ändringar synkas automatiskt till GitHub.

För lokal utveckling:

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm i
npm run dev
```

Krav: Node.js & npm ([installera via nvm](https://github.com/nvm-sh/nvm#installing-and-updating)).

## Publicering

Öppna [Lovable](https://lovable.dev) och välj **Share → Publish**.

## Custom domain

Gå till **Project → Settings → Domains** och klicka **Connect Domain**. Mer info: [docs.lovable.dev](https://docs.lovable.dev/features/custom-domain#custom-domain).

## Native app (App Store / Google Play)

Appen är förberedd för native-bygge med Capacitor (`capacitor.config.ts`), inklusive
riktig haptik (`@capacitor/haptics`), lokala påminnelser (`@capacitor/local-notifications`)
och push (`@capacitor/push-notifications`). Webb/PWA-versionen påverkas inte – all
native-kod ligger bakom en `isNative()`-guard (`src/lib/platform.ts`).

### Kom igång lokalt

```sh
git pull
npm install
npx cap add ios       # och/eller: npx cap add android
npx cap update ios    # och/eller: npx cap update android
npm run build
npx cap sync
npx cap run ios       # kräver Mac + Xcode. Android: npx cap run android
```

Kör `npx cap sync` varje gång du har gjort `git pull` eller ändrat native-plugins.

### Notiser

- **Lokala påminnelser** fungerar direkt efter installation: 14:30 (nya läxor),
  15:30 (ogjorda uppgifter) och 18:30 (kvällspåminnelse). De följer samma togglar
  som webben och pausas automatiskt när Lov-läge är aktivt.
- **Push från servern** går via FCM HTTP v1 (Android direkt, iOS via APNs-nyckel
  uppladdad i Firebase). Lägg till secreten `FIREBASE_SERVICE_ACCOUNT` (hela
  service account-JSON:en) i backend-inställningarna för att aktivera den.

### iOS-checklista

1. I Xcode: aktivera **Push Notifications** och **Background Modes → Remote notifications**
   under *Signing & Capabilities*.
2. Ladda upp din APNs-nyckel (.p8) i Firebase Console → Project settings → Cloud Messaging.
3. Se till att `Info.plist` innehåller `UIBackgroundModes` med `remote-notification`.

### Android-checklista

1. Lägg `google-services.json` från Firebase i `android/app/`.
2. Notiskanalen heter `laxhjalp-reminders`.
