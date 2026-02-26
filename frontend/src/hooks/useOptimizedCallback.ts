/**
 * Optimized Hooks
 * Enhanced useCallback and useMemo with dependency tracking
 */

import { useCallback, useMemo, useRef, DependencyList } from 'react';

/**
 * Development mode flag
 */
const __DEV__ = process.env.NODE_ENV === 'development';

/**
 * Track callback/memo dependencies in development
 */
function trackDependencies(
  hookName: string,
  componentName: string,
  deps: DependencyList | undefined
): void {
  if (!__DEV__) return;

  const depsKey = deps?.map(d => 
    typeof d === 'object' ? JSON.stringify(d) : String(d)
  ).join(',') || 'no-deps';

  console.log(`[${hookName}] ${componentName} dependencies: ${depsKey}`);
}

/**
 * Enhanced useCallback with dependency tracking
 * Helps identify unnecessary re-creations in development
 */
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList,
  componentName: string = 'Unknown'
): T {
  const callCount = useRef(0);

  if (__DEV__) {
    callCount.current++;
    if (callCount.current > 1) {
      trackDependencies('useOptimizedCallback', componentName, deps);
    }
  }

  return useCallback(callback, deps);
}

/**
 * Enhanced useMemo with dependency tracking
 */
export function useOptimizedMemo<T>(
  factory: () => T,
  deps: DependencyList,
  componentName: string = 'Unknown'
): T {
  const callCount = useRef(0);

  if (__DEV__) {
    callCount.current++;
    if (callCount.current > 1) {
      trackDependencies('useOptimizedMemo', componentName, deps);
    }
  }

  return useMemo(factory, deps);
}

/**
 * Hook to detect unnecessary re-renders
 * Logs when component re-renders and which props changed
 */
export function useWhyDidYouUpdate(
  name: string,
  props: Record<string, any>
): void {
  const previousProps = useRef<Record<string, any>>();

  if (!__DEV__) return;

  if (previousProps.current) {
    const allKeys = Object.keys({ ...previousProps.current, ...props });
    const changedProps: Record<string, { from: any; to: any }> = {};

    allKeys.forEach(key => {
      if (previousProps.current![key] !== props[key]) {
        changedProps[key] = {
          from: previousProps.current![key],
          to: props[key],
        };
      }
    });

    if (Object.keys(changedProps).length > 0) {
      console.log(`[WhyDidYouUpdate] ${name} changed:`, changedProps);
    }
  }

  previousProps.current = props;
}

/**
 * Hook to measure component render time
 */
export function useRenderTime(componentName: string): void {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  if (!__DEV__) return;

  renderCount.current++;

  // Measure after render completes
  Promise.resolve().then(() => {
    const renderTime = performance.now() - startTime.current;
    
    if (renderTime > 16) { // More than 1 frame at 60fps
      console.warn(
        `[RenderTime] ${componentName} took ${renderTime.toFixed(2)}ms (render #${renderCount.current})`
      );
    }
    
    startTime.current = performance.now();
  });
}

/**
 * Debounced callback for expensive operations
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: DependencyList
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay, ...deps]
  );
}

/**
 * Throttled callback for scroll/input events
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: DependencyList
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args: any[]) => {
      const now = Date.now();
      
      if (now - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRun.current = Date.now();
        }, delay - (now - lastRun.current));
      }
    }) as T,
    [callback, delay, ...deps]
  );
}

/**
 * Stable callback that never changes reference
 * Useful for callbacks passed to memoized components
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback);
  
  // Update ref on every render
  callbackRef.current = callback;

  // Return stable function that calls current callback
  return useCallback(
    ((...args: any[]) => callbackRef.current(...args)) as T,
    []
  );
}
