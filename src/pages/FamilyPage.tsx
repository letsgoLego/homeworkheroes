import { useState } from 'react';
import { motion } from 'framer-motion';
import { Navigation } from '@/components/Navigation';
import { ChildSwitcher } from '@/components/ChildSwitcher';
import { AddChild } from '@/components/AddChild';
import { useHomeworkStore } from '@/stores/homeworkStore';
import { Users, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function FamilyPage() {
  const [showAddChild, setShowAddChild] = useState(false);
  const { children, homework } = useHomeworkStore();
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
        toast.success('App installed! 🎉');
      }
      setDeferredPrompt(null);
    } else {
      toast.info('To install: tap the share button and "Add to Home Screen"');
    }
  };
  
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-lg z-40 safe-area-top border-b border-border">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" />
            Family
          </h1>
        </div>
      </header>
      
      <main className="px-4 py-4 space-y-6">
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
              <h3 className="font-bold">Install HomeWork Hero</h3>
              <p className="text-sm text-muted-foreground">
                Add to your home screen for quick access
              </p>
            </div>
          </div>
          <Button onClick={handleInstall} className="w-full" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Install App
          </Button>
        </motion.div>
        
        {/* Children list */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Children</h2>
            <Button
              onClick={() => setShowAddChild(true)}
              variant="ghost"
              size="sm"
            >
              + Add
            </Button>
          </div>
          
          <div className="space-y-3">
            {children.map((child) => {
              const childHomework = homework.filter((hw) => hw.childId === child.id);
              const activeCount = childHomework.filter((hw) => !hw.completed).length;
              const todayTasks = childHomework.flatMap((hw) =>
                hw.tasks.filter(
                  (t) =>
                    t.date === new Date().toISOString().split('T')[0] &&
                    !t.completed
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
                        {activeCount} active homework
                      </p>
                    </div>
                  </div>
                  
                  {todayTasks.length > 0 ? (
                    <div className="p-3 rounded-xl bg-accent/20">
                      <p className="text-sm font-medium">
                        📝 {todayTasks.length} tasks for today
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-success/10">
                      <p className="text-sm font-medium text-success">
                        ✓ All done for today!
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>
        
        {/* Sync info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-2xl bg-muted text-center"
        >
          <p className="text-sm text-muted-foreground">
            💡 To sync between devices, connect Lovable Cloud
          </p>
        </motion.div>
      </main>
      
      <Navigation />
      <AddChild open={showAddChild} onClose={() => setShowAddChild(false)} />
    </div>
  );
}
