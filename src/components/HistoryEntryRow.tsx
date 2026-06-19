import { useState } from 'react';
import type { HistoryEntry } from '../types';

interface HistoryEntryRowProps {
  entry: HistoryEntry;
  formatTimestamp: (iso: string) => string;
}

export function HistoryEntryRow({ entry, formatTimestamp }: HistoryEntryRowProps) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = Boolean(entry.details && entry.details.length > 0);

  return (
    <li className={`history-item ${expanded ? 'expanded' : ''}`}>
      <button
        type="button"
        className="history-item-header"
        onClick={() => hasDetails && setExpanded((value) => !value)}
        aria-expanded={hasDetails ? expanded : undefined}
        disabled={!hasDetails}
      >
        <div className="history-item-summary">
          <p className="history-message">{entry.message}</p>
          <time className="history-time" dateTime={entry.timestamp}>
            {formatTimestamp(entry.timestamp)}
          </time>
        </div>
        {hasDetails && (
          <span className="history-chevron" aria-hidden>
            {expanded ? '▲' : '▼'}
          </span>
        )}
      </button>

      {expanded && hasDetails && (
        <ul className="history-details">
          {entry.details!.map((detail, index) => (
            <li key={`${entry.id}-${index}-${detail.name}`} className="history-detail-item">
              <span className="history-detail-name">{detail.name}</span>
              {detail.quantity && (
                <span className="history-detail-quantity">Qty: {detail.quantity}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
