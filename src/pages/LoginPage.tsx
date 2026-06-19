import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, getPasswordHint, getUsernameHint } from '../context/AuthContext';
import { Button } from '../components/Button';

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const success = login(username, password);
    if (!success) {
      setError('Incorrect username or password');
      return;
    }
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">📦</div>
        <h1 className="login-title">Inventory</h1>
        <p className="login-subtitle">Sign in to access your materials</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="field">
            <span>Username</span>
            <input
              type="text"
              className="input"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              placeholder={getUsernameHint()}
              autoComplete="username"
              autoFocus
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder={getPasswordHint()}
              autoComplete="current-password"
            />
          </label>

          {error && <p className="error-text">{error}</p>}

          <Button type="submit" className="login-button">
            Log In
          </Button>
        </form>
      </div>
    </div>
  );
}
