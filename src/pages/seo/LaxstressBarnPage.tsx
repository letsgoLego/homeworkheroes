import SeoArticleLayout from '@/components/SeoArticleLayout';

const related = [
  { path: '/tips/laxplanering', title: 'Läxplanering — 7 smarta tips för föräldrar och barn' },
  { path: '/tips/motivation-laxor', title: 'Så motiverar du ditt barn att göra läxor' },
  { path: '/tips/studieteknik-barn', title: 'Studieteknik för barn — 8 metoder som fungerar' },
];

export default function LaxstressBarnPage() {
  return (
    <SeoArticleLayout
      title="Läxstress hos barn — så minskar ni den tillsammans"
      metaTitle="Läxstress hos barn — så minskar ni den"
      slug="laxstress"
      metaDescription="Känner ditt barn stress över läxor? Här är konkreta strategier för att minska läxångesten och skapa en lugnare vardag."
      relatedArticles={related}
    >
      <p>
        Allt fler barn upplever stress kopplad till skolan och läxor. Enligt en undersökning
        från Barnombudsmannen känner nästan vart tredje barn i mellanstadiet press över skolarbetet.
        Men det finns mycket ni kan göra hemma för att minska stressen.
      </p>

      <h2>Varför blir läxor stressiga?</h2>
      <ul>
        <li><strong>Brist på överblick</strong> — barnet vet inte vad som ska göras eller när</li>
        <li><strong>För stora uppgifter</strong> — ett helt kapitel känns oöverstigligt</li>
        <li><strong>Tidsbrist</strong> — aktiviteter, kompisar och skärmtid konkurrerar</li>
        <li><strong>Prestationsångest</strong> — rädsla för att göra fel</li>
        <li><strong>Konflikter hemma</strong> — läxor blir en maktkamp mellan förälder och barn</li>
      </ul>

      <h2>5 strategier som minskar läxstressen</h2>

      <h3>1. Ge barnet kontroll</h3>
      <p>
        Låt barnet välja <em>när</em> under dagen läxorna görs. Känslan av kontroll minskar
        stress avsevärt. Ert jobb som förälder är att sätta ramarna, inte styra varje minut.
      </p>

      <h3>2. Dela upp i små bitar</h3>
      <p>
        "Plugga matte" är vagt och skrämmande. "Gör uppgift 1–5 på sidan 42" är konkret och
        hanterbart. En app som <strong>Läxhjälp</strong> hjälper barnet att bryta ner
        läxor i dagliga studieuppgifter automatiskt.
      </p>

      <h3>3. Normalisera misstag</h3>
      <p>
        Prata om att misstag är en del av lärandet. Berätta om egna missar i skolan. Skapa
        en kultur hemma där det är okej att inte kunna allt direkt.
      </p>

      <h3>4. Skapa förutsägbarhet</h3>
      <p>
        En tydlig rutin med samma tid och plats varje dag minskar den mentala belastningen.
        Barnet slipper fundera på om och när läxorna ska göras — det bara händer.
      </p>

      <h3>5. Prata med skolan</h3>
      <p>
        Om stressen är ihållande, ta kontakt med läraren. Ibland handlar det om att barnet
        behöver anpassningar eller att arbetsbelastningen är ojämn.
      </p>

      <h2>När ska man söka hjälp?</h2>
      <p>
        Om ditt barn har magont, svårt att sova, eller vägrar gå till skolan på grund av
        läxstress, kontakta elevhälsan eller BUP. Läxstress kan vara ett symtom på något
        underliggande som behöver professionell hjälp.
      </p>

      <h2>Sammanfattning</h2>
      <p>
        Läxstress är vanligt men går att hantera. Nyckeln är att ge barnet verktyg för att
        planera, dela upp arbetet i hanterbara delar och skapa en trygg miljö där det är
        okej att inte vara perfekt.
      </p>
    </SeoArticleLayout>
  );
}
