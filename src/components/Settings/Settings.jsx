import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import './Settings.css';

export default function Settings() {
    const { t } = useTranslation();
    const { isAdmin } = useAuth();
    const [prices, setPrices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchPrices();
    }, []);

    const fetchPrices = async () => {
        try {
            const { data, error } = await supabase
                .from('room_rates')
                .select('*')
                .order('price', { ascending: true });

            if (error) throw error;
            setPrices(data || []);
        } catch (error) {
            console.error('Error fetching prices:', error);
            setMessage({ type: 'error', text: 'Failed to load prices' });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePriceChange = (roomType, newPrice) => {
        setPrices(prev => prev.map(p =>
            p.room_type === roomType ? { ...p, price: newPrice } : p
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            // Update all prices
            const updates = prices.map(p =>
                supabase
                    .from('room_rates')
                    .update({ price: p.price, updated_at: new Date().toISOString() })
                    .eq('room_type', p.room_type)
            );

            await Promise.all(updates);
            setMessage({ type: 'success', text: 'Prices updated successfully!' });
        } catch (error) {
            console.error('Error saving prices:', error);
            setMessage({ type: 'error', text: 'Failed to save prices' });
        } finally {
            setSaving(false);
        }
    };



    if (isLoading) return <div className="p-4 text-center">Loading settings...</div>;

    const getRoomLabel = (type) => {
        switch (type) {
            case 'standard': return t('calendar.standard');
            case 'standard-connecting': return `${t('calendar.standard')} (Connecting)`;
            case 'delux': return t('calendar.deluxe');
            case 'suite': return t('calendar.suite');
            default: return type;
        }
    };

    return (
        <div className="settings-container animate-in">
            <div className="settings-header">
                <h2>⚙️ Admin Settings</h2>
                <p className="text-secondary">Manage room rates and system configurations</p>
            </div>

            <div className="card settings-card">
                <h3>💵 Room Pricing (Per Night)</h3>

                {message && (
                    <div className={`alert ${message.type === 'error' ? 'alert-danger' : 'alert-success'}`}>
                        {message.text}
                    </div>
                )}

                <div className="price-list">
                    {prices.map(rate => (
                        <div key={rate.room_type} className="price-item">
                            <label className="price-label">
                                {getRoomLabel(rate.room_type)}
                            </label>
                            <div className="price-input-group">
                                <span className="currency-symbol">฿</span>
                                <input
                                    type="number"
                                    value={rate.price}
                                    onChange={(e) => handlePriceChange(rate.room_type, e.target.value)}
                                    className="form-control"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="settings-actions">
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : t('common.save')}
                    </button>
                </div>
            </div>
        </div>
    );
}
