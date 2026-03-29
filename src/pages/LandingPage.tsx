import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, Calendar, CheckCircle2, Backpack, Users, 
  ArrowRight, Sparkles, Bell, BarChart3, ChevronDown,
  Plus, Flag, Repeat, Moon, Smartphone, UserPlus, Eye,
  Clock, Star, Zap, Heart, Shield, Crown
} from 'lucide-react';
import screenshotToday from '@/assets/screenshot-today.png';
import screenshotAdd from '@/assets/screenshot-add.png';
import screenshotWeek from '@/assets/screenshot-week.png';
import screenshotFamily from '@/assets/screenshot-family.png';
import screenshotCelebrate from '@/assets/screenshot-celebrate.png';
import screenshotPacklist from '@/assets/screenshot-packlist.png';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation bar */}
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <span className="text-xl font-extrabold text-foreground">Homework Heroes</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="font-semibold">
                Logga in
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="font-bold shadow-glow-primary">
                Kom igång gratis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ============ HERO SECTION ============ */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="text-center lg:text-left"
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-celebration/15 text-celebration-foreground px-4 py-1.5 rounded-full text-sm font-bold mb-6">
                <Sparkles className="w-4 h-4 text-celebration" />
                Gratis att komma igång
              </motion.div>
              <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6">
                Läxläsning som{' '}
                <span className="text-primary">hela familjen</span>{' '}
                har koll på
              </motion.h1>
              <motion.p variants={fadeUp} className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0">
                Hjälp ditt barn planera, prioritera och klara sina läxor – medan du som förälder får full insyn och kan stötta på riktigt.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link to="/auth">
                  <Button size="lg" className="w-full sm:w-auto h-14 text-lg font-bold shadow-glow-primary px-8">
                    Skapa konto gratis
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <a href="#how-to">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 text-lg font-semibold px-8">
                    Se hur det fungerar
                    <ChevronDown className="w-5 h-5 ml-2" />
                  </Button>
                </a>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative flex justify-center"
            >
              <img
                src={screenshotToday}
                alt="Homework Heroes dagvy med uppgifter"
                width={320}
                height={568}
                className="w-64 sm:w-72 rounded-[2rem] shadow-elevated"
              />
              <img
                src={screenshotCelebrate}
                alt="Fira avklarade uppgifter"
                width={200}
                height={355}
                className="absolute -right-2 sm:-right-8 bottom-0 w-44 sm:w-52 rounded-[2rem] shadow-elevated hidden sm:block"
                loading="lazy"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ TRUST BAR ============ */}
      <section className="py-8 bg-primary/5 border-y border-primary/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { icon: '📖', label: 'Alla ämnen', desc: 'Matte, svenska, NO...' },
              { icon: '👨‍👩‍👧‍👦', label: 'Hela familjen', desc: 'Föräldrar & barn' },
              { icon: '🎉', label: 'Belöningar', desc: 'Konfetti & stjärnor' },
              { icon: '🔔', label: 'Påminnelser', desc: 'Glöm aldrig en läxa' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1">
                <span className="text-2xl">{item.icon}</span>
                <span className="font-bold text-sm text-foreground">{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS (3 steps) ============ */}
      <section id="features" className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
              Så funkar det
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tre enkla steg till organiserad läxläsning
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                step: '1',
                icon: Plus,
                title: 'Lägg till läxan',
                desc: 'Välj ämne, typ (inlämning eller förhör), deadline och vad som ska tas med till skolan.',
                color: 'bg-primary/10 text-primary',
                image: screenshotAdd,
              },
              {
                step: '2',
                icon: Calendar,
                title: 'Planera veckan',
                desc: 'Fördela uppgifterna över veckans dagar. Se arbetsbelastningen per dag så du inte bokar för mycket.',
                color: 'bg-accent/10 text-accent',
                image: screenshotWeek,
              },
              {
                step: '3',
                icon: CheckCircle2,
                title: 'Bocka av & fira',
                desc: 'Varje avklarad uppgift firas med konfetti! Klara alla uppgifter och streaken växer.',
                color: 'bg-success/10 text-success',
                image: screenshotCelebrate,
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                className="relative bg-card rounded-3xl p-6 shadow-card border border-border hover:shadow-elevated transition-shadow"
              >
                <div className="absolute -top-4 -left-2 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-extrabold shadow-md">
                  {item.step}
                </div>
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-48 object-cover object-top rounded-2xl mb-4"
                  loading="lazy"
                />
                <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center mb-3`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============ FOR PARENTS SECTION ============ */}
      <section className="py-16 sm:py-24 bg-primary/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full text-sm font-bold text-primary mb-4">
                <Users className="w-4 h-4" />
                För föräldrar
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold text-foreground mb-6">
                Ha koll utan att tjata
              </motion.h2>
              <motion.div variants={stagger} className="space-y-4">
                {[
                  { icon: Eye, text: 'Se vilka läxor som är aktiva, avklarade eller försenade' },
                  { icon: BarChart3, text: 'Följ ditt barns streak och veckostatistik' },
                  { icon: Users, text: 'Hantera hela familjen – lägg till barn och föräldrar' },
                  { icon: Bell, text: 'Få påminnelser när deadlines närmar sig' },
                  { icon: Shield, text: 'Kontrollera roller – bestäm vem som är förälder eller barn' },
                ].map((item) => (
                  <motion.div key={item.text} variants={fadeUp} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-foreground font-medium pt-2">{item.text}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex justify-center"
            >
              <img
                src={screenshotFamily}
                alt="Familjevy med medlemmar och statistik"
                width={320}
                height={568}
                className="w-64 sm:w-72 rounded-[2rem] shadow-elevated"
                loading="lazy"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ HOW-TO GUIDE (Step by step features) ============ */}
      <section id="how-to" className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
              Steg-för-steg guide 📖
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Lär dig allt du kan göra i Homework Heroes
            </motion.p>
          </motion.div>

          {/* Guide 1: Skapa konto & familj */}
          <HowToStep
            stepNumber={1}
            title="Skapa konto & sätt upp din familj"
            description="Registrera dig som förälder, skapa en familj och bjud in resten. Barn kan logga in med eget barnkonto."
            items={[
              { icon: UserPlus, title: 'Skapa konto', desc: 'Registrera dig med e-post och lösenord. Det tar under en minut.' },
              { icon: Users, title: 'Skapa familj', desc: 'Ge din familj ett namn. Du får en unik inbjudningskod att dela.' },
              { icon: Heart, title: 'Bjud in familjen', desc: 'Dela koden så att partners och barn kan gå med i familjen.' },
              { icon: Shield, title: 'Tilldela roller', desc: 'Bestäm vem som är förälder (full kontroll) och vem som är barn (ser sina egna läxor).' },
            ]}
          />

          {/* Guide 2: Lägg till läxor */}
          <HowToStep
            stepNumber={2}
            title="Lägg till en läxa"
            description="Skapa en läxa med alla detaljer som behövs för att planera pluggandet."
            image={screenshotAdd}
            imageAlt="Lägg till läxa-formulär"
            reverse
            items={[
              { icon: BookOpen, title: 'Välj ämne', desc: 'Matte, svenska, NO, SO, engelska, bild, musik – alla ämnen finns med tydliga färgkodade ikoner.' },
              { icon: Flag, title: 'Typ av läxa', desc: 'Markera om det är en inlämning eller ett förhör. Det syns direkt på kortet.' },
              { icon: Calendar, title: 'Sätt deadline', desc: 'Välj när läxan ska vara klar. Appen visar automatiskt hur många dagar som är kvar.' },
              { icon: Backpack, title: 'Saker att ta med', desc: 'Lägg till vad som behöver packas – räknare, bok, gympapåse – allt visas i packlistan.' },
              { icon: Repeat, title: 'Återkommande läxor', desc: 'Läsläxor eller veckologgar? Ställ in vilka dagar de ska upprepas automatiskt.' },
            ]}
          />

          {/* Guide 3: Planera pluggdagar */}
          <HowToStep
            stepNumber={3}
            title="Planera dina pluggdagar"
            description="Fördela arbetet smart över veckan – se direkt om en dag blir för fullpackad."
            image={screenshotWeek}
            imageAlt="Veckoöversikt med uppgifter"
            items={[
              { icon: Calendar, title: 'Välj dagar', desc: 'Klicka på dagarna i kalendern för att lägga in pluggpass. Varje dag visar hur många uppgifter du redan har.' },
              { icon: Zap, title: 'Snabbval', desc: 'Använd "Alla dagar", "Vardagar" eller "Varannan dag" för att snabbt fördela arbetet.' },
              { icon: Moon, title: 'Snooze', desc: 'Hinner du inte idag? Svep för att skjuta upp uppgiften till imorgon.' },
              { icon: Clock, title: 'Överblick', desc: 'Veckovyn visar alla läxor och uppgifter sorterade per dag – perfekt för att planera framåt.' },
            ]}
          />

          {/* Guide 4: Packlistor */}
          <HowToStep
            stepNumber={4}
            title="Packlistor – glöm aldrig att packa"
            description="Appen samlar ihop allt som ska med till skolan och visar det tydligt."
            image={screenshotPacklist}
            imageAlt="Packlista med saker att ta med"
            reverse
            items={[
              { icon: Backpack, title: 'Per läxa', desc: 'Saker kopplade till specifika läxor visas automatiskt den dag de behövs.' },
              { icon: Repeat, title: 'Återkommande saker', desc: 'Gympapåse på tisdagar? Flöjt på torsdagar? Ställ in det en gång och glöm det.' },
              { icon: Bell, title: 'Daglig lista', desc: 'Varje morgon ser du exakt vad som ska med i ryggsäcken.' },
            ]}
          />

          {/* Guide 5: Extra uppgifter */}
          <HowToStep
            stepNumber={5}
            title="Extra uppgifter – gör det lilla extra"
            description="Lägg till bonusuppgifter utöver läxorna för att visa engagemang."
            items={[
              { icon: Star, title: 'Bonusuppgifter', desc: 'Skapa frivilliga uppgifter som "Läs 15 minuter extra" eller "Öva glosor". Firas med stjärnor!' },
              { icon: Sparkles, title: 'Stjärnregn', desc: 'När du klarar en extra uppgift regnar det guldstjärnor – motivation som fungerar.' },
              { icon: BarChart3, title: 'Räknas i statistiken', desc: 'Extra uppgifter ökar din veckostatistik och visar att du gör mer än vad som krävs.' },
            ]}
          />

          {/* Guide 6: Fira framgång */}
          <HowToStep
            stepNumber={6}
            title="Fira varje framgång"
            description="Positiv förstärkning gör att pluggandet känns bra – inte som ett måste."
            image={screenshotCelebrate}
            imageAlt="Firande med konfetti och trofé"
            reverse
            items={[
              { icon: Sparkles, title: 'Konfetti', desc: 'Varje avklarad uppgift belönas med en konfettiexplosion. Det är omöjligt att inte le!' },
              { icon: BarChart3, title: 'Streak', desc: 'Klara alla uppgifter en dag och din streak ökar. Hur lång kan du göra den?' },
              { icon: Repeat, title: 'Öva mer', desc: 'Kan du inte allt? Välj "Öva mer" och schemalägg repetition med smart mellanrum.' },
            ]}
          />

          {/* Guide 7: Familjehantering */}
          <HowToStep
            stepNumber={7}
            title="Hantera familjen"
            description="Som förälder har du full kontroll. Barn ser bara sin egen information."
            image={screenshotFamily}
            imageAlt="Familjevy med medlemmar"
            items={[
              { icon: Users, title: 'Familjemedlemmar', desc: 'Se alla som är med i familjen. Tilldela roller och koppla barn till rätt profil.' },
              { icon: Shield, title: 'Roller', desc: 'Föräldrar ser allt och kan hantera. Barn ser bara sina egna läxor och uppgifter.' },
              { icon: Smartphone, title: 'Barnkonto', desc: 'Barn loggar in med eget användarnamn eller e-post – enkelt och säkert.' },
              { icon: Bell, title: 'Påminnelser', desc: 'Ställ in notiser för nya läxor, deadlines och ogjorda uppgifter.' },
            ]}
          />
        </div>
      </section>

      {/* ============ PRICING SECTION ============ */}
      <section id="pricing" className="py-16 sm:py-24 bg-primary/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
              Välj din plan
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Kom igång gratis – uppgradera när du behöver mer
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-6 items-stretch"
          >
            {/* Free plan */}
            <motion.div variants={fadeUp} className="bg-card rounded-3xl p-6 border border-border shadow-card flex flex-col">
              <h3 className="text-xl font-bold text-foreground mb-1">Gratis</h3>
              <p className="text-3xl font-extrabold mb-1">0 kr</p>
              <p className="text-sm text-muted-foreground mb-6">Perfekt för att testa</p>
              <ul className="space-y-3 flex-1 mb-6">
                {['Max 3 aktiva läxor/barn', 'Alla ämnen & läxtyper', 'Packlistor', 'Streaks & konfetti', 'Familjemedlemmar (max 6)'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                    {f}
                  </li>
                ))}
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  Innehåller annonser
                </li>
              </ul>
              <Link to="/auth">
                <Button variant="outline" className="w-full font-bold">
                  Kom igång gratis
                </Button>
              </Link>
            </motion.div>

            {/* Monthly plan */}
            <motion.div variants={fadeUp} className="bg-card rounded-3xl p-6 border border-border shadow-card flex flex-col">
              <h3 className="text-xl font-bold text-foreground mb-1">Månadsplan</h3>
              <p className="text-3xl font-extrabold mb-1">39 kr<span className="text-base font-normal text-muted-foreground">/mån</span></p>
              <p className="text-sm text-muted-foreground mb-6">Flexibelt, avsluta när du vill</p>
              <ul className="space-y-3 flex-1 mb-6">
                {['Obegränsat antal läxor', 'Alla ämnen & läxtyper', 'Packlistor & påminnelser', 'Streaks & konfetti', 'Familjemedlemmar (max 6)'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                    {f}
                  </li>
                ))}
                <li className="flex items-center gap-2 text-sm font-medium">
                  <Shield className="w-4 h-4 text-success flex-shrink-0" />
                  Inga annonser
                </li>
              </ul>
              <Link to="/auth">
                <Button variant="outline" className="w-full font-bold">
                  Välj månadsplan
                </Button>
              </Link>
            </motion.div>

            {/* Yearly plan - HIGHLIGHTED */}
            <motion.div variants={fadeUp} className="relative bg-card rounded-3xl p-6 border-2 border-primary shadow-elevated flex flex-col ring-2 ring-primary/20">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-celebration text-celebration-foreground text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap">
                <Sparkles className="w-3.5 h-3.5" />
                Bäst värde – spara 2 månader!
              </div>
              <h3 className="text-xl font-bold text-primary mb-1 mt-2">Årsplan</h3>
              <p className="text-3xl font-extrabold mb-1">399 kr<span className="text-base font-normal text-muted-foreground">/år</span></p>
              <p className="text-sm text-muted-foreground mb-6">Bara ~33 kr/mån</p>
              <ul className="space-y-3 flex-1 mb-6">
                {['Obegränsat antal läxor', 'Alla ämnen & läxtyper', 'Packlistor & påminnelser', 'Streaks & konfetti', 'Familjemedlemmar (max 6)'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
                <li className="flex items-center gap-2 text-sm font-medium">
                  <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                  Inga annonser
                </li>
                <li className="flex items-center gap-2 text-sm font-bold text-primary">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  Bäst pris – spara 69 kr
                </li>
              </ul>
              <Link to="/auth">
                <Button className="w-full font-bold shadow-glow-primary">
                  <Crown className="w-4 h-4 mr-2" />
                  Välj årsplan
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
              Redo att ta kontroll över läxorna?
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Skapa ett gratis konto på under en minut. Bjud in hela familjen och börja planera redan idag.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Link to="/auth">
                <Button size="lg" className="h-14 text-lg font-bold shadow-glow-primary px-10">
                  Kom igång gratis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">📚</span>
            <span className="font-bold text-foreground">Homework Heroes</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
              Integritetspolicy
            </Link>
            <span className="text-border">·</span>
            <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
              Användarvillkor
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Homework Heroes. Gör läxläsning enklare.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ============ HOW-TO STEP COMPONENT ============ */
interface HowToItem {
  icon: typeof BookOpen;
  title: string;
  desc: string;
}

interface HowToStepProps {
  stepNumber: number;
  title: string;
  description: string;
  items: HowToItem[];
  image?: string;
  imageAlt?: string;
  reverse?: boolean;
}

function HowToStep({ stepNumber, title, description, items, image, imageAlt, reverse }: HowToStepProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={stagger}
      className={`grid ${image ? 'lg:grid-cols-2' : 'lg:grid-cols-1 max-w-3xl mx-auto'} gap-10 items-center py-12 border-b border-border last:border-0 ${
        reverse ? 'lg:[direction:rtl]' : ''
      }`}
    >
      <div className={reverse ? 'lg:[direction:ltr]' : ''}>
        <motion.div variants={fadeUp} className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-extrabold shadow-md">
            {stepNumber}
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground">{title}</h3>
        </motion.div>
        <motion.p variants={fadeUp} className="text-muted-foreground mb-6">{description}</motion.p>
        <motion.div variants={stagger} className="space-y-4">
          {items.map((item) => (
            <motion.div key={item.title} variants={fadeUp} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <item.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-foreground">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
      {image && (
        <motion.div
          variants={fadeUp}
          className={`flex justify-center ${reverse ? 'lg:[direction:ltr]' : ''}`}
        >
          <img
            src={image}
            alt={imageAlt || title}
            width={320}
            height={568}
            className="w-56 sm:w-64 rounded-[2rem] shadow-elevated"
            loading="lazy"
          />
        </motion.div>
      )}
    </motion.div>
  );
}
