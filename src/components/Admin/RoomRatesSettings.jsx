import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

export default function RoomRatesSettings() {
    const { isAdmin } = useAuth();
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchRates();
    }, []);

    const fetchRates = async () => {
        try {
            const { data, error } = await supabase
                .from('room_rates')
                .select('*')
                .order('room_type');

            if (error) throw error;
            setRates(data || []);
        } catch (error) {
            console.error('Error fetching rates:', error);
            setMessage({ type: 'error', text: 'Failed to load room rates.' });
        } finally {
            setLoading(false);
        }
    };

    const handlePriceChange = (roomType, newPrice) => {
        setRates(prev => prev.map(rate =>
            rate.room_type === roomType ? { ...rate, price: newPrice } : rate
        ));
    };

    const handleSave = async (roomType) => {
        setSaving(true);
        setMessage(null);

        try {
            const rateToUpdate = rates.find(r => r.room_type === roomType);
            if (!rateToUpdate) return;

            // Ensure price is a number
            const price = parseFloat(rateToUpdate.price);
            if (isNaN(price)) {
                throw new Error('Invalid price value');
            }

            const { error } = await supabase
                .from('room_rates')
                .update({ price: price, updated_at: new Date().toISOString() })
                .eq('id', rateToUpdate.id);

            if (error) throw error;

            setMessage({ type: 'success', text: `Successfully updated ${roomType} rate!` });
            console.log(`Rate saved successfully for ${roomType}. New price: ${price}`);

            // Clear message after 3 seconds
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Error saving rate:', error);
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    const getDisplayName = (type) => {
        switch (type) {
            case 'standard': return 'Standard Room';
            case 'standard-connecting': return 'Standard Connecting';
            case 'delux': return 'Private Delux';
            case 'suite': return 'Suite';
            default: return type;
        }
    };


    if (loading) return <div>Loading rates...</div>;

    return (
        <div className="room-rates-container animate-in" style={{ padding: '1rem' }}>
            <h2>💰 Room Rates Management</h2>
            <p className="text-secondary" style={{ marginBottom: '2rem' }}>
                Update the base price per night for each room type.
            </p>

            {message && (
                <div style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    background: message.type === 'error' ? '#fee2e2' : '#dcfce7',
                    color: message.type === 'error' ? '#991b1b' : '#166534',
                    border: `1px solid ${message.type === 'error' ? '#f87171' : '#4ade80'}`
                }}>
                    {message.text}
                </div>
            )}

            <div className="card" style={{ maxWidth: '800px', padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b' }}>Room Type</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b' }}>Price (THB)</th>
                            <th style={{ padding: '1rem', textAlign: 'right', color: '#64748b' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rates.map(rate => (
                            <tr key={rate.room_type} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '1rem', fontWeight: '500' }}>
                                    {getDisplayName(rate.room_type)}
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                        {rate.room_type}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>฿</span>
                                        <input
                                            type="number"
                                            value={rate.price}
                                            onChange={(e) => handlePriceChange(rate.room_type, e.target.value)}
                                            style={{
                                                padding: '0.5rem',
                                                border: '1px solid #cbd5e1',
                                                borderRadius: '4px',
                                                width: '100px'
                                            }}
                                        />
                                    </div>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleSave(rate.room_type)}
                                        disabled={saving}
                                        style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                                    >
                                        {saving ? 'Saving...' : 'Save'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
