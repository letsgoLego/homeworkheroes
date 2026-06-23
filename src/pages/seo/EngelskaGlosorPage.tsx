import SeoArticleLayout, { FaqItem } from '@/components/SeoArticleLayout';

const related = [
  { path: '/tips/studieteknik-barn', title: 'Studieteknik för barn — metoder som fungerar' },
  { path: '/tips/laxplanering', title: 'Läxplanering — 7 tips för en strukturerad vecka' },
  { path: '/tips/hogstadiet-studieteknik', title: 'Studieteknik för högstadiet — åk 7–9' },
];

const faqItems: FaqItem[] = [
  {
    question: 'Hur många glosor kan ett barn lära sig per vecka?',
    answer:
      'Realistiskt 15–25 glosor i mellanstadiet och 25–40 i högstadiet — om man tränar med rätt teknik. Mer än så fastnar inte långsiktigt, även om barnet klarar förhöret. Glosförhöret är inte målet; långtidsminnet är.',
  },
  {
    question: 'Är digitala glosappar bättre än papper?',
    answer:
      'Digitala appar med spaced repetition (Quizlet, Anki, Memrise) är överlägsna för repetition över tid eftersom de schemalägger nya förhör automatiskt. Papper är bättre för det första pluggpasset eftersom handskrift fördjupar inkodning. Kombinera båda.',
  },
  {
    question: 'Hur tränar man uttal när läraren inte har gått igenom det?',
    answer:
      'Använd Google Translate eller en uttalsapp som Forvo. Lyssna minst tre gånger och säg efter högt. På engelska räcker det med standardbrittiskt eller standardamerikanskt — bli inte besatt vid "rätt" varietet.',
  },
  {
    question: 'Min 4:a vill bara plugga 5 minuter åt gången — räcker det?',
    answer:
      'För 4:or räcker 5–10 minuter glosor per pass, men 3–4 pass spridda över veckan slår ett långt pass. Forskningen kallar det distribuerad inlärning, och effekten är dramatisk: dubbelt så mycket sitter kvar efter en vecka.',
  },
  {
    question: 'Måste glosor pluggas i båda riktningarna (sv→eng och eng→sv)?',
    answer:
      'Ja, om syftet är aktivt språkbruk. Eng→sv (känna igen) är lättare och tränar läsförståelse; sv→eng (producera) är svårare och tränar talad och skriven engelska. Förhöret är ofta i båda riktningar.',
  },
];

export default function EngelskaGlosorPage() {
  return (
    <SeoArticleLayout
      title="Engelska glosor — effektiv pluggteknik för barn"
      metaTitle="Engelska glosor — effektiv pluggteknik | Läxhjälp"
      slug="engelska-glosor"
      metaDescription="Vetenskapligt baserade tekniker för att lära in engelska glosor långsiktigt. Spaced repetition, appar, exempel per årskurs och vanliga föräldrafällor."
      relatedArticles={related}
      datePublished="2026-02-22"
      dateModified="2026-06-23"
      readingTimeMin={12}
      faqItems={faqItems}
    >
      <p>
        Engelska glosor är den vanligaste återkommande läxan i svensk grundskola — och en av de
        mest misshandlade. Många barn kämpar igenom listan kvällen innan, klarar förhöret, och har
        glömt halva listan en vecka senare. Tiden var bortkastad. Den här guiden visar hur du och
        ditt barn använder forskningsbaserade tekniker så glosorna faktiskt fastnar.
      </p>

      <h2>Den enskilt viktigaste principen: spaced repetition</h2>
      <p>
        Hjärnan glömmer snabbast i början och saktare över tid (Ebbinghaus glömskekurva, 1885 —
        fortfarande sann). Genom att repetera glosorna med ökande intervall — efter 1 dag, 3
        dagar, 7 dagar, 14 dagar — flyttas de från korttids- till långtidsminne. Pluggar man
        allt på en gång (cramming) klarar man förhöret men förlorar 80 % inom en vecka.
      </p>
      <p>
        Det här är inte en åsikt. Det är den mest replikerade fyndet inom inlärningspsykologi.
        Och det är gratis att tillämpa.
      </p>

      <h3>En enkel veckomall för spaced repetition</h3>
      <ul>
        <li><strong>Måndag (samma dag du fått listan):</strong> Läs igenom, säg högt, skriv var glosa en gång. 10 min.</li>
        <li><strong>Tisdag:</strong> Testa dig själv på alla glosor. Markera de du missar. 5 min.</li>
        <li><strong>Onsdag:</strong> Repetera bara de svåra. 5 min.</li>
        <li><strong>Torsdag:</strong> Testa hela listan igen. 5 min.</li>
        <li><strong>Fredag (förhör):</strong> Snabb genomkörning på morgonen. 3 min.</li>
        <li><strong>Veckan efter:</strong> Repetera samma lista en gång — det är där långtidsminnet skapas.</li>
      </ul>
      <p>
        Totalt: ~30 minuter utspritt på en vecka. Resultat: dubbelt så bra retention som ett pass
        på 30 minuter dagen innan.
      </p>

      <h2>Active recall slår passiv läsning</h2>
      <p>
        Det är frestande att "läsa igenom" listan flera gånger. Men hjärnan stärks bara av att
        försöka komma ihåg — inte av att titta på svaret. Det heter <em>active recall</em>.
      </p>
      <ul>
        <li>Täck över översättningen. Säg ordet högt. Kolla sedan.</li>
        <li>Skriv glosan ur minnet, inte av.</li>
        <li>Förhör varandra — som förälder kan du ställa orden i slumpmässig ordning.</li>
        <li>Använd appar som tvingar dig att skriva eller välja svar (Quizlet, Anki).</li>
      </ul>
      <p>
        Ett gammalt trick som funkar: <strong>flashcards</strong>. Glosa på framsidan, översättning
        på baksidan. Dela in i tre högar: "kan", "halvkan", "kan inte". Plugga bara de två sista
        högarna varje pass. Effektivt och visuellt.
      </p>

      <h2>Bygg in glosorna i meningar</h2>
      <p>
        En isolerad glosa är lätt att glömma. En glosa i en mening fastnar dubbelt så bra.
        Be barnet skriva eller säga en mening med varje nytt ord — gärna en personlig eller
        löjlig mening. Hjärnan minns det märkliga.
      </p>
      <ul>
        <li><em>"squirrel"</em> → "There is a squirrel in my hair." (Löjligt = minnesvärt.)</li>
        <li><em>"borrow"</em> → "Can I borrow your phone, mom?"</li>
        <li><em>"although"</em> → "I went outside although it was raining."</li>
      </ul>

      <h2>Uttal — viktigare än många tror</h2>
      <p>
        Om barnet bara läser glosorna tyst lär den sig stavning men inte uttal. När det dyker upp
        i samtal eller hörförståelse går det inte att koppla. Säg varje ord högt minst tre gånger
        i första pluggpasset.
      </p>
      <ul>
        <li>Google Translate har högtalarikon → klicka och imitera.</li>
        <li>Forvo.com har inspelningar från modersmålstalare för enskilda ord.</li>
        <li>YouTube har "pronunciation"-kanaler med vanliga svåra ord (delicious, vegetable, comfortable).</li>
      </ul>

      <h2>Appar som faktiskt fungerar</h2>
      <ul>
        <li><strong>Quizlet</strong> — enklast att komma igång med. Lärare lägger ofta in skolans lista. Spaced repetition i premiumversionen.</li>
        <li><strong>Anki</strong> — gratis, kraftfullt, hjärnvänligt. Brantare inlärningskurva. Bäst för högstadiet och uppåt.</li>
        <li><strong>Memrise</strong> — mer spelifierat, bra för yngre barn som tappar fokus.</li>
        <li><strong>Duolingo</strong> — för bredare engelskainlärning, inte glosförhör specifikt. Komplement, inte ersättning.</li>
      </ul>

      <h2>Vanliga föräldrafällor</h2>
      <ul>
        <li><strong>"Plugga ihop kvällen innan."</strong> Klarar förhöret, glömmer veckan efter. Ge upp på den strategin.</li>
        <li><strong>"Du måste kunna alla 25."</strong> Bättre att kunna 18 ordentligt än 25 halvdant. Prioritera djup.</li>
        <li><strong>"Sluta jobba med engelskan, du har klarat förhöret."</strong> Repetera samma ord 1 vecka och 1 månad senare. Då blir det permanent.</li>
        <li><strong>Att rätta uttal mitt i en mening.</strong> Det dödar talviljan. Notera, vänta, ta upp efteråt.</li>
      </ul>

      <h2>Per årskurs — vad som är rimligt</h2>
      <ul>
        <li><strong>Åk 3–4:</strong> 5–10 glosor/vecka. Fokus på konkreta saker (animals, food, colors). Stor andel högläsning.</li>
        <li><strong>Åk 5–6:</strong> 10–20 glosor/vecka. Verb och adjektiv börjar dominera. Skriv meningar.</li>
        <li><strong>Åk 7–9:</strong> 20–40 glosor/vecka. Abstrakta ord, sammansatta uttryck, oregelbundna verb. Inför spaced repetition på riktigt.</li>
      </ul>

      <h2>Hur Läxhjälp passar in</h2>
      <p>
        Lägg in glosförhöret som en "Förhör"-läxa med deadline samma vecka. Lägg sedan in
        återkommande "Repetera engelska glosor"-läxor på onsdag och söndag — det är där spaced
        repetition byggs in i vardagen utan att någon behöver komma ihåg. Streaks och konfetti
        i appen ger den lilla extra knuffen.
      </p>

      <h2>Sammanfattning</h2>
      <p>
        Engelska glosor lärs in bäst genom <strong>spaced repetition</strong> (korta pass spridda
        över veckan), <strong>active recall</strong> (att försöka komma ihåg, inte läsa), och
        <strong> meningar runt orden</strong>. Säg orden högt, använd en app som schemalägger
        repetitionen åt dig, och repetera även efter att förhöret är klart. Då sitter
        ordförrådet kvar — och det är hela poängen.
      </p>
    </SeoArticleLayout>
  );
}
