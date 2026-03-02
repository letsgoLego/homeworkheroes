import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface NotificationPreferences {
  notify_new_homework: boolean;
  notify_unfinished: boolean;
  notify_reminder: boolean;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    notify_new_homework: true,
    notify_unfinished: true,
    notify_reminder: true,
  });
  const [loading, setLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const loadSubscription = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await (supabase as any)
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .limit(1);

      if (data && data.length > 0) {
        setIsSubscribed(true);
        setPreferences({
          notify_new_homework: data[0].notify_new_homework,
          notify_unfinished: data[0].notify_unfinished,
          notify_reminder: data[0].notify_reminder,
        });
      } else {
        setIsSubscribed(false);
      }
    } catch (err) {
      console.error('Error loading notification subscription:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const subscribe = async (): Promise<boolean> => {
    if (!user || !isSupported) return false;

    try {
      // Request notification permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        toast.error('Notifieringar blockerades. Ändra i webbläsarens inställningar.');
        return false;
      }

      // Get VAPID public key from edge function
      const { data: config, error: configError } = await supabase.functions.invoke('get-push-config');
      if (configError || !config?.publicKey) {
        console.error('Failed to get push config:', configError);
        toast.error('Kunde inte aktivera notifieringar');
        return false;
      }

      // Subscribe to push
      const registration = await navigator.serviceWorker.ready;
      const subscription = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.publicKey),
      });

      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        toast.error('Kunde inte aktivera notifieringar');
        return false;
      }

      // Get user's timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Store subscription in database
      const { error: insertError } = await (supabase as any)
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: json.endpoint,
          p256dh: json.keys.p256dh,
          auth_key: json.keys.auth,
          timezone,
        }, { onConflict: 'user_id,endpoint' });

      if (insertError) {
        console.error('Failed to store subscription:', insertError);
        toast.error('Kunde inte spara notifieringsinställningar');
        return false;
      }

      setIsSubscribed(true);
      toast.success('Notifieringar aktiverade! 🔔');
      return true;
    } catch (err) {
      console.error('Error subscribing to push:', err);
      toast.error('Kunde inte aktivera notifieringar');
      return false;
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      // Unsubscribe from browser push
      const registration = await navigator.serviceWorker.ready;
      const subscription = await (registration as any).pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove from database
      await (supabase as any)
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);

      setIsSubscribed(false);
      setPreferences({
        notify_new_homework: true,
        notify_unfinished: true,
        notify_reminder: true,
      });
      toast.success('Notifieringar avaktiverade');
      return true;
    } catch (err) {
      console.error('Error unsubscribing:', err);
      toast.error('Kunde inte avaktivera notifieringar');
      return false;
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await (supabase as any)
        .from('push_subscriptions')
        .update({ [key]: value })
        .eq('user_id', user.id);

      if (error) {
        toast.error('Kunde inte uppdatera inställning');
        return false;
      }

      setPreferences(prev => ({ ...prev, [key]: value }));
      return true;
    } catch (err) {
      console.error('Error updating preference:', err);
      return false;
    }
  };

  return {
    permission,
    isSubscribed,
    isSupported,
    preferences,
    loading,
    subscribe,
    unsubscribe,
    updatePreference,
  };
}
