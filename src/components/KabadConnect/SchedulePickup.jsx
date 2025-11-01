import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
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
    if (step === 1 && !formData.wasteCategory) {
      alert(t('selectWasteCategory'));
      return;
    }
    if (step === 2) {
      if (!formData.address || !formData.date || !formData.timeSlot) {
        alert(t('fillAllFields'));
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
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // TODO: Save pickup request to Firestore
    const pickupRequest = {
      userId: user.uid,
      ...formData,
      partner: assignedPartner,
      status: 'pending',
      timestamp: new Date().toISOString()
    };
    
    setLoading(false);
    onSuccess && onSuccess(pickupRequest);
    
    alert(t('pickupScheduled'));
    onClose && onClose();
  };

  const renderStep1 = () => (
    <div className="pickup-step">
      <h3>{t('selectWasteType')}</h3>
      <p className="step-subtitle">{t('selectWasteTypeDesc')}</p>
      
      <div className="waste-categories">
        {wasteCategories.map(category => (
          <div
            key={category.id}
            className={`waste-category-card ${formData.wasteCategory === category.id ? 'selected' : ''}`}
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
                const selectedDate = e.target.value;
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowStr = tomorrow.toISOString().split('T')[0];
                if (selectedDate >= tomorrowStr) {
                  handleInputChange('date', selectedDate);
                }
              }}
              min={(() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                return tomorrow.toISOString().split('T')[0];
              })()}
            />
          </div>

          <div className="form-group">
            <label>{t('phoneNumber')}</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                handleInputChange('phone', value);
              }}
              placeholder="Enter phone number"
              maxLength="15"
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

  return (
    <div className="schedule-pickup-overlay" onClick={onClose}>
      <div className="schedule-pickup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {t('schedulePickup')}
          </h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="pickup-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="step-circle">1</div>
            <span>{t('wasteType')}</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <div className="step-circle">2</div>
            <span>{t('details')}</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-circle">3</div>
            <span>{t('confirm')}</span>
          </div>
        </div>

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
            <button className="btn-primary" onClick={handleNext}>
              {t('next')}
            </button>
          ) : (
            <button 
              className="btn-primary" 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? t('scheduling') : t('confirmBooking')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchedulePickup;

