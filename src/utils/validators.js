/**
 * Input Validation and Sanitization Utilities
 */

import { UUID_REGEX, ADMIN_EMAIL } from './constants.js';
import DOMPurify from 'dompurify';

/**
 * Validate UUID format
 */
export function isValidUuid(value) {
  if (!value || typeof value !== 'string') {
    return false;
  }
  return UUID_REGEX.test(value);
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Normalize and validate email
 */
export function normalizeEmail(email) {
  if (!email || typeof email !== 'string') {
    return '';
  }
  return email.trim().toLowerCase();
}

/**
 * Validate password strength (minimum 8 chars, mixed case, number)
 */
export function isValidPassword(password) {
  if (!password || typeof password !== 'string') {
    return false;
  }
  // Min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(password);
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}

/**
 * Sanitize HTML content (allow safe tags)
 */
export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') {
    return '';
  }
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'a', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href']
  });
}

/**
 * Check if email is admin email
 */
export function isAdminEmail(email) {
  const normalized = normalizeEmail(email);
  return normalized === normalizeEmail(ADMIN_EMAIL);
}

/**
 * Validate file type and size
 */
export function validateFile(file, allowedTypes = [], maxSizeBytes = 25 * 1024 * 1024) {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size > maxSizeBytes) {
    return { valid: false, error: `Fișierul nu trebuie să depășească ${maxSizeBytes / 1024 / 1024}MB` };
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { valid: false, error: `Tip de fișier neacceptabil. Tipurile acceptate: ${allowedTypes.join(', ')}` };
  }

  return { valid: true };
}

/**
 * Validate form data object
 */
export function validateFormData(data, schema) {
  const errors = {};

  for (const [field, rule] of Object.entries(schema)) {
    const value = data[field];

    if (rule.required && (!value || value.trim() === '')) {
      errors[field] = `${field} este obligatoriu`;
      continue;
    }

    if (value && rule.type === 'email' && !isValidEmail(value)) {
      errors[field] = 'Email invalid';
      continue;
    }

    if (value && rule.type === 'password' && !isValidPassword(value)) {
      errors[field] = 'Parola nu este suficient de sigură (min 8 caractere, majuscule, minuscule, cifre)';
      continue;
    }

    if (value && rule.minLength && value.length < rule.minLength) {
      errors[field] = `${field} trebuie să aibă cel puțin ${rule.minLength} caractere`;
      continue;
    }

    if (value && rule.maxLength && value.length > rule.maxLength) {
      errors[field] = `${field} trebuie să aibă maximum ${rule.maxLength} caractere`;
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Escape HTML entities
 */
export function escapeHtml(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
