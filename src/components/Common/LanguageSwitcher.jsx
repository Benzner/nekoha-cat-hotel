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
                    color: i18n.language.startsWith('en') ? 'white' : 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    flex: 1,
                    justifyContent: 'center'
                }}
                title="English"
            >
                <span>🇬🇧</span>
                <span>English</span>
            </button>
            <button
                onClick={() => changeLanguage('th')}
                style={{
                    background: i18n.language.startsWith('th') ? 'var(--primary)' : 'transparent',
                    color: i18n.language.startsWith('th') ? 'white' : 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    flex: 1,
                    justifyContent: 'center'
                }}
                title="ไทย"
            >
                <span>🇹🇭</span>
                <span>Thai</span>
            </button>
        </div>
    );
};

export default LanguageSwitcher;
