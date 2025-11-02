import React from 'react';
import './SmartBinAnimation.css';

const SmartBinAnimation = ({ isOpen, isClosing, countdown }) => {
  if (!isOpen && !isClosing) return null;

  return (
    <div className={`smart-bin-container ${isOpen || isClosing ? 'active' : ''} ${isClosing ? 'closing' : ''}`}>
      {/* Status text */}
      <div className="bin-status show">
        {isOpen && !isClosing && (
          <div className="status-message open-status">
            <div className="status-icon">🔓</div>
            <div className="status-text">
              <div className="status-header">
                <strong>Bin Opened!</strong>
                <span className="countdown-timer">{countdown}s</span>
              </div>
              <span>Please deposit your trash</span>
            </div>
          </div>
        )}
        {isClosing && (
          <div className="status-message closing-status">
            <div className="status-icon">🔒</div>
            <div className="status-text">
              <strong>Bin Closed</strong>
              <span>Thank you for recycling!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartBinAnimation;
