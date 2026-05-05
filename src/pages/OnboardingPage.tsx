import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, Plus, ArrowRight, ArrowLeft, BookOpen, Bell, CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFamily } from '@/hooks/useFamily';

const colors = [
  '#2eb8a6', '#f97853', '#9b59b6', '#3498db',
  '#e6c229', '#27ae60', '#e74c3c', '#f39c12',
];

type Step = 'welcome' | 'choice' | 'create' | 'join' | 'children';

// Step sequences depend on the chosen path.
const CREATE_STEPS: Step[] = ['welcome', 'choice', 'create', 'children'];
const JOIN_STEPS: Step[] = ['welcome', 'choice', 'join'];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { userRole, loading: familyLoading } = useFamily();

  const [step, setStep] = useState<Step>('welcome');
  const [path, setPath] = useState<'create' | 'join' | null>(null);
  const [loading, setLoading] = useState(false);

  const [familyName, setFamilyName] = useState('');
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState('');

  const [childName, setChildName] = useState('');
  const [childColor, setChildColor] = useState(colors[0]);
  const [addedChildren, setAddedChildren] = useState<{ name: string; color: string }[]>([]);

  // Guard: users with an existing role should never see onboarding.
  useEffect(() => {
    if (!familyLoading && userRole) {
      navigate('/', { replace: true });
    }
  }, [familyLoading, userRole, navigate]);

  if (familyLoading || userRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const activeSteps = path === 'join' ? JOIN_STEPS : CREATE_STEPS;
  const currentStepIndex = Math.max(0, activeSteps.indexOf(step));
  const progressValue = ((currentStepIndex + 1) / activeSteps.length) * 100;

  const handleChoosePath = (choice: 'create' | 'join') => {
    setPath(choice);
    setStep(choice);
  };

  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      toast.error('Ange ett familjenamn');
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Logga in först');
        navigate('/auth');
        return;
      }
      const { data: newFamilyId, error } = await supabase
        .rpc('create_family_with_role', { _family_name: familyName.trim() });
      if (error) throw error;
      if (!newFamilyId) throw new Error('Familj skapades inte korrekt');
      setFamilyId(newFamilyId);
      setStep('children');
      toast.success('Familj skapad! Lägg nu till dina barn.');
    } catch (err: any) {
      console.error('Error creating family:', err);
      toast.error(err.message || 'Kunde inte skapa familj');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFamily = async () => {
    const cleanCode = inviteCode.toLowerCase().trim();
    if (!/^[a-f0-9]{8}$/.test(cleanCode)) {
      toast.error('Ogiltig kod. 8 tecken (a-f, 0-9).');
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Logga in först');
        navigate('/auth');
        return;
      }

      const { data: families, error: lookupError } = await supabase
        .rpc('lookup_family_by_invite_code', { code: cleanCode });
      if (lookupError) throw lookupError;
      const family = families && families.length > 0 ? families[0] : null;
      if (!family) {
        toast.error('Ingen familj hittades med den koden');
        return;
      }

      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('family_id', family.id)
        .maybeSingle();

      if (!existing) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: user.id, role: 'parent', family_id: family.id });
        if (roleError) throw roleError;
      }

      toast.success(`Välkommen till ${family.name}! 🎉`);
      navigate('/');
    } catch (err: any) {
      console.error('Error joining family:', err);
      toast.error(err.message || 'Kunde inte gå med i familjen');
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async () => {
    if (!childName.trim()) {
      toast.error('Ange ett namn');
      return;
    }
    if (!familyId) {
      toast.error('Familj hittades inte');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('children')
        .insert({ family_id: familyId, name: childName.trim(), color: childColor });
      if (error) throw error;
      setAddedChildren([...addedChildren, { name: childName.trim(), color: childColor }]);
      setChildName('');
      setChildColor(colors[(addedChildren.length + 1) % colors.length]);
      toast.success(`${childName} tillagt! 🎉`);
    } catch (err: any) {
      console.error('Error adding child:', err);
      toast.error(err.message || 'Kunde inte lägga till barn');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    if (addedChildren.length === 0) {
      toast.error('Lägg till minst ett barn');
      return;
    }
    toast.success('Allt klart! Nu börjar vi hålla koll på läxorna! 📚');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      {/* Progress bar */}
      <div className="w-full max-w-sm mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground font-medium">
            Steg {currentStepIndex + 1} av {activeSteps.length}
          </span>
        </div>
        <Progress value={progressValue} className="h-2" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-sm"
        >
          {step === 'welcome' && (
            <>
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="text-6xl mb-4"
                >
                  📚
                </motion.div>
                <h1 className="text-2xl font-bold mb-2">Välkommen till Läxhjälpen!</h1>
                <p className="text-muted-foreground">
                  Håll koll på läxorna tillsammans som familj
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-card shadow-soft">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Alla läxor på ett ställe</p>
                    <p className="text-xs text-muted-foreground">Lägg till läxor, dela upp i uppgifter och bocka av dag för dag</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-card shadow-soft">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Påminnelser & packlistor</p>
                    <p className="text-xs text-muted-foreground">Glöm aldrig vad som ska med till skolan</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-card shadow-soft">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Streaks & framsteg</p>
                    <p className="text-xs text-muted-foreground">Följ barnens framsteg och fira milstolpar</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setStep('choice')}
                className="w-full h-12 text-lg shadow-glow-primary"
              >
                Kom igång
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </>
          )}

          {step === 'choice' && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Hur vill du börja?</h1>
                <p className="text-muted-foreground">
                  Skapa en ny familj eller gå med i en befintlig
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleChoosePath('create')}
                  className="w-full p-4 rounded-2xl bg-card shadow-card text-left flex items-start gap-3 hover:shadow-glow-primary transition-all border-2 border-transparent hover:border-primary"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Skapa ny familj</p>
                    <p className="text-xs text-muted-foreground">
                      Du blir förälder och lägger till barn
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground self-center" />
                </button>

                <button
                  onClick={() => handleChoosePath('join')}
                  className="w-full p-4 rounded-2xl bg-card shadow-card text-left flex items-start gap-3 hover:shadow-glow-primary transition-all border-2 border-transparent hover:border-primary"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Gå med i befintlig familj</p>
                    <p className="text-xs text-muted-foreground">
                      Använd en inbjudningskod du har fått
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground self-center" />
                </button>
              </div>

              <div className="mt-6 text-center">
                <Button
                  variant="ghost"
                  onClick={() => setStep('welcome')}
                  className="text-muted-foreground"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Tillbaka
                </Button>
              </div>
            </>
          )}

          {step === 'create' && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Skapa din familj</h1>
                <p className="text-muted-foreground">Ge din familj ett roligt namn!</p>
              </div>

              <div className="space-y-4">
                <Input
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="t.ex. Familjen Svensson"
                  className="text-center text-lg h-14"
                />
                <Button
                  onClick={handleCreateFamily}
                  disabled={loading || !familyName.trim()}
                  className="w-full h-12 text-lg shadow-glow-primary"
                >
                  Fortsätt
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>

              <div className="mt-6 text-center">
                <Button
                  variant="ghost"
                  onClick={() => { setPath(null); setStep('choice'); }}
                  className="text-muted-foreground"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Tillbaka
                </Button>
              </div>
            </>
          )}

          {step === 'join' && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Gå med i familj</h1>
                <p className="text-muted-foreground">Ange inbjudningskoden du fått</p>
              </div>

              <div className="space-y-4">
                <Input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toLowerCase())}
                  placeholder="xxxxxxxx"
                  maxLength={8}
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="text-center text-2xl font-mono tracking-widest h-14"
                />
                <Button
                  onClick={handleJoinFamily}
                  disabled={loading || inviteCode.trim().length !== 8}
                  className="w-full h-12 text-lg shadow-glow-primary"
                >
                  Gå med i familjen
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>

              <div className="mt-6 text-center">
                <Button
                  variant="ghost"
                  onClick={() => { setPath(null); setStep('choice'); }}
                  className="text-muted-foreground"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Tillbaka
                </Button>
              </div>
            </>
          )}

          {step === 'children' && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2">Lägg till barn</h1>
                <p className="text-muted-foreground">Vilka ska göra läxor?</p>
              </div>

              {addedChildren.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6 justify-center">
                  {addedChildren.map((child, i) => (
                    <span
                      key={i}
                      className="px-4 py-2 rounded-full text-white font-medium"
                      style={{ backgroundColor: child.color }}
                    >
                      {child.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="p-4 rounded-2xl bg-card shadow-card space-y-4 mb-4">
                <Input
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="Barnets namn"
                  className="text-center"
                />
                <div className="flex flex-wrap gap-2 justify-center">
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setChildColor(c)}
                      className={cn(
                        'w-8 h-8 rounded-full transition-all',
                        childColor === c && 'ring-2 ring-offset-2 ring-foreground scale-110'
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <Button
                  onClick={handleAddChild}
                  disabled={loading || !childName.trim()}
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Lägg till barn
                </Button>
              </div>

              <Button
                onClick={handleFinish}
                disabled={addedChildren.length === 0}
                className="w-full h-12 text-lg shadow-glow-primary"
              >
                Börja använda Läxhjälpen
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
