/**
 * Background Controller
 * Handles dynamic background generation requests
 */

import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { backgroundContextService } from '../services/backgroundContext.service';
import { backgroundGeneratorService } from '../services/backgroundGenerator.service';

export class BackgroundController {
  /**
   * GET /api/background/current
   * Generate and return current user's dynamic background
   */
  async getCurrentBackground(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Get dimensions from query params
      const width = parseInt(req.query.width as string) || 1920;
      const height = parseInt(req.query.height as string) || 1080;
      const format = (req.query.format as 'png' | 'jpeg') || 'png';

      // Get user context
      const context = await backgroundContextService.getUserContext(userId);
      
      // Generate visualization data
      const vizData = backgroundContextService.generateVisualizationData(context);
      
      // Generate background image
      const imageBuffer = await backgroundGeneratorService.generateBackground(
        vizData,
        { width, height, format }
      );

      // Set appropriate headers
      res.set({
        'Content-Type': format === 'png' ? 'image/png' : 'image/jpeg',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'Content-Length': imageBuffer.length,
      });

      res.send(imageBuffer);
    } catch (error) {
      console.error('Error generating background:', error);
      res.status(500).json({ 
        error: 'Failed to generate background',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/background/context
   * Get user context data (for debugging/preview)
   */
  async getContext(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const context = await backgroundContextService.getUserContext(userId);
      const vizData = backgroundContextService.generateVisualizationData(context);

      res.json({
        context,
        visualization: {
          type: vizData.type,
          colors: vizData.colors,
          intensity: vizData.intensity,
          complexity: vizData.complexity,
          dataPoints: vizData.data.length,
        },
      });
    } catch (error) {
      console.error('Error getting context:', error);
      res.status(500).json({ 
        error: 'Failed to get context',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/background/activity-trend
   * Get activity trend data
   */
  async getActivityTrend(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const days = parseInt(req.query.days as string) || 30;
      const trend = await backgroundContextService.getActivityTrend(userId, days);

      res.json({ trend, days });
    } catch (error) {
      console.error('Error getting activity trend:', error);
      res.status(500).json({ 
        error: 'Failed to get activity trend',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/background/preview/:type
   * Generate preview of a specific visualization type
   */
  async getPreview(req: Request, res: Response): Promise<void> {
    try {
      const type = req.params.type as any;
      const validTypes = ['wave', 'particle', 'gradient', 'graph', 'mandala'];
      
      if (!validTypes.includes(type)) {
        res.status(400).json({ error: 'Invalid visualization type' });
        return;
      }

      const width = parseInt(req.query.width as string) || 800;
      const height = parseInt(req.query.height as string) || 600;
      const format = (req.query.format as 'png' | 'jpeg') || 'png';

      // Create sample visualization data
      const vizData = {
        type,
        colors: ['#4ECDC4', '#44E3C6', '#95E1D3', '#A29BFE'],
        intensity: 0.7,
        complexity: 0.6,
        data: Array.from({ length: 30 }, () => Math.random()),
      };

      const imageBuffer = await backgroundGeneratorService.generateBackground(
        vizData,
        { width, height, format }
      );

      res.set({
        'Content-Type': format === 'png' ? 'image/png' : 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': imageBuffer.length,
      });

      res.send(imageBuffer);
    } catch (error) {
      console.error('Error generating preview:', error);
      res.status(500).json({ 
        error: 'Failed to generate preview',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const backgroundController = new BackgroundController();
