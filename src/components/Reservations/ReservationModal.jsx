import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useReservations } from '../../context/ReservationContext';
import { formatDate, isDateInRange } from '../../utils/dateUtils';
import { getRoomAvailability } from '../../utils/roomUtils';

export default function ReservationModal({ isOpen, onClose, reservation, onSuccess }) {
    const { saveReservation, reservations } = useReservations();

    const [formData, setFormData] = useState({
        id: '',
        bookerName: '',
        bookerContact: '',
        catName: '',
        catDetails: '',
        checkIn: '',
        checkOut: '',
        roomType: '',
        roomNumber: '',
        notes: ''
    });

    useEffect(() => {
        if (reservation) {
            setFormData(reservation);
        } else {
            setFormData({
                id: '',
                bookerName: '',
                bookerContact: '',
                catName: '',
                catDetails: '',
                checkIn: '',
                checkOut: '',
                roomType: '',
                roomNumber: '',
                notes: ''
            });
        }
    }, [reservation]);

    // Check if room is available for the selected dates
    const isRoomAvailableForDates = (roomNumber, checkIn, checkOut) => {
        if (!checkIn || !checkOut) return true;

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
        return allRooms.filter(room =>
            isRoomAvailableForDates(room, formData.checkIn, formData.checkOut)
        );
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

        // Update check-out min when check-in changes
        if (name === 'checkIn' && value) {
            const minCheckOut = new Date(value);
            minCheckOut.setDate(minCheckOut.getDate() + 1);
            const minDateStr = formatDate(minCheckOut);
            if (formData.checkOut < minDateStr) {
                setFormData(prev => ({ ...prev, checkOut: minDateStr }));
            }
        }
    };

    const checkAvailability = () => {
        if (!formData.checkIn || !formData.checkOut || !formData.roomType) return true;

        const checkIn = new Date(formData.checkIn);
        const checkOut = new Date(formData.checkOut);

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

        // Reset form to initial empty state
        setFormData({
            id: '',
            bookerName: '',
            bookerContact: '',
            catName: '',
            catDetails: '',
            checkIn: '',
            checkOut: '',
            roomType: '',
            roomNumber: '',
            notes: ''
        });

        onClose();
        if (onSuccess) onSuccess();
    };

    if (!isOpen) return null;

    const today = formatDate(new Date());
    const minCheckOut = formData.checkIn ? formatDate(new Date(new Date(formData.checkIn).getTime() + 86400000)) : today;

    return createPortal(
        <div className="modal active">
            <div className="modal-content">
                <div className="modal-header">
                    <h2 className="modal-title">{reservation ? 'Edit Reservation' : 'New Reservation'}</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
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
                            />
                        </div>

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
                                    min={today}
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
                                <option value="standard">Standard Room (4 available)</option>
                                <option value="standard-connecting">Standard Connecting (2 rooms - for pairs)</option>
                                <option value="delux">Private Delux (2 available)</option>
                                <option value="suite">Suite (2 available)</option>
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
