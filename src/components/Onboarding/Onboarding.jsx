import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import './Onboarding.css';

const Onboarding = ({ onComplete }) => {
  const { language, changeLanguage, t } = useLanguage();
  // Always start from language selection (step 0) on onboarding
  const [currentStep, setCurrentStep] = useState(0);

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'हिन्दी', nativeName: 'Hindi', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు', nativeName: 'Telugu', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ்', nativeName: 'Tamil', flag: '🇮🇳' }
  ];

  const tutorialSteps = [
    {
      icon: '📱',
      title: 'tutorialStep1Title',
      description: 'tutorialStep1Desc',
      illustration: (
        <div className="illustration">
          <div className="phone-frame">
            <div className="qr-code-animation">
              <div className="qr-grid">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="qr-block"></div>
                ))}
              </div>
              <div className="scan-line"></div>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: '⌨️',
      title: 'tutorialStep2Title',
      description: 'tutorialStep2Desc',
      illustration: (
        <div className="illustration">
          <div className="code-input-animation">
            <div className="input-field">
              <div className="input-text">DBN001</div>
              <div className="cursor-blink"></div>
            </div>
            <div className="keyboard-icon">⌨️</div>
          </div>
        </div>
      )
    },
    {
      icon: '🗑️',
      title: 'tutorialStep3Title',
      description: 'tutorialStep3Desc',
      illustration: (
        <div className="illustration">
          <div className="dustbin-animation">
            <div className="dustbin">
              <div className="dustbin-lid"></div>
              <div className="dustbin-body"></div>
            </div>
            <div className="waste-item waste-1">♻️</div>
            <div className="waste-item waste-2">📄</div>
            <div className="waste-item waste-3">🥫</div>
          </div>
        </div>
      )
    },
    {
      icon: '🎁',
      title: 'tutorialStep4Title',
      description: 'tutorialStep4Desc',
      illustration: (
        <div className="illustration">
          <div className="rewards-animation">
            <div className="gift-box">🎁</div>
            <div className="coins">
              <span className="coin coin-1">💰</span>
              <span className="coin coin-2">💰</span>
              <span className="coin coin-3">💰</span>
            </div>
            <div className="sparkles">
              <span className="sparkle sparkle-1">✨</span>
              <span className="sparkle sparkle-2">✨</span>
              <span className="sparkle sparkle-3">✨</span>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: '🌍',
      title: 'tutorialStep5Title',
      description: 'tutorialStep5Desc',
      illustration: (
        <div className="illustration">
          <div className="impact-animation">
            <div className="earth">🌍</div>
            <div className="hearts">
              <span className="heart heart-1">💚</span>
              <span className="heart heart-2">💚</span>
              <span className="heart heart-3">💚</span>
            </div>
            <div className="trees">
              <span className="tree">🌱</span>
              <span className="tree">🌿</span>
              <span className="tree">🌳</span>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: '♻️',
      title: 'tutorialStep6Title',
      description: 'tutorialStep6Desc',
      illustration: (
        <div className="illustration">
          <div className="pickup-animation">
            <div className="phone-pickup">📱</div>
            <div className="truck">🚚</div>
            <div className="house">🏠</div>
            <div className="dots">
              <span className="dot dot-1">•</span>
              <span className="dot dot-2">•</span>
              <span className="dot dot-3">•</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleLanguageSelect = (langCode) => {
    changeLanguage(langCode);
    setCurrentStep(1);
  };

  const handleNext = () => {
    if (currentStep < tutorialSteps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    // Don't save to localStorage anymore - we want to show it every session
    onComplete();
  };

  if (currentStep === 0) {
    // Language Selection
    return (
      <div className="onboarding-container">
        <div className="onboarding-content language-selection">
          <div className="language-header">
            <div className="logo-animation">
              <div className="eco-logo">♻️</div>
            </div>
            <h1 className="welcome-text">EcoRewards</h1>
            <p className="tagline">Select Your Language</p>
          </div>

          <div className="language-grid">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className="language-card"
              >
                <span className="language-flag">{lang.flag}</span>
                <div className="language-names">
                  <span className="language-name">{lang.name}</span>
                  <span className="language-name-english">{lang.nativeName}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const step = tutorialSteps[currentStep - 1];

  return (
    <div className="onboarding-container">
      <div className="onboarding-content tutorial">
        <button className="skip-button" onClick={handleSkip}>
          {t('skip')}
        </button>

        <div className="tutorial-step">
          {step.illustration}
          
          <div className="step-content">
            <div className="step-icon">{step.icon}</div>
            <h2 className="step-title">{t(step.title)}</h2>
            <p className="step-description">{t(step.description)}</p>
          </div>

          <div className="step-indicators">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`indicator ${index + 1 === currentStep ? 'active' : ''} ${index + 1 < currentStep ? 'completed' : ''}`}
              />
            ))}
          </div>

          <button className="next-button" onClick={handleNext}>
            {currentStep < tutorialSteps.length ? t('next') : t('finish')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

