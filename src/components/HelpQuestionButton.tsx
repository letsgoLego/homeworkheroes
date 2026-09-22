import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CircleHelp, Loader2, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { track } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const NEW_ACCOUNT_DAYS = 30;

function useIsNewParent() {
  const { user } = useAuth();

  const { data: isParent } = useQuery({
    queryKey: ['is-parent', user?.id],
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id)
        .limit(1)
        .maybeSingle();
      return data?.role === 'parent' || data?.role === 'admin';
    },
  });

  if (!user || !isParent) return false;
  const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
  const ageDays = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
  return ageDays <= NEW_ACCOUNT_DAYS;
}

export function HelpQuestionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (message.trim().length < 3) {
      toast.error('Skriv gärna några ord så vi förstår vad du behöver hjälp med.');
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-help-question', {
        body: { message: message.trim() },
      });
      if (error) throw error;
      track('help_question_sent');
      toast.success('Tack för din fråga! Vi återkommer till din e-post så snart vi kan. 💬');
      setMessage('');
      onOpenChange(false);
    } catch {
      toast.error('Det gick inte att skicka just nu – försök igen om en liten stund.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Kör du fast? 💬</DialogTitle>
          <DialogDescription>
            Skriv din fråga så svarar vi så snart vi kan – svaret kommer till din e-post.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="T.ex. Hur lägger jag till ett andra barn?"
          rows={4}
          maxLength={2000}
          autoFocus
        />
        <Button onClick={handleSend} disabled={sending} className="w-full">
          {sending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Skicka fråga
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function HelpQuestionButton() {
  const isNewParent = useIsNewParent();
  const [open, setOpen] = useState(false);

  if (!isNewParent) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ställ en fråga – få hjälp"
        className="fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 md:bottom-8 md:right-8"
      >
        <CircleHelp className="h-6 w-6" />
      </button>
      <HelpQuestionDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
