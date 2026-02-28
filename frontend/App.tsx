import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, SafeAreaView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { OnboardingProvider } from './src/context/OnboardingContext';
import { useFonts } from './src/hooks/useFonts';
import { theme } from './src/theme';

export default function App() {
  const fontsLoaded = useFonts();

  // Temporarily skip font loading check for web demo
  // if (!fontsLoaded) {
  //   return null;
  // }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <OnboardingProvider>
          <SafeAreaView style={styles.container}>
            <AppNavigator />
          </SafeAreaView>
          <StatusBar style="auto" />
        </OnboardingProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
});
