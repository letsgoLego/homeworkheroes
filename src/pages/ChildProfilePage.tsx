import { motion } from 'framer-motion';
import { Navigation } from '@/components/Navigation';
import { useFamily } from '@/hooks/useFamily';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Smartphone, Download, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StreakStats } from '@/components/StreakStats';
import { toast } from 'sonner';
import { useState } from 'react';

export default function ChildProfilePage() {
  const { children, activeChildId, homework, loading } = useFamily();
  const { signOut, user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  const activeChild = children.find(c => c.id === activeChildId);
  
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
      <header className="sticky top-0 bg-background/95 backdrop-blur-lg z-40 safe-area-top border-b border-border">
        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Min profil</h1>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>
      
      <main className="px-4 py-4 space-y-6">
        {/* Profile card */}
        {activeChild && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-card shadow-card flex items-center gap-4"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
              style={{ backgroundColor: activeChild.color }}
            >
              {activeChild.name[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold">{activeChild.name}</h2>
              {activeChild.username && (
                <p className="text-sm text-muted-foreground">@{activeChild.username}</p>
              )}
            </div>
          </motion.div>
        )}
        
        {/* Streak Stats */}
        {activeChildId && (
          <StreakStats homework={homework} childId={activeChildId} />
        )}
        
        {/* Install App */}
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
        
        {/* Account info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-2xl bg-muted"
        >
          <p className="text-sm text-muted-foreground">
            Inloggad som <span className="font-medium text-foreground">{activeChild?.username ? `@${activeChild.username}` : user?.email}</span>
          </p>
        </motion.div>
      </main>
      
      <Navigation />
    </div>
  );
}
