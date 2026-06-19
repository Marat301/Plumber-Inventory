import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';
import { ClockIcon } from './Icons';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  backTo?: string;
  rightAction?: ReactNode;
}

export function Header({ title, showBack, backTo = '/', rightAction }: HeaderProps) {
  const { logout } = useAuth();

  return (
    <header className="header">
      <div className="header-left">
        {showBack && (
          <Link to={backTo} className="header-back" aria-label="Go back">
            ←
          </Link>
        )}
        <h1 className="header-title">{title}</h1>
      </div>
      <div className="header-right">
        {rightAction}
        <Link to="/history" className="header-icon" aria-label="History">
          <ClockIcon />
        </Link>
        <Link to="/settings" className="header-icon" aria-label="Settings">
          ⚙
        </Link>
        <Button variant="ghost" className="header-logout" onClick={logout}>
          Log out
        </Button>
      </div>
    </header>
  );
}
