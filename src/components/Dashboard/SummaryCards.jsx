import { useReservations } from '../../context/ReservationContext';
import { getRoomAvailability } from '../../utils/roomUtils';
import SkeletonCard from '../Common/SkeletonCard';
import { useTranslation } from 'react-i18next';

export default function SummaryCards({ reservations: reservationsProp }) {
    const { t } = useTranslation();
    const { reservations: contextReservations, isLoading } = useReservations();

    // Use prop if provided, otherwise use context
    const reservations = reservationsProp !== undefined ? reservationsProp : contextReservations;

    const today = new Date();
    const availability = getRoomAvailability(today, reservations);

    const totalRooms = 8;
    const totalBooked = availability.standard.booked + availability.delux.booked + availability.suite.booked;
    const totalAvailable = totalRooms - totalBooked;
    const occupancyRate = ((totalBooked / totalRooms) * 100).toFixed(0);

    // Calculate upcoming check-ins (next 7 days)
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const upcomingCheckIns = reservations.filter(res => {
        const checkIn = new Date(res.checkIn);
        return checkIn >= today && checkIn <= nextWeek;
    }).length;

    // Calculate active reservations (currently staying)
    const activeReservations = reservations.filter(res => {
        const checkIn = new Date(res.checkIn);
        const checkOut = new Date(res.checkOut);
        return checkIn <= today && checkOut >= today;
    }).length;

    if (isLoading) {
        return (
            <div className="dashboard-summary">
                {[...Array(8)].map((_, i) => (
                    <SkeletonCard key={i} height="160px" />
                ))}
            </div>
        );
    }

    return (
        <div className="dashboard-summary">
            {/* Available Rooms Card with Icon */}
            <div className="summary-card available animate-in">
                <div className="summary-icon">🏠</div>
                <div className="summary-label">{t('dashboard.available_rooms')}</div>
                <div className="summary-value">{totalAvailable}</div>
                <div className="summary-detail">{t('dashboard.total_rooms', { count: totalRooms })}</div>
                <div className="progress-bar">
                    <div
                        className="progress-fill available-fill"
                        style={{ width: `${(totalAvailable / totalRooms) * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* Booked Rooms Card with Icon */}
            <div className="summary-card booked animate-in" style={{ animationDelay: '0.1s' }}>
                <div className="summary-icon">🐱</div>
                <div className="summary-label">{t('dashboard.booked_rooms')}</div>
                <div className="summary-value">{totalBooked}</div>
                <div className="summary-detail">{t('dashboard.occupancy_rate', { rate: occupancyRate })}</div>
                <div className="progress-bar">
                    <div
                        className="progress-fill booked-fill"
                        style={{ width: `${occupancyRate}%` }}
                    ></div>
                </div>
                <div className="trend-indicator positive">
                    <span className="trend-arrow">↗</span>
                    <span className="trend-text">+12% vs last week</span>
                </div>
            </div>

            {/* Active Guests Card */}
            <div className="summary-card animate-in" style={{ animationDelay: '0.2s' }}>
                <div className="summary-icon">✨</div>
                <div className="summary-label">{t('dashboard.active_guests')}</div>
                <div className="summary-value">{activeReservations}</div>
                <div className="summary-detail">{t('dashboard.currently_staying')}</div>
                <div className="trend-indicator neutral">
                    <span className="trend-arrow">→</span>
                    <span className="trend-text">Same as yesterday</span>
                </div>
            </div>

            {/* Upcoming Check-ins Card */}
            <div className="summary-card animate-in" style={{ animationDelay: '0.3s' }}>
                <div className="summary-icon">📅</div>
                <div className="summary-label">Upcoming Check-ins</div>
                <div className="summary-value">{upcomingCheckIns}</div>
                <div className="summary-detail">next 7 days</div>
            </div>

            {/* Standard Rooms Card */}
            <div className="summary-card animate-in" style={{ animationDelay: '0.4s' }}>
                <div className="summary-icon">🛏️</div>
                <div className="summary-label">Standard Rooms</div>
                <div className="summary-value">{availability.standard.available}/{availability.standard.total}</div>
                <div className="summary-detail">available today</div>
                <div className="room-type-indicator standard"></div>
            </div>

            {/* Private Delux Card */}
            <div className="summary-card animate-in" style={{ animationDelay: '0.5s' }}>
                <div className="summary-icon">👑</div>
                <div className="summary-label">Private Delux</div>
                <div className="summary-value">{availability.delux.available}/{availability.delux.total}</div>
                <div className="summary-detail">available today</div>
                <div className="room-type-indicator delux"></div>
            </div>

            {/* Suite Rooms Card */}
            <div className="summary-card animate-in" style={{ animationDelay: '0.6s' }}>
                <div className="summary-icon">💎</div>
                <div className="summary-label">Suite Rooms</div>
                <div className="summary-value">{availability.suite.available}/{availability.suite.total}</div>
                <div className="summary-detail">available today</div>
                <div className="room-type-indicator suite"></div>
            </div>

            {/* Total Reservations Card */}
            <div className="summary-card animate-in" style={{ animationDelay: '0.7s' }}>
                <div className="summary-icon">📊</div>
                <div className="summary-label">Total Reservations</div>
                <div className="summary-value">{reservations.length}</div>
                <div className="summary-detail">all time bookings</div>
                {reservations.length > 0 && (
                    <div className="trend-indicator positive">
                        <span className="trend-arrow">↗</span>
                        <span className="trend-text">+5 this week</span>
                    </div>
                )}
            </div>
        </div>
    );
}
