import { useEffect } from 'react';

export default function Toast({ message, type = 'info', onClose, duration = 3000 }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'info': return 'ℹ️';
            default: return 'ℹ️';
        }
    };

    return (
        <div className={`toast ${type}`}>
            <span className="toast-icon">{getIcon()}</span>
            <span className="toast-message">{message}</span>
            <button
                onClick={onClose}
                style={{
                    background: 'none',
                    border: 'none',
                    marginLeft: 'auto',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    fontSize: '1.2rem'
                }}
            >
                ×
            </button>
        </div>
    );
}
