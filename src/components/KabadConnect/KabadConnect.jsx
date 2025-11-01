import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { checkDailyPickupLimit } from '../../services/pickupService';
import SchedulePickup from './SchedulePickup';
import PastOrders from './PastOrders';
import Missions from './Missions';
import './KabadConnect.css';

const KabadConnect = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('schedule');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [activeOrders, setActiveOrders] = useState([]);
  const [notification, setNotification] = useState(null);
  const [dailyLimitInfo, setDailyLimitInfo] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [complaint, setComplaint] = useState('');

  const tabs = [
    { id: 'schedule', label: t('schedulePickup'), icon: '📅' },
    { id: 'orders', label: t('pastDeliveries'), icon: '📦' },
    { id: 'missions', label: t('ecoMissions'), icon: '🎯' }
  ];

  // Check daily pickup limit on mount and when active orders change
  useEffect(() => {
    const checkLimit = async () => {
      if (user?.uid) {
        try {
          const limitInfo = await checkDailyPickupLimit(user.uid, 2);
          setDailyLimitInfo(limitInfo);
        } catch (error) {
          // Silently handle error
        }
      }
    };
    checkLimit();
  }, [user, activeOrders]);

  const handleOpenScheduleModal = async () => {
    // Check limit before opening modal
    if (user?.uid) {
      try {
        const limitCheck = await checkDailyPickupLimit(user.uid, 2);
        if (!limitCheck.allowed) {
          showNotification('⚠️ Limit Over! You cannot schedule more pickups today. Please try again tomorrow.', 'error');
          return;
        }
      } catch (error) {
        // Silently handle error
      }
    }
    setShowScheduleModal(true);
  };

  const handlePickupSuccess = (pickupRequest) => {
    // Add order with unique ID
    const newOrder = {
      id: `ORDER-${Date.now()}`,
      ...pickupRequest,
      status: 'pending'
    };
    setActiveOrders(prev => [...prev, newOrder]);
    setShowScheduleModal(false);
    
    // Update limit info after successful pickup
    if (user?.uid) {
      checkDailyPickupLimit(user.uid, 2).then(limitInfo => {
        setDailyLimitInfo(limitInfo);
      });
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 7000);
  };

  const handleEndPickup = (orderId) => {
    const order = activeOrders.find(o => o.id === orderId);
    const confirmed = window.confirm('Are you sure you want to cancel this pickup order?');
    
    if (confirmed) {
      setActiveOrders(prev => prev.filter(order => order.id !== orderId));
      showNotification('Order cancelled', 'error');
    }
  };

  const handleCompletePickup = (orderId) => {
    setCurrentOrderId(orderId);
    setShowRatingModal(true);
  };

  const handleSubmitRating = () => {
    if (rating === 0) {
      showNotification('Please select a rating', 'error');
      return;
    }

    // Update order status with rating
    setActiveOrders(prev => prev.map(order => 
      order.id === currentOrderId ? { 
        ...order, 
        status: 'completed',
        rating,
        review,
        complaint 
      } : order
    ));

    showNotification('Thank you for your feedback!', 'success');
    
    // Reset modal state
    setShowRatingModal(false);
    setRating(0);
    setReview('');
    setComplaint('');
    setCurrentOrderId(null);
    
    // Move to past orders after a delay
    setTimeout(() => {
      setActiveOrders(prev => prev.filter(order => order.id !== currentOrderId));
    }, 2000);
  };

  return (
    <div className="kabadconnect-container">
      {/* Notification */}
      {notification && (
        <div className={`order-notification ${notification.type}`}>
          <span className="notification-icon">
            {notification.type === 'success' ? '✓' : '✕'}
          </span>
          <span className="notification-message">{notification.message}</span>
        </div>
      )}

      <div className="kabadconnect-header">
        <div className="header-content">
          <div className="header-text">
            <h2>
              <span className="header-icon">♻️</span>
              {t('kabadConnect')}
            </h2>
            <p className="header-subtitle">{t('kabadConnectDesc')}</p>
          </div>
          {activeTab === 'schedule' && (
            <button 
              className="btn-new-pickup"
              onClick={handleOpenScheduleModal}
            >
              <span>+</span>
              {t('newPickup')}
            </button>
          )}
        </div>
      </div>

      <div className="kabadconnect-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`kabad-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="kabadconnect-content">
        {activeTab === 'schedule' && (
          <div className="schedule-content">
            <div className="schedule-info-cards">
              <div className="info-card">
                <div className="info-icon">🚚</div>
                <h3>{t('howItWorksTitle')}</h3>
                <ol className="info-list">
                  <li>{t('pickupStep1')}</li>
                  <li>{t('pickupStep2')}</li>
                  <li>{t('pickupStep3')}</li>
                  <li>{t('pickupStep4')}</li>
                  <li>{t('pickupStep5')}</li>
                </ol>
                <button 
                  className={`btn-schedule-now ${dailyLimitInfo && !dailyLimitInfo.allowed ? 'disabled' : ''}`}
                  onClick={handleOpenScheduleModal}
                  disabled={dailyLimitInfo && !dailyLimitInfo.allowed}
                  title={dailyLimitInfo && !dailyLimitInfo.allowed ? `❌ Cannot schedule more pickups! You've reached your daily limit of ${dailyLimitInfo.limit} pickup(s).` : ''}
                >
                  {dailyLimitInfo && !dailyLimitInfo.allowed ? '❌ Cannot Schedule - Limit Reached' : t('scheduleNow')}
                </button>
                
                {dailyLimitInfo && !dailyLimitInfo.allowed && (
                  <div className="limit-warning-card">
                    <div className="warning-icon">⚠️</div>
                    <div className="warning-content">
                      <h4>Daily Pickup Limit Reached</h4>
                      <p>You cannot schedule more pickups. You've already scheduled <strong>{dailyLimitInfo.count}</strong> pickup(s) today out of your daily limit of <strong>{dailyLimitInfo.limit}</strong>.</p>
                      <p className="warning-note">Please try again tomorrow to schedule a new pickup.</p>
                    </div>
                  </div>
                )}
              </div>

              {activeOrders.length > 0 ? (
                <div className="info-card active-orders-card">
                  <h3>Your Orders</h3>
                  <div className="active-orders-list">
                    {activeOrders.map(order => (
                      <div key={order.id} className="active-order-item">
                        <div className="order-info">
                          <h4>{order.wasteCategory ? order.wasteCategory.charAt(0).toUpperCase() + order.wasteCategory.slice(1) : 'Mixed'}</h4>
                          <p>{order.address}</p>
                          <p className="order-date">
                            {order.date ? new Date(order.date).toLocaleDateString() : ''} • {order.timeSlot || 'Not specified'}
                          </p>
                          {order.partner && (
                            <p className="order-partner">Partner: {order.partner.name}</p>
                          )}
                        </div>
                        <div className="order-actions">
                          <button
                            className="btn-end-pickup"
                            onClick={() => handleEndPickup(order.id)}
                          >
                            End Pickup
                          </button>
                          <button
                            className="btn-complete-pickup"
                            onClick={() => handleCompletePickup(order.id)}
                          >
                            Complete Pickup
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="info-card">
                  <div className="info-icon">✅</div>
                  <h3>{t('whyChooseUs')}</h3>
                  <ul className="benefits-list">
                    <li>
                      <span className="benefit-icon">👤</span>
                      <span>{t('benefit1')}</span>
                    </li>
                    <li>
                      <span className="benefit-icon">💰</span>
                      <span>{t('benefit2')}</span>
                    </li>
                    <li>
                      <span className="benefit-icon">⏰</span>
                      <span>{t('benefit3')}</span>
                    </li>
                    <li>
                      <span className="benefit-icon">♻️</span>
                      <span>{t('benefit4')}</span>
                    </li>
                    <li>
                      <span className="benefit-icon">🌍</span>
                      <span>{t('benefit5')}</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'orders' && <PastOrders />}
        {activeTab === 'missions' && <Missions />}
      </div>

      {showScheduleModal && (
        <SchedulePickup 
          onClose={() => setShowScheduleModal(false)}
          onSuccess={handlePickupSuccess}
        />
      )}

      {/* Rating & Review Modal */}
      {showRatingModal && (
        <div className="modal-overlay" onClick={() => setShowRatingModal(false)}>
          <div className="rating-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rating-modal-header">
              <h2>Rate Your Experience</h2>
              <button className="modal-close-btn" onClick={() => setShowRatingModal(false)}>
                ×
              </button>
            </div>

            <div className="rating-modal-body">
              {/* Star Rating */}
              <div className="rating-section">
                <label>How would you rate the service?</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star ${rating >= star ? 'active' : ''}`}
                      onClick={() => setRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="rating-text">
                    {rating === 1 && 'Poor'}
                    {rating === 2 && 'Fair'}
                    {rating === 3 && 'Good'}
                    {rating === 4 && 'Very Good'}
                    {rating === 5 && 'Excellent'}
                  </p>
                )}
              </div>

              {/* Review */}
              <div className="review-section">
                <label htmlFor="review">Write a review (optional)</label>
                <textarea
                  id="review"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Share your experience with us..."
                  rows="4"
                  maxLength="500"
                />
                <small>{review.length}/500 characters</small>
              </div>

              {/* Complaint */}
              <div className="complaint-section">
                <label htmlFor="complaint">Any complaints or issues? (optional)</label>
                <textarea
                  id="complaint"
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  placeholder="Let us know if something went wrong..."
                  rows="3"
                  maxLength="300"
                />
                <small>{complaint.length}/300 characters</small>
              </div>

              {/* Submit Button */}
              <button className="btn-submit-rating" onClick={handleSubmitRating}>
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KabadConnect;

