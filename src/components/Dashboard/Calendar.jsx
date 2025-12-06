import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useReservations } from '../../context/ReservationContext';
import { formatDate, getMonthData, formatDisplayDate } from '../../utils/dateUtils';

export default function Calendar({ onNewReservation }) {
    const { t, i18n } = useTranslation();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(null);
    const [filterRoomTypes, setFilterRoomTypes] = useState(['all']);
    const { reservations } = useReservations();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();

    const { firstDay, daysInMonth, daysInPrevMonth } = getMonthData(year, month);

    // Use current language for date formatting
    const monthName = currentDate.toLocaleDateString(i18n.language === 'th' ? 'th-TH' : 'en-US', {
        month: 'long'
    });

    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const handleToday = () => setCurrentDate(new Date());

    // Helper to check if a date is within a reservation range
    const isBookedOnDay = (date, reservation) => {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        const start = new Date(reservation.checkIn);
        start.setHours(0, 0, 0, 0);

        const end = new Date(reservation.checkOut);
        end.setHours(0, 0, 0, 0);

        return targetDate >= start && targetDate < end;
    };

    const getRoomColor = (roomType) => {
        switch (roomType) {
            case 'suite': return 'var(--primary)'; // Orange
            case 'delux': return 'var(--secondary)'; // Blue
            case 'standard': return 'var(--accent)'; // Green
            default: return 'var(--text-secondary)';
        }
    };

    const getRoomLabel = (roomType) => {
        switch (roomType) {
            case 'suite': return t('calendar.suite');
            case 'delux': return t('calendar.deluxe');
            case 'standard': return t('calendar.standard');
            case 'standard-connecting': return `${t('calendar.standard')} (C)`;
            default: return roomType;
        }
    };

    const handleDayClick = (date) => {
        const dayReservations = reservations.filter(res => isBookedOnDay(date, res));
        // Sort by room type
        dayReservations.sort((a, b) => a.roomType.localeCompare(b.roomType));

        setSelectedDay({
            date: date,
            reservations: dayReservations
        });
    };

    const closeDayModal = () => {
        setSelectedDay(null);
    };

    const toggleFilter = (type) => {
        setFilterRoomTypes(prev => {
            if (type === 'all') return ['all'];

            // If currently 'all', remove it and start strict list
            let newFilters = prev.includes('all') ? [] : [...prev];

            if (newFilters.includes(type)) {
                newFilters = newFilters.filter(t => t !== type);
            } else {
                newFilters.push(type);
            }

            // If empty, revert to 'all'
            if (newFilters.length === 0) return ['all'];

            return newFilters;
        });
    };

    const renderDay = (date, isOtherMonth = false) => {
        const dateStr = formatDate(date);
        const isToday = date.toDateString() === today.toDateString();

        // Find reservations for this day
        const dayReservations = reservations
            .filter(res => isBookedOnDay(date, res))
            .filter(res => {
                if (filterRoomTypes.includes('all')) return true;

                // Check if reservation matches any active filter
                // Special case: 'standard' filter matches BOTH 'standard' and 'standard-connecting'
                if (filterRoomTypes.includes('standard') && (res.roomType === 'standard' || res.roomType === 'standard-connecting')) {
                    return true;
                }

                // Normal match
                return filterRoomTypes.includes(res.roomType);
            });

        // Sort by room type to keep consistent order visually
        dayReservations.sort((a, b) => a.roomType.localeCompare(b.roomType));

        const maxEventsToShow = 3;
        const visibleEvents = dayReservations.slice(0, maxEventsToShow);
        const hiddenCount = dayReservations.length - maxEventsToShow;

        return (
            <div
                key={dateStr}
                className={`calendar-day ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
                onClick={() => handleDayClick(date)}
            >
                <div className="calendar-day-header-row">
                    <span className="calendar-day-number">{date.getDate()}</span>
                </div>

                <div className="calendar-events">
                    {visibleEvents.map(res => (
                        <div
                            key={res.id}
                            className="event-bar"
                            style={{
                                backgroundColor: getRoomColor(res.roomType),
                                opacity: isOtherMonth ? 0.5 : 1
                            }}
                            title={`${res.roomNumber} - ${res.catName} (${getRoomLabel(res.roomType)})`}
                        //title={`Room ${res.roomNumber} - ${res.catName} (${getRoomLabel(res.roomType)})`}
                        >
                            {res.roomNumber} - {res.catName}
                        </div>
                    ))}
                    {hiddenCount > 0 && (
                        <div className="event-more">
                            +{hiddenCount} more
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const days = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const date = new Date(year, month - 1, day);
        days.push(renderDay(date, true));
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        days.push(renderDay(date, false));
    }

    // Next month days to fill grid
    const remainingCells = Math.ceil(days.length / 7) * 7 - days.length;
    for (let day = 1; day <= remainingCells; day++) {
        const date = new Date(year, month + 1, day);
        days.push(renderDay(date, true));
    }

    return (
        <>
            <div className="card calendar-container">
                <div className="calendar-header">
                    <div className="calendar-header-left">
                        <h2 className="calendar-month">{monthName} {year}</h2>
                        <div className="calendar-nav">
                            <button className="btn btn-outline btn-sm" onClick={handlePrevMonth}>←</button>
                            <button className="btn btn-outline btn-sm" onClick={handleToday}>{t('calendar.today')}</button>
                            <button className="btn btn-outline btn-sm" onClick={handleNextMonth}>→</button>
                        </div>
                    </div>
                    <button className="btn btn-primary btn-sm calendar-new-reservation-btn" onClick={onNewReservation}>
                        <span className="btn-icon">➕</span>
                        {t('dashboard.new_reservation')}
                    </button>
                </div>

                {/* Room Type Filters */}
                <div className="room-filter-section">
                    <button
                        className={`room-filter-btn ${filterRoomTypes.includes('all') ? 'active' : ''}`}
                        onClick={() => toggleFilter('all')}
                    >
                        {t('calendar.all_types')}
                    </button>
                    <button
                        className={`room-filter-btn standard ${filterRoomTypes.includes('standard') ? 'active' : ''}`}
                        onClick={() => toggleFilter('standard')}
                    >
                        🛏️ {t('calendar.standard')}
                    </button>
                    <button
                        className={`room-filter-btn delux ${filterRoomTypes.includes('delux') ? 'active' : ''}`}
                        onClick={() => toggleFilter('delux')}
                    >
                        👑 {t('calendar.deluxe')}
                    </button>
                    <button
                        className={`room-filter-btn suite ${filterRoomTypes.includes('suite') ? 'active' : ''}`}
                        onClick={() => toggleFilter('suite')}
                    >
                        💎 {t('calendar.suite')}
                    </button>
                </div>

                <div className="calendar-grid">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="calendar-day-header">{day}</div>
                    ))}
                    {days}
                </div>
            </div>

            {/* Day Details Modal */}
            {selectedDay && createPortal(
                <div className="modal active">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {formatDisplayDate(formatDate(selectedDay.date))}
                            </h2>
                            <button className="modal-close" onClick={closeDayModal}>×</button>
                        </div>

                        <div className="modal-body">
                            {selectedDay.reservations.length === 0 ? (
                                <div className="empty-state" style={{ padding: '2rem 0' }}>
                                    <p className="text-secondary">No reservations for this day.</p>
                                </div>
                            ) : (
                                <div className="day-reservations-list">
                                    {selectedDay.reservations.map(res => (
                                        <div key={res.id} className="day-reservation-item" style={{ borderLeft: `4px solid ${getRoomColor(res.roomType)}` }}>
                                            <div className="day-res-header">
                                                <span className="day-res-cat">{res.catName}</span>
                                                <span className="day-res-room" style={{ color: getRoomColor(res.roomType) }}>
                                                    {getRoomLabel(res.roomType)}
                                                </span>
                                            </div>
                                            <div className="day-res-details">
                                                <div>Owner: {res.bookerName}</div>
                                                <div>{formatDisplayDate(res.checkIn)} - {formatDisplayDate(res.checkOut)}</div>
                                            </div>
                                            {res.notes && <div className="day-res-note">"{res.notes}"</div>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-primary" onClick={closeDayModal}>Close</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
