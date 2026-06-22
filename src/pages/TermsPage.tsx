import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Användarvillkor – Läxhjälp</title>
        <meta name="description" content="Användarvillkor för Läxhjälp – villkoren som gäller när din familj använder vår läx- och skolapp." />
        <link rel="canonical" href="https://laxhjalp.app/terms" />
        <meta property="og:title" content="Användarvillkor – Läxhjälp" />
        <meta property="og:description" content="Villkoren som gäller när din familj använder Läxhjälp." />
        <meta property="og:url" content="https://laxhjalp.app/terms" />
      </Helmet>
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link to="/landing">
            <Button variant="ghost" size="icon" aria-label="Tillbaka till startsidan">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">Användarvillkor</span>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 prose prose-sm dark:prose-invert max-w-none">
        <h1 className="text-2xl font-extrabold text-foreground">Användarvillkor</h1>
        <p className="text-muted-foreground text-sm">Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}</p>

        <h2>1. Om tjänsten</h2>
        <p>
          Läxhjälp ("tjänsten") är en webbapplikation för familjer att hantera barns läxor, 
          packlistor och skoluppgifter. Tjänsten tillhandahålls av Läxhjälp ("vi", "oss").
        </p>

        <h2>2. Konton</h2>
        <ul>
          <li>Du måste vara minst 18 år för att skapa ett föräldrakonto.</li>
          <li>Du ansvarar för att hålla dina inloggningsuppgifter säkra.</li>
          <li>Barnkonton skapas och hanteras av föräldern i familjen.</li>
          <li>Varje familj kan ha maximalt 6 medlemmar (gäller alla planer).</li>
          <li>Du ansvarar för all aktivitet som sker under ditt konto.</li>
        </ul>

        <h2>3. Gratis plan</h2>
        <p>
          Den kostnadsfria planen ger tillgång till alla funktioner med följande begränsning:
        </p>
        <ul>
          <li>Max 3 aktiva läxor per barn</li>
          <li>Max 6 familjemedlemmar</li>
          <li>Alla övriga funktioner ingår</li>
        </ul>

        <h2>4. Betald prenumeration</h2>
        <h3>4.1 Priser</h3>
        <ul>
          <li><strong>Månadsplan:</strong> 39 kr/månad</li>
          <li><strong>Årsplan:</strong> 399 kr/år</li>
        </ul>
        <p>Alla priser är inklusive moms. Vi förbehåller oss rätten att ändra priserna med 30 dagars varsel.</p>

        <h3>4.2 Betalning</h3>
        <p>
          Betalning sker via Stripe. Prenumerationen förnyas automatiskt vid periodens slut om du inte 
          avbryter den. Du debiteras vid starten av varje ny period.
        </p>

        <h3>4.3 Avbokning</h3>
        <ul>
          <li>Du kan avbryta din prenumeration när som helst via appen (Familjesidan → Hantera prenumeration).</li>
          <li>Vid avbokning behåller du tillgång till betalda funktioner fram till slutet av den aktuella perioden.</li>
          <li>Efter periodens slut övergår kontot till den kostnadsfria planen med max 3 läxor per barn.</li>
          <li>Ingen återbetalning ges för oanvänd tid inom en redan påbörjad period.</li>
        </ul>

        <h3>4.4 Ångerrätt</h3>
        <p>
          Enligt distansavtalslagen har du 14 dagars ångerrätt från köptillfället. 
          Om du har använt tjänsten under ångerperioden kan vi göra avdrag för den tid tjänsten använts.
          Kontakta oss för att utnyttja ångerrätten.
        </p>

        <h2>5. Användarens ansvar</h2>
        <p>Du förbinder dig att:</p>
        <ul>
          <li>Inte använda tjänsten för olagliga ändamål</li>
          <li>Inte försöka kringgå säkerhetsåtgärder eller begränsningar</li>
          <li>Inte skapa konton med falsk information</li>
          <li>Behandla andra användare med respekt</li>
        </ul>

        <h2>6. Immateriella rättigheter</h2>
        <p>
          Allt innehåll, design och kod i tjänsten tillhör Läxhjälp. 
          Du får inte kopiera, modifiera eller distribuera någon del av tjänsten utan skriftligt tillstånd.
          Det innehåll du skapar (läxor, anteckningar) tillhör dig.
        </p>

        <h2>7. Tillgänglighet och ändringar</h2>
        <ul>
          <li>Vi strävar efter att hålla tjänsten tillgänglig dygnet runt men garanterar inte 100% drifttid.</li>
          <li>Vi kan ändra, uppdatera eller avsluta funktioner med rimligt varsel.</li>
          <li>Planerade driftstopp meddelas i förväg när det är möjligt.</li>
        </ul>

        <h2>8. Ansvarsbegränsning</h2>
        <p>
          Tjänsten tillhandahålls "i befintligt skick". Vi ansvarar inte för:
        </p>
        <ul>
          <li>Förlust av data utöver vad som orsakats av vår grova oaktsamhet</li>
          <li>Indirekta skador, utebliven vinst eller följdskador</li>
          <li>Tredjepartstjänsters tillgänglighet (Stripe, etc.)</li>
        </ul>
        <p>
          Vårt totala ansvar är begränsat till det belopp du betalat för tjänsten under de senaste 12 månaderna.
        </p>

        <h2>9. Uppsägning</h2>
        <ul>
          <li>Du kan när som helst radera ditt konto, vilket permanent tar bort all din data.</li>
          <li>Vi kan stänga av eller avsluta konton som bryter mot dessa villkor.</li>
          <li>Vid uppsägning från vår sida ger vi rimligt varsel och eventuell återbetalning av förbetalda perioder.</li>
        </ul>

        <h2>10. Tvister och tillämplig lag</h2>
        <p>
          Dessa villkor regleras av svensk lag. Tvister avgörs i första hand genom Allmänna reklamationsnämnden (ARN) 
          eller svensk domstol.
        </p>

        <h2>11. Ändringar av villkoren</h2>
        <p>
          Vi kan uppdatera dessa villkor. Vid väsentliga ändringar meddelar vi dig minst 30 dagar i förväg. 
          Fortsatt användning efter ändring innebär att du godkänner de nya villkoren.
        </p>

        <h2>12. Kontakt</h2>
        <p>
          Frågor om dessa villkor? Kontakta oss på <strong>[din e-postadress]</strong>
        </p>

        <div className="mt-12 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Genom att använda Läxhjälp godkänner du dessa villkor.
          </p>
        </div>
      </main>
    </div>
  );
}
