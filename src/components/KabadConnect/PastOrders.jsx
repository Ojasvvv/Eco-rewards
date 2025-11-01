import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import './PastOrders.css';

const PastOrders = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isDark } = useTheme();
  
  // Mock past orders data (would come from Firestore in production)
  const [orders] = useState([
    {
      id: 'ORD001',
      date: '2025-10-28',
      wasteType: 'plastic',
      wasteIcon: '♻️',
      quantity: '3.5 kg',
      amount: '₹175',
      partner: 'Rajesh Sharma',
      status: 'completed',
      points: 35,
      impact: {
        co2Saved: '4.2 kg',
        waterSaved: '52 L',
        energySaved: '12 kWh'
      }
    },
    {
      id: 'ORD002',
      date: '2025-10-25',
      wasteType: 'paper',
      wasteIcon: '📄',
      quantity: '5.2 kg',
      amount: '₹130',
      partner: 'Amit Patel',
      status: 'completed',
      points: 52,
      impact: {
        co2Saved: '6.5 kg',
        waterSaved: '78 L',
        energySaved: '18 kWh'
      }
    },
    {
      id: 'ORD003',
      date: '2025-10-20',
      wasteType: 'metal',
      wasteIcon: '🔩',
      quantity: '2.8 kg',
      amount: '₹280',
      partner: 'Suresh Kumar',
      status: 'completed',
      points: 28,
      impact: {
        co2Saved: '8.4 kg',
        waterSaved: '45 L',
        energySaved: '25 kWh'
      }
    },
    {
      id: 'ORD004',
      date: '2025-10-15',
      wasteType: 'ewaste',
      wasteIcon: '📱',
      quantity: '1.5 kg',
      amount: '₹450',
      partner: 'Rajesh Sharma',
      status: 'completed',
      points: 75,
      impact: {
        co2Saved: '12 kg',
        waterSaved: '35 L',
        energySaved: '40 kWh'
      }
    },
    {
      id: 'ORD005',
      date: '2025-10-18',
      wasteType: 'mixed',
      wasteIcon: '🗑️',
      quantity: '4.0 kg',
      amount: '₹120',
      partner: 'Amit Patel',
      status: 'cancelled',
      points: 0,
      impact: null
    }
  ]);

  const [selectedOrder, setSelectedOrder] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'cancelled': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const calculateTotalImpact = () => {
    const completedOrders = orders.filter(o => o.status === 'completed');
    return {
      totalOrders: completedOrders.length,
      totalWeight: completedOrders.reduce((sum, o) => sum + parseFloat(o.quantity), 0).toFixed(1),
      totalPoints: completedOrders.reduce((sum, o) => sum + o.points, 0),
      totalCO2: completedOrders.reduce((sum, o) => sum + parseFloat(o.impact?.co2Saved || 0), 0).toFixed(1),
      totalWater: completedOrders.reduce((sum, o) => sum + parseFloat(o.impact?.waterSaved || 0), 0).toFixed(0),
      totalEnergy: completedOrders.reduce((sum, o) => sum + parseFloat(o.impact?.energySaved || 0), 0).toFixed(0)
    };
  };

  const totalImpact = calculateTotalImpact();

  return (
    <div className="past-orders-container">
      <div className="orders-header">
        <h2>
          <span className="header-icon">📦</span>
          {t('pastDeliveries')}
        </h2>
        <p className="header-subtitle">{t('pastDeliveriesDesc')}</p>
      </div>

      {/* Total Impact Summary */}
      <div className="impact-summary">
        <h3>{t('yourTotalImpact')}</h3>
        <div className="impact-stats">
          <div className="impact-stat">
            <div className="impact-icon" style={{background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}}>
              <span>♻️</span>
            </div>
            <div className="impact-info">
              <div className="impact-value">{totalImpact.totalWeight} kg</div>
              <div className="impact-label">{t('wasteRecycled')}</div>
            </div>
          </div>

          <div className="impact-stat">
            <div className="impact-icon" style={{background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'}}>
              <span>🌍</span>
            </div>
            <div className="impact-info">
              <div className="impact-value">{totalImpact.totalCO2} kg</div>
              <div className="impact-label">{t('co2Prevented')}</div>
            </div>
          </div>

          <div className="impact-stat">
            <div className="impact-icon" style={{background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'}}>
              <span>💧</span>
            </div>
            <div className="impact-info">
              <div className="impact-value">{totalImpact.totalWater} L</div>
              <div className="impact-label">{t('waterSaved')}</div>
            </div>
          </div>

          <div className="impact-stat">
            <div className="impact-icon" style={{background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'}}>
              <span>⚡</span>
            </div>
            <div className="impact-info">
              <div className="impact-value">{totalImpact.totalEnergy} kWh</div>
              <div className="impact-label">{t('energySaved')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="orders-list">
        {orders.length === 0 ? (
          <div className="no-orders">
            <div className="no-orders-icon">📦</div>
            <h3>{t('noOrders')}</h3>
            <p>{t('noOrdersDesc')}</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-icon">{order.wasteIcon}</div>
                <div className="order-main-info">
                  <div className="order-type">
                    {t(`waste${order.wasteType.charAt(0).toUpperCase() + order.wasteType.slice(1)}`)}
                  </div>
                  <div className="order-date">{new Date(order.date).toLocaleDateString()}</div>
                </div>
                <div 
                  className="order-status"
                  style={{ 
                    background: `${getStatusColor(order.status)}20`,
                    color: getStatusColor(order.status)
                  }}
                >
                  {t(order.status)}
                </div>
              </div>

              <div className="order-details">
                <div className="order-detail">
                  <span className="detail-label">{t('quantity')}:</span>
                  <span className="detail-value">{order.quantity}</span>
                </div>
                <div className="order-detail">
                  <span className="detail-label">{t('amount')}:</span>
                  <span className="detail-value">{order.amount}</span>
                </div>
                <div className="order-detail">
                  <span className="detail-label">{t('partner')}:</span>
                  <span className="detail-value">{order.partner}</span>
                </div>
                {order.status === 'completed' && (
                  <div className="order-detail">
                    <span className="detail-label">{t('pointsEarned')}:</span>
                    <span className="detail-value points">+{order.points} {t('points')}</span>
                  </div>
                )}
              </div>

              {order.status === 'completed' && order.impact && (
                <div className="order-impact">
                  <div className="impact-title">{t('environmentalImpact')}</div>
                  <div className="impact-items">
                    <div className="impact-item">
                      <span className="impact-emoji">🌍</span>
                      <span>{order.impact.co2Saved} {t('co2Saved')}</span>
                    </div>
                    <div className="impact-item">
                      <span className="impact-emoji">💧</span>
                      <span>{order.impact.waterSaved} {t('waterSaved')}</span>
                    </div>
                    <div className="impact-item">
                      <span className="impact-emoji">⚡</span>
                      <span>{order.impact.energySaved} {t('energySaved')}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="order-actions">
                <button 
                  className="btn-view-details"
                  onClick={() => setSelectedOrder(order)}
                >
                  {t('viewDetails')}
                </button>
                {order.status === 'completed' && (
                  <button className="btn-reorder">
                    {t('reorder')}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="order-details-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="order-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('orderDetails')}</h3>
              <button className="close-btn" onClick={() => setSelectedOrder(null)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">{t('orderId')}:</span>
                <span className="detail-value">{selectedOrder.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('date')}:</span>
                <span className="detail-value">{new Date(selectedOrder.date).toLocaleDateString()}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('wasteType')}:</span>
                <span className="detail-value">
                  {selectedOrder.wasteIcon} {t(`waste${selectedOrder.wasteType.charAt(0).toUpperCase() + selectedOrder.wasteType.slice(1)}`)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('quantity')}:</span>
                <span className="detail-value">{selectedOrder.quantity}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('amount')}:</span>
                <span className="detail-value">{selectedOrder.amount}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('recyclingPartner')}:</span>
                <span className="detail-value">{selectedOrder.partner}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('status')}:</span>
                <span 
                  className="detail-value"
                  style={{ color: getStatusColor(selectedOrder.status), fontWeight: 600 }}
                >
                  {t(selectedOrder.status)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PastOrders;

