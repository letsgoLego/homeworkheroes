import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Integritetspolicy – Läxhjälp</title>
        <meta name="description" content="Läs Läxhjälp integritetspolicy. Så hanterar vi familjers personuppgifter enligt GDPR i vår läxapp." />
        <link rel="canonical" href="https://laxhjalp.app/privacy" />
        <meta property="og:title" content="Integritetspolicy – Läxhjälp" />
        <meta property="og:description" content="Så hanterar Läxhjälp personuppgifter enligt GDPR." />
        <meta property="og:url" content="https://laxhjalp.app/privacy" />
      </Helmet>
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link to="/landing">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">Integritetspolicy</span>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 prose prose-sm dark:prose-invert max-w-none">
        <h1 className="text-2xl font-extrabold text-foreground">Integritetspolicy</h1>
        <p className="text-muted-foreground text-sm">Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}</p>

        <h2>1. Personuppgiftsansvarig</h2>
        <p>
          Läxhjälp ("vi", "oss", "vår") är personuppgiftsansvarig för behandlingen av dina personuppgifter.
          Kontakta oss på: <strong>[din e-postadress]</strong>
        </p>

        <h2>2. Vilka uppgifter samlar vi in?</h2>
        <ul>
          <li><strong>Kontouppgifter:</strong> E-postadress, lösenord (krypterat), namn</li>
          <li><strong>Familjedata:</strong> Familjenamn, barnens namn och användarnamn</li>
          <li><strong>Läxdata:</strong> Ämnen, beskrivningar, datum, status</li>
          <li><strong>Betalningsuppgifter:</strong> Hanteras av Stripe – vi lagrar aldrig kortnummer</li>
          <li><strong>Teknisk data:</strong> IP-adress, webbläsartyp, enhetsinformation (via cookies)</li>
        </ul>

        <h2>3. Varför behandlar vi dina uppgifter?</h2>
        <table>
          <thead>
            <tr>
              <th>Ändamål</th>
              <th>Laglig grund</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Tillhandahålla tjänsten (konto, läxor, familj)</td>
              <td>Avtal</td>
            </tr>
            <tr>
              <td>Hantera betalningar och prenumerationer</td>
              <td>Avtal</td>
            </tr>
            <tr>
              <td>Skicka notifikationer (push, påminnelser)</td>
              <td>Samtycke</td>
            </tr>
            <tr>
              <td>Förbättra tjänsten (analys, felsökning)</td>
              <td>Berättigat intresse</td>
            </tr>
          </tbody>
        </table>

        <h2>4. Personuppgiftsbiträden</h2>
        <p>Vi delar dina uppgifter med följande tjänsteleverantörer som behandlar data på våra vägnar:</p>
        <ul>
          <li><strong>Supabase (Hosting & databas):</strong> EU-baserade servrar</li>
          <li><strong>Stripe (Betalningar):</strong> PCI DSS-certifierad betalhantering</li>
          <li><strong>Lovable (Plattform):</strong> Hosting av applikationen</li>
        </ul>

        <h2>5. Cookies</h2>
        <p>Vi använder följande typer av cookies:</p>
        <ul>
          <li><strong>Nödvändiga cookies:</strong> Inloggningssession, säkerhetstokens – krävs för att appen ska fungera</li>
          <li><strong>Funktionella cookies:</strong> Sparar dina preferenser (t.ex. cookie-samtycke)</li>
          <li><strong>Tredjepartscookies:</strong> Stripe (betalhantering) – sätts endast efter samtycke</li>
        </ul>
        <p>Du kan hantera dina cookie-inställningar genom att rensa webbläsardata eller avvisa icke-nödvändiga cookies via vår cookie-banner.</p>

        <h2>6. Hur länge sparar vi dina uppgifter?</h2>
        <ul>
          <li><strong>Kontodata:</strong> Så länge kontot är aktivt, plus 30 dagar efter radering</li>
          <li><strong>Läxdata:</strong> Automatisk rensning av avslutade läxor efter 90 dagar</li>
          <li><strong>Betalningshistorik:</strong> Enligt bokföringskrav, minst 7 år</li>
        </ul>

        <h2>7. Dina rättigheter</h2>
        <p>Enligt GDPR har du rätt att:</p>
        <ul>
          <li><strong>Få tillgång</strong> till dina personuppgifter</li>
          <li><strong>Rätta</strong> felaktiga uppgifter</li>
          <li><strong>Radera</strong> ditt konto och alla tillhörande data</li>
          <li><strong>Exportera</strong> dina uppgifter (dataportabilitet)</li>
          <li><strong>Invända</strong> mot behandling baserad på berättigat intresse</li>
          <li><strong>Återkalla samtycke</strong> för notifikationer och icke-nödvändiga cookies</li>
        </ul>
        <p>
          Kontakta oss på <strong>[din e-postadress]</strong> för att utöva dina rättigheter. Vi svarar inom 30 dagar.
        </p>

        <h2>8. Barns personuppgifter</h2>
        <p>
          Vår tjänst är utformad för familjer. Barnkonton skapas av föräldrar och innehåller begränsad data 
          (namn och användarnamn). Barn under 13 år behöver föräldrarnas samtycke. 
          Föräldrar kan när som helst radera barnkonton och tillhörande data.
        </p>

        <h2>9. Säkerhet</h2>
        <p>
          Vi skyddar dina uppgifter med kryptering (TLS/SSL), säker autentisering, 
          och begränsad åtkomst. Lösenord lagras med bcrypt-hashning och vi lagrar aldrig betalkortsinformation.
        </p>

        <h2>10. Ändringar i policyn</h2>
        <p>
          Vi kan uppdatera denna policy. Vid väsentliga ändringar meddelar vi dig via e-post eller i appen. 
          Senaste versionen finns alltid tillgänglig på denna sida.
        </p>

        <h2>11. Klagomål</h2>
        <p>
          Om du inte är nöjd med vår hantering av dina personuppgifter kan du lämna klagomål till 
          Integritetsskyddsmyndigheten (IMY): <a href="https://www.imy.se" target="_blank" rel="noopener noreferrer" className="text-primary">www.imy.se</a>
        </p>

        <div className="mt-12 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Har du frågor? Kontakta oss på <strong>[din e-postadress]</strong>
          </p>
        </div>
      </main>
    </div>
  );
}
