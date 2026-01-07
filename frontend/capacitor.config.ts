import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lenzu.timeline',
  appName: 'LenzuApp',
  webDir: 'dist',
  server: {
    // La app iOS se conectará a la API de producción
    url: 'https://lenzu.app',
    cleartext: false
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: true,
    scrollEnabled: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#FFFFFF',
      showSpinner: false
    }
  }
};

export default config;
