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
import InsightsPage from "./pages/InsightsPage";
import ChildProfilePage from "./pages/ChildProfilePage";
import AuthPage from "./pages/AuthPage";
import OnboardingPage from "./pages/OnboardingPage";
import JoinFamilyPage from "./pages/JoinFamilyPage";
import JoinFamilyStartPage from "./pages/JoinFamilyStartPage";
import ChildLoginPage from "./pages/ChildLoginPage";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import LaxplaneringTipsPage from "./pages/seo/LaxplaneringTipsPage";
import StudieteknikBarnPage from "./pages/seo/StudieteknikBarnPage";
import LaxstressBarnPage from "./pages/seo/LaxstressBarnPage";
import LaxrutinPage from "./pages/seo/LaxrutinPage";
import MotivationLaxorPage from "./pages/seo/MotivationLaxorPage";
import TonaringarLaxorPage from "./pages/seo/TonaringarLaxorPage";
import LaxhjalpHemmaPage from "./pages/seo/LaxhjalpHemmaPage";
import TipsIndexPage from "./pages/seo/TipsIndexPage";
import AboutPage from "./pages/AboutPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ParentRouteGuard from "./components/ParentRouteGuard";
import CookieBanner from "./components/CookieBanner";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { OfflineBanner } from "./components/OfflineBanner";
import SeoNoIndex from "./components/SeoNoIndex";
import LasforstaelseBarnPage from "./pages/seo/LasforstaelseBarnPage";
import MatematikHjalpBarnPage from "./pages/seo/MatematikHjalpBarnPage";
import EngelskaGlosorPage from "./pages/seo/EngelskaGlosorPage";
import SkarmtidLaxorPage from "./pages/seo/SkarmtidLaxorPage";
import AdhdLaxorPage from "./pages/seo/AdhdLaxorPage";
import LaxorArskurs1_3Page from "./pages/seo/LaxorArskurs1_3Page";
import LaxorArskurs4_6Page from "./pages/seo/LaxorArskurs4_6Page";
import HogstadietStudieteknikPage from "./pages/seo/HogstadietStudieteknikPage";


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
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/tips" element={<TipsIndexPage />} />
      <Route path="/om-oss" element={<AboutPage />} />
      <Route path="/tips/laxplanering" element={<LaxplaneringTipsPage />} />
      <Route path="/tips/studieteknik-barn" element={<StudieteknikBarnPage />} />
      <Route path="/tips/laxstress" element={<LaxstressBarnPage />} />
      <Route path="/tips/laxrutin" element={<LaxrutinPage />} />
      <Route path="/tips/motivation-laxor" element={<MotivationLaxorPage />} />
      <Route path="/tips/tonaringar-laxor" element={<TonaringarLaxorPage />} />
      <Route path="/tips/laxhjalp-hemma" element={<LaxhjalpHemmaPage />} />
      <Route path="/tips/lasforstaelse-barn" element={<LasforstaelseBarnPage />} />
      <Route path="/tips/matematik-hjalp-barn" element={<MatematikHjalpBarnPage />} />
      <Route path="/tips/engelska-glosor" element={<EngelskaGlosorPage />} />
      <Route path="/tips/skarmtid-och-laxor" element={<SkarmtidLaxorPage />} />
      <Route path="/tips/adhd-laxor" element={<AdhdLaxorPage />} />
      <Route path="/tips/laxor-arskurs-1-3" element={<LaxorArskurs1_3Page />} />
      <Route path="/tips/laxor-arskurs-4-6" element={<LaxorArskurs4_6Page />} />
      <Route path="/tips/hogstadiet-studieteknik" element={<HogstadietStudieteknikPage />} />
      <Route path="/join-family-start" element={<JoinFamilyStartPage />} />
      <Route path="/join-family" element={<ProtectedRoute><JoinFamilyPage /></ProtectedRoute>} />
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
      <Route path="/" element={<ProtectedRoute><TodayPage /></ProtectedRoute>} />
      <Route path="/week" element={<ProtectedRoute><WeekPage /></ProtectedRoute>} />
      <Route path="/add" element={<ProtectedRoute><AddPage /></ProtectedRoute>} />
      <Route path="/family" element={<ProtectedRoute><ParentRouteGuard><FamilyPage /></ParentRouteGuard></ProtectedRoute>} />
      <Route path="/insights" element={<ProtectedRoute><ParentRouteGuard><InsightsPage /></ParentRouteGuard></ProtectedRoute>} />
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
          <SubscriptionProvider>
            <OfflineBanner />
            <SeoNoIndex />
            <AppRoutes />
            <CookieBanner />
          </SubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
