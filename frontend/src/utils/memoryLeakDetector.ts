/**
 * Memory Leak Detector
 * Detects common memory leak patterns in React Native
 */

import { useEffect, useRef } from 'react';

interface LeakDetectionResult {
  hasLeaks: boolean;
  leakTypes: string[];
  suggestions: string[];
}

class MemoryLeakDetector {
  private activeListeners: Map<string, number> = new Map();
  private activeTimers: Set<any> = new Set();
  private activeIntervals: Set<any> = new Set();
  private componentMounts: Map<string, number> = new Map();

  /**
   * Track event listener registration
   */
  trackListener(componentName: string, eventName: string): void {
    const key = `${componentName}:${eventName}`;
    const current = this.activeListeners.get(key) || 0;
    this.activeListeners.set(key, current + 1);

    if (current > 5) {
      console.warn(
        `[MemoryLeak] Possible listener leak: ${key} (${current + 1} listeners)`
      );
    }
  }

  /**
   * Track listener cleanup
   */
  untrackListener(componentName: string, eventName: string): void {
    const key = `${componentName}:${eventName}`;
    const current = this.activeListeners.get(key) || 0;
    if (current > 0) {
      this.activeListeners.set(key, current - 1);
    }
  }

  /**
   * Track setTimeout/setInterval
   */
  trackTimer(timerId: any, type: 'timeout' | 'interval'): void {
    if (type === 'timeout') {
      this.activeTimers.add(timerId);
    } else {
      this.activeIntervals.add(timerId);
    }

    // Warn if too many active timers
    if (this.activeTimers.size > 50) {
      console.warn(`[MemoryLeak] High number of active timeouts: ${this.activeTimers.size}`);
    }
    if (this.activeIntervals.size > 20) {
      console.warn(`[MemoryLeak] High number of active intervals: ${this.activeIntervals.size}`);
    }
  }

  /**
   * Track timer cleanup
   */
  untrackTimer(timerId: any, type: 'timeout' | 'interval'): void {
    if (type === 'timeout') {
      this.activeTimers.delete(timerId);
    } else {
      this.activeIntervals.delete(timerId);
    }
  }

  /**
   * Track component mount
   */
  trackMount(componentName: string): void {
    const current = this.componentMounts.get(componentName) || 0;
    this.componentMounts.set(componentName, current + 1);

    if (current > 100) {
      console.warn(
        `[MemoryLeak] Component mounted many times: ${componentName} (${current + 1} times)`
      );
    }
  }

  /**
   * Run leak detection analysis
   */
  analyze(): LeakDetectionResult {
    const leakTypes: string[] = [];
    const suggestions: string[] = [];

    // Check for orphaned listeners
    const orphanedListeners = Array.from(this.activeListeners.entries())
      .filter(([_, count]) => count > 0);
    
    if (orphanedListeners.length > 0) {
      leakTypes.push('event-listeners');
      suggestions.push(
        'Remove event listeners in useEffect cleanup:\n' +
        orphanedListeners.map(([key, count]) => `  ${key}: ${count}`).join('\n')
      );
    }

    // Check for active timers
    if (this.activeTimers.size > 10) {
      leakTypes.push('timeouts');
      suggestions.push(
        `Clear ${this.activeTimers.size} active setTimeout calls in cleanup functions`
      );
    }

    if (this.activeIntervals.size > 0) {
      leakTypes.push('intervals');
      suggestions.push(
        `Clear ${this.activeIntervals.size} active setInterval calls in cleanup functions`
      );
    }

    // Check for excessive component mounts
    const excessiveMounts = Array.from(this.componentMounts.entries())
      .filter(([_, count]) => count > 50);
    
    if (excessiveMounts.length > 0) {
      leakTypes.push('component-remounts');
      suggestions.push(
        'Components remounting excessively (may indicate missing memoization):\n' +
        excessiveMounts.map(([name, count]) => `  ${name}: ${count} mounts`).join('\n')
      );
    }

    return {
      hasLeaks: leakTypes.length > 0,
      leakTypes,
      suggestions,
    };
  }

  /**
   * Get current statistics
   */
  getStats() {
    return {
      activeListeners: this.activeListeners.size,
      activeTimeouts: this.activeTimers.size,
      activeIntervals: this.activeIntervals.size,
      componentMounts: Array.from(this.componentMounts.entries()),
    };
  }

  /**
   * Reset all tracking
   */
  reset(): void {
    this.activeListeners.clear();
    this.activeTimers.clear();
    this.activeIntervals.clear();
    this.componentMounts.clear();
  }

  /**
   * Log analysis report
   */
  logReport(): void {
    const analysis = this.analyze();
    const stats = this.getStats();

    console.log('\n=== Memory Leak Detection Report ===');
    console.log(`Active Listeners: ${stats.activeListeners}`);
    console.log(`Active Timeouts: ${stats.activeTimeouts}`);
    console.log(`Active Intervals: ${stats.activeIntervals}`);
    console.log(`Component Mounts: ${stats.componentMounts.length} types tracked`);
    
    if (analysis.hasLeaks) {
      console.log('\n⚠️  Potential Leaks Detected:');
      console.log(`Leak Types: ${analysis.leakTypes.join(', ')}`);
      console.log('\n💡 Suggestions:');
      analysis.suggestions.forEach((s, i) => {
        console.log(`\n${i + 1}. ${s}`);
      });
    } else {
      console.log('\n✅ No memory leaks detected');
    }
    
    console.log('=====================================\n');
  }
}

// Singleton instance
export const memoryLeakDetector = new MemoryLeakDetector();

/**
 * Hook to detect memory leaks in component
 */
export function useMemoryLeakDetection(componentName: string): void {
  const isMounted = useRef(true);

  useEffect(() => {
    memoryLeakDetector.trackMount(componentName);
    
    return () => {
      isMounted.current = false;
    };
  }, [componentName]);
}

/**
 * Hook to safely use setTimeout with cleanup
 */
export function useSafeTimeout(
  callback: () => void,
  delay: number
): void {
  useEffect(() => {
    const timerId = setTimeout(callback, delay);
    memoryLeakDetector.trackTimer(timerId, 'timeout');

    return () => {
      clearTimeout(timerId);
      memoryLeakDetector.untrackTimer(timerId, 'timeout');
    };
  }, [callback, delay]);
}

/**
 * Hook to safely use setInterval with cleanup
 */
export function useSafeInterval(
  callback: () => void,
  delay: number
): void {
  useEffect(() => {
    const intervalId = setInterval(callback, delay);
    memoryLeakDetector.trackTimer(intervalId, 'interval');

    return () => {
      clearInterval(intervalId);
      memoryLeakDetector.untrackTimer(intervalId, 'interval');
    };
  }, [callback, delay]);
}

/**
 * Hook to safely add event listener with cleanup tracking
 */
export function useSafeEventListener(
  componentName: string,
  target: any,
  eventName: string,
  handler: (event: any) => void
): void {
  useEffect(() => {
    if (!target || !target.addEventListener) return;

    target.addEventListener(eventName, handler);
    memoryLeakDetector.trackListener(componentName, eventName);

    return () => {
      target.removeEventListener(eventName, handler);
      memoryLeakDetector.untrackListener(componentName, eventName);
    };
  }, [componentName, target, eventName, handler]);
}
