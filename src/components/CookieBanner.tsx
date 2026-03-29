import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Cookie, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const CONSENT_KEY = 'cookie-consent';

export type CookieConsent = 'all' | 'essential' | null;

export function getCookieConsent(): CookieConsent {
  return localStorage.getItem(CONSENT_KEY) as CookieConsent;
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getCookieConsent();
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = (level: 'all' | 'essential') => {
    localStorage.setItem(CONSENT_KEY, level);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6"
        >
          <div className="max-w-lg mx-auto bg-card border border-border rounded-2xl shadow-elevated p-5 sm:p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Cookie className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">Vi använder cookies</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Vi använder nödvändiga cookies för att appen ska fungera, samt valfria cookies för betalning och analys.{' '}
                  <Link to="/privacy" className="text-primary underline underline-offset-2">
                    Läs vår integritetspolicy
                  </Link>
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => accept('essential')}
                className="flex-1"
              >
                <Shield className="w-4 h-4 mr-1.5" />
                Bara nödvändiga
              </Button>
              <Button
                size="sm"
                onClick={() => accept('all')}
                className="flex-1 shadow-glow-primary"
              >
                Godkänn alla
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
