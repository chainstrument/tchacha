import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMessages } from '../api/messages.js';
import { listConversations } from '../api/conversations.js';
import { getCurrentUser } from '../api/auth.js';
import { useSocket } from '../hooks/useSocket.js';

const TYPING_IDLE_MS = 2000;
const TYPING_STALE_MS = 5000;

export default function Chat() {
  const { conversationId } = useParams();
  const currentUser = getCurrentUser();
  const { socket, connected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const otherTypingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    getMessages(conversationId)
      .then(setMessages)
      .catch((err) => setError(err.message));

    listConversations()
      .then((conversations) => {
        const conversation = conversations.find((c) => c._id === conversationId);
        const other = conversation?.participants.find((p) => p._id !== currentUser?.id);
        setOtherUser(other ?? null);
      })
      .catch(() => {});

    setOtherTyping(false);
  }, [conversationId, currentUser?.id]);

  useEffect(() => {
    if (!socket || !connected) {
      return undefined;
    }

    socket.emit('conversation:read', { conversationId });

    function handleNewMessage(message) {
      if (message.conversationId !== conversationId) {
        return;
      }
      setMessages((prev) => [...prev, message]);
      socket.emit('conversation:read', { conversationId });
    }

    function handleTyping({ conversationId: cid, typing }) {
      if (cid !== conversationId) {
        return;
      }
      setOtherTyping(typing);
      clearTimeout(otherTypingTimeoutRef.current);
      if (typing) {
        otherTypingTimeoutRef.current = setTimeout(() => setOtherTyping(false), TYPING_STALE_MS);
      }
    }

    socket.on('message:new', handleNewMessage);
    socket.on('typing', handleTyping);
    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('typing', handleTyping);
      clearTimeout(otherTypingTimeoutRef.current);
    };
  }, [socket, connected, conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current && socket) {
        isTypingRef.current = false;
        socket.emit('typing:stop', { conversationId });
      }
    };
  }, [socket, conversationId]);

  function handleContentChange(e) {
    setContent(e.target.value);
    if (!socket) {
      return;
    }

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing:start', { conversationId });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('typing:stop', { conversationId });
    }, TYPING_IDLE_MS);
  }

  function handleSend(e) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || !socket) {
      return;
    }

    clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit('typing:stop', { conversationId });
    }

    socket.emit('message:send', { conversationId, content: trimmed }, (ack) => {
      if (ack?.error) {
        setError(ack.error);
      }
    });
    setContent('');
  }

  return (
    <div className="chat-page">
      <header className="topbar">
        <div className="topbar-left">
          <Link to="/">← Conversations</Link>
          <h1>{otherUser?.username ?? 'Conversation'}</h1>
        </div>
      </header>

      {error && <p role="alert" className="page-alert">{error}</p>}

      <div className="message-list">
        {messages.map((message) => {
          const isOwn = message.senderId === currentUser?.id;
          return (
            <div key={message._id} className={`message${isOwn ? ' own' : ''}`}>
              <span className="sender">{isOwn ? 'Moi' : otherUser?.username}</span>
              {message.content}
            </div>
          );
        })}
        {otherTyping && <p className="typing-indicator">{otherUser?.username ?? 'Il/elle'} est en train d'écrire...</p>}
        <div ref={bottomRef} />
      </div>

      <form className="message-form" onSubmit={handleSend}>
        <input
          type="text"
          value={content}
          onChange={handleContentChange}
          placeholder="Écrire un message..."
        />
        <button type="submit" className="btn-primary" disabled={!connected}>Envoyer</button>
      </form>
    </div>
  );
}
