import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import TodayPage from "./pages/TodayPage";
import WeekPage from "./pages/WeekPage";
import AddPage from "./pages/AddPage";
import FamilyPage from "./pages/FamilyPage";
import ChildProfilePage from "./pages/ChildProfilePage";
import AuthPage from "./pages/AuthPage";
import OnboardingPage from "./pages/OnboardingPage";
import JoinFamilyPage from "./pages/JoinFamilyPage";
import JoinFamilyStartPage from "./pages/JoinFamilyStartPage";
import ChildLoginPage from "./pages/ChildLoginPage";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import ParentRouteGuard from "./components/ParentRouteGuard";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}


function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
      <Route path="/child-login" element={<PublicRoute><ChildLoginPage /></PublicRoute>} />
      <Route path="/join-family-start" element={<JoinFamilyStartPage />} />
      <Route path="/join-family" element={<ProtectedRoute><JoinFamilyPage /></ProtectedRoute>} />
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
      <Route path="/" element={<ProtectedRoute><TodayPage /></ProtectedRoute>} />
      <Route path="/week" element={<ProtectedRoute><WeekPage /></ProtectedRoute>} />
      <Route path="/add" element={<ProtectedRoute><AddPage /></ProtectedRoute>} />
      <Route path="/family" element={<ProtectedRoute><ParentRouteGuard><FamilyPage /></ParentRouteGuard></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ChildProfilePage /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
