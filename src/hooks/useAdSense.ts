import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const ADSENSE_SRC = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8522260330728102';

/**
 * Loads the AdSense script only when a user is authenticated.
 * This prevents ads from appearing on login/public pages.
 */
export function useAdSense() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    // Don't add twice
    if (document.querySelector(`script[src="${ADSENSE_SRC}"]`)) return;

    const script = document.createElement('script');
    script.src = ADSENSE_SRC;
    script.async = true;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }, [user]);
}
