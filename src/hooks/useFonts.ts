import { useEffect, useState } from 'react';
import * as Font from 'expo-font';

/**
 * Custom hook to load Ora brand fonts (Sentient + Switzer)
 * 
 * Font Families:
 * - Sentient: Primary display and body font (10 weights)
 * - Switzer: Secondary UI and button font (18 weights)
 * 
 * Usage:
 * ```tsx
 * const fontsLoaded = useFonts();
 * if (!fontsLoaded) return <LoadingScreen />;
 * ```
 */
export const useFonts = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          // Sentient Font Family (Primary - Display & Body)
          'Sentient-Extralight': require('../../assets/fonts/Sentient-Extralight.otf'),
          'Sentient-ExtralightItalic': require('../../assets/fonts/Sentient-ExtralightItalic.otf'),
          'Sentient-Light': require('../../assets/fonts/Sentient-Light.otf'),
          'Sentient-LightItalic': require('../../assets/fonts/Sentient-LightItalic.otf'),
          'Sentient-Regular': require('../../assets/fonts/Sentient-Regular.otf'),
          'Sentient-Italic': require('../../assets/fonts/Sentient-Italic.otf'),
          'Sentient-Medium': require('../../assets/fonts/Sentient-Medium.otf'),
          'Sentient-MediumItalic': require('../../assets/fonts/Sentient-MediumItalic.otf'),
          'Sentient-Bold': require('../../assets/fonts/Sentient-Bold.otf'),
          'Sentient-BoldItalic': require('../../assets/fonts/Sentient-BoldItalic.otf'),

          // Switzer Font Family (Secondary - UI & Buttons)
          'Switzer-Thin': require('../../assets/fonts/Switzer-Thin.otf'),
          'Switzer-ThinItalic': require('../../assets/fonts/Switzer-ThinItalic.otf'),
          'Switzer-Extralight': require('../../assets/fonts/Switzer-Extralight.otf'),
          'Switzer-ExtralightItalic': require('../../assets/fonts/Switzer-ExtralightItalic.otf'),
          'Switzer-Light': require('../../assets/fonts/Switzer-Light.otf'),
          'Switzer-LightItalic': require('../../assets/fonts/Switzer-LightItalic.otf'),
          'Switzer-Regular': require('../../assets/fonts/Switzer-Regular.otf'),
          'Switzer-Italic': require('../../assets/fonts/Switzer-Italic.otf'),
          'Switzer-Medium': require('../../assets/fonts/Switzer-Medium.otf'),
          'Switzer-MediumItalic': require('../../assets/fonts/Switzer-MediumItalic.otf'),
          'Switzer-Semibold': require('../../assets/fonts/Switzer-Semibold.otf'),
          'Switzer-SemiboldItalic': require('../../assets/fonts/Switzer-SemiboldItalic.otf'),
          'Switzer-Bold': require('../../assets/fonts/Switzer-Bold.otf'),
          'Switzer-BoldItalic': require('../../assets/fonts/Switzer-BoldItalic.otf'),
          'Switzer-Extrabold': require('../../assets/fonts/Switzer-Extrabold.otf'),
          'Switzer-ExtraboldItalic': require('../../assets/fonts/Switzer-ExtraboldItalic.otf'),
          'Switzer-Black': require('../../assets/fonts/Switzer-Black.otf'),
          'Switzer-BlackItalic': require('../../assets/fonts/Switzer-BlackItalic.otf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        // Set to true anyway to prevent blocking the app
        setFontsLoaded(true);
      }
    }

    loadFonts();
  }, []);

  return fontsLoaded;
};

/**
 * Alternative: useFonts hook with error handling and loading state
 */
export const useCustomFonts = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Sentient-Extralight': require('../../assets/fonts/Sentient-Extralight.otf'),
          'Sentient-ExtralightItalic': require('../../assets/fonts/Sentient-ExtralightItalic.otf'),
          'Sentient-Light': require('../../assets/fonts/Sentient-Light.otf'),
          'Sentient-LightItalic': require('../../assets/fonts/Sentient-LightItalic.otf'),
          'Sentient-Regular': require('../../assets/fonts/Sentient-Regular.otf'),
          'Sentient-Italic': require('../../assets/fonts/Sentient-Italic.otf'),
          'Sentient-Medium': require('../../assets/fonts/Sentient-Medium.otf'),
          'Sentient-MediumItalic': require('../../assets/fonts/Sentient-MediumItalic.otf'),
          'Sentient-Bold': require('../../assets/fonts/Sentient-Bold.otf'),
          'Sentient-BoldItalic': require('../../assets/fonts/Sentient-BoldItalic.otf'),
          'Switzer-Thin': require('../../assets/fonts/Switzer-Thin.otf'),
          'Switzer-ThinItalic': require('../../assets/fonts/Switzer-ThinItalic.otf'),
          'Switzer-Extralight': require('../../assets/fonts/Switzer-Extralight.otf'),
          'Switzer-ExtralightItalic': require('../../assets/fonts/Switzer-ExtralightItalic.otf'),
          'Switzer-Light': require('../../assets/fonts/Switzer-Light.otf'),
          'Switzer-LightItalic': require('../../assets/fonts/Switzer-LightItalic.otf'),
          'Switzer-Regular': require('../../assets/fonts/Switzer-Regular.otf'),
          'Switzer-Italic': require('../../assets/fonts/Switzer-Italic.otf'),
          'Switzer-Medium': require('../../assets/fonts/Switzer-Medium.otf'),
          'Switzer-MediumItalic': require('../../assets/fonts/Switzer-MediumItalic.otf'),
          'Switzer-Semibold': require('../../assets/fonts/Switzer-Semibold.otf'),
          'Switzer-SemiboldItalic': require('../../assets/fonts/Switzer-SemiboldItalic.otf'),
          'Switzer-Bold': require('../../assets/fonts/Switzer-Bold.otf'),
          'Switzer-BoldItalic': require('../../assets/fonts/Switzer-BoldItalic.otf'),
          'Switzer-Extrabold': require('../../assets/fonts/Switzer-Extrabold.otf'),
          'Switzer-ExtraboldItalic': require('../../assets/fonts/Switzer-ExtraboldItalic.otf'),
          'Switzer-Black': require('../../assets/fonts/Switzer-Black.otf'),
          'Switzer-BlackItalic': require('../../assets/fonts/Switzer-BlackItalic.otf'),
        });
        setFontsLoaded(true);
      } catch (err) {
        console.error('Error loading fonts:', err);
        setError(err instanceof Error ? err : new Error('Unknown error loading fonts'));
        setFontsLoaded(true); // Continue anyway
      }
    }

    loadFonts();
  }, []);

  return { fontsLoaded, error };
};
