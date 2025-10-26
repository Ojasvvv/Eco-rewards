/**
 * Input Validation Utilities
 * Validates user input to prevent invalid data and security issues
 */

/**
 * Validate dustbin code format
 * Expected format: 5 characters max, alphanumeric only (e.g., AB123, XY45Z)
 * @param {string} code - Dustbin code to validate
 * @returns {object} { isValid: boolean, error?: string }
 */
export const validateDustbinCode = (code) => {
  if (!code || typeof code !== 'string') {
    return { isValid: false, error: 'Dustbin code is required' };
  }

  const trimmedCode = code.trim().toUpperCase();

  if (trimmedCode.length === 0) {
    return { isValid: false, error: 'Dustbin code cannot be empty' };
  }

  if (trimmedCode.length > 5) {
    return { isValid: false, error: 'Dustbin code is too long (maximum 5 characters)' };
  }

  // Format: Alphanumeric only, max 5 characters
  const regex = /^[A-Z0-9]{1,5}$/;
  if (!regex.test(trimmedCode)) {
    return { 
      isValid: false, 
      error: 'Invalid format. Code must be alphanumeric (letters and numbers only, max 5 characters)' 
    };
  }

  return { isValid: true, value: trimmedCode };
};

/**
 * Validate report details
 * @param {string} details - Report details text
 * @returns {object} { isValid: boolean, error?: string }
 */
export const validateReportDetails = (details) => {
  if (!details || typeof details !== 'string') {
    return { isValid: false, error: 'Report details are required' };
  }

  const trimmedDetails = details.trim();

  if (trimmedDetails.length < 10) {
    return { 
      isValid: false, 
      error: `Please provide more details (minimum 10 characters, you have ${trimmedDetails.length})` 
    };
  }

  if (trimmedDetails.length > 1000) {
    return { 
      isValid: false, 
      error: `Details are too long (maximum 1000 characters, you have ${trimmedDetails.length})` 
    };
  }

  return { isValid: true, value: trimmedDetails };
};

/**
 * Validate report type
 * @param {string} type - Report type
 * @returns {object} { isValid: boolean, error?: string }
 */
export const validateReportType = (type) => {
  const validTypes = ['broken', 'full', 'technical', 'qr_code', 'location', 'other'];
  
  if (!type || !validTypes.includes(type)) {
    return { isValid: false, error: 'Please select a valid issue type' };
  }

  return { isValid: true, value: type };
};

/**
 * Validate points amount
 * @param {number} points - Points amount
 * @param {number} min - Minimum allowed
 * @param {number} max - Maximum allowed
 * @returns {object} { isValid: boolean, error?: string }
 */
export const validatePoints = (points, min = 1, max = 1000) => {
  if (typeof points !== 'number' || isNaN(points)) {
    return { isValid: false, error: 'Points must be a valid number' };
  }

  if (points < min) {
    return { isValid: false, error: `Points must be at least ${min}` };
  }

  if (points > max) {
    return { isValid: false, error: `Points cannot exceed ${max}` };
  }

  if (!Number.isInteger(points)) {
    return { isValid: false, error: 'Points must be a whole number' };
  }

  return { isValid: true, value: points };
};

/**
 * Validate text input (general purpose)
 * @param {string} text - Text to validate
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @param {string} fieldName - Name of the field (for error messages)
 * @returns {object} { isValid: boolean, error?: string }
 */
export const validateTextInput = (text, minLength = 1, maxLength = 500, fieldName = 'Input') => {
  if (!text || typeof text !== 'string') {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const trimmedText = text.trim();

  if (trimmedText.length < minLength) {
    return { 
      isValid: false, 
      error: `${fieldName} must be at least ${minLength} characters` 
    };
  }

  if (trimmedText.length > maxLength) {
    return { 
      isValid: false, 
      error: `${fieldName} must not exceed ${maxLength} characters` 
    };
  }

  return { isValid: true, value: trimmedText };
};

/**
 * Validate numeric input
 * @param {any} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {string} fieldName - Name of the field
 * @returns {object} { isValid: boolean, error?: string }
 */
export const validateNumericInput = (value, min = 0, max = Number.MAX_SAFE_INTEGER, fieldName = 'Value') => {
  const num = Number(value);

  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }

  if (num < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min}` };
  }

  if (num > max) {
    return { isValid: false, error: `${fieldName} must not exceed ${max}` };
  }

  return { isValid: true, value: num };
};

/**
 * Sanitize and validate user input to prevent XSS
 * @param {string} input - User input
 * @param {number} maxLength - Maximum length
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input, maxLength = 1000) => {
  if (!input) return '';
  
  return String(input)
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .slice(0, maxLength);
};

/**
 * Validate file upload (for future use)
 * @param {File} file - File object
 * @param {array} allowedTypes - Allowed MIME types
 * @param {number} maxSize - Maximum file size in bytes
 * @returns {object} { isValid: boolean, error?: string }
 */
export const validateFile = (file, allowedTypes = ['image/jpeg', 'image/png'], maxSize = 5242880) => {
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` 
    };
  }

  if (file.size > maxSize) {
    return { 
      isValid: false, 
      error: `File too large. Maximum size: ${(maxSize / 1024 / 1024).toFixed(1)}MB` 
    };
  }

  return { isValid: true, value: file };
};

