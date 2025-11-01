import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { checkDailyPickupLimit, schedulePickup } from '../../services/pickupService';
import './SchedulePickup.css';

const SchedulePickup = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isDark } = useTheme();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    wasteCategory: '',
    address: '',
    date: '',
    timeSlot: '',
    phone: '',
    notes: ''
  });
  const [assignedPartner, setAssignedPartner] = useState(null);
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dailyLimitInfo, setDailyLimitInfo] = useState(null);

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Check daily pickup limit on mount and when user changes
  useEffect(() => {
    const checkLimit = async () => {
      if (user?.uid) {
        try {
          const limitInfo = await checkDailyPickupLimit(user.uid, 2);
          setDailyLimitInfo(limitInfo);
        } catch (error) {
          console.error('Error checking pickup limit:', error);
        }
      }
    };
    checkLimit();
  }, [user]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const wasteCategories = [
    { id: 'paper', name: t('wastePaper'), icon: '📄', description: t('wastePaperDesc') },
    { id: 'plastic', name: t('wastePlastic'), icon: '♻️', description: t('wastePlasticDesc') },
    { id: 'metal', name: t('wasteMetal'), icon: '🔩', description: t('wasteMetalDesc') },
    { id: 'ewaste', name: t('wasteEwaste'), icon: '📱', description: t('wasteEwasteDesc') },
    { id: 'mixed', name: t('wasteMixed'), icon: '🗑️', description: t('wasteMixedDesc') }
  ];

  const timeSlots = [
    { id: 'morning', label: t('timeMorning'), time: '8:00 AM - 12:00 PM' },
    { id: 'afternoon', label: t('timeAfternoon'), time: '12:00 PM - 4:00 PM' },
    { id: 'evening', label: t('timeEvening'), time: '4:00 PM - 8:00 PM' }
  ];

  // Mock partners database
  const partners = [
    { id: 1, name: 'Rajesh Sharma', age: 34, experience: 2, rating: 4.8, locality: 'Vijayawada', distance: '2.3 km' },
    { id: 2, name: 'Amit Patel', age: 28, experience: 1.5, rating: 4.6, locality: 'Guntur', distance: '3.1 km' },
    { id: 3, name: 'Suresh Kumar', age: 42, experience: 5, rating: 4.9, locality: 'Indore', distance: '1.8 km' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    // Prevent progression if limit is reached
    if (dailyLimitInfo && !dailyLimitInfo.allowed) {
      alert(`❌ Cannot Schedule Pickup!\n\nYou cannot schedule more pickups. You've reached your daily limit of ${dailyLimitInfo.limit} pickup(s).\n\nPlease try again tomorrow.`);
      return;
    }

    if (step === 1 && !formData.wasteCategory) {
      alert(t('selectWasteCategory'));
      return;
    }
    if (step === 2) {
      if (!formData.address || !formData.date || !formData.timeSlot) {
        alert(t('fillAllFields'));
        return;
      }
      
      // Validate phone number
      if (!formData.phone || formData.phone.length !== 10) {
        alert('Please enter a valid 10-digit phone number');
        return;
      }
      
      // Validate date is after today
      const minDate = getMinDate();
      if (formData.date < minDate) {
        alert('Please select a date from tomorrow onwards');
        return;
      }
      
      // Simulate partner assignment
      const randomPartner = partners[Math.floor(Math.random() * partners.length)];
      setAssignedPartner(randomPartner);
      
      // Simulate price estimation (will be confirmed by partner later)
      setEstimatedPrice(null); // Price shown after partner confirms
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    // Check daily limit before submitting
    if (dailyLimitInfo && !dailyLimitInfo.allowed) {
      alert(`❌ Cannot Schedule Pickup!\n\nYou cannot schedule more pickups. You've reached your daily limit of ${dailyLimitInfo.limit} pickup(s).\n\nYou've already scheduled ${dailyLimitInfo.count} pickup(s) today.\n\nPlease try again tomorrow.`);
      return;
    }

    setLoading(true);
    
    try {
      // Check limit again just before submitting (double-check)
      const limitCheck = await checkDailyPickupLimit(user.uid, 2);
      if (!limitCheck.allowed) {
        setLoading(false);
        alert(`❌ Cannot Schedule Pickup!\n\nYou cannot schedule more pickups. You've reached your daily limit of ${limitCheck.limit} pickup(s).\n\nYou've already scheduled ${limitCheck.count} pickup(s) today.\n\nPlease try again tomorrow.`);
        return;
      }

      // Save pickup request to Firestore
      const pickupRequest = {
        ...formData,
        partner: assignedPartner,
      };

      const createdPickup = await schedulePickup(pickupRequest);
      
      // Update limit info after successful creation
      const updatedLimitInfo = await checkDailyPickupLimit(user.uid, 2);
      setDailyLimitInfo(updatedLimitInfo);
      
      setLoading(false);
      onSuccess && onSuccess({
        ...createdPickup,
        timestamp: createdPickup.createdAt
      });
      
      alert(t('pickupScheduled'));
      onClose && onClose();
    } catch (error) {
      console.error('Error scheduling pickup:', error);
      setLoading(false);
      alert(`❌ Failed to schedule pickup: ${error.message || 'Please try again later.'}`);
    }
  };

  const renderStep1 = () => (
    <div className="pickup-step">
      <h3>{t('selectWasteType')}</h3>
      <p className="step-subtitle">{t('selectWasteTypeDesc')}</p>
      
      <div className="waste-categories">
        {wasteCategories.map(category => (
          <div
            key={category.id}
            className={`waste-category-card ${formData.wasteCategory === category.id ? 'selected' : ''} ${category.id === 'mixed' ? 'waste-category-mixed' : ''}`}
            onClick={() => handleInputChange('wasteCategory', category.id)}
          >
            <h4>{category.name}</h4>
            <p>{category.description}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="pickup-step">
      <h3>{t('pickupDetails')}</h3>
      <p className="step-subtitle">{t('pickupDetailsDesc')}</p>
      
      <div className="pickup-form">
        <div className="form-group">
          <label>{t('pickupAddress')}</label>
          <textarea
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder={t('enterFullAddress')}
            rows="3"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{t('pickupDate')}</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => {
                handleInputChange('date', e.target.value);
              }}
              onBlur={(e) => {
                const selectedDate = e.target.value;
                if (selectedDate) {
                  const minDate = getMinDate();
                  if (selectedDate < minDate) {
                    alert('Please select a date from tomorrow onwards');
                    handleInputChange('date', '');
                  }
                }
              }}
              min={getMinDate()}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('phoneNumber')}</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                handleInputChange('phone', value);
              }}
              placeholder="Enter 10 digit phone number"
              maxLength="10"
              pattern="[0-9]{10}"
            />
          </div>
        </div>

        <div className="form-group">
          <label>{t('preferredTime')}</label>
          <div className="time-slots">
            {timeSlots.map(slot => (
              <div
                key={slot.id}
                className={`time-slot ${formData.timeSlot === slot.id ? 'selected' : ''}`}
                onClick={() => handleInputChange('timeSlot', slot.id)}
              >
                <div className="slot-label">{slot.label}</div>
                <div className="slot-time">{slot.time}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>{t('additionalNotes')} ({t('optional')})</label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder={t('notesPlaceholder')}
            rows="2"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="pickup-step">
      <h3>{t('confirmPickup')}</h3>
      <p className="step-subtitle">{t('reviewDetails')}</p>
      
      <div className="pickup-summary">
        <div className="summary-section">
          <h4>{t('wasteType')}</h4>
          <div className="summary-value">
            {wasteCategories.find(c => c.id === formData.wasteCategory)?.name}
          </div>
        </div>

        <div className="summary-section">
          <h4>{t('pickupAddress')}</h4>
          <div className="summary-value">{formData.address}</div>
        </div>

        <div className="summary-section">
          <h4>{t('scheduledFor')}</h4>
          <div className="summary-value">
            {new Date(formData.date).toLocaleDateString()} • {timeSlots.find(s => s.id === formData.timeSlot)?.label}
          </div>
        </div>

        {assignedPartner && (
          <div className="partner-card">
            <div className="partner-header">
              <div className="partner-avatar">
                {assignedPartner.name.charAt(0)}
              </div>
              <div className="partner-info">
                <h4>{assignedPartner.name}</h4>
                <p>{t('recyclingPartner')}</p>
              </div>
            </div>
            
            <div className="partner-details">
              <div className="partner-stat">
                <span>{assignedPartner.rating} {t('rating')}</span>
              </div>
              <div className="partner-stat">
                <span>{assignedPartner.locality} ({assignedPartner.distance})</span>
              </div>
              <div className="partner-stat">
                <span>{assignedPartner.experience} {t('yearsExp')}</span>
              </div>
              <div className="partner-stat">
                <span>{t('expectedArrival')}: {t('nextDay')}</span>
              </div>
            </div>
          </div>
        )}

        <div className="price-info">
          <div className="price-note">
            <p>{t('priceNote')}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const modalContent = (
    <div className="schedule-pickup-overlay" onClick={onClose}>
      <div className="schedule-pickup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {t('schedulePickup')}
          </h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        {/* Daily Limit Indicator */}
        {dailyLimitInfo && (
          <div className={`daily-limit-indicator ${!dailyLimitInfo.allowed ? 'limit-reached' : ''}`}>
            <span className="limit-text">
              {dailyLimitInfo.allowed 
                ? `📅 ${dailyLimitInfo.remaining} pickup${dailyLimitInfo.remaining !== 1 ? 's' : ''} remaining today (${dailyLimitInfo.count}/${dailyLimitInfo.limit})`
                : `❌ Cannot Schedule More Pickups! Daily limit reached - You've scheduled ${dailyLimitInfo.count} out of ${dailyLimitInfo.limit} allowed pickup(s) today. Please try again tomorrow.`
              }
            </span>
          </div>
        )}


        <div className="modal-body">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        <div className="modal-footer">
          {step > 1 && (
            <button className="btn-secondary" onClick={() => setStep(step - 1)}>
              {t('back')}
            </button>
          )}
          {step < 3 ? (
            <button 
              className="btn-primary" 
              onClick={handleNext}
              disabled={dailyLimitInfo && !dailyLimitInfo.allowed}
            >
              {t('next')}
            </button>
          ) : (
            <button 
              className="btn-primary" 
              onClick={handleSubmit}
              disabled={loading || (dailyLimitInfo && !dailyLimitInfo.allowed)}
            >
              {loading ? t('scheduling') : t('confirmBooking')}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default SchedulePickup;

