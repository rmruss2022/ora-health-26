import { Router } from 'express';
import { voiceController } from '../controllers/voice.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Token minting can be used by the chat voice client even when dev mock auth
// has not successfully produced a JWT yet.
router.post('/conversation-token', voiceController.createConversationToken.bind(voiceController));
router.use(authenticateToken);
router.post('/tool-call', voiceController.executeToolCall.bind(voiceController));

export default router;
