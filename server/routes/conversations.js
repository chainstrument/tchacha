import { Router } from 'express';
import Conversation from '../models/Conversation.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  const conversations = await Conversation.find({ participants: req.userId })
    .populate('participants', 'username email')
    .sort({ createdAt: -1 });

  res.json(conversations);
});

export default router;
