import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, ArrowRight, ArrowLeft, Mail, Lock, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function JoinFamilyStartPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<'code' | 'auth' | 'confirm'>('code');
  const [inviteCode, setInviteCode] = useState('');
  const [familyInfo, setFamilyInfo] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Auth state (only used if not logged in)
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const handleVerifyCode = async () => {
    if (!inviteCode.trim()) {
      toast.error('Ange en inbjudningskod');
      return;
    }

    const cleanCode = inviteCode.toLowerCase().trim();
    
    if (!/^[a-f0-9]{8}$/.test(cleanCode)) {
      toast.error('Ogiltig inbjudningskod. Koden ska vara 8 tecken.');
      return;
    }

    setLoading(true);

    try {
      const { data: families, error } = await supabase
        .rpc('lookup_family_by_invite_code', { code: cleanCode });

      if (error) throw error;

      const family = families && families.length > 0 ? families[0] : null;

      if (!family) {
        toast.error('Ingen familj hittades med den koden');
        return;
      }

      setFamilyInfo(family);
      
      // If user is already logged in, go to confirm step
      if (user) {
        setStep('confirm');
      } else {
        setStep('auth');
      }
      
      toast.success(`Familj hittad: ${family.name}`);
    } catch (err: any) {
      console.error('Error verifying code:', err);
      toast.error(err.message || 'Kunde inte verifiera koden');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFamily = async (_userId: string) => {
    if (!familyInfo) {
      toast.error('Familj saknas');
      return;
    }

    const { error: joinError } = await supabase
      .rpc('join_family_with_invite_code', { _code: inviteCode.trim().toLowerCase() });

    if (joinError) {
      const msg = joinError.message?.toLowerCase() || '';
      if (msg.includes('limit')) toast.error('Familjen har nått max antal medlemmar');
      else if (msg.includes('not found')) toast.error('Ingen familj hittades');
      else throw joinError;
      return;
    }

    toast.success(`Välkommen till ${familyInfo.name}! 🎉`);
    navigate('/');
  };

  const handleConfirmJoin = async () => {
    if (!user) {
      toast.error('Du måste vara inloggad');
      return;
    }

    setLoading(true);

    try {
      await handleJoinFamily(user.id);
    } catch (err: any) {
      console.error('Error joining family:', err);
      toast.error(err.message || 'Kunde inte gå med i familjen');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Fyll i alla fält');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Lösenordet måste vara minst 6 tecken');
      return;
    }

    if (!familyInfo) {
      toast.error('Familj saknas');
      return;
    }
    
    setLoading(true);
    
    try {
      let userId: string;
      
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
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
        
        userId = data.user.id;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('Den här e-posten är redan registrerad. Prova att logga in!');
            setIsLogin(true);
          } else {
            toast.error(error.message);
          }
          return;
        }
        
        if (!data.user) {
          toast.error('Kunde inte skapa konto');
          return;
        }
        
        userId = data.user.id;
      }

      await handleJoinFamily(userId);
    } catch (err: any) {
      console.error('Error joining family:', err);
      toast.error(err.message || 'Kunde inte gå med i familjen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-sm"
      >
        {step === 'code' && (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Gå med i familj</h1>
              <p className="text-muted-foreground">
                Ange inbjudningskoden du fått
              </p>
              {user && (
                <p className="text-sm text-primary mt-2">
                  Inloggad som {user.email}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="inviteCode">Inbjudningskod</Label>
                <Input
                  id="inviteCode"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="XXXXXXXX"
                  className="text-center text-2xl font-mono tracking-widest h-14 mt-1.5"
                  maxLength={8}
                />
              </div>

              <Button
                onClick={handleVerifyCode}
                disabled={loading || !inviteCode.trim()}
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
                    Fortsätt
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => navigate(user ? '/' : '/auth')}
                className="text-muted-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Tillbaka
              </Button>
            </div>
          </>
        )}

        {step === 'confirm' && user && (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Gå med i {familyInfo?.name}?</h1>
              <p className="text-muted-foreground">
                Du kommer att läggas till som förälder
              </p>
              <p className="text-sm text-primary mt-2">
                {user.email}
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleConfirmJoin}
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
                    Gå med i familjen
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setStep('code')}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Ändra kod
              </Button>
            </div>
          </>
        )}

        {step === 'auth' && !user && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Gå med i {familyInfo?.name}</h1>
              <p className="text-muted-foreground">
                {isLogin ? 'Logga in för att gå med' : 'Skapa konto för att gå med'}
              </p>
            </div>

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

            <form onSubmit={handleAuth} className="space-y-4">
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
                    {isLogin ? 'Logga in & Gå med' : 'Skapa konto & Gå med'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => setStep('code')}
                className="text-muted-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Ändra kod
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
