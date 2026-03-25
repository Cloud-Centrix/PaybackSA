import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import * as Sentry from '@sentry/react-native';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';
import { AppNavigator } from './src/navigation';
import { usePremiumStore } from './src/store/premiumStore';

SplashScreen.preventAutoHideAsync();

const extra = Constants.expoConfig?.extra ?? {};

Sentry.init({
  dsn: extra.sentryDsn || '',
  enabled: !__DEV__,
  tracesSampleRate: 0.2,
});

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={ebStyles.container}>
          <Text style={ebStyles.emoji}>😵</Text>
          <Text style={ebStyles.title}>Something went wrong</Text>
          <Text style={ebStyles.message}>{this.state.error}</Text>
          <TouchableOpacity
            style={ebStyles.button}
            onPress={() => this.setState({ hasError: false, error: '' })}
          >
            <Text style={ebStyles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const ebStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#F8F6F2',
  },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#2C2C2C', marginBottom: 8 },
  message: { fontSize: 14, color: '#6B6B6B', textAlign: 'center', marginBottom: 24 },
  button: {
    backgroundColor: '#2D7987',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});

export default function App() {
  const checkEntitlement = usePremiumStore((s) => s.checkEntitlement);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        if (Platform.OS !== 'web') {
          Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.ERROR);
          const apiKey =
            Platform.OS === 'ios'
              ? extra.revenueCatIosKey
              : extra.revenueCatAndroidKey;
          if (apiKey) {
            Purchases.configure({ apiKey });
            await checkEntitlement();
          }
        }
      } finally {
        setAppReady(true);
      }
    };
    init();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <NavigationContainer>
            <StatusBar style="dark" />
            <AppNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
