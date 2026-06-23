import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

/**
 * Adds <meta name="robots" content="noindex,follow"> on app/utility routes
 * so Google does not index the app shell. Belt-and-suspenders with robots.txt.
 */
const NON_INDEXABLE_PREFIXES = [
  '/auth',
  '/child-login',
  '/forgot-password',
  '/reset-password',
  '/join-family',
  '/join-family-start',
  '/onboarding',
  '/week',
  '/add',
  '/family',
  '/insights',
  '/profile',
  '/holiday',
];

const NON_INDEXABLE_EXACT = new Set<string>([
  '/',
]);

export default function SeoNoIndex() {
  const { pathname } = useLocation();
  const shouldNoIndex =
    NON_INDEXABLE_EXACT.has(pathname) ||
    NON_INDEXABLE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (!shouldNoIndex) return null;
  return (
    <Helmet>
      <meta name="robots" content="noindex,follow" />
    </Helmet>
  );
}
