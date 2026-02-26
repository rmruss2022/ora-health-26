import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const KEY_PREFIX = '@ora:aura-seen';

const todayStr = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

/**
 * Tracks whether the floating Aura agent has already auto-expanded and spoken
 * to the user today for a given context (home / community).
 *
 * Re-checks AsyncStorage on every screen focus so it handles:
 *  - Tab switching (coming back to Home after visiting Community)
 *  - App restarts
 *  - Cross-midnight transitions (new day → not seen yet)
 *
 * seenToday === null  →  still loading (AsyncStorage read in flight)
 * seenToday === false →  first visit today, go ahead and auto-show
 * seenToday === true  →  already shown today, stay quiet
 */
export const useAuraSeenToday = (context: string) => {
  const [seenToday, setSeenToday] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      setSeenToday(null); // reset to "loading" on each focus
      AsyncStorage.getItem(`${KEY_PREFIX}:${context}`)
        .then((val) => setSeenToday(val === todayStr()))
        .catch(() => setSeenToday(false)); // assume not seen on storage error
    }, [context])
  );

  const markSeen = useCallback(async () => {
    try {
      await AsyncStorage.setItem(`${KEY_PREFIX}:${context}`, todayStr());
      setSeenToday(true);
    } catch (_) {}
  }, [context]);

  return {
    /** null while AsyncStorage check is in flight */
    seenToday,
    /** Convenience alias — true while loading */
    loading: seenToday === null,
    /** Persist today's date so subsequent visits are quiet */
    markSeen,
  };
};
