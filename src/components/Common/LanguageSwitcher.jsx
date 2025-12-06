import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className="language-switcher" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
                onClick={() => changeLanguage('en')}
                style={{
                    background: i18n.language.startsWith('en') ? 'var(--primary)' : 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    opacity: i18n.language.startsWith('en') ? 1 : 0.6,
                    transition: 'all 0.2s'
                }}
                title="English"
            >
                🇬🇧
            </button>
            <button
                onClick={() => changeLanguage('th')}
                style={{
                    background: i18n.language.startsWith('th') ? 'var(--primary)' : 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    opacity: i18n.language.startsWith('th') ? 1 : 0.6,
                    transition: 'all 0.2s'
                }}
                title="ไทย"
            >
                🇹🇭
            </button>
        </div>
    );
};

export default LanguageSwitcher;
