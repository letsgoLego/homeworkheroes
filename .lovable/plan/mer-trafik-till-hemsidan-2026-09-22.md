# Mer trafik till hemsidan

Hemsidan får idag 20–30 besökare per vecka och tappar de flesta besökare direkt (hög avvisningsfrekvens). Artiklarna på /tips börjar synas i Google (t.ex. "läxor åskurs 1-3" på plats ~6), men det finns två saker som snabbast ökar trafiken: en ny artikel på ett stort sökord utan konkurrens, och att fixa de sökfel vi redan hittat.

## 1. Ny guide: "Lära barnet klockan" (/tips/lara-sig-klockan)

Sökkontroll: **"lära sig klockan" – 720 sökningar/mån i Sverige, låg konkurrens (svårighet 19/100)**. Motsvarande guider är en av de största trafikkällorna för konkurrenter som Allakando, och temat passar appen (skolstöd för yngre barn).

- Praktisk steg-för-steg-guide för föräldrar till barn 5–8 år (~2000 ord): förberedelser, analog vs digital klocka, övningar per vecka, vanliga hinder.
- Samma struktur som övriga guider (SeoArticleLayout): rubrik, brödsmulor, Article-schema, författarpresentation, FAQ.
- Ett avsnitt om verktyget + "Kom igång gratis"-CTA, korslänkning till/från närliggande guider (t.ex. skolmaterial, läxrutin, läxor åskurs 1-3).
- Registreras i `src/lib/tipsArticles.ts`, ny route i `App.tsx`, nytt i `public/sitemap.xml` och `public/llms.txt`, länk från tipsindex-sidan.

## 2. Fixa sökfelen vi redan hittat

- **/landing titel för lång** – kortas till under 60 tecken, unik mot startsidan.
- **Samma og:title på / och /landing** – landningssidan får egen og:title.
- **Knappar utan namn för skärmläsare** (kryssrutan "klar" på uppgiftskort + plus-knappen i menyn) – får aria-label; ingen synlig förändring.

## 3. Lyft de guider som är närmast första sidan

- "Läxor åskurs 1-3" (plats ~6,4) och "Läxplanering" (plats ~5,75) får en snabb genomgång: tydligare inledning som svarar på sökfrågan direkt och interna länkar till den nya klockan-guiden, så länkkraften sprids.

## Teknik

- Ny fil `src/pages/seo/LaraSigKlockanPage.tsx` enligt `SeoArticleLayout`; artikelmetadata i `src/lib/tipsArticles.ts`.
- Mindre justeringar i `LandingPage.tsx` (titel/og:title), `TaskCard.tsx`, `Navigation.tsx` (aria-labels).
- Inga databasändringar. `npx tsgo --noEmit` efteråt.

Trafiken syns i Google först 1–4 veckor efter nästa publicering.
