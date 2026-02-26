/**
 * Background Routes
 * API endpoints for dynamic background generation
 */

import express from 'express';
import { backgroundController } from '../controllers/background.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @route   GET /api/background/current
 * @desc    Get current user's dynamic background
 * @access  Private
 * @query   width: number (optional, default 1920)
 * @query   height: number (optional, default 1080)
 * @query   format: 'png' | 'jpeg' (optional, default 'png')
 */
router.get('/current', authenticateToken, (req, res) => 
  backgroundController.getCurrentBackground(req, res)
);

/**
 * @route   GET /api/background/context
 * @desc    Get user context data for background generation
 * @access  Private
 */
router.get('/context', authenticateToken, (req, res) => 
  backgroundController.getContext(req, res)
);

/**
 * @route   GET /api/background/activity-trend
 * @desc    Get user activity trend data
 * @access  Private
 * @query   days: number (optional, default 30)
 */
router.get('/activity-trend', authenticateToken, (req, res) => 
  backgroundController.getActivityTrend(req, res)
);

/**
 * @route   GET /api/background/preview/:type
 * @desc    Get preview of a specific visualization type
 * @access  Public
 * @param   type: 'wave' | 'particle' | 'gradient' | 'graph' | 'mandala'
 * @query   width: number (optional, default 800)
 * @query   height: number (optional, default 600)
 * @query   format: 'png' | 'jpeg' (optional, default 'png')
 */
router.get('/preview/:type', (req, res) => 
  backgroundController.getPreview(req, res)
);

export default router;
