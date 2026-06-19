import { useState } from 'react';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { useTheme } from '../context/ThemeContext';
import { updatePassword } from '../context/AuthContext';
import type { ThemeMode } from '../types';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [newPassword, setNewPassword] = useState('');
  const [saved, setSaved] = useState(false);

  const handlePasswordSave = () => {
    if (newPassword.trim()) {
      updatePassword(newPassword);
      setNewPassword('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="page">
      <Header title="Settings" showBack backTo="/" />

      <main className="content settings-content">
        <section className="settings-section">
          <h2 className="settings-heading">Appearance</h2>
          <p className="settings-description">Choose light or dark mode</p>
          <div className="theme-toggle">
            {(['light', 'dark'] as ThemeMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`theme-option ${theme === mode ? 'active' : ''}`}
                onClick={() => setTheme(mode)}
              >
                {mode === 'light' ? '☀ Light' : '🌙 Dark'}
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <h2 className="settings-heading">Security</h2>
          <p className="settings-description">Change your login password</p>
          <label className="field">
            <span>New Password</span>
            <input
              type="password"
              className="input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </label>
          <Button onClick={handlePasswordSave} disabled={!newPassword.trim()}>
            Save Password
          </Button>
          {saved && <p className="success-text">Password updated</p>}
        </section>
      </main>
    </div>
  );
}
