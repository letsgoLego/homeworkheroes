import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, ArrowRight, Calendar, User, ChevronRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { useEffect, useRef } from 'react';
import { useAdSense } from '@/hooks/useAdSense';

export interface FaqItem {
  question: string;
  answer: string;
}

interface SeoArticleLayoutProps {
  title: string;
  metaTitle: string;
  metaDescription: string;
  children: React.ReactNode;
  relatedArticles?: { path: string; title: string }[];
  slug?: string;
  /** ISO date e.g. "2026-06-23" */
  datePublished?: string;
  dateModified?: string;
  /** Estimated reading time in minutes */
  readingTimeMin?: number;
  faqItems?: FaqItem[];
}

export default function SeoArticleLayout({
  title,
  metaTitle,
  metaDescription,
  children,
  relatedArticles = [],
  slug,
  datePublished = '2026-01-15',
  dateModified = '2026-06-23',
  readingTimeMin,
  faqItems = [],
}: SeoArticleLayoutProps) {
  useAdSense();
  const adPushed = useRef(false);

  useEffect(() => {
    if (adPushed.current) return;
    const timer = setTimeout(() => {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        adPushed.current = true;
      } catch {}
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const canonicalUrl = slug
    ? `https://laxhjalp.app/tips/${slug}`
    : 'https://laxhjalp.app/tips';

  const articleJsonLd = slug
    ? {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: metaTitle,
        description: metaDescription,
        url: canonicalUrl,
        datePublished,
        dateModified,
        inLanguage: 'sv-SE',
        author: {
          '@type': 'Organization',
          name: 'Läxhjälp-redaktionen',
          url: 'https://laxhjalp.app/om-oss',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Läxhjälp',
          url: 'https://laxhjalp.app',
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
      }
    : null;

  const breadcrumbJsonLd = slug
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Hem', item: 'https://laxhjalp.app/landing' },
          { '@type': 'ListItem', position: 2, name: 'Tips & guider', item: 'https://laxhjalp.app/tips' },
          { '@type': 'ListItem', position: 3, name: title, item: canonicalUrl },
        ],
      }
    : null;

  const faqJsonLd =
    faqItems.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqItems.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        }
      : null;

  const formattedModified = new Date(dateModified).toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="article:published_time" content={datePublished} />
        <meta property="article:modified_time" content={dateModified} />
        {articleJsonLd && (
          <script type="application/ld+json">{JSON.stringify(articleJsonLd)}</script>
        )}
        {breadcrumbJsonLd && (
          <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
        )}
        {faqJsonLd && (
          <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
        )}
      </Helmet>
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/landing">
              <Button variant="ghost" size="icon" aria-label="Tillbaka till startsidan">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="font-bold text-foreground">Läxhjälp</span>
            </div>
          </div>
          <Link to="/auth">
            <Button size="sm" className="rounded-full">Kom igång</Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Breadcrumbs */}
        {slug && (
          <nav aria-label="Brödsmulor" className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6 flex-wrap">
            <Link to="/landing" className="hover:text-primary transition-colors">Hem</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/tips" className="hover:text-primary transition-colors">Tips & guider</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground truncate">{title}</span>
          </nav>
        )}

        <article className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-3">{title}</h1>

          {/* Author + meta row */}
          <div className="not-prose flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground mb-6 pb-6 border-b border-border">
            <span className="inline-flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Av <Link to="/om-oss" className="font-semibold text-foreground hover:text-primary">Läxhjälp-redaktionen</Link>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Senast uppdaterad {formattedModified}
            </span>
            {readingTimeMin && (
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                {readingTimeMin} min läsning
              </span>
            )}
          </div>

          {children}

          {/* FAQ section */}
          {faqItems.length > 0 && (
            <>
              <h2 id="faq">Vanliga frågor</h2>
              <div className="not-prose space-y-3">
                {faqItems.map((f, i) => (
                  <details
                    key={i}
                    className="rounded-xl border border-border bg-card p-4 group"
                  >
                    <summary className="font-semibold text-foreground cursor-pointer list-none flex items-start justify-between gap-3">
                      <span>{f.question}</span>
                      <ChevronRight className="w-4 h-4 mt-0.5 shrink-0 transition-transform group-open:rotate-90 text-muted-foreground" />
                    </summary>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.answer}</p>
                  </details>
                ))}
              </div>
            </>
          )}

          {/* Author bio block */}
          <div className="not-prose mt-10 p-5 rounded-2xl bg-muted/30 border border-border">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold shrink-0">
                LH
              </div>
              <div>
                <div className="font-semibold text-foreground">Läxhjälp-redaktionen</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Vi är ett svenskt team som bygger verktyg för familjer som vill ha mindre läxstress
                  och mer tid tillsammans. Våra guider bygger på erfarenhet från föräldrar, lärare och
                  öppna källor från Skolverket, 1177 och BRIS. <Link to="/om-oss" className="text-primary font-medium">Läs mer om oss →</Link>
                </p>
              </div>
            </div>
          </div>
        </article>

        {/* CTA */}
        <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-primary/10 border border-primary/20 text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Testa Läxhjälp gratis</h2>
          <p className="text-muted-foreground mb-4">
            Planera läxor, skapa packlistor och håll koll på aktiviteter — hela familjen tillsammans.
          </p>
          <Link to="/auth">
            <Button size="lg" className="rounded-full gap-2">
              Skapa konto gratis <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* AdSense ad */}
        <div className="mt-8 flex justify-center">
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-8522260330728102"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
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
            <Link to="/om-oss" className="hover:text-primary transition-colors">Om oss</Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">Integritetspolicy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Villkor</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
