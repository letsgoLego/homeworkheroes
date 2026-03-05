import { Navigate } from 'react-router-dom';
import { useFamily } from '@/hooks/useFamily';

export default function ParentRouteGuard({ children }: { children: React.ReactNode }) {
  const { userRole, loading } = useFamily();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  
  if (userRole === 'child') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}
