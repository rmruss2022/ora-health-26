import { Router } from 'express';
import { voiceController } from '../controllers/voice.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.post('/conversation-token', voiceController.createConversationToken.bind(voiceController));
router.post('/tool-call', voiceController.executeToolCall.bind(voiceController));

export default router;
