import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Users, ArrowRight, ArrowLeft } from 'lucide-react';

export default function JoinFamilyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteCode.trim()) {
      toast.error('Ange en inbjudningskod');
      return;
    }

    if (!user) {
      toast.error('Du måste vara inloggad');
      return;
    }

    // Validate and clean the invite code
    const cleanCode = inviteCode.toLowerCase().trim();
    
    // Invite codes are 8-character hex strings
    if (!/^[a-f0-9]{8}$/.test(cleanCode)) {
      toast.error('Ogiltig inbjudningskod. Koden ska vara 8 tecken.');
      return;
    }

    setLoading(true);

    try {
      // Look up family name first (for the success toast)
      const { data: families } = await supabase
        .rpc('lookup_family_by_invite_code', { code: cleanCode });
      const family = families && families.length > 0 ? families[0] : null;

      // Securely join via SECURITY DEFINER RPC (validates code + caps members)
      const { error: joinError } = await supabase
        .rpc('join_family_with_invite_code', { _code: cleanCode });

      if (joinError) {
        const msg = joinError.message?.toLowerCase() || '';
        if (msg.includes('not found')) toast.error('Ingen familj hittades med den koden');
        else if (msg.includes('limit')) toast.error('Familjen har nått max antal medlemmar');
        else if (msg.includes('invalid invite code')) toast.error('Ogiltig kod');
        else toast.error(joinError.message || 'Kunde inte gå med i familjen');
        return;
      }

      toast.success(`Välkommen till ${family?.name ?? 'familjen'}! 🎉`);
      navigate('/');
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Gå med i familj</h1>
          <p className="text-muted-foreground">
            Ange inbjudningskoden du fått
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
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
            type="submit"
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
                Gå med
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/onboarding')}
            className="text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Skapa egen familj istället
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
