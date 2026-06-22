import SeoArticleLayout from '@/components/SeoArticleLayout';

const related = [
  { path: '/tips/laxrutin', title: 'Skapa en läxrutin som håller hela terminen' },
  { path: '/tips/studieteknik-barn', title: 'Studieteknik för barn — 8 metoder som fungerar' },
  { path: '/tips/motivation-laxor', title: 'Så motiverar du ditt barn att göra läxor' },
];

export default function LaxhjalpHemmaPage() {
  return (
    <SeoArticleLayout
      title="Läxhjälp hemma — den kompletta guiden för föräldrar"
      metaTitle="Läxhjälp hemma — komplett guide för föräldrar"
      slug="laxhjalp-hemma"
      metaDescription="Allt du behöver veta om att hjälpa ditt barn med läxor hemma. Från rätt miljö till effektiva strategier för alla åldrar."
      relatedArticles={related}
    >
      <p>
        Att hjälpa sitt barn med läxor är en av de vanligaste och ibland mest frustrerande
        uppgifterna som förälder. Hur mycket ska man hjälpa? Vad gör man när man inte kan
        ämnet? Hur undviker man konflikter? Den här guiden ger dig svaren.
      </p>

      <h2>Förälderns roll — coach, inte lärare</h2>
      <p>
        Ditt jobb är inte att undervisa (det gör skolan), utan att skapa rätt förutsättningar
        för att barnet ska kunna lära sig. Tänk på dig själv som en coach: du motiverar,
        strukturerar och stöttar — men det är barnet som gör jobbet.
      </p>

      <h2>Skapa rätt miljö</h2>
      <ul>
        <li><strong>Lugn plats:</strong> Bort från TV och syskon som leker</li>
        <li><strong>Rätt material:</strong> Pennor, suddgummi, linjal tillgängligt</li>
        <li><strong>Mellanmål först:</strong> Ett hungrigt barn kan inte koncentrera sig</li>
        <li><strong>Mobilen bort:</strong> Eller i flygplansläge under läxtiden</li>
      </ul>

      <h2>Åldersanpassad hjälp</h2>

      <h3>Lågstadiet (6–9 år)</h3>
      <p>
        Sitt med under hela läxpasset. Läs instruktionerna högt. Hjälp barnet att förstå
        vad uppgiften frågar efter. Berömmer varje ansträngning.
      </p>

      <h3>Mellanstadiet (10–12 år)</h3>
      <p>
        Var i närheten men sitt inte bredvid. Låt barnet börja själv och kom tillbaka efter
        10 minuter för att se hur det går. Hjälp med att planera, inte med att lösa uppgifterna.
      </p>

      <h3>Högstadiet och uppåt (13+ år)</h3>
      <p>
        Erbjud dig att hjälpa men insistera inte. Fokusera på struktur: "Har du en plan
        för uppsatsen?" istället för att skriva den åt dem. Använd verktyg som
        <strong> Läxhjälp</strong> för att ge överblick utan att behöva fråga varje dag.
      </p>

      <h2>Vad gör man när man inte kan ämnet?</h2>
      <ul>
        <li>Googla tillsammans — visa att det är okej att inte kunna allt</li>
        <li>Använd gratisresurser: Studi.se, Khan Academy, YouTube-tutorials</li>
        <li>Kontakta läraren — de vill veta om läxorna är för svåra</li>
        <li>Läxhjälp på biblioteket — många kommuner erbjuder gratis läxhjälp</li>
      </ul>

      <h2>Undvik dessa vanliga fällor</h2>
      <ol>
        <li><strong>Göra läxan åt barnet</strong> — det ger ett snabbt resultat men ingen inlärning</li>
        <li><strong>Bli arg</strong> — om du blir frustrerad, ta en paus och kom tillbaka</li>
        <li><strong>Jämföra med andra barn</strong> — varje barn har sin egen takt</li>
        <li><strong>Ha för höga förväntningar</strong> — perfektion är inte målet, inlärning är</li>
      </ol>

      <h2>Digitala hjälpmedel</h2>
      <p>
        En familjeplaneringsapp gör det enklare för alla i familjen att ha koll. Med
        <strong> Läxhjälp</strong> kan barnet själv lägga till läxor med snabbval,
        se sin veckoplanering och bocka av uppgifter — medan föräldrarna har överblick
        utan att behöva fråga "Har du läxor idag?"
      </p>

      <h2>Sammanfattning</h2>
      <p>
        Bra läxhjälp handlar mindre om att kunna ämnet och mer om att skapa rätt miljö,
        struktur och attityd. Var en stöttande coach, anpassa hjälpen efter barnets ålder
        och kom ihåg: det viktigaste är inte att läxan blir perfekt, utan att barnet lär sig
        att ta ansvar för sitt eget lärande.
      </p>
    </SeoArticleLayout>
  );
}
