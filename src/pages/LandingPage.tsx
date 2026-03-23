import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, Calendar, CheckCircle2, Backpack, Users, 
  ArrowRight, Sparkles, Bell, BarChart3, ChevronDown,
  Plus, Flag, Repeat, Moon
} from 'lucide-react';
import heroFamily from '@/assets/hero-family.png';
import appMockup from '@/assets/app-mockup.png';
import featurePacklist from '@/assets/feature-packlist.png';
import featurePlanning from '@/assets/feature-planning.png';
import featureCelebrate from '@/assets/feature-celebrate.png';

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
                Gratis att använda
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
                <a href="#features">
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
                src={heroFamily}
                alt="Förälder och barn som pluggar tillsammans"
                width={500}
                height={500}
                className="w-full max-w-md drop-shadow-xl"
              />
              <img
                src={appMockup}
                alt="Homework Heroes app"
                width={200}
                height={250}
                className="absolute -right-4 bottom-4 w-40 sm:w-48 drop-shadow-2xl hidden sm:block"
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

      {/* ============ HOW IT WORKS ============ */}
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
              },
              {
                step: '2',
                icon: Calendar,
                title: 'Välj pluggdagar',
                desc: 'Fördela uppgifterna över veckans dagar. Se arbetsbelastningen per dag så du inte bokar för mycket.',
                color: 'bg-accent/10 text-accent',
              },
              {
                step: '3',
                icon: CheckCircle2,
                title: 'Bocka av & fira',
                desc: 'Varje avklarad uppgift firas med konfetti! Klara alla uppgifter för en hel läxa och det blir fest.',
                color: 'bg-success/10 text-success',
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                className="relative bg-card rounded-3xl p-8 shadow-card border border-border hover:shadow-elevated transition-shadow"
              >
                <div className="absolute -top-4 -left-2 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-extrabold shadow-md">
                  {item.step}
                </div>
                <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center mb-4`}>
                  <item.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
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
                  { icon: BookOpen, text: 'Se vilka läxor som är aktiva, avklarade eller försenade' },
                  { icon: BarChart3, text: 'Följ ditt barns streak och veckostatistik' },
                  { icon: Users, text: 'Hantera hela familjen – lägg till barn och föräldrar' },
                  { icon: Bell, text: 'Få påminnelser när deadlines närmar sig' },
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
                src={appMockup}
                alt="App-översikt med uppgifter och kalender"
                width={350}
                height={440}
                className="drop-shadow-2xl"
                loading="lazy"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ FEATURE DEEP DIVES (How-to) ============ */}
      <section id="guide" className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
              Allt du kan göra
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto">
              En komplett guide till alla funktioner i Homework Heroes
            </motion.p>
          </motion.div>

          {/* Feature 1: Lägg till läxor */}
          <FeatureBlock
            reverse={false}
            image={featurePlanning}
            imageAlt="Planera dina pluggdagar"
            badge={{ icon: Plus, label: 'Lägg till läxor', color: 'bg-primary/10 text-primary' }}
            title="Skapa läxor med alla detaljer"
            items={[
              { icon: BookOpen, title: 'Välj ämne', desc: 'Matte, svenska, NO, SO, engelska, bild, musik – alla ämnen finns.' },
              { icon: Flag, title: 'Inlämning eller förhör', desc: 'Markera vilken typ av läxa det är för tydligare planering.' },
              { icon: Calendar, title: 'Sätt deadline', desc: 'Välj inlämningsdatum och se det tydligt i veckovyn.' },
              { icon: Repeat, title: 'Återkommande läxor', desc: 'Perfekt för läsläxor eller veckologgar som upprepas.' },
            ]}
          />

          {/* Feature 2: Planera pluggdagar */}
          <FeatureBlock
            reverse={true}
            image={featureCelebrate}
            imageAlt="Fira avklarade uppgifter"
            badge={{ icon: Calendar, label: 'Smart planering', color: 'bg-accent/10 text-accent' }}
            title="Fördela arbetet över veckan"
            items={[
              { icon: Calendar, title: 'Välj dagar', desc: 'Klicka på dagar i kalendern för att lägga in pluggpass. Se hur många uppgifter du redan har varje dag.' },
              { icon: CheckCircle2, title: 'Snabbval', desc: 'Välj "Alla dagar", "Vardagar" eller "Varannan dag" med ett klick.' },
              { icon: Moon, title: 'Snooze', desc: 'Hinner du inte idag? Skjut upp till imorgon med ett svep.' },
              { icon: Sparkles, title: 'Extra uppgifter', desc: 'Lägg till bonusuppgifter för extra stjärnor och känsla av framgång.' },
            ]}
          />

          {/* Feature 3: Packlistor */}
          <FeatureBlock
            reverse={false}
            image={featurePacklist}
            imageAlt="Packlista för skolan"
            badge={{ icon: Backpack, label: 'Packlistor', color: 'bg-celebration/15 text-celebration-foreground' }}
            title="Glöm aldrig att packa rätt"
            items={[
              { icon: Backpack, title: 'Per läxa', desc: 'Lägg till saker att ta med kopplat till specifika läxor.' },
              { icon: Repeat, title: 'Återkommande saker', desc: 'Gympapåse på tisdagar? Flöjt på torsdagar? Ställ in det en gång.' },
              { icon: Bell, title: 'Smarta påminnelser', desc: 'Appen visar vad som behövs imorgon redan på eftermiddagen.' },
            ]}
          />

          {/* Feature 4: Statistik & streak */}
          <FeatureBlock
            reverse={true}
            image={heroFamily}
            imageAlt="Familj som pluggar tillsammans"
            badge={{ icon: BarChart3, label: 'Statistik', color: 'bg-success/10 text-success' }}
            title="Följ framstegen"
            items={[
              { icon: BarChart3, title: 'Veckostatistik', desc: 'Se hur många uppgifter och läxor som klarats av den här veckan.' },
              { icon: Sparkles, title: 'Streak', desc: 'Håll din streak vid liv genom att klara alla uppgifter varje dag.' },
              { icon: CheckCircle2, title: 'Completion rate', desc: 'Procent av avklarade uppgifter – en positiv motivator.' },
            ]}
          />
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="py-16 sm:py-24 bg-primary/5">
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">📚</span>
            <span className="font-bold text-foreground">Homework Heroes</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Homework Heroes. Gör läxläsning enklare.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ============ FEATURE BLOCK COMPONENT ============ */
interface FeatureItem {
  icon: typeof BookOpen;
  title: string;
  desc: string;
}

interface FeatureBlockProps {
  reverse: boolean;
  image: string;
  imageAlt: string;
  badge: { icon: typeof BookOpen; label: string; color: string };
  title: string;
  items: FeatureItem[];
}

function FeatureBlock({ reverse, image, imageAlt, badge, title, items }: FeatureBlockProps) {
  const BadgeIcon = badge.icon;
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={stagger}
      className={`grid lg:grid-cols-2 gap-10 items-center py-12 border-b border-border last:border-0 ${
        reverse ? 'lg:[direction:rtl]' : ''
      }`}
    >
      <div className={reverse ? 'lg:[direction:ltr]' : ''}>
        <motion.div variants={fadeUp} className={`inline-flex items-center gap-2 ${badge.color} px-3 py-1 rounded-full text-sm font-bold mb-3`}>
          <BadgeIcon className="w-4 h-4" />
          {badge.label}
        </motion.div>
        <motion.h3 variants={fadeUp} className="text-2xl sm:text-3xl font-extrabold text-foreground mb-6">
          {title}
        </motion.h3>
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
      <motion.div
        variants={fadeUp}
        className={`flex justify-center ${reverse ? 'lg:[direction:ltr]' : ''}`}
      >
        <img
          src={image}
          alt={imageAlt}
          width={360}
          height={360}
          className="w-full max-w-sm drop-shadow-lg"
          loading="lazy"
        />
      </motion.div>
    </motion.div>
  );
}
