import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { OnboardingProvider } from './src/context/OnboardingContext';
import { useFonts } from './src/hooks/useFonts';
import { theme } from './src/theme';
import { ElevenLabsAgentProvider } from './src/providers/ElevenLabsAgentProvider';

export default function App() {
  const fontsLoaded = useFonts();

  // Temporarily skip font loading check for web demo
  // if (!fontsLoaded) {
  //   return null;
  // }

  return (
    <SafeAreaProvider>
      <ElevenLabsAgentProvider>
        <AuthProvider>
          <OnboardingProvider>
            <View style={styles.container}>
              <AppNavigator />
            </View>
            <StatusBar style="auto" />
          </OnboardingProvider>
        </AuthProvider>
      </ElevenLabsAgentProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
});
