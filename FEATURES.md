# Läxhjälpen – Funktionsöversikt

Läxhjälpen är en svensk PWA (Progressive Web App) byggd för familjer med barn i grundskolan. Appen hjälper familjer att planera, hantera och få koll på läxor, prov, inlämningar och fritidsaktiviteter – med ett enkelt och peppande gränssnitt anpassat för både föräldrar och barn på iPhone och iPad.

- **Målspråk:** Svenska
- **Målgrupp:** Familjer med skolbarn
- **Plattform:** PWA (installeras på hemskärmen på iPhone/iPad/Android)
- **Publicerad URL:** https://laxhjalp.app

---

## Innehåll

- [Huvudfunktioner](#huvudfunktioner)
  - [Läxor & hemuppgifter](#läxor--hemuppgifter)
  - [Läxinkorg (förälder → barn)](#läxinkorg-förälder--barn)
  - [Barnvyn](#barnvyn)
  - [Familj & roller](#familj--roller)
  - [Aktiviteter](#aktiviteter)
  - [Todos](#todos)
  - [Progress & gamification](#progress--gamification)
  - [Smart schemaläggning](#smart-schemaläggning)
  - [Lov-läge](#lov-läge)
  - [Påminnelser & notiser](#påminnelser--notiser)
  - [Onboarding & introtur](#onboarding--introtur)
- [Prenumeration](#prenumeration)
- [Autentisering](#autentisering)
- [PWA & offline](#pwa--offline)
- [Native app (iOS & Android)](#native-app-ios--android)
- [Marknadsföring & SEO](#marknadsföring--seo)
- [Säkerhet & efterlevnad](#säkerhet--efterlevnad)
- [Teknisk stack](#teknisk-stack)

---

## Huvudfunktioner

### Läxor & hemuppgifter

- **Skapa läxor** med ämne (inkl. emoji-flaggor, t.ex. 🇬🇧 Engelska), arbetsbörda (visualiseras med punkter/emoji-indikatorer) och deadline.
- **Två huvudtyper:**
  - **Inlämning** – uppgift som ska lämnas in.
  - **Förhör / prov** – markeras med diamantdeadline.
- **Smart studieteknik för förhör/prov** – ämnesanpassade förslag på delmoment (t.ex. "Gör delförhör", "Räkna gamla uppgifter", "Repetera glosor") som föräldern och barnet kan välja, redigera och fördela på pluggdagar.
- **Återkommande läxor** – t.ex. "läs 5 dagar/vecka" som genererar uppgifter på valda dagar.
- **Extrauppgifter (⭐ Extra)** – ad-hoc-uppgifter med gyllene hover-effekt och stjärnregn-animation vid avklarning.
- **Gamifierad skapelse** – auto-genererade namn och emoji-indikatorer för arbetsbörda.
- **Snooze** – skjut upp en uppgift till nästa dag (kan inte snoozas förbi deadline).
- **Försenade läxor** – egen vy med röd ålders-indikator baserad på ursprungsdatum.
- **Automatisk städning** – pg_cron raderar uppgifter mer än 7 dagar försenade kl 03:00.
- **Veckovy** – vertikal sticky-scroll med filter för inlämningar och prov.
- **Sortering i "Idag"-vyn** – nyaste uppgifter överst, äldre/försenade i botten.
- **Swipe-to-delete** – 2-stegs swipe för att radera i Idag-vyn.

### Läxinkorg (förälder → barn)

- **Förälder skickar läxa** – titel, ämne, beskrivning och deadline fylls i av föräldern via "Skicka läxa".
- **Föreslagna delmoment** – föräldern kan lägga till delmoment (t.ex. "läs kapitel 1") som sparas som `homework_plan_items`.
- **Barnets inkorg** – oplanerade läxor visas högst upp på Idag- och Läxor-sidan med notisbricka i navigeringen.
- **Barnet planerar dagarna** – barnet fördelar delmomenten på dagar mellan idag och deadline; först då blir läxan synlig i Idag/Vecka.
- **Påminnelse kl 16:00** – push/lokal notis om det finns oplanerade läxor kvar i inkorgen.
- **Statuslägen** – `planning_status`: `pending` (i inkorgen) eller `planned` (klar att göra).

### Barnvyn

- **Förenklad dashboard** som lyfter fram veckans viktigaste och peppar barnet att komma i mål.
- **Veckoöversikt** anpassad för barn.
- **Packlista** – skoluppgifts-checklista på Pack-fliken, återställs dagligen kl 14:00.
- **Väderwidget** på Pack-fliken (cachad i localStorage i 24h).
- **Konfetti & animationer** vid avklarade uppgifter (grön gradient-overlay).
- **Haptisk feedback** – lätta/medel/tunga vibrationer (med visuell fallback på iOS Safari där Web Vibration API saknas).

### Familj & roller

- **Föräldrar** är administratörer och hanterar familjen samt tilldelar konton.
- **Barnkonton** med förenklad inloggning via @laxhjalpen.child-mail (3–20 tecken användarnamn).
- **Max 6 medlemmar** per familj.
- **Inbjudningskoder** – 8-siffriga hex-koder via `/join-family-start`.
- Aktivt barn sparas i localStorage.

### Aktiviteter

- **Fritidsaktiviteter** (sport, hobbies m.m.) med automatisk **krockdetektering** mot läxor och andra åtaganden.
- **Återkommande eller engångsaktiviteter** – välj veckodagar eller ett enskilt datum.
- **Full redigering (CRUD)** – skapa, uppdatera och ta bort aktiviteter direkt på Idag-sidan eller i aktivitetslistan på Läxor-sidan.
- **Föräldrastyrt** – redigera/ta bort är dolt för barnkonton.
- **Förinstallda mallar** för vanliga aktiviteter, varje med passande emoji.

### Todos

- **Engångs- eller återkommande todo-uppgifter** för saker utöver läxor och aktiviteter, så familjen kan samla allt på ett ställe.

### Progress & gamification

- **XP-system** med nivåer 0–10.
- **Veckostatistik** och KPI:er för varje barn.
- Visuell feedback (konfetti, stjärnregn, gradienter) som peppar.

### Smart schemaläggning

- Algoritm som föreslår studiedagar baserat på arbetsbörda och deadlines, för att jämna ut veckan och minska läxstress.

### Lov-läge

- **Aktiveras på lov** från barnets profil eller direkt i veckovyn – vanliga läxpåminnelser pausas automatiskt.
- **1–3 egna mål** per barn med emoji, färg, måltyp (dagligt eller totalt) och målvärde.
- **Daglig ifyllning** – barnet registrerar sina resultat varje dag (`holiday_goal_entries`).
- **Gamification** – streaks (🔥), 7-dagars sparkline, Lov-XP med nivåer ("Lovstartare" → "Lov-legend"), milstolpar och "perfekt dag"-splash.
- **Heatmap** över hela lovet som visar konsekvens.
- **Veckosammanfattning** som delbar PNG-bild (html-to-image) att skicka till förälder eller kompis.
- **Redigera mål** när som helst – namn, emoji, färg, mål och typ.
- **Troféer när lovet är slut** – guld/silver/brons per mål baserat på måluppfyllnad, med egen delbar trofébild.

### Påminnelser & notiser

- **Push-notiser** på PWA kl **14:30, 15:30 och 18:30** via Supabase Edge Functions.
- **Påminnelser triggas 2 dagar före** en läxas deadline.
- Föräldrar kan skicka en "nudge" till barnet.

### Onboarding & introtur

- **3-stegs setup** vid första inloggning.
- **UI-tur** sparad i localStorage så den bara visas en gång.

---

## Prenumeration

- **Gratis:** Upp till 3 läxor per barn.
- **Pro:** 39 SEK/månad – obegränsade läxor.
- **Stripe Checkout** + **kundportal** för uppsägning och kortbyte.
- Status cachad i 1h, polling var 5:e minut.
- Gifted-status kan åsidosätta Stripe-status (manuella gåvor).

---

## Autentisering

- **Google- och Apple-inloggning** för föräldrar.
- E-postverifiering krävs (ingen anonym signup).
- **Lösenordsåterställning** via mail (`/forgot-password`, `/reset-password`).
- **Automatisk kontolänkning** – om en användare loggar in med social provider som matchar en verifierad e-post länkas kontona ihop.
- **Barninloggning** via egen `/child-login`-sida med användarnamn.
- Säkra edge-funktioner för känsliga operationer (skapa barnkonto, återställa barnlösenord).

---

## PWA & offline

- Installerbar på hemskärmen på iPhone/iPad/Android.
- **NetworkFirst-caching** via Workbox – appen fungerar även med dålig uppkoppling.
- **OfflineBanner** visas när användaren är offline.
- Push-notiser stöds där webbläsaren tillåter.

---

## Native app (iOS & Android)

- **Capacitor-uppsättning** (`capacitor.config.ts`) för bygge till App Store och Google Play.
- **Riktig haptik** via `@capacitor/haptics` – visuell puls som fallback på webben/iOS Safari.
- **Lokala notiser** via `@capacitor/local-notifications` (14:30, 15:30, 18:30 samt 16:00 för inkorgen).
- **Native push** via `@capacitor/push-notifications` och FCM HTTP v1 i `send-notifications` (kräver secret `FIREBASE_SERVICE_ACCOUNT`).
- **Plattformsabstraktion** i `src/lib/platform.ts` och `src/lib/nativeNotifications.ts` – all native-kod ligger bakom `isNative()`, webbversionen påverkas inte.
- `push_subscriptions` innehåller `platform` ('web' | 'ios' | 'android') och `device_token`.

---

## Analys & mätning

- **Google Analytics 4** med egna händelser: `sign_up`, `login`, `begin_checkout`, `checkout_redirect`, `homework_created`, `todo_created`, `task_completed`, `assignment_completed`, `homework_sent_to_child`, `homework_planned_by_child`, `perfect_day`, `streak_milestone`.
- **Föräldrainsikter** – analysvy med t.ex. beredskap inför prov och friktionspunkter.

---

## Marknadsföring & SEO

- **Publik landningssida** på `/` (kanonisk `https://laxhjalp.app/`) med how-to och prissättning; `/landing` omdirigerar dit.
- **Om oss-sida** på `/om-oss`.
- **SEO-artiklar** på `/tips/*` med JSON-LD Article-schema:
  - Läxplanering
  - Studieteknik för barn
  - Läxstress
  - Läxrutin
  - Motivation till läxor
  - Tonåringar och läxor
  - Läxhjälp hemma
- **15+ pelarartiklar** (~2000 ord) om bl.a. ADHD och läxor, mattehjälp och läsförståelse, med FAQ- och Article-schema, brödsmulor och författarpresentation.
- **AdSense är strikt begränsat** till `/tips/*` – inga annonser inne i appen.

---

## Säkerhet & efterlevnad

- **GDPR/ePrivacy-cookiebanner** med svensk text.
- **Integritets- och användarvillkor** på svenska (`/privacy`, `/terms`).
- **Row Level Security (RLS)** på samtliga tabeller.
- **Roller i separat tabell** (aldrig på profil-/users-tabell) – `has_role`-funktion som SECURITY DEFINER för att undvika rekursiva RLS-problem.
- **Edge-funktioner med service role** för operationer som inte får ske från klient.
- Familjebyte och rolltilldelning sker uteslutande via SECURITY DEFINER-RPC:er.

---

## Teknisk stack

- **Frontend:** React 18, Vite 5, TypeScript 5, Tailwind CSS, shadcn/ui, Framer Motion.
- **Backend:** Lovable Cloud (Supabase) – Postgres, Auth, Storage, Realtime, Edge Functions (Deno).
- **Betalningar:** Stripe Subscriptions + Customer Portal.
- **PWA:** Workbox (NetworkFirst), Web Push.
- **Schemaläggning:** pg_cron för städning av gamla uppgifter och utskick av notiser.

---

## Edge Functions (översikt)

| Funktion | Syfte |
|---|---|
| `check-subscription` | Hämtar Stripe-status och cachar den. |
| `create-checkout` | Skapar Stripe Checkout-session. |
| `customer-portal` | Skickar användaren till Stripes kundportal. |
| `create-child-account` | Skapar barnkonto med @laxhjalpen.child-mail. |
| `reset-child-password` | Föräldrar kan återställa barnets lösenord. |
| `get-push-config` | Returnerar VAPID-konfiguration. |
| `send-notifications` | Schemalagda push-notiser (14:30/15:30/18:30). |
| `nudge-child` | Förälder skickar peppande notis till barn. |
| `cleanup-old-homework` | Tar bort gamla läxor >7 dagar försenade. |
| `send-notifications` (FCM) | Native push till iOS/Android via FCM HTTP v1. |

---

*Senast uppdaterad: 2026. Det här dokumentet versionhanteras tillsammans med koden i GitHub.*
