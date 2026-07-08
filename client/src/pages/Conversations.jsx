import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { listConversations, searchUsers, startConversation } from '../api/conversations.js';
import { getCurrentUser, logout } from '../api/auth.js';

export default function Conversations() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [conversations, setConversations] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    listConversations()
      .then(setConversations)
      .catch((err) => setError(err.message));
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) {
      setResults([]);
      return;
    }
    try {
      setResults(await searchUsers(query));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStart(userId) {
    try {
      const conversation = await startConversation(userId);
      setResults([]);
      setQuery('');
      navigate(`/conversations/${conversation._id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function otherParticipant(conversation) {
    return conversation.participants.find((p) => p._id !== currentUser?.id) ?? conversation.participants[0];
  }

  return (
    <div className="conversations-page">
      <header className="topbar">
        <h1>Conversations</h1>
        <button type="button" className="btn-ghost" onClick={handleLogout}>Déconnexion</button>
      </header>

      <form className="search-form" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Rechercher un utilisateur"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn-primary">Rechercher</button>
      </form>

      {error && <p role="alert" className="page-alert">{error}</p>}

      {results.length > 0 && (
        <ul className="search-results">
          {results.map((user) => (
            <li key={user._id} className="search-result-item">
              {user.username}
              <button type="button" className="btn-ghost" onClick={() => handleStart(user._id)}>Démarrer</button>
            </li>
          ))}
        </ul>
      )}

      {conversations.length === 0 ? (
        <p className="empty-state">Aucune conversation pour l'instant.</p>
      ) : (
        <ul className="conversation-list">
          {conversations.map((conversation) => (
            <li key={conversation._id} className="conversation-item">
              <Link to={`/conversations/${conversation._id}`}>{otherParticipant(conversation).username}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
