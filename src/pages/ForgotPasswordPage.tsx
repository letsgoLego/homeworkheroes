import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BookOpen, Mail, ArrowLeft, Send } from 'lucide-react';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Ange din e-postadress');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setSent(true);
      toast.success('Mejl skickat! Kolla din inkorg 📬');
    } catch {
      toast.error('Något gick fel. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 shadow-glow-primary">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Glömt lösenord?</h1>
          <p className="text-muted-foreground">
            Vi skickar en återställningslänk till din e-post
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-sm"
        >
          {sent ? (
            <div className="space-y-4 text-center">
              <div className="p-6 rounded-xl bg-success/10 border border-success/20">
                <p className="text-sm">
                  Vi har skickat en återställningslänk till <strong>{email}</strong>.
                  Klicka på länken i mejlet för att välja ett nytt lösenord.
                </p>
              </div>
              <Button onClick={() => navigate('/auth')} variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Tillbaka till inloggning
              </Button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">E-post</Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="du@exempel.se"
                      className="pl-10"
                      autoCapitalize="none"
                      autoCorrect="off"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 text-lg shadow-glow-primary">
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                    />
                  ) : (
                    <>
                      Skicka länk
                      <Send className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>
              <div className="mt-6 text-center">
                <Button variant="ghost" onClick={() => navigate('/auth')} className="text-muted-foreground">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Tillbaka till inloggning
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </div>
      <div className="text-center pb-8 text-sm text-muted-foreground px-6">
        <p>Barnkonton återställs av en förälder under Familj-fliken.</p>
      </div>
    </div>
  );
}
