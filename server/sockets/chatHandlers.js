import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

export function authenticateSocket(socket, next) {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('missing authentication token'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = payload.sub;
    next();
  } catch {
    next(new Error('invalid or expired token'));
  }
}

export function registerChatHandlers(io, socket) {
  socket.join(`user:${socket.userId}`);

  socket.on('message:send', async ({ conversationId, content } = {}, ack) => {
    try {
      if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
        throw new Error('a valid conversationId is required');
      }

      const trimmed = content?.trim();
      if (!trimmed) {
        throw new Error('content is required');
      }

      const conversation = await Conversation.findById(conversationId);
      const isParticipant = conversation?.participants.some((p) => p.toString() === socket.userId);
      if (!isParticipant) {
        throw new Error('conversation not found');
      }

      const message = await Message.create({
        conversationId,
        senderId: socket.userId,
        content: trimmed,
      });

      const payload = {
        _id: message._id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        content: message.content,
        createdAt: message.createdAt,
        readAt: message.readAt,
      };

      conversation.participants.forEach((participantId) => {
        io.to(`user:${participantId}`).emit('message:new', payload);
      });

      ack?.({ message: payload });
    } catch (err) {
      ack?.({ error: err.message });
    }
  });
}
