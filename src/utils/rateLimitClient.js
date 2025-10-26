/**
 * Client-side rate limiting utilities
 * 
 * SECURITY NOTE: These functions are for UX only - NOT for security!
 * Users can bypass these by modifying JavaScript in their browser.
 * All actual rate limiting and security is enforced server-side.
 * 
 * Purpose: Prevent accidental spam and improve user experience
 */

// Track last API call times
const lastCallTimes = new Map();

/**
 * Throttle function - allows one call per specified interval
 * @param {string} key - Unique identifier for the throttled action
 * @param {number} intervalMs - Minimum time between calls in milliseconds
 * @returns {boolean} - True if call is allowed, false if throttled
 */
export function throttle(key, intervalMs = 1000) {
  const now = Date.now();
  const lastCall = lastCallTimes.get(key);

  if (lastCall && now - lastCall < intervalMs) {
    const remainingTime = Math.ceil((intervalMs - (now - lastCall)) / 1000);
    console.warn(`Action "${key}" throttled. Try again in ${remainingTime} seconds.`);
    return false;
  }

  lastCallTimes.set(key, now);
  return true;
}

/**
 * Handle rate limit errors from API
 * @param {Error} error - Error object from API call
 * @returns {object} - { isRateLimit: boolean, retryAfter?: number, message?: string }
 */
export function handleRateLimitError(error) {
  // Check if it's a rate limit error (429)
  if (error.message && error.message.includes('Rate limit exceeded')) {
    const match = error.message.match(/Try again in (\d+) seconds/);
    const retryAfter = match ? parseInt(match[1]) : 60;
    
    return {
      isRateLimit: true,
      retryAfter,
      message: `Too many requests. Please wait ${retryAfter} seconds before trying again.`
    };
  }

  return { isRateLimit: false };
}

/**
 * Debounce function - delays execution until after wait time
 * Useful for search inputs, etc.
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Check if user is spamming (multiple rapid clicks)
 * @param {string} actionKey - Unique key for the action
 * @param {number} maxClicks - Maximum clicks allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} - True if spamming detected
 */
const clickTracking = new Map();

export function detectSpam(actionKey, maxClicks = 5, windowMs = 10000) {
  const now = Date.now();
  const clicks = clickTracking.get(actionKey) || [];
  
  // Remove old clicks outside the window
  const recentClicks = clicks.filter(time => now - time < windowMs);
  
  // Add current click
  recentClicks.push(now);
  clickTracking.set(actionKey, recentClicks);
  
  // Check if spamming
  if (recentClicks.length > maxClicks) {
    console.warn(`Spam detected for action "${actionKey}"`);
    return true;
  }
  
  return false;
}

