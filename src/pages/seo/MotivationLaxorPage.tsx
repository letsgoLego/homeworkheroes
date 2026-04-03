import SeoArticleLayout from '@/components/SeoArticleLayout';

const related = [
  { path: '/tips/laxstress', title: 'Läxstress hos barn — så minskar ni den tillsammans' },
  { path: '/tips/tonaringar-laxor', title: 'Tonåringar och läxor — guide för föräldrar' },
  { path: '/tips/laxrutin', title: 'Skapa en läxrutin som håller hela terminen' },
];

export default function MotivationLaxorPage() {
  return (
    <SeoArticleLayout
      title="Så motiverar du ditt barn att göra läxor — utan tjat"
      metaTitle="Motivera barn att göra läxor — utan tjat"
      metaDescription="Trött på att tjata om läxor? Här är forskningsbaserade strategier för att öka ditt barns motivation och skapa en positiv inställning till läxor."
      relatedArticles={related}
    >
      <p>
        "Har du gjort läxan?" — en fråga som många föräldrar ställer varje dag, ofta med samma
        trötta svar: "Snart!" eller "Jag har ingen läxa." Motivationsbrist kring läxor är ett
        av de vanligaste problemen i svenska familjer. Men det finns bättre sätt än att tjata.
      </p>

      <h2>Förstå varför barnet inte vill</h2>
      <p>
        Brist på motivation har ofta en underliggande orsak:
      </p>
      <ul>
        <li><strong>Uppgiften känns för svår</strong> — barnet vet inte var det ska börja</li>
        <li><strong>Uppgiften känns meningslös</strong> — "Varför ska jag kunna detta?"</li>
        <li><strong>Andra saker är roligare</strong> — skärmar, kompisar, lek</li>
        <li><strong>Trötthet</strong> — en lång skoldag har tömt energin</li>
      </ul>

      <h2>6 strategier som fungerar</h2>

      <h3>1. Koppla läxan till verkligheten</h3>
      <p>
        "Varför ska jag kunna bråk?" Visa hur bråk används när man bakar eller delar pizza.
        Barn som förstår <em>varför</em> de lär sig något blir mer motiverade.
      </p>

      <h3>2. Ge valmöjligheter</h3>
      <p>
        "Vill du börja med matte eller engelska?" Att få välja ger barnet en känsla av autonomi
        — en av de starkaste drivkrafterna för motivation enligt self-determination theory.
      </p>

      <h3>3. Gör det visuellt</h3>
      <p>
        Barn älskar att se sina framsteg. En streak-räknare som visar "5 dagar i rad!" eller
        en progressbar som fylls upp ger en känsla av prestation. I <strong>Homework Heroes</strong>
        får barnet konfetti och emojis varje gång de bockar av en uppgift.
      </p>

      <h3>4. Korta pass, inte maraton</h3>
      <p>
        Hellre 15 minuter med fullt fokus än 45 minuter av utdraget motstånd. Använd en timer
        och lägg in mikropauser. "Bara 15 minuter" är en tröskel de flesta barn kan acceptera.
      </p>

      <h3>5. Beröm processen</h3>
      <p>
        "Vad bra att du satte dig och pluggade, även om det var svårt!" Beröm ansträngningen,
        inte resultatet. Det bygger ett <em>growth mindset</em> och minskar prestationsångesten.
      </p>

      <h3>6. Var en förebild</h3>
      <p>
        Sitt med och gör ditt eget "arbete" under läxtiden — betala räkningar, läs en bok,
        planera veckan. Barn som ser sina föräldrar arbeta fokuserat imiterar beteendet.
      </p>

      <h2>Vad gör man med den som vägrar?</h2>
      <p>
        Om inget fungerar, ta ett steg tillbaka. Lägg ner tjatet i en vecka och observera.
        Prata med läraren. Ibland handlar det om att uppgifterna inte matchar barnets nivå,
        eller att det finns sociala problem i skolan som påverkar.
      </p>

      <h2>Sammanfattning</h2>
      <p>
        Motivation kommer inifrån, men vi kan skapa rätt förutsättningar. Ge barnet valmöjligheter,
        gör framstegen synliga och beröm ansträngningen. Med tålamod och rätt verktyg kan läxor
        bli något barnet klarar av — kanske till och med tycker är okej.
      </p>
    </SeoArticleLayout>
  );
}
