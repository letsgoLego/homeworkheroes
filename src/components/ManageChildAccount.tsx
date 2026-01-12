import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Lock, Check, X } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Child = Tables<'children'>;

interface ManageChildAccountProps {
  child: Child;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function ManageChildAccount({ child, open, onClose, onUpdate }: ManageChildAccountProps) {
  const [username, setUsername] = useState(child.username || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const hasAccount = child.has_account;

  const handleCreateAccount = async () => {
    if (!username.trim()) {
      toast.error('Ange ett användarnamn');
      return;
    }

    if (password.length < 6) {
      toast.error('Lösenordet måste vara minst 6 tecken');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Lösenorden matchar inte');
      return;
    }

    // Validate username (only letters, numbers, underscore, 3-20 characters)
    // This matches the database trigger validation
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      toast.error('Användarnamn måste vara 3-20 tecken (bokstäver, siffror, understreck)');
      return;
    }

    setLoading(true);

    try {
      // Create auth user with generated email
      const email = `${username.toLowerCase().trim()}@laxhjalpen.child`;
      
      // Note: We don't store sensitive metadata in auth.users.raw_user_meta_data
      // Authorization is handled via user_roles table with RLS policies
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          toast.error('Det användarnamnet är upptaget. Välj ett annat.');
        } else {
          throw authError;
        }
        return;
      }

      if (!authData.user) {
        throw new Error('Kunde inte skapa konto');
      }

      // Update child record with username
      const { error: updateError } = await supabase
        .from('children')
        .update({ 
          username: username.toLowerCase().trim(),
          has_account: true,
        })
        .eq('id', child.id);

      if (updateError) throw updateError;

      // Get family_id from child
      const { data: childData } = await supabase
        .from('children')
        .select('family_id')
        .eq('id', child.id)
        .single();

      if (childData) {
        // Add user role for child
        await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'child',
            family_id: childData.family_id,
            child_id: child.id,
          });
      }

      toast.success(`Konto skapat för ${child.name}! 🎉`);
      onUpdate();
      onClose();
    } catch (err: any) {
      console.error('Error creating child account:', err);
      toast.error(err.message || 'Kunde inte skapa konto');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (password.length < 6) {
      toast.error('Lösenordet måste vara minst 6 tecken');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Lösenorden matchar inte');
      return;
    }

    setLoading(true);

    try {
      // We need to use admin functions for this, but for now show info
      toast.info('Kontakta support för att återställa barnets lösenord');
    } catch (err: any) {
      console.error('Error resetting password:', err);
      toast.error(err.message || 'Kunde inte återställa lösenord');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: child.color }}
            >
              {child.name[0]}
            </div>
            {hasAccount ? 'Hantera konto' : 'Skapa inloggning'} för {child.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {hasAccount ? (
            <>
              <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                <div className="flex items-center gap-2 text-success">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Konto aktivt</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Användarnamn: <span className="font-mono font-medium">{child.username}</span>
                </p>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Återställ lösenord</p>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="newPassword">Nytt lösenord</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirmNewPassword">Bekräfta lösenord</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmNewPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleResetPassword}
                    disabled={loading || !password || !confirmPassword}
                    variant="outline"
                    className="w-full"
                  >
                    Återställ lösenord
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Skapa ett konto så att {child.name} kan logga in själv och se sina läxor.
              </p>

              <div>
                <Label htmlFor="username">Användarnamn</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="barnets_namn"
                    className="pl-9"
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  3-20 tecken, bara bokstäver, siffror och understreck
                </p>
              </div>

              <div>
                <Label htmlFor="password">Lösenord</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Bekräfta lösenord</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9"
                  />
                </div>
              </div>

              <Button
                onClick={handleCreateAccount}
                disabled={loading || !username || !password || !confirmPassword}
                className="w-full"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                  />
                ) : (
                  'Skapa konto'
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
