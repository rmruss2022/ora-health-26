/**
 * useAgentContext
 * Fetches an AI-generated, context-aware message for Ora's floating agent.
 * Results are cached in AsyncStorage for 60 seconds to avoid hammering the API.
 */

import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

type AgentScreen = 'home' | 'community' | 'chat';

const CACHE_TTL_MS = 60 * 1000; // 60 seconds

interface CachedEntry {
  message: string;
  timestamp: number;
}

export const useAgentContext = (screen: AgentScreen) => {
  const { user } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const cacheKey = `@ora:agent-message:${screen}`;

  const fetchMessage = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // Check cache first
    try {
      const raw = await AsyncStorage.getItem(cacheKey);
      if (raw) {
        const cached: CachedEntry = JSON.parse(raw);
        if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
          setMessage(cached.message);
          setLoading(false);
          return;
        }
      }
    } catch {
      // cache read failed — proceed to fetch
    }

    // Fetch fresh message from backend
    try {
      const res = await fetch(`${API_URL}/api/ora-agent/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          screen,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const msg: string = data.message;
        setMessage(msg);
        // Cache the fresh message
        await AsyncStorage.setItem(
          cacheKey,
          JSON.stringify({ message: msg, timestamp: Date.now() } as CachedEntry)
        );
      }
    } catch (err) {
      // Network/API error — fall through to null (component will use fallback)
      console.warn('[useAgentContext] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.name, screen, cacheKey]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setMessage(null);
      fetchMessage();
    }, [fetchMessage])
  );

  return { message, loading };
};
