import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import './Customers.css';

export default function CustomerForm({ customer, onClose }) {
    // If customer is provided, we are in Edit mode. Otherwise Create mode.
    const isEditMode = !!customer;
    const { user } = useAuth(); // Log who created this?

    // Customer State
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        email: '',
        line_id: '',
        address: ''
    });

    // Cats State
    const [cats, setCats] = useState([]);

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);

    // Load data if editing
    useEffect(() => {
        if (isEditMode && customer) {
            setFormData({
                full_name: customer.full_name || '',
                phone: customer.phone || '',
                email: customer.email || '',
                line_id: customer.line_id || '',
                address: customer.address || ''
            });

            if (customer.cats) {
                setCats(customer.cats);
            }
        }
    }, [isEditMode, customer]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // ----- Cat Management -----
    const addCatPlaceholder = () => {
        setCats(prev => [
            ...prev,
            {
                id: `temp-${Date.now()}`, // Temporary ID
                name: '',
                breed: '',
                color: '',
                gender: 'Male',
                type: 'new' // Marker
            }
        ]);
    };

    const handleCatChange = (index, field, value) => {
        setCats(prev => {
            const newCats = [...prev];
            newCats[index] = { ...newCats[index], [field]: value };
            return newCats;
        });
    };

    const removeCat = async (index) => {
        const catToRemove = cats[index];

        // If it's a real cat (has UUID), we might want to delete from DB or just mark as deleted? 
        // For simplicity, let's just remove from UI list. 
        // Real deletion logic could happen on Save, or immediately if we want.
        // Let's remove immediately if it is an existing cat to keep state clean, but warn user?
        // Actually, safer to just track deletions and commit on Save, but for MVP:

        if (catToRemove.type !== 'new') {
            if (!window.confirm('Delete this cat permanently?')) return;
            // Delete from DB immediately
            try {
                const { error } = await supabase.from('cats').delete().eq('id', catToRemove.id);
                if (error) throw error;
            } catch (err) {
                console.error("Error deleting cat", err);
                alert("Failed to delete cat");
                return;
            }
        }

        setCats(prev => prev.filter((_, i) => i !== index));
    };

    // ----- Save Logic -----
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            let customerId = customer?.id;

            // 1. Save Customer
            if (isEditMode) {
                const { error } = await supabase
                    .from('customers')
                    .update({
                        ...formData,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', customerId);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from('customers')
                    .insert({ ...formData })
                    .select()
                    .single();
                if (error) throw error;
                customerId = data.id;
            }

            // 2. Save Cats
            // We need to upsert cats. 
            // Filter valid cats first
            const catsToSave = cats.map(cat => {
                const catData = {
                    owner_id: customerId,
                    name: cat.name,
                    breed: cat.breed,
                    color: cat.color,
                    gender: cat.gender,
                    medical_notes: cat.medical_notes,
                    dietary_notes: cat.dietary_notes
                };

                // If it's an existing cat (not temp), include ID
                if (!cat.id.toString().startsWith('temp-')) {
                    catData.id = cat.id;
                }

                return catData;
            }).filter(c => c.name.trim() !== ''); // Skip empty names

            if (catsToSave.length > 0) {
                const { error: catError } = await supabase
                    .from('cats')
                    .upsert(catsToSave);

                if (catError) throw catError;
            }

            onClose(true); // Close and refresh
        } catch (error) {
            console.error('Error saving customer:', error);
            setMessage('Failed to save data. Please check connection.');
        } finally {
            setIsLoading(false);
        }
    };

    return createPortal(
        <div className="modal active">
            <div className="modal-content customer-modal-content">
                <div className="modal-header">
                    <h2 className="modal-title">
                        {isEditMode ? 'Edit Customer' : 'New Customer'}
                    </h2>
                    <button className="modal-close" onClick={() => onClose(false)}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {message && <div className="alert alert-danger mb-3">{message}</div>}

                        <h3 className="section-title">👤 Owner Details</h3>

                        <div className="form-group">
                            <label className="form-label">Full Name *</label>
                            <input
                                type="text"
                                name="full_name"
                                className="form-input"
                                required
                                value={formData.full_name}
                                onChange={handleInputChange}
                                placeholder="e.g. John Doe"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    className="form-input"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="e.g. 081-234-5678"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="form-input"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="name@example.com"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">LINE ID</label>
                                <input
                                    type="text"
                                    name="line_id"
                                    className="form-input"
                                    value={formData.line_id}
                                    onChange={handleInputChange}
                                    placeholder="Line ID"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Address</label>
                            <textarea
                                name="address"
                                className="form-textarea"
                                rows="3"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="Enter full address..."
                            ></textarea>
                        </div>

                        <h3 className="section-title">🐱 Cats</h3>
                        <div className="cats-grid">
                            {cats.map((cat, index) => (
                                <div key={cat.id} className="cat-card">
                                    <div className="cat-card-header">
                                        <input
                                            type="text"
                                            placeholder="Cat Name *"
                                            value={cat.name}
                                            onChange={(e) => handleCatChange(index, 'name', e.target.value)}
                                            className="cat-name-input"
                                            required
                                            style={{ fontWeight: 'bold', width: '70%' }}
                                        />
                                        <button
                                            type="button"
                                            className="text-danger btn-link"
                                            onClick={() => removeCat(index)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <div className="cat-details">
                                        <div className="cat-row mb-2">
                                            <input
                                                type="text"
                                                placeholder="Breed"
                                                value={cat.breed || ''}
                                                onChange={(e) => handleCatChange(index, 'breed', e.target.value)}
                                                className="form-input"
                                                style={{ fontSize: '0.9rem', marginBottom: '0.5rem', padding: '0.5rem' }}
                                            />
                                        </div>
                                        <div className="cat-row" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <select
                                                value={cat.gender || 'Male'}
                                                onChange={(e) => handleCatChange(index, 'gender', e.target.value)}
                                                className="form-select"
                                                style={{ fontSize: '0.9rem', padding: '0.5rem' }}
                                            >
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                            </select>
                                            <input
                                                type="text"
                                                placeholder="Color"
                                                value={cat.color || ''}
                                                onChange={(e) => handleCatChange(index, 'color', e.target.value)}
                                                className="form-input"
                                                style={{ fontSize: '0.9rem', padding: '0.5rem' }}
                                            />
                                        </div>
                                        <div className="cat-row">
                                            <textarea
                                                placeholder="Medical/Dietary Notes..."
                                                rows="2"
                                                value={cat.medical_notes || ''}
                                                onChange={(e) => handleCatChange(index, 'medical_notes', e.target.value)}
                                                className="form-textarea"
                                                style={{ fontSize: '0.85rem', width: '100%', padding: '0.5rem' }}
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button type="button" className="add-cat-btn" onClick={addCatPlaceholder}>
                                <span>+ Add Cat</span>
                            </button>
                        </div>

                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline" onClick={() => onClose(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Customer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
