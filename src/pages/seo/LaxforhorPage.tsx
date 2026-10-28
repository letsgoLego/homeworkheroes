import { Link } from 'react-router-dom';
import SeoArticleLayout, { FaqItem } from '@/components/SeoArticleLayout';

const related = [
  { path: '/tips/engelska-glosor', title: 'Engelska glosor — effektiv pluggteknik för barn' },
  { path: '/tips/studieteknik-barn', title: 'Studieteknik för barn — metoder som fungerar' },
  { path: '/tips/laxloggen', title: 'Läxloggen — så skapar ni en som funkar' },
];

const faqItems: FaqItem[] = [
  {
    question: 'Hur ofta ska man förhöra barnet inför ett läxförhör?',
    answer:
      'Två till fyra korta förhör spridda över veckan fungerar bättre än ett långt kvällen innan. Ett första förhör dagen efter att läxan delats ut, ett mitt i veckan och ett kort dagen före räcker för de flesta läxförhör.',
  },
  {
    question: 'Ska jag förhöra muntligt eller skriftligt?',
    answer:
      'Gör som läraren gör på förhöret. Är det ett skriftligt glosförhör, låt barnet skriva minst en gång. Muntliga förhör passar bra i bilen eller vid middagen och ger snabb repetition.',
  },
  {
    question: 'Vad gör jag när barnet inte kan något alls?',
    answer:
      'Förhör inte än — gå tillbaka till förståelsen. Läs eller gå igenom avsnittet tillsammans, och förhör först nästa dag. Förhör fungerar när barnet har något att plocka fram ur minnet.',
  },
  {
    question: 'Mitt barn blir stressat av förhör hemma. Vad gör jag?',
    answer:
      'Gör det kort och lekfullt: låt barnet förhöra dig ibland, använd kort eller ett spel och sluta när det går bra. Fokusera på hur många ord som sitter i dag jämfört med i går, inte på felen.',
  },
];

export default function LaxforhorPage() {
  return (
    <SeoArticleLayout
      title="Läxförhör hemma — så förhör du barnet rätt"
      metaTitle="Läxförhör hemma: så förhör du barnet rätt (2026)"
      slug="laxforhor"
      metaDescription="Så förhör du barnet inför läxförhöret: glosor, engelska och SO/NO. Hur ofta, hur länge och vad du gör när det inte sitter — enkel guide för föräldrar."
      relatedArticles={related}
      toolParagraph="I Läxhjälp kan du prata in eller fota läxan, så föreslår Pluggcoachen några lagom långa pass på ca 20 minuter fram till förhöret — Förstå, Träna och Repetera — utlagda på dagar då barnet har tid."
      datePublished="2026-10-28"
      dateModified="2026-10-28"
      readingTimeMin={7}
      faqItems={faqItems}
    >
      <p>
        Läxförhöret är en av de vanligaste läxorna i grundskolan: glosor på engelska, ord på
        svenska, begrepp i SO och NO. Det bästa du kan göra hemma är inte att läsa igenom
        materialet med barnet en gång till — utan att <strong>förhöra</strong>. Att plocka fram
        svaret ur minnet är det som får kunskapen att fastna.
      </p>

      <h2>Varför förhör fungerar bättre än att läsa igen</h2>
      <p>
        När barnet läser samma lista igen känns den bekant, och det är lätt att tro att den sitter.
        När barnet måste svara utan att titta märks direkt vad som inte sitter. Varje gång barnet
        lyckas plocka fram ett ord blir minnet starkare. Det är därför tre korta förhör under
        veckan slår en lång kväll med läsning.
      </p>

      <h2>En enkel veckoplan inför läxförhöret</h2>
      <ol>
        <li><strong>Dag 1 – Förstå:</strong> gå igenom orden eller texten. Säg orden högt och se till att barnet förstår vad de betyder.</li>
        <li><strong>Dag 2–3 – Träna:</strong> korta förhör, ca 10–20 minuter. Lägg orden som inte satt i en egen hög.</li>
        <li><strong>Dagen före – Repetera:</strong> ett kort förhör på allt, och lite extra på högen med svåra ord.</li>
      </ol>
      <p>
        Lägg passen på dagar när det finns tid — inte samma kväll som fotbollsträningen. Läs mer i
        guiden om <Link to="/tips/laxplanering">läxplanering</Link>.
      </p>

      <h2>Glosförhör och engelska</h2>
      <ul>
        <li>Förhör i båda riktningarna: först engelska → svenska, sedan svenska → engelska.</li>
        <li>Låt barnet skriva orden minst en gång om förhöret är skriftligt — stavningen behöver tränas för sig.</li>
        <li>Säg orden högt, så tränas uttalet samtidigt.</li>
        <li>Fler tips finns i guiden om <Link to="/tips/engelska-glosor">engelska glosor</Link>.</li>
      </ul>

      <h2>Förhör i SO och NO</h2>
      <ul>
        <li>Ställ frågor med egna ord: ”Varför har vi årstider?” i stället för att läsa upp en mening.</li>
        <li>Låt barnet förklara för dig som om du inte kunde något. Det som är svårt att förklara behöver tränas mer.</li>
        <li>Gör egna frågekort med fråga på ena sidan och svar på andra.</li>
      </ul>

      <h2>Hur länge och hur ofta?</h2>
      <p>
        I lågstadiet räcker 5–10 minuter per förhör. I mellan- och högstadiet fungerar pass på ca
        20 minuter bra. Två till fyra pass under veckan räcker för de flesta läxförhör. Sluta medan
        det går bra — då är det lättare att komma igång nästa gång.
      </p>

      <h2>Vanliga misstag</h2>
      <ul>
        <li><strong>Allt pluggas kvällen innan.</strong> Det kan räcka till förhöret, men glöms snabbt.</li>
        <li><strong>Föräldern läser, barnet lyssnar.</strong> Byt roller: barnet ska svara.</li>
        <li><strong>För mycket på en gång.</strong> Dela upp listan och ta de svåra orden flera gånger.</li>
        <li><strong>Fokus på fel.</strong> Räkna hur många som sitter — och se siffran växa.</li>
      </ul>

      <h2>Sammanfattning</h2>
      <p>
        Förhör i stället för att läsa igen, sprid ut två till fyra korta pass under veckan och lägg
        extra tid på det som inte sitter. Då blir läxförhöret lugnare för både barnet och dig. Vill
        du ha hela familjens läxor samlade, se guiden om <Link to="/tips/laxloggen">läxloggen</Link>.
      </p>
    </SeoArticleLayout>
  );
}
