import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// router.use(authenticateToken); // Disabled for testing

router.post('/messages', chatController.sendMessage);
router.get('/history', chatController.getChatHistory);
router.post('/behavior', chatController.switchBehavior);
router.get('/behavior', chatController.getCurrentBehavior);

export default router;
