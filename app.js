// NekohaCatHotel Room Reservation System
// Main Application Logic

// ===========================
// State Management
// ===========================

const APP_STATE = {
    currentUser: null,
    currentDate: new Date(),
    currentView: 'dashboard',
    editingReservation: null,
    rooms: {
        standard: { total: 4, type: 'Standard' },
        delux: { total: 2, type: 'Private Delux' },
        suite: { total: 2, type: 'Suite' }
    }
};

// ===========================
// Authentication
// ===========================

function initAuth() {
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');

    // Check if already logged in
    const session = localStorage.getItem('nekohaCatHotelSession');
    if (session) {
        showApp();
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleLogin();
    });

    logoutBtn.addEventListener('click', handleLogout);
}

function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');

    if (username === 'NekohaCatHotel' && password === 'NekohaCatHotel') {
        // Success
        localStorage.setItem('nekohaCatHotelSession', 'true');
        APP_STATE.currentUser = username;
        showApp();
    } else {
        // Error
        errorDiv.textContent = '❌ Invalid username or password. Please try again.';
        errorDiv.classList.add('show');

        setTimeout(() => {
            errorDiv.classList.remove('show');
        }, 3000);
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('nekohaCatHotelSession');
        APP_STATE.currentUser = null;
        hideApp();
    }
}

function showApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').classList.add('active');
    initApp();
}

function hideApp() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').classList.remove('active');
}

// ===========================
// Data Management
// ===========================

function getReservations() {
    const data = localStorage.getItem('nekohaCatHotelData');
    if (!data) {
        return [];
    }
    const parsed = JSON.parse(data);
    return parsed.reservations || [];
}

function getHistory() {
    const data = localStorage.getItem('nekohaCatHotelData');
    if (!data) {
        return [];
    }
    const parsed = JSON.parse(data);
    return parsed.history || [];
}

function saveReservation(reservation) {
    const data = JSON.parse(localStorage.getItem('nekohaCatHotelData') || '{"reservations":[],"history":[]}');

    if (reservation.id) {
        // Update existing
        const index = data.reservations.findIndex(r => r.id === reservation.id);
        if (index !== -1) {
            const oldReservation = { ...data.reservations[index] };
            data.reservations[index] = { ...reservation, modifiedAt: new Date().toISOString() };

            // Add to history
            data.history.unshift({
                action: 'updated',
                reservationId: reservation.id,
                timestamp: new Date().toISOString(),
                details: {
                    before: oldReservation,
                    after: reservation
                }
            });
        }
    } else {
        // Create new
        reservation.id = Date.now().toString();
        reservation.createdAt = new Date().toISOString();
        reservation.modifiedAt = new Date().toISOString();
        reservation.status = 'active';
        data.reservations.push(reservation);

        // Add to history
        data.history.unshift({
            action: 'created',
            reservationId: reservation.id,
            timestamp: new Date().toISOString(),
            details: reservation
        });
    }

    localStorage.setItem('nekohaCatHotelData', JSON.stringify(data));
}

function deleteReservation(id) {
    const data = JSON.parse(localStorage.getItem('nekohaCatHotelData') || '{"reservations":[],"history":[]}');
    const index = data.reservations.findIndex(r => r.id === id);

    if (index !== -1) {
        const reservation = { ...data.reservations[index] };
        data.reservations.splice(index, 1);

        // Add to history
        data.history.unshift({
            action: 'deleted',
            reservationId: id,
            timestamp: new Date().toISOString(),
            details: reservation
        });

        localStorage.setItem('nekohaCatHotelData', JSON.stringify(data));
    }
}

// ===========================
// Room Availability Logic
// ===========================

function getRoomAvailability(date) {
    const reservations = getReservations();
    const dateStr = formatDate(date);

    let standardBooked = 0;
    let deluxBooked = 0;
    let suiteBooked = 0;

    reservations.forEach(res => {
        if (isDateInRange(dateStr, res.checkIn, res.checkOut)) {
            if (res.roomType === 'standard') {
                standardBooked += 1;
            } else if (res.roomType === 'standard-connecting') {
                standardBooked += 2; // Connecting room uses 2 standard rooms
            } else if (res.roomType === 'delux') {
                deluxBooked += 1;
            } else if (res.roomType === 'suite') {
                suiteBooked += 1;
            }
        }
    });

    return {
        standard: {
            total: APP_STATE.rooms.standard.total,
            booked: standardBooked,
            available: APP_STATE.rooms.standard.total - standardBooked
        },
        delux: {
            total: APP_STATE.rooms.delux.total,
            booked: deluxBooked,
            available: APP_STATE.rooms.delux.total - deluxBooked
        },
        suite: {
            total: APP_STATE.rooms.suite.total,
            booked: suiteBooked,
            available: APP_STATE.rooms.suite.total - suiteBooked
        }
    };
}

function getTotalAvailability(date) {
    const availability = getRoomAvailability(date);
    const totalRooms = 8;
    const bookedRooms = availability.standard.booked + availability.delux.booked + availability.suite.booked;
    const availableRooms = totalRooms - bookedRooms;

    if (availableRooms === totalRooms) return 'available';
    if (availableRooms === 0) return 'full';
    return 'partial';
}

function isDateInRange(date, startDate, endDate) {
    const d = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check-out day is not included (guest leaves in the morning)
    return d >= start && d < end;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ===========================
// Calendar Rendering
// ===========================

function renderCalendar() {
    const monthElement = document.getElementById('calendar-month');
    const gridElement = document.getElementById('calendar-grid');

    const year = APP_STATE.currentDate.getFullYear();
    const month = APP_STATE.currentDate.getMonth();

    // Set month title
    monthElement.textContent = APP_STATE.currentDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
    });

    // Clear grid
    gridElement.innerHTML = '';

    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        gridElement.appendChild(header);
    });

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Add previous month's days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const date = new Date(year, month - 1, day);
        renderCalendarDay(date, gridElement, true);
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        renderCalendarDay(date, gridElement, false);
    }

    // Add next month's days to fill grid
    const totalCells = gridElement.children.length - 7; // Minus headers
    const remainingCells = Math.ceil(totalCells / 7) * 7 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
        const date = new Date(year, month + 1, day);
        renderCalendarDay(date, gridElement, true);
    }
}

function renderCalendarDay(date, container, otherMonth) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';

    if (otherMonth) {
        dayElement.classList.add('other-month');
    }

    // Check if today
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
        dayElement.classList.add('today');
    }

    // Get availability status
    const status = getTotalAvailability(date);
    dayElement.classList.add(status);

    // Day number
    const numberSpan = document.createElement('span');
    numberSpan.className = 'calendar-day-number';
    numberSpan.textContent = date.getDate();
    dayElement.appendChild(numberSpan);

    // Status indicator
    const statusSpan = document.createElement('span');
    statusSpan.className = 'calendar-day-status';
    dayElement.appendChild(statusSpan);

    // Click handler
    dayElement.addEventListener('click', () => {
        showDayDetails(date);
    });

    container.appendChild(dayElement);
}

function showDayDetails(date) {
    const availability = getRoomAvailability(date);
    const dateStr = formatDisplayDate(formatDate(date));

    alert(`📅 ${dateStr}\n\n` +
        `🏨 Room Availability:\n` +
        `Standard: ${availability.standard.available}/${availability.standard.total} available\n` +
        `Private Delux: ${availability.delux.available}/${availability.delux.total} available\n` +
        `Suite: ${availability.suite.available}/${availability.suite.total} available`
    );
}

// ===========================
// Dashboard
// ===========================

function renderDashboard() {
    renderCalendar();
    renderSummaryCards();
}

function renderSummaryCards() {
    const container = document.getElementById('dashboard-summary');
    const today = new Date();
    const availability = getRoomAvailability(today);

    const totalRooms = 8;
    const totalBooked = availability.standard.booked + availability.delux.booked + availability.suite.booked;
    const totalAvailable = totalRooms - totalBooked;

    container.innerHTML = `
    <div class="summary-card available">
      <div class="summary-label">Available Rooms (Today)</div>
      <div class="summary-value">${totalAvailable}</div>
      <div class="summary-detail">out of ${totalRooms} total rooms</div>
    </div>
    
    <div class="summary-card booked">
      <div class="summary-label">Booked Rooms (Today)</div>
      <div class="summary-value">${totalBooked}</div>
      <div class="summary-detail">out of ${totalRooms} total rooms</div>
    </div>
    
    <div class="summary-card">
      <div class="summary-label">Standard Rooms</div>
      <div class="summary-value">${availability.standard.available}/${availability.standard.total}</div>
      <div class="summary-detail">available today</div>
    </div>
    
    <div class="summary-card">
      <div class="summary-label">Private Delux</div>
      <div class="summary-value">${availability.delux.available}/${availability.delux.total}</div>
      <div class="summary-detail">available today</div>
    </div>
    
    <div class="summary-card">
      <div class="summary-label">Suite Rooms</div>
      <div class="summary-value">${availability.suite.available}/${availability.suite.total}</div>
      <div class="summary-detail">available today</div>
    </div>
    
    <div class="summary-card">
      <div class="summary-label">Total Reservations</div>
      <div class="summary-value">${getReservations().length}</div>
      <div class="summary-detail">active bookings</div>
    </div>
  `;
}

// ===========================
// Reservations List
// ===========================

function renderReservations() {
    const container = document.getElementById('reservations-list');
    const reservations = getReservations();

    if (reservations.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <h3 class="empty-state-title">No Reservations</h3>
        <p class="empty-state-description">Click "New Reservation" to create your first booking.</p>
      </div>
    `;
        return;
    }

    // Sort by check-in date
    const sorted = [...reservations].sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn));

    container.innerHTML = sorted.map(reservation => `
    <div class="reservation-item">
      <div class="reservation-header">
        <div class="reservation-info">
          <h3>🐱 ${reservation.catName}</h3>
          <div class="reservation-meta">
            Booked by: ${reservation.bookerName} | ${reservation.bookerContact}
          </div>
        </div>
        <div class="reservation-actions">
          <button class="btn btn-secondary btn-sm" onclick="editReservation('${reservation.id}')">
            ✏️ Edit
          </button>
          <button class="btn btn-danger btn-sm" onclick="confirmDelete('${reservation.id}')">
            🗑️ Delete
          </button>
        </div>
      </div>
      
      <div class="reservation-details">
        <div class="detail-item">
          <div class="detail-label">Check-in</div>
          <div class="detail-value">${formatDisplayDate(reservation.checkIn)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Check-out</div>
          <div class="detail-value">${formatDisplayDate(reservation.checkOut)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Room Type</div>
          <div class="detail-value">${getRoomTypeLabel(reservation.roomType)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Cat Details</div>
          <div class="detail-value">${reservation.catDetails || 'N/A'}</div>
        </div>
        ${reservation.notes ? `
        <div class="detail-item" style="grid-column: 1 / -1;">
          <div class="detail-label">Special Notes</div>
          <div class="detail-value">${reservation.notes}</div>
        </div>
        ` : ''}
      </div>
    </div>
  `).join('');
}

function getRoomTypeLabel(type) {
    const labels = {
        'standard': 'Standard Room',
        'standard-connecting': 'Standard Connecting (2 rooms)',
        'delux': 'Private Delux',
        'suite': 'Suite'
    };
    return labels[type] || type;
}

// ===========================
// History
// ===========================

function renderHistory() {
    const container = document.getElementById('history-list');
    const history = getHistory();

    if (history.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📜</div>
        <h3 class="empty-state-title">No History</h3>
        <p class="empty-state-description">Booking history will appear here as you create, edit, or delete reservations.</p>
      </div>
    `;
        return;
    }

    container.innerHTML = history.map(entry => {
        const actionIcons = {
            'created': '➕',
            'updated': '✏️',
            'deleted': '🗑️'
        };

        const actionColors = {
            'created': 'var(--secondary-green)',
            'updated': 'var(--info)',
            'deleted': 'var(--error)'
        };

        const timestamp = new Date(entry.timestamp).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        let detailsHtml = '';
        if (entry.action === 'created' || entry.action === 'deleted') {
            const res = entry.details;
            detailsHtml = `
        <div class="reservation-meta">
          ${res.catName} | ${res.bookerName} | ${formatDisplayDate(res.checkIn)} to ${formatDisplayDate(res.checkOut)} | ${getRoomTypeLabel(res.roomType)}
        </div>
      `;
        } else if (entry.action === 'updated') {
            const res = entry.details.after;
            detailsHtml = `
        <div class="reservation-meta">
          ${res.catName} | ${res.bookerName} | ${formatDisplayDate(res.checkIn)} to ${formatDisplayDate(res.checkOut)} | ${getRoomTypeLabel(res.roomType)}
        </div>
      `;
        }

        return `
      <div class="reservation-item" style="border-left-color: ${actionColors[entry.action]}">
        <div class="reservation-header">
          <div class="reservation-info">
            <h3>${actionIcons[entry.action]} Reservation ${entry.action.charAt(0).toUpperCase() + entry.action.slice(1)}</h3>
            ${detailsHtml}
          </div>
          <div style="color: var(--text-secondary); font-size: var(--font-size-sm);">
            ${timestamp}
          </div>
        </div>
      </div>
    `;
    }).join('');
}

// ===========================
// Modal & Form
// ===========================

function openReservationModal(reservation = null) {
    const modal = document.getElementById('reservation-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('reservation-form');

    // Set today as minimum date for date inputs
    const today = formatDate(new Date());
    document.getElementById('check-in').min = today;
    document.getElementById('check-out').min = today;

    if (reservation) {
        // Edit mode
        modalTitle.textContent = 'Edit Reservation';
        APP_STATE.editingReservation = reservation;

        document.getElementById('reservation-id').value = reservation.id;
        document.getElementById('booker-name').value = reservation.bookerName;
        document.getElementById('booker-contact').value = reservation.bookerContact;
        document.getElementById('cat-name').value = reservation.catName;
        document.getElementById('cat-details').value = reservation.catDetails || '';
        document.getElementById('check-in').value = reservation.checkIn;
        document.getElementById('check-out').value = reservation.checkOut;
        document.getElementById('room-type').value = reservation.roomType;
        document.getElementById('notes').value = reservation.notes || '';
    } else {
        // New mode
        modalTitle.textContent = 'New Reservation';
        APP_STATE.editingReservation = null;
        form.reset();
        document.getElementById('reservation-id').value = '';
    }

    modal.classList.add('active');
}

function closeReservationModal() {
    const modal = document.getElementById('reservation-modal');
    modal.classList.remove('active');
    APP_STATE.editingReservation = null;
}

function handleReservationSubmit(e) {
    e.preventDefault();

    const reservation = {
        id: document.getElementById('reservation-id').value || null,
        bookerName: document.getElementById('booker-name').value,
        bookerContact: document.getElementById('booker-contact').value,
        catName: document.getElementById('cat-name').value,
        catDetails: document.getElementById('cat-details').value,
        checkIn: document.getElementById('check-in').value,
        checkOut: document.getElementById('check-out').value,
        roomType: document.getElementById('room-type').value,
        notes: document.getElementById('notes').value
    };

    // Validate dates
    if (new Date(reservation.checkOut) <= new Date(reservation.checkIn)) {
        alert('❌ Check-out date must be after check-in date!');
        return;
    }

    // Check room availability for the date range
    if (!checkAvailabilityForReservation(reservation)) {
        alert('❌ No rooms available for the selected dates and room type!');
        return;
    }

    saveReservation(reservation);
    closeReservationModal();

    // Refresh current view
    if (APP_STATE.currentView === 'dashboard') {
        renderDashboard();
    } else if (APP_STATE.currentView === 'reservations') {
        renderReservations();
    } else if (APP_STATE.currentView === 'history') {
        renderHistory();
    }

    alert('✅ Reservation saved successfully!');
}

function checkAvailabilityForReservation(reservation) {
    const checkIn = new Date(reservation.checkIn);
    const checkOut = new Date(reservation.checkOut);

    // Check each day in the range
    for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
        const availability = getRoomAvailability(d);

        // If editing, we need to exclude the current reservation from the count
        let adjustedAvailability = { ...availability };
        if (reservation.id) {
            const existingReservations = getReservations();
            const existing = existingReservations.find(r => r.id === reservation.id);
            if (existing && isDateInRange(formatDate(d), existing.checkIn, existing.checkOut)) {
                // Add back the rooms from existing reservation
                if (existing.roomType === 'standard') {
                    adjustedAvailability.standard.available += 1;
                } else if (existing.roomType === 'standard-connecting') {
                    adjustedAvailability.standard.available += 2;
                } else if (existing.roomType === 'delux') {
                    adjustedAvailability.delux.available += 1;
                } else if (existing.roomType === 'suite') {
                    adjustedAvailability.suite.available += 1;
                }
            }
        }

        // Check if requested room type is available
        if (reservation.roomType === 'standard' && adjustedAvailability.standard.available < 1) {
            return false;
        } else if (reservation.roomType === 'standard-connecting' && adjustedAvailability.standard.available < 2) {
            return false;
        } else if (reservation.roomType === 'delux' && adjustedAvailability.delux.available < 1) {
            return false;
        } else if (reservation.roomType === 'suite' && adjustedAvailability.suite.available < 1) {
            return false;
        }
    }

    return true;
}

function editReservation(id) {
    const reservations = getReservations();
    const reservation = reservations.find(r => r.id === id);
    if (reservation) {
        openReservationModal(reservation);
    }
}

function confirmDelete(id) {
    const reservations = getReservations();
    const reservation = reservations.find(r => r.id === id);

    if (reservation && confirm(`Are you sure you want to delete the reservation for ${reservation.catName}?`)) {
        deleteReservation(id);
        renderReservations();
        renderDashboard();
        alert('✅ Reservation deleted successfully!');
    }
}

// ===========================
// Navigation & Tabs
// ===========================

function initTabs() {
    const tabs = document.querySelectorAll('.tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Update active tab
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update active content
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');

    APP_STATE.currentView = tabName;

    // Render content
    if (tabName === 'dashboard') {
        renderDashboard();
    } else if (tabName === 'reservations') {
        renderReservations();
    } else if (tabName === 'history') {
        renderHistory();
    }
}

// ===========================
// Calendar Navigation
// ===========================

function initCalendarNav() {
    document.getElementById('prev-month').addEventListener('click', () => {
        APP_STATE.currentDate.setMonth(APP_STATE.currentDate.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById('next-month').addEventListener('click', () => {
        APP_STATE.currentDate.setMonth(APP_STATE.currentDate.getMonth() + 1);
        renderCalendar();
    });

    document.getElementById('today-btn').addEventListener('click', () => {
        APP_STATE.currentDate = new Date();
        renderCalendar();
    });
}

// ===========================
// Modal Controls
// ===========================

function initModal() {
    const modal = document.getElementById('reservation-modal');
    const newReservationBtn = document.getElementById('new-reservation-btn');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const form = document.getElementById('reservation-form');

    newReservationBtn.addEventListener('click', () => openReservationModal());
    closeModalBtn.addEventListener('click', closeReservationModal);
    cancelBtn.addEventListener('click', closeReservationModal);

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeReservationModal();
        }
    });

    form.addEventListener('submit', handleReservationSubmit);

    // Update check-out min when check-in changes
    document.getElementById('check-in').addEventListener('change', (e) => {
        const checkInDate = e.target.value;
        if (checkInDate) {
            const minCheckOut = new Date(checkInDate);
            minCheckOut.setDate(minCheckOut.getDate() + 1);
            document.getElementById('check-out').min = formatDate(minCheckOut);
        }
    });
}

// ===========================
// App Initialization
// ===========================

function initApp() {
    initTabs();
    initCalendarNav();
    initModal();
    renderDashboard();
}

// ===========================
// Start Application
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    initAuth();

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(() => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed:', err));
    }
});
