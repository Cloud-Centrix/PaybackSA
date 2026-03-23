import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'PayBack SA',
  slug: 'PayBackSA',
  scheme: 'paybacksa',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#F8F6F2',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.paybacksa.app',
    infoPlist: {
      NSCameraUsageDescription:
        'PayBack SA needs camera access to scan receipts',
    },
  },
  android: {
    package: 'com.paybacksa.app',
    adaptiveIcon: {
      backgroundColor: '#2D7987',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    permissions: ['CAMERA'],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-asset',
  ],
  extra: {
    revenueCatAndroidKey: process.env.REVENUCAT_ANDROID_API_KEY,
    revenueCatIosKey: process.env.REVENUCAT_IOS_API_KEY,
    sentryDsn: process.env.SENTRY_DSN,
    eas: {
      projectId: 'ea369e76-f2c0-43fc-810e-1e92dd0f9476',
    },
  },
  owner: 'percybosch',
  runtimeVersion: {
    policy: 'appVersion',
  },
  updates: {
    url: 'https://u.expo.dev/ea369e76-f2c0-43fc-810e-1e92dd0f9476',
  },
});
