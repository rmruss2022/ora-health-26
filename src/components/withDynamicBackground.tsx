/**
 * Higher-Order Component: withDynamicBackground
 * Wraps any screen component with a dynamic background
 */

import React from 'react';
import { DynamicBackground } from './DynamicBackground';

interface BackgroundOptions {
  refreshInterval?: number;
  opacity?: number;
}

/**
 * HOC to add dynamic background to any screen
 * 
 * @example
 * const HomeScreenWithBackground = withDynamicBackground(HomeScreen, {
 *   opacity: 0.2,
 *   refreshInterval: 300000, // 5 minutes
 * });
 */
export function withDynamicBackground<P extends object>(
  Component: React.ComponentType<P>,
  options: BackgroundOptions = {}
) {
  return function WithDynamicBackgroundComponent(props: P) {
    return (
      <DynamicBackground
        refreshInterval={options.refreshInterval}
        opacity={options.opacity}
      >
        <Component {...props} />
      </DynamicBackground>
    );
  };
}

export default withDynamicBackground;
