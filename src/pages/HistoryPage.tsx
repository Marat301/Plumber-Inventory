import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { HistoryEntryRow } from '../components/HistoryEntryRow';
import { useHistory } from '../context/HistoryContext';

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function HistoryPage() {
  const { entries, clearHistory } = useHistory();

  return (
    <div className="page">
      <Header title="History" showBack backTo="/" />

      <main className="content">
        {entries.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">No activity yet</p>
            <p className="empty-state-text">
              Moves, adds, and deletes will show up here.
            </p>
          </div>
        ) : (
          <>
            <ul className="history-list">
              {entries.map((entry) => (
                <HistoryEntryRow
                  key={entry.id}
                  entry={entry}
                  formatTimestamp={formatTimestamp}
                />
              ))}
            </ul>
            <Button variant="secondary" className="history-clear" onClick={clearHistory}>
              Clear history
            </Button>
          </>
        )}
      </main>
    </div>
  );
}
