import { isNative, nativePlatform } from './platform';

export interface ReminderPrefs {
  notify_new_homework: boolean;
  notify_unfinished: boolean;
  notify_reminder: boolean;
}

const REMINDERS = [
  {
    id: 1,
    key: 'notify_new_homework' as const,
    hour: 14,
    minute: 30,
    title: 'Nya läxor?',
    body: 'Lägg in dagens läxor i Läxhjälp så ni har koll.',
  },
  {
    id: 2,
    key: 'notify_unfinished' as const,
    hour: 15,
    minute: 30,
    title: 'Ogjorda uppgifter',
    body: 'Kolla vad som är kvar att göra idag.',
  },
  {
    id: 3,
    key: 'notify_reminder' as const,
    hour: 18,
    minute: 30,
    title: 'Kvällspåminnelse',
    body: 'Hinner ni bocka av dagens läxor innan läggdags?',
  },
];

/** Ask for permission to show local notifications on the device. */
export async function requestLocalPermission(): Promise<boolean> {
  if (!isNative()) return false;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const current = await LocalNotifications.checkPermissions();
  if (current.display === 'granted') return true;
  const result = await LocalNotifications.requestPermissions();
  return result.display === 'granted';
}

/** Cancel all locally scheduled Läxhjälp reminders. */
export async function cancelLocalReminders(): Promise<void> {
  if (!isNative()) return;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const pending = await LocalNotifications.getPending();
  const ours = pending.notifications.filter((n) =>
    REMINDERS.some((r) => r.id === n.id)
  );
  if (ours.length > 0) {
    await LocalNotifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) });
  }
}

/**
 * (Re)schedule the daily reminders on the device based on the user's
 * preferences. Passing `skipAll` (e.g. during Lov-läge) cancels everything.
 */
export async function scheduleLocalReminders(
  prefs: ReminderPrefs,
  skipAll = false
): Promise<void> {
  if (!isNative()) return;
  await cancelLocalReminders();
  if (skipAll) return;

  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const notifications = REMINDERS.filter((r) => prefs[r.key]).map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    schedule: {
      on: { hour: r.hour, minute: r.minute },
      allowWhileIdle: true,
    },
  }));

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
  }
}

/**
 * Register the device with APNs/FCM and resolve the device token.
 * Resolves null when unavailable or the user declines.
 */
export async function registerPushDevice(): Promise<{
  token: string;
  platform: 'ios' | 'android';
} | null> {
  if (!isNative()) return null;
  const platform = nativePlatform();
  if (platform === 'web') return null;

  const { PushNotifications } = await import('@capacitor/push-notifications');

  const perm = await PushNotifications.checkPermissions();
  let granted = perm.receive === 'granted';
  if (!granted) {
    const requested = await PushNotifications.requestPermissions();
    granted = requested.receive === 'granted';
  }
  if (!granted) return null;

  return new Promise((resolve) => {
    let settled = false;
    const done = (value: { token: string; platform: 'ios' | 'android' } | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    PushNotifications.addListener('registration', (t) => done({ token: t.value, platform }));
    PushNotifications.addListener('registrationError', () => done(null));
    PushNotifications.register();

    setTimeout(() => done(null), 15000);
  });
}

/** Remove push listeners and unregister the device from push. */
export async function unregisterPushDevice(): Promise<void> {
  if (!isNative()) return;
  const { PushNotifications } = await import('@capacitor/push-notifications');
  await PushNotifications.removeAllListeners();
  try {
    await PushNotifications.unregister();
  } catch {
    /* not supported on all platforms */
  }
}
