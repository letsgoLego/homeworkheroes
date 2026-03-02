import { motion } from 'framer-motion';
import { Bell, BellOff, BookOpen, ClipboardCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useNotifications } from '@/hooks/useNotifications';

export function NotificationSettings() {
  const {
    isSupported,
    isSubscribed,
    permission,
    preferences,
    loading,
    subscribe,
    unsubscribe,
    updatePreference,
  } = useNotifications();

  if (!isSupported) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl bg-muted"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-muted-foreground/10 flex items-center justify-center">
            <BellOff className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-bold">Notifieringar</h3>
            <p className="text-sm text-muted-foreground">
              Din webbläsare stöder inte push-notifieringar
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 rounded-2xl bg-card shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-3 w-40 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-card shadow-card space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold">Notifieringar</h3>
            <p className="text-sm text-muted-foreground">
              {isSubscribed ? 'Påminnelser aktiverade' : 'Få påminnelser om läxor'}
            </p>
          </div>
        </div>
      </div>

      {/* Enable/disable button */}
      {!isSubscribed ? (
        <Button onClick={subscribe} className="w-full" variant="default">
          <Bell className="w-4 h-4 mr-2" />
          Aktivera notifieringar
        </Button>
      ) : (
        <>
          {/* Notification type toggles */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Nya läxor</p>
                  <p className="text-xs text-muted-foreground">Vardagar kl. 14:30</p>
                </div>
              </div>
              <Switch
                checked={preferences.notify_new_homework}
                onCheckedChange={(checked) => updatePreference('notify_new_homework', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="w-5 h-5 text-warning" />
                <div>
                  <p className="text-sm font-medium">Ogjorda uppgifter</p>
                  <p className="text-xs text-muted-foreground">Kl. 15:30</p>
                </div>
              </div>
              <Switch
                checked={preferences.notify_unfinished}
                onCheckedChange={(checked) => updatePreference('notify_unfinished', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-destructive" />
                <div>
                  <p className="text-sm font-medium">Kvällspåminnelse</p>
                  <p className="text-xs text-muted-foreground">Kl. 18:30</p>
                </div>
              </div>
              <Switch
                checked={preferences.notify_reminder}
                onCheckedChange={(checked) => updatePreference('notify_reminder', checked)}
              />
            </div>
          </div>

          {/* Disable button */}
          <Button onClick={unsubscribe} variant="ghost" size="sm" className="w-full text-muted-foreground">
            <BellOff className="w-4 h-4 mr-2" />
            Stäng av alla notifieringar
          </Button>
        </>
      )}

      {permission === 'denied' && (
        <p className="text-xs text-destructive text-center">
          Notifieringar är blockerade. Ändra i din webbläsares inställningar.
        </p>
      )}
    </motion.div>
  );
}
