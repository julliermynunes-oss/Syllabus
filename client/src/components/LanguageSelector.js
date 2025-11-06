import React, { useState, useRef, useEffect } from 'react';
import CountryFlag from './CountryFlag';
import './LanguageSelector.css';

const LanguageSelector = ({ value, onChange, style }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'pt', countryCode: 'BR', label: 'Português' },
    { code: 'en', countryCode: 'US', label: 'English' },
    { code: 'es', countryCode: 'ES', label: 'Español' }
  ];

  const selectedLanguage = languages.find(lang => lang.code === value) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (langCode) => {
    onChange(langCode);
    setIsOpen(false);
  };

  return (
    <div className="language-selector" ref={dropdownRef} style={style}>
      <button
        type="button"
        className="language-selector-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CountryFlag countryCode={selectedLanguage.countryCode} size={16} />
        <span>{selectedLanguage.label}</span>
        <span className="language-selector-arrow">▼</span>
      </button>
      {isOpen && (
        <div className="language-selector-dropdown">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              className={`language-selector-option ${value === lang.code ? 'selected' : ''}`}
              onClick={() => handleSelect(lang.code)}
            >
              <CountryFlag countryCode={lang.countryCode} size={16} />
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;

