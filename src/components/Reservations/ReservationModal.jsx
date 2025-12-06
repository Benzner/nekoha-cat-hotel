import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useReservations } from '../../context/ReservationContext';
import { formatDate, isDateInRange } from '../../utils/dateUtils';
import { getRoomAvailability } from '../../utils/roomUtils';
import { supabase } from '../../supabaseClient';

export default function ReservationModal({ isOpen, onClose, reservation, onSuccess }) {
    const { saveReservation, reservations } = useReservations();

    const [formData, setFormData] = useState({
        id: '',
        bookerName: '',
        bookerContact: '',
        catName: '',
        catDetails: '',
        customerId: null,
        catId: null,
        checkIn: '',
        checkOut: '',
        roomType: '',
        roomNumber: '',
        notes: '',
        totalPrice: 0
    });

    const [customers, setCustomers] = useState([]);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedCatIds, setSelectedCatIds] = useState([]);
    const [roomRates, setRoomRates] = useState({});

    // Fetch dependencies when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchCustomers();
            fetchRoomRates();
            // Reset local states
            setCustomerSearch('');
            setShowCustomerDropdown(false);
            setSelectedCatIds([]);
        }
    }, [isOpen]);

    // Handle initial data when 'reservation' prop changes
    useEffect(() => {
        if (reservation) {
            setFormData(reservation);
            // If we have a catId from DB, set it in array for highlighting
            if (reservation.catId) {
                setSelectedCatIds([reservation.catId]);
            }
            // We might want to find the customer here if we had customerId in reservation
            // But strict requirement wasn't clear, assuming booking flow sets it.
        } else {
            // Reset form for new reservation
            setFormData({
                id: '',
                bookerName: '',
                bookerContact: '',
                catName: '',
                catDetails: '',
                customerId: null,
                catId: null,
                checkIn: '',
                checkOut: '',
                roomType: '',
                roomNumber: '',
                notes: '',
                totalPrice: 0
            });
            setSelectedCustomer(null);
            setCustomerSearch('');
            setSelectedCatIds([]);
        }
    }, [reservation]);

    // Recalculate price when dates or room type change
    useEffect(() => {
        if (formData.checkIn && formData.checkOut && formData.roomType && roomRates[formData.roomType]) {
            const start = new Date(formData.checkIn);
            const end = new Date(formData.checkOut);

            // Validate dates
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

                if (nights > 0) {
                    const pricePerNight = roomRates[formData.roomType];
                    setFormData(prev => ({ ...prev, totalPrice: nights * pricePerNight }));
                } else {
                    setFormData(prev => ({ ...prev, totalPrice: 0 }));
                }
            }

        }
    }, [formData.checkIn, formData.checkOut, formData.roomType, roomRates]);

    const fetchCustomers = async () => {
        try {
            const { data, error } = await supabase.from('customers').select('*, cats(*)');
            if (error) throw error;
            setCustomers(data || []);
        } catch (err) {
            console.error("Error fetching customers:", err);
            setCustomers([]);
        }
    };

    const fetchRoomRates = async () => {
        try {
            const { data, error } = await supabase.from('room_rates').select('*');
            if (error) throw error;
            if (data) {
                const rates = {};
                data.forEach(r => rates[r.room_type] = r.price);
                setRoomRates(rates);
            }
        } catch (err) {
            console.error("Error fetching rates:", err);
        }
    };

    const handleCustomerSearchChange = (e) => {
        setCustomerSearch(e.target.value);
        setShowCustomerDropdown(true);
    };

    const selectCustomer = (customer) => {
        setSelectedCustomer(customer);
        setCustomerSearch(customer.full_name || '');
        setShowCustomerDropdown(false);
        setSelectedCatIds([]); // Reset cats when customer changes

        setFormData(prev => ({
            ...prev,
            customerId: customer.id,
            bookerName: customer.full_name || '',
            bookerContact: customer.phone || '',
            catId: null, // Reset cat
            catName: '',
            catDetails: ''
        }));
    };

    const clearCustomerSelection = () => {
        setSelectedCustomer(null);
        setCustomerSearch('');
        setSelectedCatIds([]);
        setFormData(prev => ({
            ...prev,
            customerId: null,
            bookerName: '',
            bookerContact: '',
            catId: null,
            catName: '',
            catDetails: ''
        }));
    };

    const handleCatSelect = (cat) => {
        let newSelectedIds;

        if (selectedCatIds.includes(cat.id)) {
            // Deselect
            newSelectedIds = selectedCatIds.filter(id => id !== cat.id);
        } else {
            // Select
            newSelectedIds = [...selectedCatIds, cat.id];
        }

        setSelectedCatIds(newSelectedIds);

        // Regenerate catName and catDetails based on ALL selected cats
        if (selectedCustomer && selectedCustomer.cats) {
            const selectedCats = selectedCustomer.cats.filter(c => newSelectedIds.includes(c.id));

            const names = selectedCats.map(c => c.name).join(', ');

            const details = selectedCats.map(c => {
                const lines = [
                    `[${c.name}]`,
                    c.breed ? `Breed: ${c.breed}` : '',
                    c.gender ? `Gender: ${c.gender}` : '',
                    c.medical_notes ? `Medical: ${c.medical_notes}` : '',
                    c.dietary_notes ? `Diet: ${c.dietary_notes}` : '',
                    c.personality_notes ? `Personality: ${c.personality_notes}` : ''
                ].filter(Boolean).join('\n');
                return lines;
            }).join('\n\n---\n\n');

            setFormData(prev => ({
                ...prev,
                // If multiple cats, we can't really store a single 'catId'. 
                // We'll store the FIRST one just to have a link, or null. 
                // Let's store the first one so at least one link doesn't hurt.
                catId: newSelectedIds.length > 0 ? newSelectedIds[0] : null,
                catName: names,
                catDetails: details
            }));
        }
    };

    // Check if room is available for the selected dates
    const isRoomAvailableForDates = (roomNumber, checkIn, checkOut) => {
        if (!checkIn || !checkOut) return true;

        // Ensure valid dates
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) return false;

        // Get all reservations that overlap with selected dates
        const conflictingReservations = reservations.filter(res => {
            // Skip current reservation when editing
            if (formData.id && res.id === formData.id) return false;

            // Check date overlap
            const resStart = res.checkIn;
            const resEnd = res.checkOut;
            return checkIn < resEnd && resStart < checkOut;
        });

        // Check for conflicts with each reservation
        for (const res of conflictingReservations) {
            // Direct match - same room number
            if (res.roomNumber === roomNumber) return false;

            // Check if we're trying to book a connecting room
            if (roomNumber.includes('+')) {
                // E.g., checking "Std3+Std4"
                const rooms = roomNumber.split('+'); // ['Std3', 'Std4']
                // If either room is booked individually, can't book the connecting
                if (rooms.includes(res.roomNumber)) return false;
            } else {
                // Check if we're trying to book an individual room
                // E.g., checking "Std3"
                // If a connecting room that includes this room is booked, can't book individual
                if (res.roomNumber && res.roomNumber.includes('+') && res.roomNumber.includes(roomNumber)) {
                    return false;
                }
            }
        }

        return true;
    };

    // Get available room numbers based on room type
    const getRoomOptions = (roomType) => {
        const allRooms = (() => {
            switch (roomType) {
                case 'standard':
                    return ['Std1', 'Std2', 'Std3', 'Std4'];
                case 'standard-connecting':
                    return ['Std1+Std2', 'Std3+Std4'];
                case 'delux':
                    return ['Delx1', 'Delx2'];
                case 'suite':
                    return ['Suite1', 'Suite2'];
                default:
                    return [];
            }
        })();

        // Filter out unavailable rooms based on selected dates
        // Add safety check around filter
        try {
            return allRooms.filter(room =>
                isRoomAvailableForDates(room, formData.checkIn, formData.checkOut)
            );
        } catch (e) {
            console.error("Error filtering rooms", e);
            return allRooms;
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // If room type changes, reset room number
        if (name === 'roomType') {
            setFormData(prev => ({
                ...prev,
                roomType: value,
                roomNumber: '' // Reset room number when room type changes
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Update check-out min when check-in changes (Standard behavior is usually at least 1 night)
        // User requested removing restriction on DATES (allowing past dates), 
        // but physically CheckOut must still be > CheckIn for calculation logic.
        if (name === 'checkIn' && value) {
            const start = new Date(value);
            if (!isNaN(start.getTime())) {
                const minCheckOutDate = new Date(start);
                minCheckOutDate.setDate(minCheckOutDate.getDate() + 1);
                const minDateStr = formatDate(minCheckOutDate);

                // Just ensure check-out isn't BEFORE check-in
                if (formData.checkOut && formData.checkOut <= value) {
                    setFormData(prev => ({ ...prev, checkOut: minDateStr }));
                }
            }
        }
    };

    const checkAvailability = () => {
        if (!formData.checkIn || !formData.checkOut || !formData.roomType) return true;

        const checkIn = new Date(formData.checkIn);
        const checkOut = new Date(formData.checkOut);

        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) return false;

        for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
            const availability = getRoomAvailability(d, reservations);

            let adjustedAvailability = { ...availability };
            if (formData.id) {
                const existing = reservations.find(r => r.id === formData.id);
                if (existing && isDateInRange(formatDate(d), existing.checkIn, existing.checkOut)) {
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

            if (formData.roomType === 'standard' && adjustedAvailability.standard.available < 1) {
                return false;
            } else if (formData.roomType === 'standard-connecting' && adjustedAvailability.standard.available < 2) {
                return false;
            } else if (formData.roomType === 'delux' && adjustedAvailability.delux.available < 1) {
                return false;
            } else if (formData.roomType === 'suite' && adjustedAvailability.suite.available < 1) {
                return false;
            }
        }

        return true;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (new Date(formData.checkOut) <= new Date(formData.checkIn)) {
            alert('❌ Check-out date must be after check-in date!');
            return;
        }

        if (!checkAvailability()) {
            alert('❌ No rooms available for the selected dates and room type!');
            return;
        }

        saveReservation(formData);
        alert('✅ Reservation saved successfully!');

        onClose();
        if (onSuccess) onSuccess();
    };

    if (!isOpen) return null;

    // Safe filtering of customers
    const filteredCustomers = customers.filter(c => {
        if (!c || !c.full_name) return false;
        const search = (customerSearch || '').toLowerCase();
        const name = c.full_name.toLowerCase();
        const phone = c.phone || '';
        return name.includes(search) || phone.includes(search);
    });

    // Determine min date for checkOut input (purely for UI guidance, not strict blocking if user wants manual override)
    // We already removed min={today} for checkIn.
    let minCheckOut = undefined;
    if (formData.checkIn) {
        const d = new Date(formData.checkIn);
        if (!isNaN(d.getTime())) {
            d.setDate(d.getDate() + 1);
            minCheckOut = formatDate(d);
        }
    }

    return createPortal(
        <div className="modal active">
            <div className="modal-content">
                <div className="modal-header">
                    <h2 className="modal-title">{reservation ? 'Edit Reservation' : 'New Reservation'}</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* Customer Searchable Dropdown */}
                        <div className="form-group" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e2e8f0', position: 'relative' }}>
                            <label className="form-label" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>👤 Select Registered Customer</label>

                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Search name or phone..."
                                    value={customerSearch}
                                    onChange={handleCustomerSearchChange}
                                    onFocus={() => setShowCustomerDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                                />
                                {selectedCustomer && (
                                    <button
                                        type="button"
                                        onClick={clearCustomerSelection}
                                        style={{
                                            position: 'absolute',
                                            right: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: '#94a3b8',
                                            fontSize: '1.2rem'
                                        }}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>

                            {/* Dropdown List */}
                            {showCustomerDropdown && customerSearch && !selectedCustomer && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: '1rem',
                                    right: '1rem',
                                    background: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '0 0 8px 8px',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                    zIndex: 100,
                                    maxHeight: '200px',
                                    overflowY: 'auto'
                                }}>
                                    {filteredCustomers.length > 0 ? (
                                        filteredCustomers.map(c => (
                                            <div
                                                key={c.id}
                                                onClick={() => selectCustomer(c)}
                                                style={{
                                                    padding: '0.75rem 1rem',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid #f1f5f9',
                                                    transition: 'background 0.2s',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}
                                                onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                                                onMouseLeave={(e) => e.target.style.background = 'white'}
                                            >
                                                <span style={{ fontWeight: 500 }}>{c.full_name}</span>
                                                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{c.phone}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: '1rem', color: '#94a3b8', textAlign: 'center' }}>
                                            No customers found
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="bookerName">Booker Name *</label>
                            <input
                                type="text"
                                id="bookerName"
                                name="bookerName"
                                className="form-input"
                                placeholder="Enter booker name"
                                value={formData.bookerName}
                                onChange={handleChange}
                                required
                                readOnly={!!formData.customerId}
                                style={formData.customerId ? { background: '#f1f5f9' } : {}}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="bookerContact">Contact Number *</label>
                            <input
                                type="tel"
                                id="bookerContact"
                                name="bookerContact"
                                className="form-input"
                                placeholder="Enter contact number"
                                value={formData.bookerContact}
                                onChange={handleChange}
                                required
                                readOnly={!!formData.customerId}
                                style={formData.customerId ? { background: '#f1f5f9' } : {}}
                            />
                        </div>

                        {/* Cat Selection if Customer Selected */}
                        {formData.customerId && selectedCustomer?.cats?.length > 0 && (
                            <div className="form-group" style={{
                                padding: '0.75rem',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                marginBottom: '1rem'
                            }}>
                                <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                    📋 Registered Cats (Select to Auto-fill):
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {selectedCustomer.cats.map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            className="cat-tag"
                                            onClick={() => handleCatSelect(cat)}
                                            style={{
                                                background: selectedCatIds.includes(cat.id) ? '#0369a1' : '#e0f2fe',
                                                color: selectedCatIds.includes(cat.id) ? 'white' : '#0369a1',
                                                padding: '4px 12px',
                                                borderRadius: '16px',
                                                fontSize: '0.85rem',
                                                border: '1px solid #bae6fd',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            <span>🐱</span>
                                            {cat.name}
                                            {selectedCatIds.includes(cat.id) && <span>✓</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label" htmlFor="catName">Cat Name *</label>
                            <input
                                type="text"
                                id="catName"
                                name="catName"
                                className="form-input"
                                placeholder="Enter cat name"
                                value={formData.catName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="catDetails">Cat Details</label>
                            <textarea
                                id="catDetails"
                                name="catDetails"
                                className="form-textarea"
                                placeholder="Age, breed, special needs, allergies, etc."
                                value={formData.catDetails}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="checkIn">Check-in Date *</label>
                                <input
                                    type="date"
                                    id="checkIn"
                                    name="checkIn"
                                    className="form-input"
                                    value={formData.checkIn}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="checkOut">Check-out Date *</label>
                                <input
                                    type="date"
                                    id="checkOut"
                                    name="checkOut"
                                    className="form-input"
                                    value={formData.checkOut}
                                    onChange={handleChange}
                                    min={minCheckOut}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="roomType">Room Type *</label>
                            <select
                                id="roomType"
                                name="roomType"
                                className="form-select"
                                value={formData.roomType}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select room type</option>
                                <option value="standard">Standard Room ({roomRates['standard'] ? `฿${roomRates['standard']}` : 'Loading...'})</option>
                                <option value="standard-connecting">Standard Connecting ({roomRates['standard-connecting'] ? `฿${roomRates['standard-connecting']}` : ''})</option>
                                <option value="delux">Private Delux ({roomRates['delux'] ? `฿${roomRates['delux']}` : ''})</option>
                                <option value="suite">Suite ({roomRates['suite'] ? `฿${roomRates['suite']}` : ''})</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="roomNumber">Room Number *</label>
                            <select
                                id="roomNumber"
                                name="roomNumber"
                                className="form-select"
                                value={formData.roomNumber}
                                onChange={handleChange}
                                required
                                disabled={!formData.roomType}
                            >
                                <option value="">Select room number</option>
                                {getRoomOptions(formData.roomType).map(room => (
                                    <option key={room} value={room}>{room}</option>
                                ))}
                            </select>
                        </div>

                        {/* Price Display */}
                        {formData.totalPrice > 0 && (
                            <div className="price-display" style={{
                                padding: '1rem',
                                background: '#f0fdf4',
                                border: '1px solid #86efac',
                                borderRadius: '8px',
                                marginBottom: '1rem',
                                color: '#166534',
                                fontWeight: 'bold',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span>Estimated Total:</span>
                                <span style={{ fontSize: '1.25rem' }}>฿{formData.totalPrice.toLocaleString()}</span>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label" htmlFor="notes">Special Notes</label>
                            <textarea
                                id="notes"
                                name="notes"
                                className="form-textarea"
                                placeholder="Any special requests or notes..."
                                value={formData.notes}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Reservation</button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
