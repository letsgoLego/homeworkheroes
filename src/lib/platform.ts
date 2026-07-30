import { Capacitor } from '@capacitor/core';

/** True when running inside the native iOS/Android app (Capacitor shell). */
export const isNative = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

/** 'ios' | 'android' | 'web' */
export const nativePlatform = (): 'ios' | 'android' | 'web' => {
  try {
    const p = Capacitor.getPlatform();
    return p === 'ios' || p === 'android' ? p : 'web';
  } catch {
    return 'web';
  }
};
