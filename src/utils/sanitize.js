/**
 * Security utilities for sanitizing user input
 * Protects against XSS and other injection attacks
 * 
 * Note: To install DOMPurify for additional protection, run:
 * npm install dompurify isomorphic-dompurify
 * 
 * If PowerShell execution is disabled on Windows:
 * 1. Open PowerShell as Administrator
 * 2. Run: Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
 * 3. Then run: npm install dompurify isomorphic-dompurify
 */

// Uncomment these lines after installing DOMPurify:
import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content using DOMPurify (when available)
 * Falls back to basic sanitization if DOMPurify is not installed
 */
export const sanitizeHTML = (dirty) => {
  if (!dirty) return '';
  
  // If DOMPurify is available, use it (uncomment after installation)
return DOMPurify.sanitize(dirty, {
ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span'],
ALLOWED_ATTR: []
 });
  
};

/**
 * Sanitize text content (React already does this, but explicit is better)
 * Removes any HTML tags and special characters
 */
export const sanitizeText = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .trim()
    .slice(0, 1000); // Limit length
};

/**
 * Validate and sanitize URLs
 * Prevents javascript:, data:, and other dangerous protocols
 */
export const sanitizeURL = (url) => {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    
    // Only allow http, https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      console.warn('Blocked dangerous URL protocol:', urlObj.protocol);
      return null;
    }
    
    return url;
  } catch (e) {
    // Invalid URL
    console.warn('Invalid URL provided:', url);
    return null;
  }
};

/**
 * Safe image URL - validates and provides fallback
 */
export const getSafeImageURL = (url, fallbackName = 'User') => {
  const safeURL = sanitizeURL(url);
  
  if (safeURL) {
    return safeURL;
  }
  
  // Return safe fallback (UI Avatars)
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=10b981&color=fff`;
};

/**
 * Sanitize email address
 */
export const sanitizeEmail = (email) => {
  if (!email) return '';
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (emailRegex.test(email)) {
    return email.toLowerCase().trim();
  }
  
  return '';
};

/**
 * Sanitize display name
 * Allows letters, numbers, spaces, and basic punctuation
 */
export const sanitizeDisplayName = (name) => {
  if (!name) return 'User';
  
  return String(name)
    .replace(/[<>{}[\]\\]/g, '') // Remove dangerous characters
    .trim()
    .slice(0, 50) || 'User'; // Limit length, fallback to 'User'
};

/**
 * Prevent XSS in object properties
 */
export const sanitizeUserObject = (user) => {
  if (!user) return null;
  
  return {
    uid: user.uid, // Firebase UID is safe
    email: sanitizeEmail(user.email),
    displayName: sanitizeDisplayName(user.displayName),
    photoURL: getSafeImageURL(user.photoURL, user.displayName || 'User'),
  };
};

