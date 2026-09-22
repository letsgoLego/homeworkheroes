import { Navigate } from 'react-router-dom';
import { useIsAdmin } from '@/hooks/useIsAdmin';

export default function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useIsAdmin();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
