import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api/auth.js';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1>Connexion</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="password">Mot de passe</label>
          <input id="password" name="password" type="password" value={form.password} onChange={handleChange} required />
        </div>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={submitting}>Se connecter</button>
      </form>
      <p>
        Pas encore de compte ? <Link to="/register">S'inscrire</Link>
      </p>
    </div>
  );
}
