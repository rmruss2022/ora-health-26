// Onboarding Routes

import { Router } from 'express';
import { onboardingController } from '../controllers/onboarding.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

// POST /api/users/:id/onboarding — save AI intake transcript
router.post('/:id/onboarding', onboardingController.saveTranscript.bind(onboardingController));

export default router;
