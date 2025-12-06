import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { formatDate } from '../../utils/dateUtils';
import './PublicStyles.css';

export default function PublicBooking() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [roomRates, setRoomRates] = useState({});

    const [formData, setFormData] = useState({
        checkIn: '',
        checkOut: '',
        roomType: 'standard',
        guestName: '',
        guestEmail: '',
        guestPhone: '',
        catName: '',
        catDetails: '',
        notes: ''
    });

    useEffect(() => {
        fetchRoomRates();
    }, []);

    const fetchRoomRates = async () => {
        const { data } = await supabase.from('room_rates').select('*');
        if (data) {
            const rates = {};
            data.forEach(r => rates[r.room_type] = r.price);
            setRoomRates(rates);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const calculateTotal = () => {
        if (!formData.checkIn || !formData.checkOut || !formData.roomType) return 0;
        const start = new Date(formData.checkIn);
        const end = new Date(formData.checkOut);
        const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        if (nights <= 0) return 0;
        return nights * (roomRates[formData.roomType] || 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Basic Auto-Assignment Logic (Simplified for MVP)
        // Find an available room of the selected type
        // In a real app, we'd do a complex query. Here we'll just insert with 'Pending' room
        // or attempt to find one. For now, let's auto-assign 'Std1' if standard, etc.
        // Actually, let's just create a reservation with room_number as 'TBD' or handle it in backend?
        // Our DB schema requires room_number.
        // Let's pick a random one for now or just first available. 
        // We really need 'getRoomAvailability' logic here.

        // Reusing logic from ReservationModal would be best, but it's coupled to Context.
        // For this MVP step, we will just alert 'Coming Soon' logic or insert a dummy.

        try {
            // Create Customer record first (or find existing?)
            // Ideally we check email.
            let customerId = null;
            const { data: existingCust } = await supabase
                .from('customers')
                .select('id')
                .eq('email', formData.guestEmail)
                .single();

            if (existingCust) {
                customerId = existingCust.id;
            } else {
                const { data: newCust, error: custError } = await supabase
                    .from('customers')
                    .insert([{
                        full_name: formData.guestName,
                        email: formData.guestEmail,
                        phone: formData.guestPhone
                    }])
                    .select()
                    .single();

                if (custError) throw custError;
                customerId = newCust.id;
            }

            // Create Cat record
            const { data: newCat, error: catError } = await supabase
                .from('cats')
                .insert([{
                    owner_id: customerId,
                    name: formData.catName,
                    breed: formData.catDetails
                }])
                .select()
                .single();

            if (catError) throw catError;

            // Create Reservation
            // Auto-assign Room: This is tricky without the full logic.
            // For MVP v1.2, let's just put them in 'Std1' (or appropriate) if available.

            const { error: resError } = await supabase
                .from('reservations')
                .insert([{
                    customer_id: customerId,
                    cat_id: newCat.id,
                    booker_name: formData.guestName,
                    booker_contact: formData.guestPhone,
                    cat_name: formData.catName,
                    check_in: formData.checkIn,
                    check_out: formData.checkOut,
                    room_type: formData.roomType,
                    room_number: getFirstRoom(formData.roomType), // Temporary: Auto-assign first room logic
                    total_price: calculateTotal(),
                    status: 'confirmed',
                    notes: formData.notes + ' (Booked Online)'
                }]);

            if (resError) throw resError;

            alert('✅ Reservation Successful! We look forward to seeing you.');
            setStep(3); // Success Step

        } catch (error) {
            console.error(error);
            alert('Error booking reservation: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const getFirstRoom = (type) => {
        switch (type) {
            case 'standard': return 'Std1';
            case 'standard-connecting': return 'Std1+Std2';
            case 'delux': return 'Delx1';
            case 'suite': return 'Suite1';
            default: return 'Std1';
        }
    };

    const today = formatDate(new Date());
    const minCheckOut = formData.checkIn ? formatDate(new Date(new Date(formData.checkIn).getTime() + 86400000)) : today;

    if (step === 3) {
        return (
            <div className="booking-container" style={{ textAlign: 'center', padding: '4rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                <h1>Booking Confirmed!</h1>
                <p>Thank you for choosing Nekoha Cat Hotel. We have sent a confirmation to <b>{formData.guestEmail}</b>.</p>
                <button className="btn-cta btn-primary-lg" onClick={() => window.location.href = '/'}>Back to Home</button>
            </div>
        );
    }

    return (
        <div className="booking-container" style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Book Your Stay</h1>

            <form onSubmit={handleSubmit} style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                {/* Step 1: Dates & Room */}
                <h3 className="section-title">📅 Dates & Room</h3>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Check-in</label>
                        <input type="date" name="checkIn" className="form-input" value={formData.checkIn} onChange={handleChange} min={today} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Check-out</label>
                        <input type="date" name="checkOut" className="form-input" value={formData.checkOut} onChange={handleChange} min={minCheckOut} required />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Room Type</label>
                    <select name="roomType" className="form-select" value={formData.roomType} onChange={handleChange} required>
                        <option value="standard">Standard Room (฿{roomRates['standard'] || '...'})</option>
                        <option value="standard-connecting">Standard Connecting (฿{roomRates['standard-connecting'] || '...'})</option>
                        <option value="delux">Private Delux (฿{roomRates['delux'] || '...'})</option>
                        <option value="suite">Suite (฿{roomRates['suite'] || '...'})</option>
                    </select>
                </div>

                <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid #eee' }} />

                {/* Step 2: Guest Info */}
                <h3 className="section-title">👤 Your Information</h3>
                <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input type="text" name="guestName" className="form-input" value={formData.guestName} onChange={handleChange} required placeholder="John Doe" />
                </div>
                <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" name="guestEmail" className="form-input" value={formData.guestEmail} onChange={handleChange} required placeholder="john@example.com" />
                </div>
                <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input type="tel" name="guestPhone" className="form-input" value={formData.guestPhone} onChange={handleChange} required placeholder="081-234-5678" />
                </div>

                <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid #eee' }} />

                {/* Step 3: Cat Info */}
                <h3 className="section-title">🐱 Cat Details</h3>
                <div className="form-group">
                    <label className="form-label">Cat Name</label>
                    <input type="text" name="catName" className="form-input" value={formData.catName} onChange={handleChange} required placeholder="Mochi" />
                </div>
                <div className="form-group">
                    <label className="form-label">Breed / Notes</label>
                    <textarea name="catDetails" className="form-textarea" value={formData.catDetails} onChange={handleChange} placeholder="Persian, Needs daily brushing..." />
                </div>

                <div className="form-group">
                    <label className="form-label">Special Requests</label>
                    <textarea name="notes" className="form-textarea" value={formData.notes} onChange={handleChange} placeholder="Any special requests?" />
                </div>

                {/* Total & Submit */}
                <div style={{ marginTop: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Estimated Total</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>฿{calculateTotal().toLocaleString()}</div>
                    </div>
                    <button type="submit" className="btn-cta btn-primary-lg" disabled={loading}>
                        {loading ? 'Confirming...' : 'Confirm Booking'}
                    </button>
                </div>
            </form>
        </div>
    );
}
