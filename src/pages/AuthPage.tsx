import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  BookOpen, Mail, Lock, ArrowRight, Users, User, Info,
  Eye, EyeOff, CheckCircle2, ShieldCheck, Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { lovable } from '@/integrations/lovable/index';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type View = 'login' | 'signup' | 'email-sent';

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

export default function AuthPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('signup');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<null | 'google' | 'apple'>(null);
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [showCreateOptIn, setShowCreateOptIn] = useState(false);

  const isLogin = view === 'login';
  const emailError = emailTouched && email.length > 0 && !isValidEmail(email)
    ? 'Det här ser inte ut som en giltig e-post'
    : null;
  const passwordOk = password.length >= 6;

  const switchToLogin = (prefilled?: string) => {
    if (prefilled) setEmail(prefilled);
    setView('login');
    setPassword('');
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setOauthLoading(provider);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result?.error) {
        toast.error(`${provider === 'google' ? 'Google' : 'Apple'}-inloggning misslyckades`);
      }
    } catch {
      toast.error(`${provider === 'google' ? 'Google' : 'Apple'}-inloggning misslyckades`);
    } finally {
      setOauthLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Fyll i alla fält');
      return;
    }
    if (!isValidEmail(email)) {
      setEmailTouched(true);
      toast.error('Skriv in en giltig e-postadress');
      return;
    }
    if (password.length < 6) {
      toast.error('Lösenordet måste vara minst 6 tecken');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setShowCreateOptIn(true);
          } else if (error.message.toLowerCase().includes('email not confirmed')) {
            toast.error('Bekräfta din e-post först – kolla inkorgen.');
            setSentTo(email);
            setView('email-sent');
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success('Välkommen tillbaka! 👋');
        navigate('/');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });

        if (error) {
          if (error.message.toLowerCase().includes('already registered') ||
              error.message.toLowerCase().includes('user already')) {
            toast.error('E-posten är redan registrerad', {
              action: { label: 'Logga in', onClick: () => switchToLogin(email) },
            });
          } else {
            toast.error(error.message);
          }
          return;
        }

        // If session exists, email-confirm is off – go straight to onboarding.
        if (data.session) {
          toast.success('Konto skapat! 🎉');
          navigate('/onboarding');
        } else {
          // Email confirmation required – show "check inbox" screen so users don't get stuck.
          setSentTo(email);
          setView('email-sent');
        }
      }
    } catch {
      toast.error('Något gick fel. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!sentTo) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: sentTo,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) toast.error('Kunde inte skicka om mejlet');
      else toast.success('Mejlet är skickat igen ✉️');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromLogin = async () => {
    setShowCreateOptIn(false);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) {
        if (
          error.message.toLowerCase().includes('already registered') ||
          error.message.toLowerCase().includes('user already')
        ) {
          toast.error('E-posten finns redan – kontrollera lösenordet');
        } else {
          toast.error(error.message);
        }
        return;
      }
      if (data.session) {
        toast.success('Konto skapat! 🎉');
        navigate('/onboarding');
      } else {
        setSentTo(email);
        setView('email-sent');
      }
    } catch {
      toast.error('Något gick fel. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  // ---- "Check your inbox" screen ----
  if (view === 'email-sent') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 shadow-glow-primary">
              <Mail className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Kolla din inkorg</h1>
            <p className="text-muted-foreground mb-1">
              Vi skickade ett bekräftelsemejl till
            </p>
            <p className="font-semibold text-foreground mb-6 break-all">{sentTo}</p>
            <p className="text-sm text-muted-foreground mb-8">
              Klicka på länken i mejlet för att slutföra registreringen.
              Hittar du det inte? Kolla skräpposten.
            </p>
            <Button
              onClick={resendVerification}
              disabled={loading}
              variant="outline"
              className="w-full h-12 mb-3"
            >
              Skicka mejlet igen
            </Button>
            <Button
              onClick={() => { setView('login'); }}
              variant="ghost"
              className="w-full"
            >
              Tillbaka till inloggning
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ---- Main auth screen ----
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 shadow-glow-primary">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Läxhjälp — Planera läxor tillsammans</h1>
          <p className="text-muted-foreground">
            {isLogin ? 'Välkommen tillbaka' : 'Kom igång på under en minut'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-sm"
        >
          {/* Toggle */}
          <div className="grid grid-cols-3 rounded-xl bg-muted p-1 mb-5 gap-1">
            <button
              onClick={() => setView('login')}
              className={`py-2 px-2 rounded-lg text-sm font-medium transition-all ${
                isLogin ? 'bg-card shadow-soft text-foreground' : 'text-muted-foreground'
              }`}
            >
              Logga in
            </button>
            <button
              onClick={() => setView('signup')}
              className={`py-2 px-2 rounded-lg text-sm font-medium transition-all ${
                !isLogin ? 'bg-card shadow-soft text-foreground' : 'text-muted-foreground'
              }`}
            >
              Skapa konto
            </button>
            <button
              onClick={() => navigate('/child-login')}
              className="py-2 px-2 rounded-lg text-sm font-medium transition-all text-muted-foreground hover:text-foreground"
            >
              Barnkonto
            </button>
          </div>


          {/* Social FIRST — converts 2-3x better */}
          <div className="space-y-2.5">
            <Button
              type="button"
              variant="outline"
              disabled={oauthLoading !== null}
              onClick={() => handleOAuth('google')}
              className="w-full h-12 font-semibold"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {oauthLoading === 'google'
                ? 'Loggar in...'
                : isLogin ? 'Fortsätt med Google' : 'Kom igång med Google'}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={oauthLoading !== null}
              onClick={() => handleOAuth('apple')}
              className="w-full h-12 font-semibold"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.52-3.23 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              {oauthLoading === 'apple'
                ? 'Loggar in...'
                : isLogin ? 'Fortsätt med Apple' : 'Kom igång med Apple'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-2">
            Samma knapp fungerar både för nya och befintliga konton.
          </p>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">eller med e-post</span>
            </div>
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">E-post</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="du@exempel.se"
                  className={`pl-10 ${emailError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  aria-invalid={emailError ? true : undefined}
                  aria-describedby={emailError ? 'email-error' : undefined}
                />
              </div>
              {emailError && (
                <p id="email-error" className="text-xs text-destructive mt-1">{emailError}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium">Lösenord</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Dölj lösenord' : 'Visa lösenord'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {!isLogin && (
                <p className={`text-xs mt-1 flex items-center gap-1 ${
                  password.length === 0
                    ? 'text-muted-foreground'
                    : passwordOk ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {passwordOk
                    ? <><CheckCircle2 className="w-3.5 h-3.5" /> Bra lösenord</>
                    : <>Minst 6 tecken</>}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || oauthLoading !== null}
              className="w-full h-12 text-lg shadow-glow-primary"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                />
              ) : (
                <>
                  {isLogin ? 'Logga in' : 'Skapa konto gratis'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            {isLogin && (
              <div className="text-center">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Glömt lösenord?
                </Link>
              </div>
            )}
          </form>

          {/* Trust row */}
          {!isLogin && (
            <div className="mt-5 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> Gratis
              </span>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Inget kort
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Avsluta när du vill
              </span>
            </div>
          )}

          {/* Alt actions */}
          <div className="mt-6">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate('/join-family-start')}
              className="h-11 w-full"
            >
              <Users className="w-4 h-4 mr-2" />
              Gå med i familj
            </Button>
          </div>

        </motion.div>
      </div>

      {/* Footer */}
      <div className="text-center pb-8 space-y-2">
        {!isLogin && (
          <p className="text-xs text-muted-foreground px-6 mb-2">
            Genom att skapa konto godkänner du våra{' '}
            <Link to="/terms" className="text-primary underline underline-offset-2">användarvillkor</Link>{' '}
            och{' '}
            <Link to="/privacy" className="text-primary underline underline-offset-2">integritetspolicy</Link>.
          </p>
        )}
        <Link to="/landing" className="text-sm text-primary font-medium inline-flex items-center gap-1 hover:underline">
          <Info className="w-4 h-4" />
          Läs mer om Läxhjälpen
        </Link>
        <p className="text-sm text-muted-foreground">Enkel läxhantering för hela familjen</p>
      </div>

      <AlertDialog open={showCreateOptIn} onOpenChange={setShowCreateOptIn}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inget konto hittades – eller fel lösenord</AlertDialogTitle>
            <AlertDialogDescription>
              Vill du skapa ett konto med samma e-post och lösenord? Du loggas in direkt om det går.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
            <AlertDialogAction onClick={handleCreateFromLogin} className="w-full">
              Skapa konto
            </AlertDialogAction>
            <AlertDialogCancel className="w-full mt-0">Försök igen</AlertDialogCancel>
            <Link
              to="/forgot-password"
              onClick={() => setShowCreateOptIn(false)}
              className="text-sm text-primary hover:underline text-center"
            >
              Glömt lösenord?
            </Link>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
