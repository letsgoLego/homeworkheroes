# Läxhjälpen

En svensk PWA som hjälper familjer att hålla koll på läxor, prov, inlämningar och fritidsaktiviteter – designad för iPhone och iPad och anpassad för både föräldrar och barn.

**Live:** https://homeworkheroes.lovable.app

## Funktioner

En komplett översikt över appens funktioner finns i [FEATURES.md](./FEATURES.md).

Kort sammanfattning:

- Läxor med inlämningar, förhör, återkommande uppgifter och extrauppgifter
- Barnvy med dashboard, packlista, väder och peppande animationer
- Familjehantering med upp till 6 medlemmar och separata barnkonton
- Smart schemaläggning, snooze och påminnelser
- XP-system och veckostatistik
- Push-notiser kl 14:30, 15:30 och 18:30
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
