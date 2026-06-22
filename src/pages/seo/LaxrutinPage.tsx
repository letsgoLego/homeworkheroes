import SeoArticleLayout from '@/components/SeoArticleLayout';

const related = [
  { path: '/tips/laxplanering', title: 'Läxplanering — 7 smarta tips för föräldrar och barn' },
  { path: '/tips/laxstress', title: 'Läxstress hos barn — så minskar ni den tillsammans' },
  { path: '/tips/laxhjalp-hemma', title: 'Läxhjälp hemma — den kompletta guiden' },
];

export default function LaxrutinPage() {
  return (
    <SeoArticleLayout
      title="Skapa en läxrutin som håller hela terminen"
      metaTitle="Skapa en läxrutin som håller hela terminen"
      slug="laxrutin"
      metaDescription="Lär dig bygga en hållbar läxrutin för ditt barn. Steg-för-steg-guide med konkreta tips för varje ålder."
      relatedArticles={related}
    >
      <p>
        En bra rutin är grunden för stressfria läxor. Men hur skapar man en rutin som faktiskt
        håller, inte bara de första två veckorna? Här är en guide som fungerar från lågstadiet
        till gymnasiet.
      </p>

      <h2>Varför behövs en rutin?</h2>
      <p>
        Utan rutin blir varje läxstund en förhandling. "Ska jag göra det nu eller sen?" leder
        till uppskjutning och stress. En fast rutin tar bort beslutsfattandet och gör läxor
        till en naturlig del av dagen — som att borsta tänderna.
      </p>

      <h2>Steg 1: Kartlägg veckan</h2>
      <p>
        Skriv ner alla fasta aktiviteter: skoltider, fritidsaktiviteter, träningar. Se vilka
        luckor som finns. Det är i dessa luckor läxtiden ska in.
      </p>

      <h2>Steg 2: Välj en fast tid</h2>
      <p>
        De flesta barn fungerar bäst med läxor direkt efter en paus — till exempel 30 minuter
        efter hemkomst. Tonåringar kanske föredrar efter middagen. Nyckeln är att <em>samma
        tid gäller varje dag</em>.
      </p>
      <ul>
        <li><strong>Lågstadiet (6–9 år):</strong> 15–30 min, direkt efter mellanmål</li>
        <li><strong>Mellanstadiet (10–12 år):</strong> 30–45 min, efter en kort paus</li>
        <li><strong>Högstadiet (13–15 år):</strong> 45–90 min, flexibel men fast tid</li>
        <li><strong>Gymnasiet (16–18 år):</strong> 1–2 timmar, eget ansvar med check-in</li>
      </ul>

      <h2>Steg 3: Skapa en "läxstation"</h2>
      <p>
        En fast plats signalerar till hjärnan att det är dags att jobba. Det behöver inte vara
        ett eget skrivbord — köksbordet fungerar utmärkt, så länge det är samma plats varje gång
        och fritt från distraktioner.
      </p>

      <h2>Steg 4: Börja med det svåraste</h2>
      <p>
        Forskning visar att vår koncentrationsförmåga är som bäst i början av ett arbetspass.
        Uppmuntra barnet att ta det tyngsta ämnet först, när energin fortfarande är hög.
      </p>

      <h2>Steg 5: Använd digitalt stöd</h2>
      <p>
        En familjeplanerare som <strong>Läxhjälp</strong> gör det enkelt att se vad som
        ska göras varje dag, bocka av uppgifter och hålla motivationen uppe med streaks och
        belöningar. Både föräldrar och barn ser samma vy.
      </p>

      <h2>Steg 6: Utvärdera efter två veckor</h2>
      <p>
        Ingen rutin är perfekt från dag ett. Sätt er ner efter 14 dagar och prata: Vad fungerar?
        Vad behöver justeras? Kanske behöver läxtiden flyttas 30 minuter, eller pauserna förlängas.
      </p>

      <h2>Vanliga misstag att undvika</h2>
      <ul>
        <li>Att byta rutin varje vecka — ge det tid</li>
        <li>Att göra läxorna åt barnet — stötta, men låt barnet arbeta</li>
        <li>Att ha skärmar nära under läxtiden</li>
        <li>Att strunta i pauser — hjärnan behöver vila</li>
      </ul>

      <h2>Sammanfattning</h2>
      <p>
        En bra läxrutin bygger på förutsägbarhet, en tydlig plats och rätt längd för barnets
        ålder. Börja enkelt, utvärdera regelbundet och använd digitala verktyg för att göra
        det roligt och överskådligt.
      </p>
    </SeoArticleLayout>
  );
}
