import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.multiciber.app',
  appName: 'Multiciber',
  webDir: '.next',
  // URL de producción en Vercel
  server: {
    url: 'https://multiciber-fzio.vercel.app/',
    cleartext: false,
    androidScheme: 'https'
  }
};

export default config;
