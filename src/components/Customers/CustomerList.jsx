import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useTranslation } from 'react-i18next';
import './Customers.css';
import CustomerForm from './CustomerForm';

export default function CustomerList() {
    const { t } = useTranslation();
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null); // For editing
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*, cats(*)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCustomers(data || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredCustomers = customers.filter(c =>
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddNew = () => {
        setSelectedCustomer(null);
        setIsFormOpen(true);
    };

    const handleEdit = (customer) => {
        setSelectedCustomer(customer);
        setIsFormOpen(true);
    };

    const handleFormClose = (shouldRefresh) => {
        setIsFormOpen(false);
        setSelectedCustomer(null);
        if (shouldRefresh) {
            fetchCustomers();
        }
    };

    return (
        <div className="customers-container animate-in">
            <div className="customers-header">
                <div>
                    <h2>👥 Customer Management</h2>
                    <p className="text-secondary">Manage owners and their cats</p>
                </div>
                <button className="btn btn-primary" onClick={handleAddNew}>
                    <span className="btn-icon">➕</span>
                    New Verified Customer
                </button>
            </div>

            <div className="card customers-card">
                <div className="search-bar" style={{ position: 'relative', maxWidth: '400px' }}>
                    <span className="search-icon" style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-light)',
                        zIndex: 1
                    }}>🔍</span>
                    <input
                        type="text"
                        placeholder="Search by name, phone, or email..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="form-input"
                        style={{ paddingLeft: '40px' }}
                    />
                </div>

                {isLoading ? (
                    <div className="text-center p-4">Loading customers...</div>
                ) : (
                    <div className="table-responsive">
                        <table className="customers-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Contact</th>
                                    <th>Cats</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center p-4 text-secondary">
                                            No customers found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCustomers.map(customer => (
                                        <tr key={customer.id}>
                                            <td className="font-medium">{customer.full_name}</td>
                                            <td>
                                                <div className="contact-info">
                                                    <div>📞 {customer.phone || '-'}</div>
                                                    {customer.email && <div className="text-sm text-secondary">✉️ {customer.email}</div>}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cat-tags">
                                                    {customer.cats && customer.cats.length > 0 ? (
                                                        customer.cats.map(cat => (
                                                            <span key={cat.id} className="cat-tag">
                                                                🐱 {cat.name}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-secondary text-sm">No cats added</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-outline btn-sm"
                                                    onClick={() => handleEdit(customer)}
                                                >
                                                    Edit / View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isFormOpen && (
                <CustomerForm
                    customer={selectedCustomer}
                    onClose={handleFormClose}
                />
            )}
        </div>
    );
}
