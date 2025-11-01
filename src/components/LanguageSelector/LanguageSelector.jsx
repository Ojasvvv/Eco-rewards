import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import './LanguageSelector.css';

const LanguageSelector = () => {
  const { language, changeLanguage, supportedLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Use API supported languages, fallback to basic list if not available
  const languages = supportedLanguages || [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' }
  ];

  // Filter languages based on search
  const filteredLanguages = languages.filter(lang => 
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.native.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentLang = languages.find(lang => lang.code === language) || languages[0];

  const handleSelect = (langCode) => {
    changeLanguage(langCode);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
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

      {isOpen && (
        <>
          <div className="language-overlay" onClick={() => { setIsOpen(false); setSearchQuery(''); }} />
          <div className="language-dropdown enhanced">
            <div className="dropdown-header">
              <h3>Select Language</h3>
              <p className="language-count">{filteredLanguages.length} languages available</p>
              
              {/* Search Bar */}
              <div className="search-container">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  className="language-search"
                  placeholder="Search languages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                {searchQuery && (
                  <button className="clear-search" onClick={() => setSearchQuery('')}>
                    ×
                  </button>
                )}
              </div>

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
      )}
    </div>
  );
};

export default LanguageSelector;

