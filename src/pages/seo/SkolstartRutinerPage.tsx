import SeoArticleLayout, { FaqItem } from '@/components/SeoArticleLayout';

const related = [
  { path: '/tips/terminsstart-checklista', title: 'Terminsstart: checklista för föräldrar' },
  { path: '/tips/laxrutin', title: 'Skapa en läxrutin som håller hela terminen' },
  { path: '/tips/skarmtid-och-laxor', title: 'Skärmtid och läxor — hitta en hållbar balans' },
];

const faqItems: FaqItem[] = [
  {
    question: 'Hur lång tid tar det att ställa om sovtiderna efter lovet?',
    answer:
      'Räkna med ungefär en dag per 15–20 minuter du behöver flytta. Ligger barnet två timmar efter behövs alltså cirka en vecka. Ljus på morgonen och samma väckningstid varje dag snabbar upp omställningen.',
  },
  {
    question: 'Hur mycket sömn behöver ett skolbarn?',
    answer:
      'Barn 6–12 år behöver ungefär 9–11 timmar och tonåringar 8–10 timmar per natt. Räkna baklänges från väckningstiden för att hitta läggtiden, och lägg till 20–30 minuter för insomning.',
  },
  {
    question: 'Vad gör vi när morgnarna alltid slutar i bråk?',
    answer:
      'Flytta så mycket som möjligt till kvällen (kläder, väska, matlåda), minska antalet beslut på morgonen och lägg in tio minuters marginal. Använd en visuell checklista så att barnet följer listan i stället för dina påminnelser.',
  },
  {
    question: 'Ska helgerna ha samma tider som vardagarna?',
    answer:
      'Nästan. Håll väckningstiden inom en timme från vardagens tid. Långa sovmorgnar på helgen ger samma effekt som en tidszonsförskjutning och gör måndagen betydligt tyngre.',
  },
];

export default function SkolstartRutinerPage() {
  return (
    <SeoArticleLayout
      title="Morgon- och sovrutiner efter lovet — så landar familjen mjukt"
      metaTitle="Skolstart: morgonrutiner & sovtider efter lovet | Läxhjälp"
      slug="skolstart-rutiner"
      metaDescription="Så ställer du om barnets sovtider efter lovet och bygger en morgonrutin som håller hela terminen. Konkret dag-för-dag-plan för föräldrar."
      datePublished="2026-08-23"
      dateModified="2026-08-23"
      readingTimeMin={7}
      relatedArticles={related}
      faqItems={faqItems}
    >
      <p>
        Efter ett lov med sena kvällar och långa morgnar är kroppens klocka förskjuten. Den
        första skolveckan blir därför ofta tyngre än den behöver vara — inte för att barnet är
        omotiverat, utan för att det är trött. Här är en plan för hur ni landar mjukt.
      </p>

      <h2>Börja med väckningstiden, inte läggtiden</h2>
      <p>
        Det är morgonljuset och uppvakningstiden som styr dygnsrytmen. Ett barn som väcks på
        skoltid blir naturligt sömnigt på skolans läggtid några dagar senare. Att bara skicka
        barnet till sängen tidigare fungerar sällan — då ligger det bara vaket.
      </p>

      <h2>En vecka innan: dag-för-dag-plan</h2>
      <ol>
        <li><strong>Dag 1–2:</strong> Väck 30 minuter tidigare än lovtiden, läggning 20 minuter tidigare</li>
        <li><strong>Dag 3–4:</strong> Ytterligare 30 minuter tidigare, ut i dagsljus första timmen</li>
        <li><strong>Dag 5–6:</strong> Skoltider fullt ut, testa hela morgonrutinen på klockan</li>
        <li><strong>Dag 7:</strong> Vanlig kväll, väskan packad, inga sena aktiviteter</li>
      </ol>

      <h2>Kvällsrutinen: samma ordning varje gång</h2>
      <p>
        Rutinens värde ligger i förutsägbarheten. Tre till fem fasta steg i samma ordning
        signalerar till hjärnan att dagen är slut.
      </p>
      <ul>
        <li>Packa väskan och lägg fram kläder</li>
        <li>Skärmar av 45–60 minuter före läggning, telefonen laddas utanför sovrummet</li>
        <li>Dusch eller tvätt, tänder</li>
        <li>Läsning eller högläsning 10–20 minuter</li>
        <li>Släckt vid samma tid — även när det protesteras</li>
      </ul>

      <h2>Morgonrutinen: minska antalet beslut</h2>
      <p>
        En stressig morgon är oftast en morgon med för många öppna frågor. Vad ska jag ha på
        mig? Var är gympapåsen? Vad blir frukost? Bestäm allt detta kvällen innan och låt
        morgonen bara vara utförande.
      </p>
      <ul>
        <li>Väck med marginal — tio minuter extra tar bort de flesta konflikter</li>
        <li>Frukost på samma plats vid samma tid, inga skärmar vid bordet</li>
        <li>En synlig checklista: kläder → frukost → tänder → väska → skor</li>
        <li>Väskan står vid dörren, packad sedan kvällen innan</li>
      </ul>
      <p>
        För barn som inte läser flytande fungerar en bild-checklista bättre än en skriven. Låt
        barnet bocka av själv — det flyttar ansvaret från din röst till listan.
      </p>

      <h2>Eftermiddagen sätter kvällen</h2>
      <p>
        Om läxorna hamnar efter 19.00 blir läggningen svår. Lägg läxtiden tidigt i
        eftermiddagen, efter mellanmål och en riktig paus, och håll den kort snarare än
        perfekt. En familjeplanerare som <strong>Läxhjälp</strong> visar barnet exakt vad som
        gäller idag, så att eftermiddagen inte går åt till att lista ut vad som ska göras.
      </p>

      <h2>Vanliga fällor</h2>
      <ul>
        <li><strong>Långa sovmorgnar på helgen</strong> — nollställer omställningen</li>
        <li><strong>Nya aktiviteter första veckan</strong> — skjut till vecka två</li>
        <li><strong>Telefonen i sovrummet</strong> — den enskilt största sömntjuven i högstadiet</li>
        <li><strong>För många ändringar samtidigt</strong> — ta sömnen först, resten sen</li>
      </ul>

      <h2>Om inget fungerar</h2>
      <p>
        Om barnet regelbundet inte kan somna, vaknar mitt i natten eller är utmattat på dagarna
        i flera veckor — prata med skolsköterskan eller vårdcentralen. Ihållande
        sömnsvårigheter är vanliga och behandlingsbara, och de brukar inte lösa sig av att man
        skärper rutinen ytterligare.
      </p>

      <h2>Sammanfattning</h2>
      <p>
        Flytta väckningstiden först, gå ut i dagsljus, håll kvällsrutinen identisk varje kväll
        och flytta morgonens beslut till kvällen. Ge det en vecka innan skolstart — då börjar
        terminen med ett utsövt barn i stället för en trött start.
      </p>
    </SeoArticleLayout>
  );
}
