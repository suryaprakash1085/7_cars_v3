import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'sl.diginova.app',
  appName: 'Car Cliniq',
  webDir: ".next",
  server: {
    url: "https://demoax.sl-diginova.com/",
  },
};

export default config;
