/**
 * Dynamic Background Component
 * Displays context-aware background images based on user activity
 */

import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { API_CONFIG } from '../config/api';

interface DynamicBackgroundProps {
  refreshInterval?: number; // milliseconds, default 5 minutes
  opacity?: number; // 0-1, default 0.3
  children?: React.ReactNode;
}

export const DynamicBackground: React.FC<DynamicBackgroundProps> = ({
  refreshInterval = 5 * 60 * 1000, // 5 minutes
  opacity = 0.3,
  children,
}) => {
  const [backgroundUri, setBackgroundUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { width, height } = Dimensions.get('window');

  /**
   * Fetch fresh background from API
   */
  const fetchBackground = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build API URL with dimensions
      const url = `${API_CONFIG.api.baseURL}/api/background/current?width=${Math.floor(width)}&height=${Math.floor(height)}&format=jpeg&t=${Date.now()}`;
      
      // Set the image URI (will trigger image load with auth headers)
      setBackgroundUri(url);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching background:', err);
      setError(err instanceof Error ? err.message : 'Failed to load background');
      setLoading(false);
    }
  };

  /**
   * Initial load
   */
  useEffect(() => {
    fetchBackground();
  }, []);

  /**
   * Set up refresh interval
   */
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(() => {
      fetchBackground();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  /**
   * Reload when dimensions change (orientation, window resize)
   */
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      fetchBackground();
    });

    return () => subscription?.remove();
  }, []);

  return (
    <View style={styles.container}>
      {backgroundUri && !error && (
        <Image
          source={{ uri: backgroundUri }}
          style={[
            styles.background,
            { opacity: loading ? 0 : opacity },
          ]}
          resizeMode="cover"
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={(e) => {
            console.error('Image load error:', e.nativeEvent.error);
            setError('Failed to load background image');
            setLoading(false);
          }}
        />
      )}
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      )}
      
      {children && <View style={styles.content}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});

export default DynamicBackground;
