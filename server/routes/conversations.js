import { Router } from 'express';
import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.use(requireAuth);

router.get('/search-users', async (req, res) => {
  const q = req.query.q?.trim();

  if (!q) {
    return res.json([]);
  }

  const pattern = escapeRegex(q);
  const users = await User.find({
    _id: { $ne: req.userId },
    $or: [
      { username: { $regex: pattern, $options: 'i' } },
      { email: { $regex: pattern, $options: 'i' } },
    ],
  }).select('username email').limit(10);

  res.json(users);
});

router.get('/', async (req, res) => {
  const conversations = await Conversation.find({ participants: req.userId })
    .populate('participants', 'username email')
    .sort({ createdAt: -1 });

  res.json(conversations);
});

router.post('/', async (req, res) => {
  const { userId } = req.body;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: 'a valid userId is required' });
  }
  if (userId === req.userId) {
    return res.status(400).json({ error: 'cannot start a conversation with yourself' });
  }

  const otherUser = await User.findById(userId);
  if (!otherUser) {
    return res.status(404).json({ error: 'user not found' });
  }

  let conversation = await Conversation.findOne({
    participants: { $all: [req.userId, userId], $size: 2 },
  });
  let status = 200;

  if (!conversation) {
    conversation = await Conversation.create({ participants: [req.userId, userId] });
    status = 201;
  }

  await conversation.populate('participants', 'username email');
  res.status(status).json(conversation);
});

router.get('/:conversationId/messages', async (req, res) => {
  const { conversationId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return res.status(400).json({ error: 'invalid conversationId' });
  }

  const conversation = await Conversation.findById(conversationId);
  const isParticipant = conversation?.participants.some((p) => p.toString() === req.userId);
  if (!isParticipant) {
    return res.status(404).json({ error: 'conversation not found' });
  }

  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const filter = { conversationId };
  if (req.query.before) {
    filter.createdAt = { $lt: new Date(req.query.before) };
  }

  const messages = await Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json(messages.reverse());
});

export default router;
