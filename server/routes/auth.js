import { Router } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

const router = Router();
const SALT_ROUNDS = 10;

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email and password are required' });
  }

  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    return res.status(409).json({ error: 'username or email already in use' });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ username, email, passwordHash });

  res.status(201).json({ id: user._id, username: user.username, email: user.email });
});

export default router;
