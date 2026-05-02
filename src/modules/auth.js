/**
 * Authentication Module
 * Centralized authentication logic with Supabase
 */

import { DB_TABLES, STORAGE_KEYS, ROLES, ERROR_MESSAGES, ADMIN_EMAIL } from '../utils/constants.js';
import { isValidUuid, normalizeEmail, isAdminEmail, isValidEmail, isValidPassword } from '../utils/validators.js';
import { getCurrentUserProfile, initSupabaseClient } from './database.js';
import Logger from '../shared/logger.js';
import toast from '../shared/toast.js';

const logger = new Logger('Auth');

let authStateSubscription = null;

/**
 * Login with Email and Password
 */
export async function loginWithEmail(email, password) {
  try {
    const client = await initSupabaseClient();
    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const { data, error } = await client.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
      }
      throw new Error(error.message);
    }

    if (data?.session) {
      await _cacheSession(data.session);
      await _resolveAndCacheUserRole(data.session.user);
      logger.success(`Login successful: ${normalizedEmail}`);
      return { success: true, user: data.user };
    }

    throw new Error('No session created');
  } catch (error) {
    logger.error('Login failed', error);
    toast.error(error.message);
    throw error;
  }
}

/**
 * Register new user with email and password
 */
export async function registerNewUser(email, password, fullName, metadata = {}) {
  try {
    const client = await initSupabaseClient();
    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      throw new Error('Email invalid');
    }

    if (!isValidPassword(password)) {
      throw new Error('Parola nu este suficient de sigură');
    }

    const { data, error } = await client.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: fullName || 'User',
          account_type: metadata.accountType || ROLES.STUDENT,
          ...metadata
        },
        emailRedirectTo: `${window.location.origin}/index.html`
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        throw new Error(ERROR_MESSAGES.EMAIL_ALREADY_USED);
      }
      if (error.message.includes('Password should be')) {
        throw new Error(ERROR_MESSAGES.WEAK_PASSWORD);
      }
      throw new Error(error.message);
    }

    if (data?.user) {
      logger.success(`Registration successful: ${normalizedEmail}`);
      
      // Try auto-login
      try {
        await loginWithEmail(normalizedEmail, password);
      } catch (loginError) {
        logger.warn('Auto-login after registration failed', loginError);
      }

      return { success: true, user: data.user };
    }

    throw new Error('Registration failed');
  } catch (error) {
    logger.error('Registration failed', error);
    toast.error(error.message);
    throw error;
  }
}

/**
 * Login with Google OAuth
 */
export async function loginWithGoogle() {
  try {
    const client = await initSupabaseClient();

    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/index.html`
      }
    });

    if (error) {
      throw new Error(error.message || 'Google OAuth failed');
    }

    logger.success('Google OAuth initiated');
    return { success: true };
  } catch (error) {
    logger.error('Google OAuth failed', error);
    toast.error(error.message);
    throw error;
  }
}

/**
 * Logout user
 */
export async function logoutUser() {
  try {
    const client = await initSupabaseClient();

    const { error } = await client.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }

    _clearSession();
    logger.success('Logout successful');
    window.location.href = 'login.html';
    return { success: true };
  } catch (error) {
    logger.error('Logout failed', error);
    _clearSession();
    window.location.href = 'login.html';
  }
}

/**
 * Check current authentication status
 */
export async function checkAuthStatus() {
  try {
    const client = await initSupabaseClient();
    const { data, error } = await client.auth.getSession();

    if (!error && data?.session?.user) {
      await _cacheSession(data.session);
      const role = await _resolveAndCacheUserRole(data.session.user);
      logger.success(`Authenticated: ${data.session.user.email}`);
      return { authenticated: true, user: data.session.user, role };
    }

    // Fallback to cached session
    const cachedUser = _getCachedUser();
    if (cachedUser) {
      const role = await _resolveAndCacheUserRole(cachedUser);
      return { authenticated: true, user: cachedUser, role };
    }

    return { authenticated: false, user: null, role: null };
  } catch (error) {
    logger.warn('Auth status check failed', error);
    return { authenticated: false, user: null, role: null };
  }
}

/**
 * Initialize authentication session on page load
 */
export async function initializeSession() {
  try {
    const status = await checkAuthStatus();
    if (status.authenticated) {
      logger.info(`Session initialized for ${status.user.email}`);
      return status;
    }
    return { authenticated: false, user: null, role: null };
  } catch (error) {
    logger.error('Session initialization failed', error);
    return { authenticated: false, user: null, role: null };
  }
}

/**
 * Setup auth state listener (real-time session sync)
 */
export async function setupAuthStateListener(callback = null) {
  if (authStateSubscription) {
    return;
  }

  const client = await initSupabaseClient();
  const { data } = client.auth.onAuthStateChange(async (_event, session) => {
    if (session) {
      await _cacheSession(session);
      await _resolveAndCacheUserRole(session.user);
      logger.info('Auth state updated: user authenticated');
    } else {
      _clearSession();
      logger.info('Auth state updated: user logged out');
    }

    if (callback && typeof callback === 'function') {
      callback(session);
    }
  });

  authStateSubscription = data?.subscription || null;
  logger.success('Auth state listener initialized');
}

/**
 * Resolve user role by checking database
 */
async function _resolveAndCacheUserRole(user) {
  try {
    if (!user?.id) {
      localStorage.setItem(STORAGE_KEYS.USER_ROLE, ROLES.STUDENT);
      return ROLES.STUDENT;
    }

    const normalizedEmail = normalizeEmail(user.email || '');

    // Check if admin
    if (isAdminEmail(normalizedEmail)) {
      localStorage.setItem(STORAGE_KEYS.USER_ROLE, ROLES.ADMIN);
      return ROLES.ADMIN;
    }

    // Check database for role
    const result = await getCurrentUserProfile(user.id, user.email);

    let role = ROLES.STUDENT;
    if (result.success && result.role) {
      role = result.role === 'professor' ? ROLES.PROFESSOR : ROLES.STUDENT;
    }

    localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
    return role;
  } catch (error) {
    logger.warn('Role resolution failed', error);
    localStorage.setItem(STORAGE_KEYS.USER_ROLE, ROLES.STUDENT);
    return ROLES.STUDENT;
  }
}

/**
 * Cache session in localStorage
 */
function _cacheSession(session) {
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, JSON.stringify(session));
  if (session?.user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(session.user));
  }
}

/**
 * Get cached user
 */
function _getCachedUser() {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    logger.warn('Failed to parse cached user', error);
    return null;
  }
}

/**
 * Clear all session data
 */
function _clearSession() {
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
}

/**
 * Get current authenticated user
 */
export function getCurrentUser() {
  return _getCachedUser();
}

/**
 * Get current user role
 */
export function getCurrentUserRole() {
  return localStorage.getItem(STORAGE_KEYS.USER_ROLE) || ROLES.STUDENT;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!getCurrentUser();
}

/**
 * Redirect based on user role
 */
export async function redirectByRole(options = {}) {
  const status = await checkAuthStatus();

  if (!status.authenticated) {
    window.location.href = 'login.html';
    return;
  }

  const role = status.role || getCurrentUserRole();
  const destination = role === ROLES.PROFESSOR
    ? (options.professorPage || 'profile.html')
    : (options.studentPage || 'index.html');

  window.location.href = destination;
}
