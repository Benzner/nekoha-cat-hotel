import SummaryCards from './SummaryCards';
import Calendar from './Calendar';
import { useState, useMemo } from 'react';
import ReservationModal from '../Reservations/ReservationModal';
import { useReservations } from '../../context/ReservationContext';
import { formatDate } from '../../utils/dateUtils';
import { useTranslation } from 'react-i18next';
import './dashboard-filter.css';

export default function Dashboard() {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dateFilter, setDateFilter] = useState('all'); // 'today', 'week', 'month', 'custom', 'all'
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const { reservations } = useReservations();

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    // Get filter dates based on selected filter type
    const getFilterDates = () => {
        const today = new Date();

        switch (dateFilter) {
            case 'today':
                return { start: formatDate(today), end: formatDate(today) };
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                return { start: formatDate(weekStart), end: formatDate(weekEnd) };
            case 'month':
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                return { start: formatDate(monthStart), end: formatDate(monthEnd) };
            case 'custom':
                if (customStartDate && customEndDate) {
                    return { start: customStartDate, end: customEndDate };
                }
                return null;
            default:
                return null; // 'all' - no filtering
        }
    };

    // Filter reservations based on selected date range
    const filteredReservations = useMemo(() => {
        const dates = getFilterDates();
        if (!dates) return reservations;

        return reservations.filter(res => {
            // Check if reservation overlaps with filter range
            return res.checkIn <= dates.end && res.checkOut >= dates.start;
        });
    }, [reservations, dateFilter, customStartDate, customEndDate]);

    return (
        <div className="dashboard-container">
            {/* Date Filter Section */}
            <div className="date-filter-section">
                <div className="filter-header">
                    <span className="filter-icon">📅</span>
                    <h3>{t('dashboard.filter_period')}</h3>
                </div>

                <div className="filter-buttons">
                    <button
                        className={`filter-btn ${dateFilter === 'today' ? 'active' : ''}`}
                        onClick={() => setDateFilter('today')}
                    >
                        {t('dashboard.today')}
                    </button>
                    <button
                        className={`filter-btn ${dateFilter === 'week' ? 'active' : ''}`}
                        onClick={() => setDateFilter('week')}
                    >
                        {t('dashboard.this_week')}
                    </button>
                    <button
                        className={`filter-btn ${dateFilter === 'month' ? 'active' : ''}`}
                        onClick={() => setDateFilter('month')}
                    >
                        {t('dashboard.this_month')}
                    </button>
                    <button
                        className={`filter-btn ${dateFilter === 'custom' ? 'active' : ''}`}
                        onClick={() => setDateFilter('custom')}
                    >
                        {t('dashboard.custom_range')}
                    </button>
                    <button
                        className={`filter-btn ${dateFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setDateFilter('all')}
                    >
                        {t('dashboard.all_time')}
                    </button>
                </div>

                {dateFilter === 'custom' && (
                    <div className="custom-date-inputs">
                        <label>
                            <span>From:</span>
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={e => setCustomStartDate(e.target.value)}
                            />
                        </label>
                        <label>
                            <span>To:</span>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={e => setCustomEndDate(e.target.value)}
                            />
                        </label>
                    </div>
                )}
            </div>

            <SummaryCards reservations={filteredReservations} />

            <Calendar onNewReservation={() => setIsModalOpen(true)} />

            <ReservationModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                reservation={null}
            />
        </div>
    );
}

