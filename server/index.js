import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import conversationRoutes from './routes/conversations.js';
import { authenticateSocket, registerChatHandlers } from './sockets/chatHandlers.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/conversations', conversationRoutes);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

io.use(authenticateSocket);
io.on('connection', (socket) => registerChatHandlers(io, socket));

try {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
} catch (err) {
  console.error('Failed to start server:', err.message);
  process.exit(1);
}
