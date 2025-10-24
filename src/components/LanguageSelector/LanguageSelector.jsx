import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import './LanguageSelector.css';

const LanguageSelector = () => {
  const { language, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', flag: 'GB' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: 'IN' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: 'IN' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: 'IN' }
  ];

  const currentLang = languages.find(lang => lang.code === language) || languages[0];

  const handleSelect = (langCode) => {
    changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="language-selector">
      <button 
        className="language-button" 
        onClick={() => setIsOpen(!isOpen)}
        title="Change Language"
      >
        <span className="lang-code">{currentLang.code.toUpperCase()}</span>
        <svg 
          className={`chevron ${isOpen ? 'open' : ''}`} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="language-overlay" onClick={() => setIsOpen(false)} />
          <div className="language-dropdown">
            {languages.map((lang) => (
              <button
                key={lang.code}
                className={`language-option ${lang.code === language ? 'active' : ''}`}
                onClick={() => handleSelect(lang.code)}
              >
                <div className="option-text">
                  <span className="option-native">{lang.nativeName}</span>
                  <span className="option-name">{lang.name}</span>
                </div>
                {lang.code === language && (
                  <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;

