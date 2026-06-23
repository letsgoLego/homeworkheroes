## Bakgrund

AdSense har avvisat sajten med "Low value content". Det vanligaste skälet för en app som Läxhjälp är att Googlebot främst ser:
- En inloggad app-skal bakom auth (Today/Week/Family/Insights/Profile) — ser ut som tunna/duplicerade sidor.
- En liten samling `/tips/*`-artiklar som idag är relativt korta.
- Sidor som `/auth`, `/onboarding`, `/join-family` i sitemapen — utility-sidor utan unikt innehåll.

Du valde: **Restrict ads + improve crawlability**, **3000+ ord pillar pages**, **8 nya artiklar**. Planen nedan följer det.

## Mål

1. Visa AdSense en tydligt avgränsad, content-rik del av sajten (`/tips/*`, `/om-oss`, `/landing`).
2. Hindra Google från att indexera tunna/utility-sidor som drar ner kvalitetssignalen.
3. Stärka E-E-A-T, struktur och intern länkning så artiklarna ser ut som ett seriöst förlag, inte en app-skal.

## 1. Crawlability & indexing-städning

**`public/robots.txt`** — lägg till `Disallow` för utility-/app-sidor som ändå ligger bakom auth:
```
Disallow: /auth
Disallow: /child-login
Disallow: /forgot-password
Disallow: /reset-password
Disallow: /join-family
Disallow: /join-family-start
Disallow: /onboarding
Disallow: /today
Disallow: /week
Disallow: /add
Disallow: /family
Disallow: /insights
Disallow: /profile
Disallow: /holiday
```
Behåll `Allow: /` för resten samt `Sitemap:`-direktivet.

**`public/sitemap.xml`** — ta bort alla rader ovan. Behåll endast:
`/landing`, `/`, `/tips`, `/om-oss`, `/tips/*` (7 befintliga + 8 nya), `/privacy`, `/terms`.
Sätt `lastmod` på alla artiklar.

**`<meta name="robots" content="noindex,follow">`** via Helmet på app-/auth-routes (`AuthPage`, `OnboardingPage`, `JoinFamilyPage`, `JoinFamilyStartPage`, `ChildLoginPage`, `ForgotPasswordPage`, `ResetPasswordPage`, `TodayPage`, `WeekPage`, `AddPage`, `FamilyPage`, `InsightsPage`, `ChildProfilePage`, `HolidayPage`). Belt-and-suspenders ihop med robots.txt — viktigt eftersom robots.txt bara hindrar crawl, inte indexering av redan kända URL:er.

## 2. Hårda ad-restriktioner

Bekräfta i kod att `AdBanner` aldrig kan renderas utanför `/tips/*`. Lägg till en safety check i `AdBanner.tsx` som tidigt-returnar om `window.location.pathname` inte börjar med `/tips/`. (`useAdSense` kan fortsätta laddas via `SeoArticleLayout` enbart.)

Dubbelkolla att inga andra sidor importerar `AdBanner` eller `useAdSense` — om så är fallet, ta bort dem.

## 3. Innehållsuppgradering — befintliga 7 artiklar

Skriv om var och en till **3000+ ord** med samma struktur, så de ser ut som riktiga guider:

- H1 + uppdaterat datum + lästid + författarrad ("Av Läxhjälp-redaktionen, senast uppdaterad…").
- Innehållsförteckning (TOC) med jump-länkar till H2:orna.
- 8–12 H2-sektioner med H3-undersektioner, exempel, listor, jämförelsetabeller och "tips/varning"-callouts.
- Konkreta exempel (ålder, ämne, scenario) — inte allmänna råd.
- Citat/källor till svenska myndigheter (Skolverket, BRIS, 1177) där relevant.
- **FAQ-sektion** (5–8 frågor) längst ner.
- **Related articles** (3) längst ner — redan stöds av `SeoArticleLayout`.
- Två illustrationer/bilder per artikel med beskrivande `alt` (genererade via imagegen).
- JSON-LD: `Article` + `FAQPage` + `BreadcrumbList` (utöka `SeoArticleLayout`).

Artiklar som ska skrivas om: `laxplanering`, `studieteknik-barn`, `laxstress`, `laxrutin`, `motivation-laxor`, `tonaringar-laxor`, `laxhjalp-hemma`.

## 4. Åtta nya pillar-artiklar (3000+ ord vardera)

Föreslagna slugs/teman (alla på svenska, högintents-frågor föräldrar söker):

1. `/tips/lasforstaelse-barn` — Träna läsförståelse hemma, åk 1–6.
2. `/tips/matematik-hjalp-barn` — Hjälpa barn med matte utan att ta över.
3. `/tips/engelska-glosor` — Effektiva glosförhör och spaced repetition för barn.
4. `/tips/skarmtid-och-laxor` — Skärmtid, koncentration och läxor.
5. `/tips/adhd-laxor` — Läxstrategier för barn med ADHD/koncentrationssvårigheter.
6. `/tips/laxor-arskurs-1-3` — Komplett guide för lågstadiet.
7. `/tips/laxor-arskurs-4-6` — Komplett guide för mellanstadiet.
8. `/tips/hogstadiet-studieteknik` — Studieteknik och planering för åk 7–9.

Varje artikel: ny route + sida som återanvänder `SeoArticleLayout`, läggs in i `TipsIndexPage` `ARTICLES`-listan och i sitemapen.

## 5. Strukturell SEO i `SeoArticleLayout`

Utöka layouten så alla artiklar automatiskt får:
- `BreadcrumbList` JSON-LD (Hem › Tips › Artikel).
- Stöd för `faqItems`-prop som genererar `FAQPage` JSON-LD + renderad FAQ-sektion.
- Synliga breadcrumbs överst.
- `lastUpdated`/`datePublished`-fält i `Article`-schema.
- Author-block ("Läxhjälp-redaktionen") med kort bio och länk till `/om-oss`.

## 6. `TipsIndexPage` & `/om-oss`

- Utöka `TipsIndexPage` med en kort introtext (200–300 ord) som förklarar vad guiderna är, vem som skriver dem och hur ofta de uppdateras.
- Lägg till en kategori-/ämnesgruppering (Planering, Studieteknik, Per åldersgrupp, Per ämne).
- `AboutPage` (`/om-oss`): utöka till ~800 ord med redaktionell process, författarinfo, kontakt — stärker E-E-A-T.

## 7. Efter implementation

Innan du re-submittar AdSense:
1. Publicera (frontend kräver publish, edge functions auto-deployer).
2. Vänta tills Google har crawlat om (1–7 dagar). Använd Search Console "URL Inspection" → "Request indexing" för alla `/tips/*`.
3. Begär ny AdSense-granskning från konsolen.

## Tekniska detaljer

```text
Filer som skapas:
  src/pages/seo/LasforstaelseBarnPage.tsx
  src/pages/seo/MatematikHjalpBarnPage.tsx
  src/pages/seo/EngelskaGlosorPage.tsx
  src/pages/seo/SkarmtidLaxorPage.tsx
  src/pages/seo/AdhdLaxorPage.tsx
  src/pages/seo/LaxorArskurs1_3Page.tsx
  src/pages/seo/LaxorArskurs4_6Page.tsx
  src/pages/seo/HogstadietStudieteknikPage.tsx
  src/assets/seo/*.jpg (illustrationer, 2 per artikel = 30 totalt)

Filer som ändras:
  public/robots.txt           — Disallow utility/app routes
  public/sitemap.xml          — ta bort utility-rader, lägg in nya artiklar + lastmod
  src/App.tsx                 — registrera 8 nya routes
  src/pages/seo/TipsIndexPage.tsx — utöka ARTICLES + intro + kategorier
  src/pages/AboutPage.tsx     — utöka till ~800 ord, redaktionell info
  src/components/SeoArticleLayout.tsx — BreadcrumbList, FAQPage JSON-LD, faqItems-prop, author block, breadcrumbs UI
  src/components/AdBanner.tsx — guard mot /tips/*
  Alla 7 befintliga /tips/*-sidor — utökas till 3000+ ord + FAQ + relaterade artiklar

Bilder: imagegen 'fast' modell, 1024x576, .jpg, ~30 stycken.
Inga DB- eller edge function-ändringar.
```

## Storlek & varning

Det här är en stor leverans (15 sidor med 3000+ ord vardera + 30 bilder + layout-uppdateringar). Räkna med att jag genererar det i flera batchar och att kreditkostnaden för bildgenereringen blir märkbar. Säg till om du vill att jag drar ner antingen ordmängden eller antalet nya artiklar för att hålla nere scope/kostnad.
