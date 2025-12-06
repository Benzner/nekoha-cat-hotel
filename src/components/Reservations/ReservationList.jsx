import { useState } from 'react';
import { useReservations } from '../../context/ReservationContext';
import ReservationItem from './ReservationItem';
import ReservationModal from './ReservationModal';
import SkeletonCard from '../Common/SkeletonCard';

export default function ReservationList() {
    const { reservations, deleteReservation, isLoading } = useReservations();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReservation, setEditingReservation] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleEdit = (reservation) => {
        setEditingReservation(reservation);
        setIsModalOpen(true);
    };

    const handleNew = () => {
        setEditingReservation(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingReservation(null);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this reservation?')) {
            deleteReservation(id);
        }
    };

    // Filter and search logic
    const filteredReservations = reservations.filter(reservation => {
        const today = new Date();
        const checkIn = new Date(reservation.checkIn);
        const checkOut = new Date(reservation.checkOut);

        // Search filter
        const matchesSearch =
            (reservation.catName && reservation.catName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (reservation.bookerName && reservation.bookerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (reservation.roomNumber && reservation.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()));

        // Room type filter
        const matchesType = filterType === 'all' || reservation.roomType === filterType;

        // Status filter
        let matchesStatus = true;
        if (filterStatus === 'active') {
            matchesStatus = checkIn <= today && checkOut >= today;
        } else if (filterStatus === 'upcoming') {
            matchesStatus = checkIn > today;
        } else if (filterStatus === 'past') {
            matchesStatus = checkOut < today;
        }

        // Date range filter
        let matchesDateRange = true;
        if (startDate && endDate) {
            const filterStart = new Date(startDate);
            const filterEnd = new Date(endDate);
            // Check for overlap: (StartA <= EndB) and (EndA >= StartB)
            matchesDateRange = checkIn <= filterEnd && checkOut >= filterStart;
        }

        return matchesSearch && matchesType && matchesStatus && matchesDateRange;
    });

    const sortedReservations = [...filteredReservations].sort((a, b) =>
        new Date(a.checkIn) - new Date(b.checkIn)
    );

    const clearFilters = () => {
        setSearchTerm('');
        setFilterType('all');
        setFilterStatus('all');
        setStartDate('');
        setEndDate('');
    };

    const hasActiveFilters = searchTerm || filterType !== 'all' || filterStatus !== 'all' || startDate || endDate;

    return (
        <div className="card">
            <div className="reservations-header">
                <div>
                    <h2>Reservations</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {sortedReservations.length} of {reservations.length} reservations
                    </p>
                </div>
                <button className="btn btn-primary" onClick={handleNew}>
                    ➕ New Reservation
                </button>
            </div>

            {/* Search and Filter Section */}
            <div className="search-filter-container">
                {/* Search Bar */}
                <div className="search-bar">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by cat name, owner, or room number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            className="clear-search-btn"
                            onClick={() => setSearchTerm('')}
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Date Range Filter */}
                <div className="filter-group">
                    <span className="filter-label">Date Range:</span>
                    <div className="date-range-inputs">
                        <input
                            type="date"
                            className="form-input date-input"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            placeholder="Start Date"
                        />
                        <span className="date-separator">to</span>
                        <input
                            type="date"
                            className="form-input date-input"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            placeholder="End Date"
                        />
                    </div>
                </div>

                {/* Filter Chips */}
                <div className="filter-chips">
                    <span className="filter-label">Status:</span>
                    <button
                        className={`filter-chip ${filterStatus === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('all')}
                    >
                        All
                    </button>
                    <button
                        className={`filter-chip ${filterStatus === 'active' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('active')}
                    >
                        🟢 Active
                    </button>
                    <button
                        className={`filter-chip ${filterStatus === 'upcoming' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('upcoming')}
                    >
                        📅 Upcoming
                    </button>
                    <button
                        className={`filter-chip ${filterStatus === 'past' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('past')}
                    >
                        ⏰ Past
                    </button>
                </div>

                <div className="filter-chips">
                    <span className="filter-label">Room Type:</span>
                    <button
                        className={`filter-chip ${filterType === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterType('all')}
                    >
                        All Types
                    </button>
                    <button
                        className={`filter-chip ${filterType === 'standard' ? 'active' : ''}`}
                        onClick={() => setFilterType('standard')}
                    >
                        🛏️ Standard
                    </button>
                    <button
                        className={`filter-chip ${filterType === 'delux' ? 'active' : ''}`}
                        onClick={() => setFilterType('delux')}
                    >
                        👑 Delux
                    </button>
                    <button
                        className={`filter-chip ${filterType === 'suite' ? 'active' : ''}`}
                        onClick={() => setFilterType('suite')}
                    >
                        💎 Suite
                    </button>
                </div>

                {hasActiveFilters && (
                    <button className="clear-filters-btn" onClick={clearFilters}>
                        ✕ Clear all filters
                    </button>
                )}
            </div>

            {/* Reservations List */}
            {isLoading ? (
                <div className="reservations-list">
                    {[...Array(3)].map((_, i) => (
                        <SkeletonCard key={i} height="120px" style={{ marginBottom: '1rem' }} />
                    ))}
                </div>
            ) : sortedReservations.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        {hasActiveFilters ? '🔍' : '📋'}
                    </div>
                    <h3 className="empty-state-title">
                        {hasActiveFilters ? 'No Matching Reservations' : 'No Reservations Yet'}
                    </h3>
                    <p className="empty-state-description">
                        {hasActiveFilters
                            ? 'Try adjusting your search or filters to find what you\'re looking for.'
                            : 'Click "New Reservation" to create your first booking.'
                        }
                    </p>
                    {hasActiveFilters && (
                        <button className="btn btn-outline" onClick={clearFilters} style={{ marginTop: '1rem' }}>
                            Clear Filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="reservations-list">
                    {sortedReservations.map((reservation, index) => (
                        <div
                            key={reservation.id}
                            className="reservation-item-wrapper animate-in"
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <ReservationItem
                                reservation={reservation}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        </div>
                    ))}
                </div>
            )}

            <ReservationModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                reservation={editingReservation}
            />
        </div>
    );
}
