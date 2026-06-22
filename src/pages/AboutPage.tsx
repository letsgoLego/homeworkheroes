import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Mail, Heart, Shield, Users, BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function AboutPage() {
  useEffect(() => {
    document.title = 'Om oss | Läxhjälp';
    const setMeta = (name: string, content: string, attr = 'name') => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };
    setMeta('description', 'Om Läxhjälp – appen som hjälper svenska familjer att planera läxor, minska stress och fira framgång tillsammans.');
    setMeta('og:title', 'Om Läxhjälp', 'property');
    setMeta('og:type', 'website', 'property');
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📚</span>
              <span className="font-bold text-foreground">Läxhjälp</span>
            </div>
          </Link>
          <Link to="/auth">
            <Button size="sm" className="rounded-full font-bold">Kom igång</Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold mb-4">
            <Heart className="w-4 h-4" />
            Om oss
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground mb-6">
            Vi vill göra läxläsning enklare för hela familjen
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            Läxhjälp är skapat av föräldrar som själva kämpat med kaoset kring läxor – glömda inlämningar, stressiga söndagskvällar och tjat som ingen mår bra av. Vi visste att det måste finnas ett bättre sätt.
          </p>

          <div className="prose prose-base dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground">
            <h2>Vår vision</h2>
            <p>
              Vi tror att läxläsning kan vara en positiv del av familjens vardag – något som bygger självförtroende, samarbete och goda vanor. Med rätt verktyg kan barn lära sig att planera, prioritera och ta ansvar för sitt skolarbete på ett sätt som följer med dem hela livet.
            </p>

            <h2>Vad vi gör</h2>
            <p>
              Läxhjälp är en svenskutvecklad app som hjälper familjer att:
            </p>
            <ul>
              <li><strong>Planera läxor</strong> tillsammans, vecka för vecka</li>
              <li><strong>Fördela arbetsbelastningen</strong> så ingen dag blir för full</li>
              <li><strong>Hålla koll på packlistor</strong> och vad som ska med till skolan</li>
              <li><strong>Fira framgångar</strong> med konfetti, streaks och belöningar</li>
              <li><strong>Stötta varandra</strong> – föräldrar får insyn, barn får självständighet</li>
            </ul>

            <h2>Våra värderingar</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-6 mb-10">
            {[
              { icon: Heart, title: 'Familjevänligt', desc: 'Designat för att fungera för både föräldrar och barn – tillsammans.' },
              { icon: Shield, title: 'Trygg & säker', desc: 'GDPR-anpassad och utvecklad i Sverige. Din data tillhör dig.' },
              { icon: Sparkles, title: 'Positiv förstärkning', desc: 'Vi firar små segrar och bygger glädje runt skolarbete.' },
              { icon: BookOpen, title: 'Pedagogisk grund', desc: 'Inspirerat av studieteknik och beprövade lärandemetoder.' },
            ].map((v) => (
              <div key={v.title} className="p-5 rounded-2xl bg-card border border-border">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <v.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-1">{v.title}</h3>
                <p className="text-sm text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>

          <div className="prose prose-base dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground">
            <h2>Kontakta oss</h2>
            <p>
              Har du frågor, feedback eller vill samarbeta? Vi älskar att höra från våra användare.
            </p>
          </div>

          <div className="mt-4 p-6 rounded-2xl bg-card border border-border flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-1">E-post</h3>
              <a href="mailto:hello@laxhjalp.app" className="text-primary font-semibold hover:underline">
                hello@laxhjalp.app
              </a>
              <p className="text-sm text-muted-foreground mt-1">
                Vi svarar normalt inom 1–2 arbetsdagar.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 p-8 rounded-3xl bg-primary/10 border border-primary/20 text-center">
            <Users className="w-10 h-10 text-primary mx-auto mb-3" />
            <h2 className="text-2xl font-extrabold text-foreground mb-3">
              Bli en del av Läxhjälp
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Tusentals svenska familjer använder redan appen. Skapa ditt gratis konto och prova själv.
            </p>
            <Link to="/auth">
              <Button size="lg" className="rounded-full gap-2 font-bold shadow-glow-primary">
                Skapa konto gratis <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-border py-8 mt-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <Link to="/landing" className="hover:text-primary transition-colors">← Tillbaka till startsidan</Link>
          <div className="flex gap-4">
            <Link to="/tips" className="hover:text-primary transition-colors">Tips</Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">Integritetspolicy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Villkor</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
