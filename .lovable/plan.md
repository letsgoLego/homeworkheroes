Skapa en FEATURES.md i repo-roten som beskriver alla appens funktioner pa svenska, plus uppdatera README.md sa den pekar pa den.

### Innehall i FEATURES.md
- App-namn och kort beskrivning (Laxhjalpen / Homework Heroes — PWA for familjer att hantera laxor)
- Malsprak: svenska, malgrupp: barn och foraldrar
- Huvudfunktioner grupperade efter kategori:
  - **Hemuppgifter & Laxor**: Skapa laxor (inlamning/forhor), aterkommande laxor, extrauppgifter (ad-hoc), smart schemalaggning, snooze, paminnelser 2 dagar innan deadline, forsenade laxor med aldersindikator, veckooverblick med filter.
  - **Barnvyn**: Forenklad dashboard for barn, veckooversikt, packningslista (skolchecklista), vaderwidget, visuell och taktil haptic feedback vid avklarade uppgifter, konfetti-animationer.
  - **Familj & Roller**: Foraldrar som administrerer, barnkonton med forenklad inloggning (@laxhjalpen.child), max 6 medlemmar per familj, 8-siffriga hex-inbjudningskoder for att ansluta familj.
  - **Progress & Gamification**: XP-system med nivaer 0-10, veckostatistik/KPI:er, swipe-to-delete i dagens vy.
  - **Aktiviteter**: Fritidsaktiviteter med krockdetektering, forinstallda mallar for sporter/hobbies med emojis.
  - **Tillval (Todos)**: Engangs- och aterkommande todo-uppgifter utover laxor.
  - **Prenumeration**: Stripe-baserade nivaer (Gratis: 3 laxor/barn, Pro: 39 SEK/man), kundportal.
  - **Teknik & PWA**: Offline-stod med NetworkFirst-caching, push-notiser kl 14:30/15:30/18:30, PWA-installation for iPhone/iPad.
  - **Autentisering**: Google- och Apple-inloggning, e-postverifiering, losenordsaterstallning, automatisk kontolankning baserat pa verifierad e-post.
  - **SEO-artiklar**: /tips/* med JSON-LD Article-schema, AdSense begransat till dessa sidor.
  - **Onboarding**: 3-stegs installation och UI-tur sparad i localStorage.
  - **Sakerhet & efterlevnad**: GDPR/cookie-banner, RLS-policyer, roller i separat tabell, edge-funktioner for kansliga operationer.
- Teknisk stack-kortfattat (React, Vite, TypeScript, Tailwind, shadcn/ui, Supabase/Edge Functions, Stripe)

### Uppdatera README.md
- Ersatt den generiska Lovable-texten med kort projektbeskrivning
- Lagg till lank till FEATURES.md
- Bevara instruktioner for lokalt utvecklingsarbete (clone, install, dev)

### Implementationsmetod
- Generera innehallet baserat pa projektminne (mem://index.md) och kodbasgranskning
- Skriv filerna direkt i repo-roten
- Commit sker automatiskt via Lovable's synkronisering till GitHub