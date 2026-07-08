import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMessages } from '../api/messages.js';
import { listConversations } from '../api/conversations.js';
import { getCurrentUser } from '../api/auth.js';
import { useSocket } from '../hooks/useSocket.js';

export default function Chat() {
  const { conversationId } = useParams();
  const currentUser = getCurrentUser();
  const { socket, connected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

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
  }, [conversationId, currentUser?.id]);

  useEffect(() => {
    if (!socket || !connected) {
      return undefined;
    }

    function handleNewMessage(message) {
      if (message.conversationId !== conversationId) {
        return;
      }
      setMessages((prev) => [...prev, message]);
    }

    socket.on('message:new', handleNewMessage);
    return () => socket.off('message:new', handleNewMessage);
  }, [socket, connected, conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend(e) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || !socket) {
      return;
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
        <div ref={bottomRef} />
      </div>

      <form className="message-form" onSubmit={handleSend}>
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Écrire un message..."
        />
        <button type="submit" className="btn-primary" disabled={!connected}>Envoyer</button>
      </form>
    </div>
  );
}
