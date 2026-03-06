import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/messages', chatController.sendMessage);
router.post('/stream', chatController.streamMessage);
router.get('/history', chatController.getChatHistory);
router.post('/behavior', chatController.switchBehavior);
router.get('/behavior', chatController.getCurrentBehavior);
router.get('/personas', chatController.getPersonas);

export default router;
