import { useState } from 'react';
import { useReservations } from '../../context/ReservationContext';
import { formatDisplayDate } from '../../utils/dateUtils';
import { getRoomTypeLabel } from '../../utils/roomUtils';

export default function HistoryList() {
    const { history } = useReservations();
    const [filterAction, setFilterAction] = useState('all');

    const actionIcons = {
        'created': '➕',
        'updated': '✏️',
        'deleted': '🗑️'
    };

    const actionColors = {
        'created': 'var(--accent)',
        'updated': 'var(--secondary)',
        'deleted': 'var(--danger)'
    };

    const filteredHistory = history.filter(entry =>
        filterAction === 'all' || entry.action === filterAction
    );

    if (history.length === 0) {
        return (
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Booking History</h2>
                </div>
                <div className="empty-state">
                    <div className="empty-state-icon">📜</div>
                    <h3 className="empty-state-title">No History</h3>
                    <p className="empty-state-description">Booking history will appear here as you create, edit, or delete reservations.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header flex-between">
                <h2 className="card-title">Booking History</h2>
                <div className="filter-chips no-margin">
                    <button
                        className={`filter-chip ${filterAction === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterAction('all')}
                    >
                        All
                    </button>
                    <button
                        className={`filter-chip ${filterAction === 'created' ? 'active' : ''}`}
                        onClick={() => setFilterAction('created')}
                    >
                        ➕ Created
                    </button>
                    <button
                        className={`filter-chip ${filterAction === 'updated' ? 'active' : ''}`}
                        onClick={() => setFilterAction('updated')}
                    >
                        ✏️ Updated
                    </button>
                    <button
                        className={`filter-chip ${filterAction === 'deleted' ? 'active' : ''}`}
                        onClick={() => setFilterAction('deleted')}
                    >
                        🗑️ Deleted
                    </button>
                </div>
            </div>

            {filteredHistory.length === 0 ? (
                <div className="empty-state p-2xl">
                    <p className="text-secondary">No history items match this filter.</p>
                </div>
            ) : (
                <div className="history-list">
                    {filteredHistory.map((entry, index) => {
                        const timestamp = new Date(entry.timestamp).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });

                        const res = entry.action === 'updated' ? entry.details.after : entry.details;

                        return (
                            <div
                                key={index}
                                className="reservation-item animate-in"
                                style={{
                                    borderLeftColor: actionColors[entry.action],
                                    animationDelay: `${index * 0.05}s`
                                }}
                            >
                                <div className="reservation-header">
                                    <div className="reservation-info">
                                        <h3>
                                            {actionIcons[entry.action]} Reservation {entry.action.charAt(0).toUpperCase() + entry.action.slice(1)}
                                        </h3>
                                        <div className="reservation-meta">
                                            {res.catName} | {res.bookerName} | {formatDisplayDate(res.checkIn)} to {formatDisplayDate(res.checkOut)} | {getRoomTypeLabel(res.roomType)}
                                        </div>
                                    </div>
                                    <div className="text-secondary text-sm">
                                        {timestamp}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
