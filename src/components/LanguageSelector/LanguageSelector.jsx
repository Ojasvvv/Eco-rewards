import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../context/LanguageContext';
import './LanguageSelector.css';

const LanguageSelector = () => {
  const { language, changeLanguage, supportedLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Use API supported languages, fallback to basic list if not available
  const languages = supportedLanguages || [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' }
  ];

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent body scroll when modal is open on mobile
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isMobile]);

  // No filtering needed since search is removed
  const filteredLanguages = languages;

  const currentLang = languages.find(lang => lang.code === language) || languages[0];

  const handleSelect = (langCode) => {
    changeLanguage(langCode);
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const dropdownContent = isOpen ? (
    <>
      {/* Only show overlay on mobile */}
      {isMobile && <div className="language-overlay" onClick={handleClose} />}
      <div className="language-dropdown enhanced">
            <div className="dropdown-header">
              <h3>Select Language</h3>
              <p className="language-count">{filteredLanguages.length} languages available</p>
            </div>

            <div className="language-list">
              {filteredLanguages.length === 0 ? (
                <div className="no-results">
                  <p>No languages found</p>
                </div>
              ) : (
                filteredLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    className={`language-option ${lang.code === language ? 'active' : ''}`}
                    onClick={() => handleSelect(lang.code)}
                  >
                    <div className="option-text">
                      <span className="option-native">{lang.native}</span>
                      <span className="option-name">{lang.name}</span>
                    </div>
                    {lang.code === language && (
                      <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
    </>
  ) : null;

  return (
    <>
      <div className="language-selector">
        <button 
          className="language-button" 
          onClick={() => setIsOpen(!isOpen)}
          title="Change Language"
        >
          <span className="lang-icon">🌐</span>
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
      </div>

      {/* Render dropdown via portal on mobile, inline on desktop */}
      {isMobile && typeof document !== 'undefined' 
        ? createPortal(dropdownContent, document.body)
        : dropdownContent
      }
    </>
  );
};

export default LanguageSelector;

