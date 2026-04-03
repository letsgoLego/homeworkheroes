import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

interface SeoArticleLayoutProps {
  title: string;
  metaTitle: string;
  metaDescription: string;
  children: React.ReactNode;
  relatedArticles?: { path: string; title: string }[];
}

function useDocumentMeta(title: string, description: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    const setMeta = (name: string, content: string, attr = 'name') => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('description', description);
    setMeta('og:title', title, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:type', 'article', 'property');

    return () => { document.title = prevTitle; };
  }, [title, description]);
}

export default function SeoArticleLayout({
  title,
  metaTitle,
  metaDescription,
  children,
  relatedArticles = [],
}: SeoArticleLayoutProps) {
  useDocumentMeta(metaTitle, metaDescription);

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/landing">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="font-bold text-foreground">Homework Heroes</span>
            </div>
          </div>
          <Link to="/auth">
            <Button size="sm" className="rounded-full">Kom igång</Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <article className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">{title}</h1>
          {children}
        </article>

        {/* CTA */}
        <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-primary/10 border border-primary/20 text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Testa Homework Heroes gratis</h2>
          <p className="text-muted-foreground mb-4">
            Planera läxor, skapa packlistor och håll koll på aktiviteter — hela familjen tillsammans.
          </p>
          <Link to="/auth">
            <Button size="lg" className="rounded-full gap-2">
              Skapa konto gratis <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Related articles */}
        {relatedArticles.length > 0 && (
          <div className="mt-10">
            <h3 className="text-lg font-bold text-foreground mb-4">Läs också</h3>
            <div className="grid gap-3">
              {relatedArticles.map((article) => (
                <Link
                  key={article.path}
                  to={article.path}
                  className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors group no-underline"
                >
                  <BookOpen className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {article.title}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border py-8 mt-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <Link to="/landing" className="hover:text-primary transition-colors">← Tillbaka till startsidan</Link>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-primary transition-colors">Integritetspolicy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Villkor</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
