import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_KEY = 'inventory-auth';
const USERNAME_KEY = 'inventory-username';
const PASSWORD_KEY = 'inventory-password';
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'inventory';

function getStoredUsername(): string {
  return localStorage.getItem(USERNAME_KEY) ?? DEFAULT_USERNAME;
}

function getStoredPassword(): string {
  return localStorage.getItem(PASSWORD_KEY) ?? DEFAULT_PASSWORD;
}

function isSessionValid(): boolean {
  return sessionStorage.getItem(AUTH_KEY) === 'true';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(isSessionValid);

  const login = useCallback((username: string, password: string) => {
    const valid =
      username === getStoredUsername() && password === getStoredPassword();
    if (valid) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      setIsAuthenticated(true);
    }
    return valid;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, login, logout }),
    [isAuthenticated, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function updateUsername(newUsername: string) {
  if (newUsername.trim()) {
    localStorage.setItem(USERNAME_KEY, newUsername.trim());
  }
}

export function updatePassword(newPassword: string) {
  if (newPassword.trim()) {
    localStorage.setItem(PASSWORD_KEY, newPassword.trim());
  }
}

export function getUsernameHint() {
  return localStorage.getItem(USERNAME_KEY)
    ? 'Enter your username'
    : `Default username: ${DEFAULT_USERNAME}`;
}

export function getPasswordHint() {
  return localStorage.getItem(PASSWORD_KEY)
    ? 'Enter your password'
    : `Default password: ${DEFAULT_PASSWORD}`;
}
