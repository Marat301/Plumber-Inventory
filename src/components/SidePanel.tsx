import type { ReactNode } from 'react';

interface SidePanelProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function SidePanel({ open, title, onClose, children }: SidePanelProps) {
  if (!open) return null;

  return (
    <div className="side-panel-overlay" onClick={onClose}>
      <aside
        className="side-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="side-panel-header">
          <h2 className="side-panel-title">{title}</h2>
          <button type="button" className="side-panel-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="side-panel-body">{children}</div>
      </aside>
    </div>
  );
}
