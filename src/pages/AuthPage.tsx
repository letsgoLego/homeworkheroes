import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BookOpen, Mail, Lock, ArrowRight, Users, User, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { lovable } from '@/integrations/lovable/index';

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Fyll i alla fält');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Lösenordet måste vara minst 6 tecken');
      return;
    }
    
    setLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Fel e-post eller lösenord');
          } else {
            toast.error(error.message);
          }
          return;
        }
        
        toast.success('Välkommen tillbaka! 👋');
        navigate('/');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('Den här e-posten är redan registrerad. Prova att logga in!');
          } else {
            toast.error(error.message);
          }
          return;
        }
        
        toast.success('Konto skapat! Välkommen till Läxhjälpen! 🎉');
        navigate('/onboarding');
      }
    } catch (err) {
      toast.error('Något gick fel. Försök igen.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 shadow-glow-primary">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Läxhjälpen</h1>
          <p className="text-muted-foreground">
            Håll koll på läxorna tillsammans
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-sm"
        >
          {/* Toggle */}
          <div className="flex rounded-xl bg-muted p-1 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                isLogin
                  ? 'bg-card shadow-soft text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              Logga in
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                !isLogin
                  ? 'bg-card shadow-soft text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              Skapa konto
            </button>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                E-post
              </Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="du@exempel.se"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="password" className="text-sm font-medium">
                Lösenord
              </Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                />
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={loading}
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
                  {isLogin ? 'Logga in' : 'Skapa konto'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Alternative actions */}
          <div className="mt-6 space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">eller</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={googleLoading}
              onClick={async () => {
                setGoogleLoading(true);
                try {
                  const result = await lovable.auth.signInWithOAuth('google', {
                    redirect_uri: window.location.origin,
                  });
                  if (result?.error) {
                    toast.error('Google-inloggning misslyckades');
                  }
                } catch {
                  toast.error('Google-inloggning misslyckades');
                } finally {
                  setGoogleLoading(false);
                }
              }}
              className="w-full h-12"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {googleLoading ? 'Loggar in...' : 'Fortsätt med Google'}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={googleLoading}
              onClick={async () => {
                setGoogleLoading(true);
                try {
                  const result = await lovable.auth.signInWithOAuth('apple', {
                    redirect_uri: window.location.origin,
                  });
                  if (result?.error) {
                    toast.error('Apple-inloggning misslyckades');
                  }
                } catch {
                  toast.error('Apple-inloggning misslyckades');
                } finally {
                  setGoogleLoading(false);
                }
              }}
              className="w-full h-12"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.52-3.23 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Fortsätt med Apple
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/join-family-start')}
                className="h-12"
              >
                <Users className="w-4 h-4 mr-2" />
                Gå med i familj
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/child-login')}
                className="h-12"
              >
                <User className="w-4 h-4 mr-2" />
                Barnkonto
              </Button>
            </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/join-family-start')}
                className="h-12"
              >
                <Users className="w-4 h-4 mr-2" />
                Gå med i familj
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/child-login')}
                className="h-12"
              >
                <User className="w-4 h-4 mr-2" />
                Barnkonto
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Footer */}
      <div className="text-center pb-8 space-y-2">
        <Link to="/landing" className="text-sm text-primary font-medium inline-flex items-center gap-1 hover:underline">
          <Info className="w-4 h-4" />
          Läs mer om Läxhjälpen
        </Link>
        <p className="text-sm text-muted-foreground">Enkel läxhantering för hela familjen</p>
      </div>
    </div>
  );
}
