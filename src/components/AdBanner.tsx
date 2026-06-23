import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdBannerProps {
  slot?: string;
  format?: string;
  className?: string;
}

/**
 * AdSense banner — strictly only renders on /tips/* SEO article routes.
 * AdSense policy: ads must not appear inside the app shell.
 */
export function AdBanner({ slot, format = 'auto', className = '' }: AdBannerProps) {
  const { subscribed, loading } = useSubscriptionContext();
  const location = useLocation();
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  const isOnTipsRoute = location.pathname.startsWith('/tips/');

  useEffect(() => {
    if (!isOnTipsRoute || loading || subscribed || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense not loaded (e.g. ad blocker)
    }
  }, [loading, subscribed, isOnTipsRoute]);

  // Hard guard: never render outside /tips/* — and not for paying users
  if (!isOnTipsRoute || loading || subscribed) return null;

  return (
    <div className={`ad-banner w-full flex justify-center my-4 ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-8522260330728102"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
