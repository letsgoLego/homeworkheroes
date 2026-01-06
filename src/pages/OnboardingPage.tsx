import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, Plus, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const colors = [
  '#2eb8a6', '#f97853', '#9b59b6', '#3498db',
  '#e6c229', '#27ae60', '#e74c3c', '#f39c12',
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'family' | 'children'>('family');
  const [loading, setLoading] = useState(false);
  
  // Family
  const [familyName, setFamilyName] = useState('');
  const [familyId, setFamilyId] = useState<string | null>(null);
  
  // Children
  const [childName, setChildName] = useState('');
  const [childColor, setChildColor] = useState(colors[0]);
  const [addedChildren, setAddedChildren] = useState<{ name: string; color: string }[]>([]);
  
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
      
      // Create family
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({ name: familyName.trim() })
        .select()
        .single();
      
      if (familyError) throw familyError;
      
      // Add user as parent
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'parent',
          family_id: family.id,
        });
      
      if (roleError) throw roleError;
      
      setFamilyId(family.id);
      setStep('children');
      toast.success('Familj skapad! Lägg nu till dina barn.');
    } catch (err: any) {
      console.error('Error creating family:', err);
      toast.error(err.message || 'Kunde inte skapa familj');
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
        .insert({
          family_id: familyId,
          name: childName.trim(),
          color: childColor,
        });
      
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
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="w-full max-w-sm"
      >
        {step === 'family' ? (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Skapa din familj</h1>
              <p className="text-muted-foreground">
                Ge din familj ett roligt namn!
              </p>
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
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2">Lägg till barn</h1>
              <p className="text-muted-foreground">
                Vilka ska göra läxor?
              </p>
            </div>
            
            {/* Added children */}
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
            
            {/* Add child form */}
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
    </div>
  );
}
