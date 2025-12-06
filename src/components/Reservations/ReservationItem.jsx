import { formatDisplayDate } from '../../utils/dateUtils';
import { getRoomTypeLabel } from '../../utils/roomUtils';

export default function ReservationItem({ reservation, onEdit, onDelete }) {
    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete the reservation for ${reservation.catName}?`)) {
            onDelete(reservation.id);
        }
    };

    return (
        <div className="reservation-item">
            <div className="reservation-header">
                <div className="reservation-info">
                    <h3>🐱 {reservation.catName}</h3>
                    <div className="reservation-meta">
                        Booked by: {reservation.bookerName} | {reservation.bookerContact}
                    </div>
                </div>
                <div className="reservation-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => onEdit(reservation)}>
                        ✏️ Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                        🗑️ Delete
                    </button>
                </div>
            </div>

            <div className="reservation-details">
                <div className="detail-item">
                    <div className="detail-label">Check-in</div>
                    <div className="detail-value">{formatDisplayDate(reservation.checkIn)}</div>
                </div>
                <div className="detail-item">
                    <div className="detail-label">Check-out</div>
                    <div className="detail-value">{formatDisplayDate(reservation.checkOut)}</div>
                </div>
                <div className="detail-item">
                    <div className="detail-label">Room Type</div>
                    <div className="detail-value">{getRoomTypeLabel(reservation.roomType)}</div>
                </div>
                <div className="detail-item">
                    <div className="detail-label">Cat Details</div>
                    <div className="detail-value">{reservation.catDetails || 'N/A'}</div>
                </div>
                {reservation.notes && (
                    <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                        <div className="detail-label">Special Notes</div>
                        <div className="detail-value">{reservation.notes}</div>
                    </div>
                )}
            </div>
        </div>
    );
}
