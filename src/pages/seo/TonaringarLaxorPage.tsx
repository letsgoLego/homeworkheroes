import SeoArticleLayout from '@/components/SeoArticleLayout';

const related = [
  { path: '/tips/motivation-laxor', title: 'Så motiverar du ditt barn att göra läxor' },
  { path: '/tips/studieteknik-barn', title: 'Studieteknik för barn — 8 metoder som fungerar' },
  { path: '/tips/laxplanering', title: 'Läxplanering — 7 smarta tips för föräldrar och barn' },
];

export default function TonaringarLaxorPage() {
  return (
    <SeoArticleLayout
      title="Tonåringar och läxor — en guide för föräldrar"
      metaTitle="Tonåringar och läxor — guide för föräldrar"
      slug="tonaringar-laxor"
      metaDescription="Hur stöttar man en tonåring med läxor utan att det blir konflikt? Praktiska råd för föräldrar till 13-18-åringar."
      relatedArticles={related}
    >
      <p>
        Att hjälpa en tonåring med läxor kräver en helt annan approach än att hjälpa en
        sjuåring. Tonåringen vill ha autonomi men behöver fortfarande stöd. Här är en guide
        som balanserar de två.
      </p>

      <h2>Varför är det svårare med tonåringar?</h2>
      <p>
        Under tonåren sker enorma förändringar i hjärnan. Prefrontala cortex — den del som
        ansvarar för planering och impulskontroll — är inte fullt utvecklad förrän i 25-årsåldern.
        Dessutom driver tonåringens behov av självständighet dem att pusha bort förälderns
        inblandning.
      </p>

      <h2>Do's</h2>
      <ul>
        <li><strong>Fråga öppet:</strong> "Hur ligger du till med skolarbetet?" istället för "Har du gjort läxan?"</li>
        <li><strong>Erbjud hjälp:</strong> "Vill du att jag kollar igenom uppsatsen?" — utan att insistera</li>
        <li><strong>Respektera deras tid:</strong> Tonåringar har ett socialt liv som är viktigt för deras utveckling</li>
        <li><strong>Ge verktyg, inte regler:</strong> Visa dem planeringsappar som <strong>Läxhjälp</strong> och låt dem använda dem på sitt sätt</li>
        <li><strong>Var tillgänglig:</strong> Ibland behöver de bara veta att du finns där om de kör fast</li>
      </ul>

      <h2>Don'ts</h2>
      <ul>
        <li><strong>Tjata:</strong> Ju mer du tjatar, desto mer motstånd. En påminnelse räcker.</li>
        <li><strong>Jämföra:</strong> "Din kompis pluggar ju varje dag" förstör motivationen</li>
        <li><strong>Göra åt dem:</strong> Även om det går snabbare, lär de sig inget</li>
        <li><strong>Straffa:</strong> Att dra in skärmtid som straff för ogjorda läxor skapar en negativ spiral</li>
      </ul>

      <h2>Skapa strukturen — låt tonåringen fylla den</h2>
      <p>
        Tonåringar fungerar bäst med <em>val inom ramar</em>. Sätt upp gemensamma regler:
        "Läxorna ska vara klara innan du spelar online" — men låt dem välja exakt när och
        hur de gör dem.
      </p>

      <h2>Digitala verktyg de faktiskt vill använda</h2>
      <p>
        Tonåringar lever i sina mobiler. En app som låter dem snabbt logga och bocka av
        uppgifter — med emojis, snabbval och streaks — har mycket bättre chans att användas
        än en papperskalender. <strong>Läxhjälp</strong> är designad just för detta:
        snabbt, visuellt och anpassat för unga användare.
      </p>

      <h2>När det går snett</h2>
      <p>
        Om betygen sjunker kraftigt, tonåringen verkar nedstämd eller helt struntar i skolan,
        ta det på allvar. Boka ett möte med mentor och elevhälsan. Det kan handla om allt
        från mobbning till depression — saker som läxhjälp inte löser.
      </p>

      <h2>Sammanfattning</h2>
      <p>
        Med tonåringar gäller: ge ansvar, erbjud stöd och håll dig lugn. Ditt jobb har
        skiftat från att vara chef till att vara coach. Med rätt verktyg och en bra relation
        kan ni navigera läxåren tillsammans.
      </p>
    </SeoArticleLayout>
  );
}
