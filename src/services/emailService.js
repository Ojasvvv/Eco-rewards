import { auth } from '../firebase/config';

// In dev, try proxy first, fallback to direct URL if proxy fails
// In production, use relative path (same domain) - no CORS issues!
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 
  || (import.meta.env.PROD 
    ? '/api' // Use relative path in production - same domain, no CORS!
    : '/api');
    
// Fallback for development only
const PRODUCTION_API_URL = import.meta.env.VITE_API_BASE_URL || 'https://eco-rewards-wheat.vercel.app/api';

/**
 * Send daily stats email
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const sendDailyStatsEmail = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const token = await user.getIdToken();
    
    // Try proxy first (development), fallback to direct URL if proxy fails
    let response;
    const url = `${API_BASE_URL}/sendDailyStatsEmail`;
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({}), // Send empty body - some proxies require body for POST
    };

    try {
      response = await fetch(url, options);
      
      // If proxy returns 405, try direct URL in development
      if (!response.ok && response.status === 405 && !import.meta.env.PROD && API_BASE_URL.startsWith('/')) {
        console.log('Proxy failed, trying direct URL...');
        response = await fetch(`${PRODUCTION_API_URL}/sendDailyStatsEmail`, {
          ...options,
          mode: 'cors', // Explicitly allow CORS for cross-origin request
        });
      }
    } catch (fetchError) {
      // If proxy completely fails, try direct URL
      if (!import.meta.env.PROD && API_BASE_URL.startsWith('/')) {
        console.log('Proxy error, trying direct URL...', fetchError);
        response = await fetch(`${PRODUCTION_API_URL}/sendDailyStatsEmail`, {
          ...options,
          mode: 'cors',
        });
      } else {
        throw fetchError;
      }
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      throw new Error(errorData.error || `Failed to send email (${response.status})`);
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Email sent successfully!',
      data: data.data,
    };
  } catch (error) {
    console.error('Error sending daily stats email:', error);
    throw error;
  }
};

