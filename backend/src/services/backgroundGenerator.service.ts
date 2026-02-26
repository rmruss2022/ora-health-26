/**
 * Background Generator Service
 * Generates dynamic background images using Canvas API
 */

import { createCanvas, CanvasRenderingContext2D } from 'canvas';
import { VisualizationData } from './backgroundContext.service';

export interface BackgroundOptions {
  width: number;
  height: number;
  format: 'png' | 'jpeg';
  quality?: number;
}

export class BackgroundGeneratorService {
  private readonly defaultOptions: BackgroundOptions = {
    width: 1920,
    height: 1080,
    format: 'png',
    quality: 0.9,
  };

  /**
   * Generate background image from visualization data
   */
  async generateBackground(
    vizData: VisualizationData,
    options: Partial<BackgroundOptions> = {}
  ): Promise<Buffer> {
    const opts = { ...this.defaultOptions, ...options };
    const canvas = createCanvas(opts.width, opts.height);
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, opts.width, opts.height);

    // Generate based on type
    switch (vizData.type) {
      case 'wave':
        this.drawWavePattern(ctx, vizData, opts);
        break;
      case 'particle':
        this.drawParticleSystem(ctx, vizData, opts);
        break;
      case 'gradient':
        this.drawGradientBackground(ctx, vizData, opts);
        break;
      case 'graph':
        this.drawActivityGraph(ctx, vizData, opts);
        break;
      case 'mandala':
        this.drawMandalaPattern(ctx, vizData, opts);
        break;
    }

    // Export as buffer
    if (opts.format === 'png') {
      return canvas.toBuffer('image/png');
    } else {
      return canvas.toBuffer('image/jpeg', { quality: opts.quality });
    }
  }

  private drawWavePattern(
    ctx: CanvasRenderingContext2D,
    vizData: VisualizationData,
    opts: BackgroundOptions
  ): void {
    const waves = 5;
    const amplitude = opts.height * 0.1 * vizData.intensity;
    
    for (let w = 0; w < waves; w++) {
      ctx.beginPath();
      const colorIndex = w % vizData.colors.length;
      ctx.strokeStyle = vizData.colors[colorIndex];
      ctx.lineWidth = 3 + vizData.complexity * 5;
      
      // Set opacity based on wave layer
      ctx.globalAlpha = (1 - w / waves) * 0.6;

      for (let x = 0; x <= opts.width; x += 5) {
        const dataIndex = Math.floor((x / opts.width) * vizData.data.length);
        const dataValue = vizData.data[dataIndex] || 0;
        
        // Combine sine wave with data
        const y = opts.height / 2 + 
                  Math.sin((x * 0.01) + (w * 0.5)) * amplitude * dataValue +
                  Math.sin((x * 0.02) + (w * 1.2)) * (amplitude * 0.5);
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1.0;
  }

  private drawParticleSystem(
    ctx: CanvasRenderingContext2D,
    vizData: VisualizationData,
    opts: BackgroundOptions
  ): void {
    const particleCount = Math.floor(50 + vizData.complexity * 150);
    
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * opts.width;
      const y = Math.random() * opts.height;
      const size = 2 + Math.random() * 8 * vizData.intensity;
      const colorIndex = Math.floor(Math.random() * vizData.colors.length);
      const dataIndex = Math.floor((x / opts.width) * vizData.data.length);
      const dataValue = vizData.data[dataIndex] || 0;
      
      // Particle influenced by data value
      const opacity = 0.3 + dataValue * 0.5;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = vizData.colors[colorIndex];
      ctx.globalAlpha = opacity;
      ctx.fill();
      
      // Add glow effect
      ctx.globalAlpha = opacity * 0.3;
      ctx.beginPath();
      ctx.arc(x, y, size * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.globalAlpha = 1.0;
  }

  private drawGradientBackground(
    ctx: CanvasRenderingContext2D,
    vizData: VisualizationData,
    opts: BackgroundOptions
  ): void {
    // Create radial gradient
    const centerX = opts.width / 2;
    const centerY = opts.height / 2;
    const radius = Math.max(opts.width, opts.height) * 0.7;
    
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );
    
    // Add color stops based on visualization colors
    const colorCount = vizData.colors.length;
    vizData.colors.forEach((color, i) => {
      const stop = i / (colorCount - 1 || 1);
      gradient.addColorStop(stop, color);
    });
    
    // Apply gradient with intensity-based opacity
    ctx.globalAlpha = 0.4 + vizData.intensity * 0.4;
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, opts.width, opts.height);
    ctx.globalAlpha = 1.0;
    
    // Add subtle noise texture
    this.addNoiseTexture(ctx, opts, vizData.complexity * 0.1);
  }

  private drawActivityGraph(
    ctx: CanvasRenderingContext2D,
    vizData: VisualizationData,
    opts: BackgroundOptions
  ): void {
    const padding = 100;
    const graphWidth = opts.width - padding * 2;
    const graphHeight = opts.height - padding * 2;
    const dataPoints = vizData.data.length;
    
    // Draw gradient background first
    const gradient = ctx.createLinearGradient(0, 0, 0, opts.height);
    gradient.addColorStop(0, vizData.colors[0]);
    gradient.addColorStop(1, vizData.colors[vizData.colors.length - 1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, opts.width, opts.height);
    
    // Draw graph line
    ctx.beginPath();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.8;
    
    vizData.data.forEach((value, i) => {
      const x = padding + (i / (dataPoints - 1)) * graphWidth;
      const y = padding + graphHeight - (value * graphHeight);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Fill area under curve
    ctx.lineTo(padding + graphWidth, padding + graphHeight);
    ctx.lineTo(padding, padding + graphHeight);
    ctx.closePath();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    
    ctx.globalAlpha = 1.0;
  }

  private drawMandalaPattern(
    ctx: CanvasRenderingContext2D,
    vizData: VisualizationData,
    opts: BackgroundOptions
  ): void {
    const centerX = opts.width / 2;
    const centerY = opts.height / 2;
    const maxRadius = Math.min(opts.width, opts.height) * 0.4;
    const layers = Math.floor(5 + vizData.complexity * 10);
    const segments = 12;
    
    // Gradient background
    const bgGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, maxRadius * 2
    );
    bgGradient.addColorStop(0, vizData.colors[0]);
    bgGradient.addColorStop(1, vizData.colors[vizData.colors.length - 1]);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, opts.width, opts.height);
    
    // Draw mandala layers
    for (let layer = 0; layer < layers; layer++) {
      const radius = (maxRadius / layers) * (layer + 1);
      const colorIndex = layer % vizData.colors.length;
      const dataValue = vizData.data[layer % vizData.data.length] || 0.5;
      
      ctx.beginPath();
      ctx.strokeStyle = vizData.colors[colorIndex];
      ctx.lineWidth = 2 + vizData.intensity * 3;
      ctx.globalAlpha = 0.4 + dataValue * 0.4;
      
      for (let i = 0; i <= segments; i++) {
        const angle = (Math.PI * 2 / segments) * i;
        const r = radius * (1 + Math.sin(angle * 3) * 0.1 * dataValue);
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.closePath();
      ctx.stroke();
      
      // Add decorative dots
      if (layer % 2 === 0) {
        for (let i = 0; i < segments; i++) {
          const angle = (Math.PI * 2 / segments) * i;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          
          ctx.beginPath();
          ctx.arc(x, y, 3 + vizData.intensity * 2, 0, Math.PI * 2);
          ctx.fillStyle = vizData.colors[colorIndex];
          ctx.fill();
        }
      }
    }
    
    ctx.globalAlpha = 1.0;
  }

  private addNoiseTexture(
    ctx: CanvasRenderingContext2D,
    opts: BackgroundOptions,
    intensity: number
  ): void {
    const imageData = ctx.getImageData(0, 0, opts.width, opts.height);
    const pixels = imageData.data;
    
    for (let i = 0; i < pixels.length; i += 4) {
      const noise = (Math.random() - 0.5) * 50 * intensity;
      pixels[i] += noise;     // R
      pixels[i + 1] += noise; // G
      pixels[i + 2] += noise; // B
    }
    
    ctx.putImageData(imageData, 0, 0);
  }
}

export const backgroundGeneratorService = new BackgroundGeneratorService();
