import { useState } from 'react';
import { motion } from 'framer-motion';
import { Navigation } from '@/components/Navigation';
import { AddChild } from '@/components/AddChild';
import { ManageChildAccount } from '@/components/ManageChildAccount';
import { useFamily } from '@/hooks/useFamily';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Download, Smartphone, LogOut, Copy, Check, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Child = Tables<'children'>;

export default function FamilyPage() {
  const [showAddChild, setShowAddChild] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const { children, homework, family, loading, refetch } = useFamily();
  const { signOut, user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // Listen for install prompt
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }
  
  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast.success('Appen installerad! 🎉');
      }
      setDeferredPrompt(null);
    } else {
      toast.info('För att installera: tryck på delningsknappen och "Lägg till på hemskärmen"');
    }
  };
  
  const handleCopyInviteCode = () => {
    if (family?.invite_code) {
      navigator.clipboard.writeText(family.invite_code);
      setCopied(true);
      toast.success('Inbjudningskod kopierad!');
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handleSignOut = async () => {
    await signOut();
    toast.success('Utloggad');
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-lg z-40 safe-area-top border-b border-border">
        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" />
            {family?.name || 'Familj'}
          </h1>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>
      
      <main className="px-4 py-4 space-y-6">
        {/* Invite Code */}
        {family?.invite_code && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-secondary"
          >
            <p className="text-sm text-muted-foreground mb-2">Familjens inbjudningskod</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-2xl font-mono font-bold tracking-widest">
                {family.invite_code.toUpperCase()}
              </code>
              <Button variant="outline" size="icon" onClick={handleCopyInviteCode}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Dela denna kod med familjemedlemmar för att bjuda in dem
            </p>
          </motion.div>
        )}
        
        {/* Install App Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold">Installera Läxhjälpen</h3>
              <p className="text-sm text-muted-foreground">
                Lägg till på hemskärmen för snabb åtkomst
              </p>
            </div>
          </div>
          <Button onClick={handleInstall} className="w-full" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Installera app
          </Button>
        </motion.div>
        
        {/* Children list */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Barn</h2>
            <Button
              onClick={() => setShowAddChild(true)}
              variant="ghost"
              size="sm"
            >
              + Lägg till
            </Button>
          </div>
          
          <div className="space-y-3">
            {children.map((child) => {
              const childHomework = homework.filter((hw) => hw.child_id === child.id);
              const activeCount = childHomework.filter((hw) => !hw.completed).length;
              const today = format(new Date(), 'yyyy-MM-dd');
              const todayTasks = childHomework.flatMap((hw) =>
                hw.tasks.filter(
                  (t) => t.task_date === today && !t.completed
                )
              );
              
              return (
                <motion.div
                  key={child.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 rounded-2xl bg-card shadow-card"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white"
                      style={{ backgroundColor: child.color }}
                    >
                      {child.name[0]}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{child.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {activeCount} aktiva läxor
                        {child.has_account && (
                          <span className="ml-2 text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
                            Har konto
                          </span>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedChild(child)}
                    >
                      <Settings className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  {todayTasks.length > 0 ? (
                    <div className="p-3 rounded-xl bg-accent/20">
                      <p className="text-sm font-medium">
                        📝 {todayTasks.length} uppgifter idag
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-success/10">
                      <p className="text-sm font-medium text-success">
                        ✓ Allt klart för idag!
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>
        
        {/* Account info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-2xl bg-muted"
        >
          <p className="text-sm text-muted-foreground">
            Inloggad som <span className="font-medium text-foreground">{user?.email}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ✨ Data synkas automatiskt mellan alla enheter
          </p>
        </motion.div>
      </main>
      
      <Navigation />
      <AddChild open={showAddChild} onClose={() => setShowAddChild(false)} />
      {selectedChild && (
        <ManageChildAccount
          child={selectedChild}
          open={!!selectedChild}
          onClose={() => setSelectedChild(null)}
          onUpdate={refetch}
        />
      )}
    </div>
  );
}
