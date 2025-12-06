// Room utility functions

export const ROOM_TYPES = {
    standard: { total: 4, type: 'Standard' },
    delux: { total: 2, type: 'Private Delux' },
    suite: { total: 2, type: 'Suite' }
};

export function getRoomTypeLabel(type) {
    const labels = {
        'standard': 'Standard Room',
        'standard-connecting': 'Standard Connecting (2 rooms)',
        'delux': 'Private Delux',
        'suite': 'Suite'
    };
    return labels[type] || type;
}

export function getRoomAvailability(date, reservations) {
    const dateStr = typeof date === 'string' ? date : formatDate(date);

    let standardBooked = 0;
    let deluxBooked = 0;
    let suiteBooked = 0;

    reservations.forEach(res => {
        if (isDateInRange(dateStr, res.checkIn, res.checkOut)) {
            if (res.roomType === 'standard') {
                standardBooked += 1;
            } else if (res.roomType === 'standard-connecting') {
                standardBooked += 2;
            } else if (res.roomType === 'delux') {
                deluxBooked += 1;
            } else if (res.roomType === 'suite') {
                suiteBooked += 1;
            }
        }
    });

    return {
        standard: {
            total: ROOM_TYPES.standard.total,
            booked: standardBooked,
            available: ROOM_TYPES.standard.total - standardBooked
        },
        delux: {
            total: ROOM_TYPES.delux.total,
            booked: deluxBooked,
            available: ROOM_TYPES.delux.total - deluxBooked
        },
        suite: {
            total: ROOM_TYPES.suite.total,
            booked: suiteBooked,
            available: ROOM_TYPES.suite.total - suiteBooked
        }
    };
}

export function getTotalAvailability(date, reservations) {
    const availability = getRoomAvailability(date, reservations);
    const totalRooms = 8;
    const bookedRooms = availability.standard.booked + availability.delux.booked + availability.suite.booked;
    const availableRooms = totalRooms - bookedRooms;

    if (availableRooms === totalRooms) return 'available';
    if (availableRooms === 0) return 'full';
    return 'partial';
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function isDateInRange(date, startDate, endDate) {
    const d = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return d >= start && d < end;
}
