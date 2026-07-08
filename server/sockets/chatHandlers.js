import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { addConnection, removeConnection, getOnlineUserIds } from './presence.js';

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

function isParticipant(conversation, userId) {
  return Boolean(conversation?.participants.some((p) => p.toString() === userId));
}

export function registerChatHandlers(io, socket) {
  socket.join(`user:${socket.userId}`);

  const becameOnline = addConnection(socket.userId, socket.id);
  socket.emit('presence:snapshot', getOnlineUserIds());
  if (becameOnline) {
    io.emit('presence:online', { userId: socket.userId });
  }

  socket.on('disconnect', () => {
    const becameOffline = removeConnection(socket.userId, socket.id);
    if (becameOffline) {
      io.emit('presence:offline', { userId: socket.userId });
    }
  });

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
      if (!isParticipant(conversation, socket.userId)) {
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

  socket.on('typing:start', ({ conversationId } = {}) => relayTyping(io, socket, conversationId, true));
  socket.on('typing:stop', ({ conversationId } = {}) => relayTyping(io, socket, conversationId, false));

  socket.on('conversation:read', async ({ conversationId } = {}) => {
    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      return;
    }

    const conversation = await Conversation.findById(conversationId);
    if (!isParticipant(conversation, socket.userId)) {
      return;
    }

    const result = await Message.updateMany(
      { conversationId, senderId: { $ne: socket.userId }, readAt: null },
      { $set: { readAt: new Date() } },
    );

    if (result.modifiedCount > 0) {
      conversation.participants
        .filter((p) => p.toString() !== socket.userId)
        .forEach((participantId) => {
          io.to(`user:${participantId}`).emit('conversation:read', { conversationId, readerId: socket.userId });
        });
    }
  });
}

async function relayTyping(io, socket, conversationId, typing) {
  if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
    return;
  }

  const conversation = await Conversation.findById(conversationId);
  if (!isParticipant(conversation, socket.userId)) {
    return;
  }

  conversation.participants
    .filter((p) => p.toString() !== socket.userId)
    .forEach((participantId) => {
      io.to(`user:${participantId}`).emit('typing', { conversationId, userId: socket.userId, typing });
    });
}
