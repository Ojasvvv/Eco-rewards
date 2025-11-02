import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sendDailyStatsEmail } from '../../services/emailService';
import './GlobalShortcuts.css';

const GlobalShortcuts = () => {
  const { user } = useAuth();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success');
  const [isLoading, setIsLoading] = useState(false);
  // Removed help tooltip - keep shortcut private

  useEffect(() => {
    if (!user) return;

    const handleKeyDown = async (e) => {
      // Ctrl+Shift+E (or Cmd+Shift+E on Mac)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        e.stopPropagation();
        
        // Prevent multiple simultaneous triggers
        if (isLoading) {
          showToast('⏳ Email is already being sent...', 'info');
          return;
        }

        await triggerEmail();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [user, isLoading]);

  const showToast = (message, type = 'success') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    
    setTimeout(() => {
      setShowNotification(false);
    }, 4000);
  };

  const triggerEmail = async () => {
    setIsLoading(true);
    showToast('📧 Sending daily stats email...', 'info');

    try {
      const result = await sendDailyStatsEmail();
      
      if (result.success) {
        const { data } = result;
        if (data.emailSent) {
          showToast(
            `✅ Email sent! 📊 ${data.binUsages} bin usages, ${data.uniqueUsers} users, ${data.pickupRequests} pickups today`,
            'success'
          );
        } else if (data.emailError) {
          showToast(
            `⚠️ Email generated but sending failed: ${data.emailError}`,
            'error'
          );
        } else {
          showToast(
            `✅ Stats generated! 📊 ${data.binUsages} bin usages, ${data.uniqueUsers} users (Email service not configured)`,
            'info'
          );
        }
      } else {
        showToast('❌ Failed to generate email. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      const errorMsg = error.message || 'Failed to send email';
      
      if (errorMsg.includes('Rate limit')) {
        showToast('⏱️ Please wait a moment before sending another email.', 'error');
      } else {
        showToast(`❌ ${errorMsg}`, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Notification Toast */}
      {showNotification && (
        <div className={`global-shortcut-toast ${notificationType}`}>
          <div className="toast-content">
            <span className="toast-icon">
              {notificationType === 'success' && '✅'}
              {notificationType === 'error' && '❌'}
              {notificationType === 'info' && '⏳'}
            </span>
            <span className="toast-message">{notificationMessage}</span>
          </div>
          <button 
            className="toast-close" 
            onClick={() => setShowNotification(false)}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}

    </>
  );
};

export default GlobalShortcuts;

