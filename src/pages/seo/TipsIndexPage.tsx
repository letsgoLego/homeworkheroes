import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, Calendar, Brain, Heart, Sparkles, Users, Home, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

const ARTICLES = [
  {
    path: '/tips/laxplanering',
    title: 'Läxplanering: 7 tips för en strukturerad vecka',
    description: 'Lär dig hur du planerar veckans läxor smart så att stressen minskar och inget glöms bort.',
    icon: Calendar,
    color: 'bg-primary/10 text-primary',
    category: 'Planering',
  },
  {
    path: '/tips/studieteknik-barn',
    title: 'Studieteknik för barn – metoder som faktiskt fungerar',
    description: 'Beprövade studietekniker anpassade för barn i grundskolan, från lågstadiet till högstadiet.',
    icon: Brain,
    color: 'bg-accent/10 text-accent',
    category: 'Studieteknik',
  },
  {
    path: '/tips/laxstress',
    title: 'Läxstress hos barn – så hjälper du ditt barn att slappna av',
    description: 'Igenkänn tecken på läxstress och få konkreta verktyg för att minska pressen i hemmet.',
    icon: Heart,
    color: 'bg-rose-500/10 text-rose-500',
    category: 'Välmående',
  },
  {
    path: '/tips/laxrutin',
    title: 'Skapa en läxrutin som håller hela terminen',
    description: 'Steg-för-steg-guide för att bygga en hållbar läxrutin som passar familjens vardag.',
    icon: BookOpen,
    color: 'bg-success/10 text-success',
    category: 'Rutiner',
  },
  {
    path: '/tips/motivation-laxor',
    title: 'Motivera barn till läxor – utan tjat',
    description: 'Praktiska strategier för att skapa inre motivation och göra läxorna till något positivt.',
    icon: Sparkles,
    color: 'bg-celebration/15 text-celebration-foreground',
    category: 'Motivation',
  },
  {
    path: '/tips/tonaringar-laxor',
    title: 'Tonåringar och läxor – hur du stöttar utan att kontrollera',
    description: 'Hitta balansen mellan att ge frihet och samtidigt vara ett tryggt stöd för din tonåring.',
    icon: GraduationCap,
    color: 'bg-blue-500/10 text-blue-500',
    category: 'Tonåringar',
  },
  {
    path: '/tips/laxhjalp-hemma',
    title: 'Läxhjälp hemma – så blir du den bästa läxcoachen',
    description: 'Konkreta tips för hur du som förälder kan vägleda utan att ta över ansvaret.',
    icon: Home,
    color: 'bg-amber-500/10 text-amber-600',
    category: 'Föräldraroll',
  },
];

export default function TipsIndexPage() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Tips & guider om läxor och studieteknik | Läxhjälp</title>
        <meta name="description" content="Praktiska guider om läxplanering, studieteknik, läxstress och motivation – skrivna för svenska föräldrar och barn." />
        <link rel="canonical" href="https://laxhjalp.app/tips" />
        <meta property="og:title" content="Tips & guider om läxor och studieteknik" />
        <meta property="og:description" content="Praktiska guider om läxplanering, studieteknik, läxstress och motivation." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://laxhjalp.app/tips" />
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
            Praktiska guider för dig som förälder eller elev – allt från planering och rutiner till hur du hanterar stress och hittar motivationen.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
          {ARTICLES.map((article, idx) => (
            <motion.div
              key={article.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
            >
              <Link
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
                    <h2 className="text-lg sm:text-xl font-bold text-foreground mt-1 mb-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h2>
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
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 p-8 sm:p-10 rounded-3xl bg-primary/10 border border-primary/20 text-center">
          <Users className="w-10 h-10 text-primary mx-auto mb-3" />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-3">
            Vill du också ha koll på läxorna?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Läxhjälp hjälper hela familjen att planera, prioritera och fira avklarade läxor – helt gratis att komma igång.
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
