# SEO steg 2 – bygga vidare på oktoberpaketet

## Läget nu (Search Console 28 sep–25 okt 2026, Semrush okt 2026)
- 12 klick, 835 visningar, snittplacering 13. Startsidan är indexerad och genomsöktes 28 okt.
- **Tipssidan (/tips)** syns mest: 449 visningar på plats ca 10, men **0 klick**. Störst och snabbast vinst.
- **Fungerar redan:** Läxor åk 1–3 (plats 7, 7 klick), åk 4–6 (plats 5,5), Läxplanering (plats 8).
- **Nära sida 1 men 0 klick:** ADHD och läxor (plats 9), Studieteknik högstadiet (plats 6,5).
- **Långt ner trots efterfrågan:** Lära sig klockan (plats 44–48, "lära barn klockan" ca 140 sök/mån), Skolstart/packlista (plats 49–88, "skolsaker" ca 170/mån), "läxförhör" (plats 78, ca 90/mån).
- "Läxloggen" (260/mån) rankas med startsidan, inte den nya guiden.

## Vad vi gör

1. **Få fler att klicka på sidorna som redan syns**
   - Ny rubrik och beskrivning i sökresultaten för /tips, ADHD och läxor, Studieteknik högstadiet och Läxhjälp hemma – tydligt löfte, årtal 2026, konkret nytta.
   - Kort svar överst på tipssidan så att den matchar vad folk söker ("hjälp med läxor").

2. **Lyfta guiderna som ligger långt ner**
   - Lära sig klockan: fördjupa med steg-för-steg per ålder, övningar att skriva ut och vanliga frågor.
   - Skolstart/packlista: komplett lista per årskurs, koppla till appens packlista.
   - Ny guide **Läxförhör** (glosor, engelska, hur man förhör hemma) – kopplad till Pluggcoachen.

3. **Starkare länkar mellan sidorna**
   - Varje guide länkar till 2–3 närliggande guider och till Läxloggen-guiden med rätt ordval, så att Google förstår vilken sida som gäller "läxloggen".
   - Lyfta AI-pluggcoachen i guiderna som naturlig nästa steg.

4. **Länkar från andra sajter (pågår parallellt)**
   - Mejlen till AutismKompetens, adhdsystern.se och Familjepsykiatri, med ADHD-guiden som landningssida.

5. **Mäta**
   - Ny avstämning i Search Console ca 3–4 veckor efter publicering.

Du behöver publicera när ändringarna är klara.

## Tekniska detaljer
- Uppdatera per-sida-metadata (react-helmet) i berörda sidor under `src/pages/seo/` och tipsindex; titlar ≤ 60 tecken, beskrivningar ≤ 155.
- Ny sida `src/pages/seo/LaxforhorPage.tsx` med `SeoArticleLayout`, FAQ-schema, route, sitemap.xml och llms.txt.
- Fördjupa `LaraSigKlockan`- och `SkolmaterialPacklista`-sidorna; behåll befintliga URL:er.
- Komponent eller block för "Läs också" med interna länkar.
- AdSense oförändrat begränsat till /tips/*.
