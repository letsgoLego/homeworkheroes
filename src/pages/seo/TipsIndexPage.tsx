import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, Calendar, Brain, Heart, Sparkles, Users, Home, GraduationCap, Languages, Calculator, Smartphone, Zap, BookText, Award } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';

interface Article {
  path: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  category: string;
}

const ARTICLES: Article[] = [
  // Planering & rutiner
  { path: '/tips/laxplanering', title: 'Läxplanering: 7 tips för en strukturerad vecka', description: 'Lär dig hur du planerar veckans läxor smart så att stressen minskar och inget glöms bort.', icon: Calendar, color: 'bg-primary/10 text-primary', category: 'Planering' },
  { path: '/tips/laxrutin', title: 'Skapa en läxrutin som håller hela terminen', description: 'Steg-för-steg-guide för att bygga en hållbar läxrutin som passar familjens vardag.', icon: BookOpen, color: 'bg-success/10 text-success', category: 'Rutiner' },

  // Studieteknik
  { path: '/tips/studieteknik-barn', title: 'Studieteknik för barn – metoder som faktiskt fungerar', description: 'Beprövade studietekniker anpassade för barn i grundskolan, från lågstadiet till högstadiet.', icon: Brain, color: 'bg-accent/10 text-accent', category: 'Studieteknik' },
  { path: '/tips/hogstadiet-studieteknik', title: 'Studieteknik för högstadiet (åk 7–9)', description: 'Active recall, spaced repetition och planering inför nationella prov.', icon: Award, color: 'bg-indigo-500/10 text-indigo-500', category: 'Studieteknik' },

  // Per ämne
  { path: '/tips/lasforstaelse-barn', title: 'Läsförståelse hos barn (åk 1–6)', description: 'Träna läsförståelse hemma med 7 enkla övningar och tips på böcker per åldersgrupp.', icon: BookText, color: 'bg-emerald-500/10 text-emerald-600', category: 'Per ämne' },
  { path: '/tips/matematik-hjalp-barn', title: 'Hjälpa barn med matte — utan att ta över', description: 'Strategier per årskurs för matteläxor, vanliga föräldrafällor och verktyg som hjälper.', icon: Calculator, color: 'bg-orange-500/10 text-orange-500', category: 'Per ämne' },
  { path: '/tips/engelska-glosor', title: 'Engelska glosor — effektiv pluggteknik', description: 'Spaced repetition, appar och tekniker som gör att glosorna faktiskt fastnar.', icon: Languages, color: 'bg-cyan-500/10 text-cyan-600', category: 'Per ämne' },

  // Per åldersgrupp
  { path: '/tips/laxor-arskurs-1-3', title: 'Läxor i åk 1–3 — komplett guide för lågstadiet', description: 'Allt om läsläxor, mattetabeller, glosor och rutiner i lågstadiet.', icon: BookOpen, color: 'bg-pink-500/10 text-pink-500', category: 'Per åldersgrupp' },
  { path: '/tips/laxor-arskurs-4-6', title: 'Läxor i åk 4–6 — komplett guide för mellanstadiet', description: 'Planering, prov, självständighet och föräldrarollen i mellanstadiet.', icon: BookOpen, color: 'bg-purple-500/10 text-purple-500', category: 'Per åldersgrupp' },
  { path: '/tips/tonaringar-laxor', title: 'Tonåringar och läxor – stötta utan att kontrollera', description: 'Hitta balansen mellan frihet och stöd för din tonåring på högstadiet och gymnasiet.', icon: GraduationCap, color: 'bg-blue-500/10 text-blue-500', category: 'Per åldersgrupp' },

  // Välmående & motivation
  { path: '/tips/laxstress', title: 'Läxstress hos barn – så hjälper du barnet att slappna av', description: 'Igenkänn tecken på läxstress och få konkreta verktyg för att minska pressen i hemmet.', icon: Heart, color: 'bg-rose-500/10 text-rose-500', category: 'Välmående' },
  { path: '/tips/motivation-laxor', title: 'Motivera barn till läxor – utan tjat', description: 'Praktiska strategier för att skapa inre motivation och göra läxorna positiva.', icon: Sparkles, color: 'bg-celebration/15 text-celebration-foreground', category: 'Motivation' },
  { path: '/tips/adhd-laxor', title: 'Läxor med ADHD — strategier som fungerar', description: 'Anpassningar, rutiner och samarbete med skolan för barn med koncentrationssvårigheter.', icon: Zap, color: 'bg-yellow-500/10 text-yellow-600', category: 'Välmående' },
  { path: '/tips/skarmtid-och-laxor', title: 'Skärmtid och läxor — hitta en hållbar balans', description: 'Riktlinjer per ålder, praktiska överenskommelser och appar som hjälper.', icon: Smartphone, color: 'bg-teal-500/10 text-teal-600', category: 'Välmående' },

  // Föräldraroll
  { path: '/tips/laxhjalp-hemma', title: 'Läxhjälp hemma – så blir du den bästa läxcoachen', description: 'Konkreta tips för hur du som förälder kan vägleda utan att ta över ansvaret.', icon: Home, color: 'bg-amber-500/10 text-amber-600', category: 'Föräldraroll' },
];

const CATEGORIES = ['Planering', 'Rutiner', 'Studieteknik', 'Per ämne', 'Per åldersgrupp', 'Välmående', 'Motivation', 'Föräldraroll'];

export default function TipsIndexPage() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Tips & guider om läxor och studieteknik | Läxhjälp</title>
        <meta name="description" content="15 fördjupande guider om läxplanering, studieteknik, läsförståelse, mattehjälp, engelska glosor, ADHD-anpassningar och mer — skrivna för svenska föräldrar." />
        <link rel="canonical" href="https://laxhjalp.app/tips" />
        <meta property="og:title" content="Tips & guider om läxor och studieteknik" />
        <meta property="og:description" content="Praktiska, fördjupande guider om läxor, studieteknik och välmående — för svenska familjer." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://laxhjalp.app/tips" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Tips & guider om läxor och studieteknik',
          url: 'https://laxhjalp.app/tips',
          inLanguage: 'sv-SE',
          publisher: { '@type': 'Organization', name: 'Läxhjälp', url: 'https://laxhjalp.app' },
        })}</script>
      </Helmet>
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Tillbaka till startsidan">
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold mb-4">
            <BookOpen className="w-4 h-4" />
            Tips & guider
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground mb-4">
            Läxor, studieteknik & motivation
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            15 fördjupande guider för svenska familjer — från lågstadiets första läsläxor till
            högstadiets nationella prov.
          </p>
        </motion.div>

        {/* Editorial intro */}
        <section className="max-w-3xl mx-auto mb-14 prose prose-sm sm:prose-base dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground">
          <h2>Varför finns Läxhjälps guider?</h2>
          <p>
            Vi bygger en app som hjälper familjer att hantera läxor utan stress. När vi pratar
            med föräldrar märker vi att verktyget bara är halva problemet — den andra halvan är
            <em> hur man faktiskt hjälper sitt barn med läxor</em>. Det finns gott om svar på nätet,
            men många är amerikanska, kommersiella eller saknar konkreta exempel.
          </p>
          <p>
            Våra guider är skrivna av Läxhjälp-redaktionen, ett svenskt team som arbetar med
            föräldrar, lärare och elever varje dag. Vi baserar råden på det vi själva ser
            fungera i verkligheten, kompletterat med öppna källor från Skolverket, Karolinska
            Institutet, 1177 och BRIS. Vi tar inga pengar för länkar eller omnämnanden — om vi
            tipsar om en bok eller en app är det för att vi själva använt den.
          </p>
          <p>
            Vi uppdaterar guiderna när nya forskningsrön kommer eller när vi själva lärt oss
            något nytt. Senast uppdaterade artiklar har datum i sidhuvudet.
          </p>
        </section>

        {/* Categorized articles */}
        {CATEGORIES.map((cat) => {
          const inCat = ARTICLES.filter((a) => a.category === cat);
          if (inCat.length === 0) return null;
          return (
            <section key={cat} className="mb-12">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">{cat}</h2>
              <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
                {inCat.map((article) => (
                  <Link
                    key={article.path}
                    to={article.path}
                    className="group block h-full p-6 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-elevated transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${article.color} flex items-center justify-center flex-shrink-0`}>
                        <article.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                          {article.category}
                        </span>
                        <h3 className="text-lg sm:text-xl font-bold text-foreground mt-1 mb-2 group-hover:text-primary transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {article.description}
                        </p>
                        <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary opacity-80 group-hover:opacity-100 transition-opacity">
                          Läs guiden
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {/* CTA */}
        <div className="mt-16 p-8 sm:p-10 rounded-3xl bg-primary/10 border border-primary/20 text-center">
          <Users className="w-10 h-10 text-primary mx-auto mb-3" />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-3">
            Vill du också ha koll på läxorna?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Läxhjälp hjälper hela familjen att planera, prioritera och fira avklarade läxor — helt gratis att komma igång.
          </p>
          <Link to="/auth">
            <Button size="lg" className="rounded-full gap-2 font-bold shadow-glow-primary">
              Skapa konto gratis <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </main>

      <footer className="border-t border-border py-8 mt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <Link to="/landing" className="hover:text-primary transition-colors">← Tillbaka till startsidan</Link>
          <div className="flex gap-4">
            <Link to="/om-oss" className="hover:text-primary transition-colors">Om oss</Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">Integritetspolicy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Villkor</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
