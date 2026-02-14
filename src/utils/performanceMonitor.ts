/**
 * Performance Monitor
 * Tracks FPS, memory usage, and screen transition times
 */

import { InteractionManager, PerformanceObserver, PerformanceEntry } from 'react-native';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number; // MB
  screenTransitionTime: number; // ms
  timestamp: Date;
}

interface TransitionMetrics {
  screen: string;
  duration: number;
  timestamp: Date;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private transitionMetrics: TransitionMetrics[] = [];
  private frameTimestamps: number[] = [];
  private lastFrameTime: number = 0;
  private isMonitoring: boolean = false;
  
  // Thresholds
  private readonly TARGET_FPS = 60;
  private readonly TARGET_TRANSITION_MS = 300;
  private readonly MEMORY_WARNING_MB = 100;

  /**
   * Start performance monitoring
   */
  start(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.startFPSMonitoring();
    this.startMemoryMonitoring();
    
    console.log('[PerformanceMonitor] Monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stop(): void {
    this.isMonitoring = false;
    console.log('[PerformanceMonitor] Monitoring stopped');
  }

  /**
   * Monitor FPS using requestAnimationFrame
   */
  private startFPSMonitoring(): void {
    const measureFPS = () => {
      if (!this.isMonitoring) return;

      const now = performance.now();
      
      if (this.lastFrameTime > 0) {
        const frameDuration = now - this.lastFrameTime;
        this.frameTimestamps.push(frameDuration);
        
        // Keep only last 60 frames (1 second at 60fps)
        if (this.frameTimestamps.length > 60) {
          this.frameTimestamps.shift();
        }
      }
      
      this.lastFrameTime = now;
      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  /**
   * Monitor memory usage (approximate for React Native)
   */
  private startMemoryMonitoring(): void {
    const checkMemory = () => {
      if (!this.isMonitoring) return;

      // Note: Actual memory monitoring requires native modules
      // This is a simplified version
      const metrics: PerformanceMetrics = {
        fps: this.getCurrentFPS(),
        memoryUsage: this.getMemoryUsage(),
        screenTransitionTime: this.getAverageTransitionTime(),
        timestamp: new Date(),
      };

      this.metrics.push(metrics);
      
      // Keep only last hour of data
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      this.metrics = this.metrics.filter(
        m => m.timestamp.getTime() > oneHourAgo
      );

      // Check for warnings
      if (metrics.fps < this.TARGET_FPS * 0.8) {
        console.warn(`[Performance] Low FPS detected: ${metrics.fps.toFixed(1)}`);
      }
      
      if (metrics.memoryUsage > this.MEMORY_WARNING_MB) {
        console.warn(`[Performance] High memory usage: ${metrics.memoryUsage.toFixed(1)}MB`);
      }

      setTimeout(checkMemory, 5000); // Check every 5 seconds
    };

    setTimeout(checkMemory, 5000);
  }

  /**
   * Calculate current FPS from recent frames
   */
  getCurrentFPS(): number {
    if (this.frameTimestamps.length < 10) return 60; // Default

    const avgFrameDuration = 
      this.frameTimestamps.reduce((a, b) => a + b, 0) / this.frameTimestamps.length;
    
    const fps = 1000 / avgFrameDuration;
    return Math.min(60, Math.max(0, fps)); // Clamp to 0-60
  }

  /**
   * Get approximate memory usage
   * Note: Requires native module for accurate measurement
   */
  private getMemoryUsage(): number {
    // This is a placeholder - actual implementation would use:
    // - Native module (react-native-device-info)
    // - Or Hermes memory profiler
    // - Or custom native bridge
    
    // Return estimate based on metrics size
    const estimatedMB = this.metrics.length * 0.001 + 
                        this.transitionMetrics.length * 0.0005;
    return estimatedMB;
  }

  /**
   * Track screen transition time
   */
  trackTransition(screenName: string, startTime: number): void {
    const duration = performance.now() - startTime;
    
    this.transitionMetrics.push({
      screen: screenName,
      duration,
      timestamp: new Date(),
    });

    // Keep only last 100 transitions
    if (this.transitionMetrics.length > 100) {
      this.transitionMetrics.shift();
    }

    if (duration > this.TARGET_TRANSITION_MS) {
      console.warn(`[Performance] Slow transition to ${screenName}: ${duration.toFixed(0)}ms`);
    }
  }

  /**
   * Get average transition time for recent screens
   */
  private getAverageTransitionTime(): number {
    if (this.transitionMetrics.length === 0) return 0;

    const recent = this.transitionMetrics.slice(-10);
    const avg = recent.reduce((sum, m) => sum + m.duration, 0) / recent.length;
    return avg;
  }

  /**
   * Get performance report
   */
  getReport(): {
    currentFPS: number;
    averageFPS: number;
    memoryUsage: number;
    averageTransitionTime: number;
    slowTransitions: TransitionMetrics[];
    warnings: string[];
  } {
    const warnings: string[] = [];
    const currentFPS = this.getCurrentFPS();
    const avgTransitionTime = this.getAverageTransitionTime();

    // Calculate average FPS over last minute
    const recentMetrics = this.metrics.slice(-12); // Last minute (5s intervals)
    const averageFPS = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.fps, 0) / recentMetrics.length
      : currentFPS;

    // Find slow transitions
    const slowTransitions = this.transitionMetrics.filter(
      t => t.duration > this.TARGET_TRANSITION_MS
    );

    // Generate warnings
    if (averageFPS < this.TARGET_FPS * 0.9) {
      warnings.push(`Average FPS below target: ${averageFPS.toFixed(1)} (target: ${this.TARGET_FPS})`);
    }

    if (avgTransitionTime > this.TARGET_TRANSITION_MS) {
      warnings.push(`Average transition time above target: ${avgTransitionTime.toFixed(0)}ms`);
    }

    const memUsage = this.getMemoryUsage();
    if (memUsage > this.MEMORY_WARNING_MB) {
      warnings.push(`High memory usage: ${memUsage.toFixed(1)}MB`);
    }

    return {
      currentFPS,
      averageFPS,
      memoryUsage: memUsage,
      averageTransitionTime: avgTransitionTime,
      slowTransitions: slowTransitions.slice(-10),
      warnings,
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = [];
    this.transitionMetrics = [];
    this.frameTimestamps = [];
    console.log('[PerformanceMonitor] Metrics reset');
  }

  /**
   * Log performance summary
   */
  logSummary(): void {
    const report = this.getReport();
    
    console.log('\n=== Performance Summary ===');
    console.log(`FPS: ${report.currentFPS.toFixed(1)} (avg: ${report.averageFPS.toFixed(1)})`);
    console.log(`Memory: ${report.memoryUsage.toFixed(1)}MB`);
    console.log(`Avg Transition: ${report.averageTransitionTime.toFixed(0)}ms`);
    console.log(`Slow Transitions: ${report.slowTransitions.length}`);
    
    if (report.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      report.warnings.forEach(w => console.log(`  - ${w}`));
    }
    
    console.log('==========================\n');
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * HOC to track screen transition performance
 */
export function withPerformanceTracking(
  ScreenComponent: React.ComponentType<any>,
  screenName: string
) {
  return function PerformanceTrackedScreen(props: any) {
    const [startTime] = React.useState(performance.now());

    React.useEffect(() => {
      // Track when component mounts (screen is ready)
      InteractionManager.runAfterInteractions(() => {
        performanceMonitor.trackTransition(screenName, startTime);
      });
    }, []);

    return <ScreenComponent {...props} />;
  };
}
