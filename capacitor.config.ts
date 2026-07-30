import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.35a2792688ca43f9806912710e01c9f1',
  appName: 'homeworkheroes',
  webDir: 'dist',
  server: {
    url: 'https://35a27926-88ca-43f9-8069-12710e01c9f1.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#2eb8a6',
    },
  },
};

export default config;
