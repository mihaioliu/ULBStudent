/**
 * Database Operations Module
 * Centralized Supabase queries and database logic
 */

import { DB_TABLES, STORAGE_KEYS } from '../utils/constants.js';
import { isValidUuid, normalizeEmail } from '../utils/validators.js';
import Logger from '../shared/logger.js';

const logger = new Logger('Database');

let supabaseClient = null;

/**
 * Wait for Supabase to load from CDN
 */
async function waitForSupabase(maxRetries = 50) {
  let retries = 0;
  while (!window.supabase && retries < maxRetries) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    retries++;
  }

  if (!window.supabase) {
    throw new Error('Supabase failed to load. Check your internet connection.');
  }

  return window.supabase;
}

/**
 * Initialize Supabase Client
 */
export async function initSupabaseClient() {
  if (!supabaseClient) {
    try {
      if (typeof window.getSupabaseClient === 'function') {
        supabaseClient = await window.getSupabaseClient();
      } else {
        await waitForSupabase();
        const { url, anonKey } = window.SUPABASE_CONFIG || {};

        if (!url || !anonKey) {
          throw new Error('Supabase configuration missing. Check supabase-client.js');
        }

        const { createClient } = window.supabase;
        supabaseClient = createClient(url, anonKey);
      }

      logger.success('Supabase client initialized');
    } catch (error) {
      logger.error('Failed to initialize Supabase', error);
      throw error;
    }
  }

  return supabaseClient;
}

/**
 * Fetch data from any table
 */
export async function fetchFromTable(tableName, filters = {}, selectFields = '*') {
  try {
    const client = await initSupabaseClient();
    let query = client.from(tableName).select(selectFields);

    Object.entries(filters).forEach(([column, value]) => {
      query = query.eq(column, value);
    });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    logger.error(`Failed to fetch from ${tableName}`, error);
    return { success: false, error };
  }
}

/**
 * Insert data into table
 */
export async function insertIntoTable(tableName, payload) {
  try {
    const client = await initSupabaseClient();
    const { data, error } = await client.from(tableName).insert([payload]).select();

    if (error) {
      throw error;
    }

    logger.success(`Data inserted into ${tableName}`);
    return { success: true, data };
  } catch (error) {
    logger.error(`Failed to insert into ${tableName}`, error);
    return { success: false, error };
  }
}

/**
 * Update data in table
 */
export async function updateInTable(tableName, updates, filters = {}) {
  try {
    const client = await initSupabaseClient();
    let query = client.from(tableName).update(updates);

    Object.entries(filters).forEach(([column, value]) => {
      query = query.eq(column, value);
    });

    const { data, error } = await query.select();

    if (error) {
      throw error;
    }

    logger.success(`Data updated in ${tableName}`);
    return { success: true, data };
  } catch (error) {
    logger.error(`Failed to update ${tableName}`, error);
    return { success: false, error };
  }
}

/**
 * Delete data from table
 */
export async function deleteFromTable(tableName, filters = {}) {
  try {
    const client = await initSupabaseClient();
    let query = client.from(tableName).delete();

    Object.entries(filters).forEach(([column, value]) => {
      query = query.eq(column, value);
    });

    const { error } = await query;

    if (error) {
      throw error;
    }

    logger.success(`Data deleted from ${tableName}`);
    return { success: true };
  } catch (error) {
    logger.error(`Failed to delete from ${tableName}`, error);
    return { success: false, error };
  }
}

/**
 * Batch fetch from multiple tables
 */
export async function batchFetch(queries = []) {
  try {
    const results = await Promise.all(queries);
    return { success: true, data: results };
  } catch (error) {
    logger.error('Batch fetch failed', error);
    return { success: false, error };
  }
}

/**
 * Helper to attempt fetch from primary table then legacy fallback
 */
async function _tryTableFetch(primaryTable, legacyTable, filters = {}, selectFields = '*') {
  const primary = await fetchFromTable(primaryTable, filters, selectFields);
  if (primary.success) return primary;

  if (legacyTable) {
    const legacy = await fetchFromTable(legacyTable, filters, selectFields);
    return legacy;
  }

  return { success: false, error: 'No table available' };
}

/**
 * Fetch courses with optional filters
 */
export async function fetchCourses(filters = {}, selectFields = '*') {
  try {
    const primary = DB_TABLES.COURSES || 'cursuri';
    const legacy = DB_TABLES.COURSES_LEGACY || 'courses';
    return await _tryTableFetch(primary, legacy, filters, selectFields);
  } catch (error) {
    logger.error('Failed to fetch courses', error);
    return { success: false, error };
  }
}

/**
 * Fetch single course by id (tries common id column names)
 */
export async function fetchCourseById(courseId, selectFields = '*') {
  try {
    const client = await initSupabaseClient();
    const table = DB_TABLES.COURSES || DB_TABLES.COURSES_LEGACY || 'cursuri';

    const idColumns = ['id', 'course_id', 'curs_id', 'courseId'];
    for (const col of idColumns) {
      const { data, error } = await client.from(table).select(selectFields).eq(col, courseId).limit(1).maybeSingle();
      if (!error && data) return { success: true, data };
    }

    return { success: false, error: 'Course not found' };
  } catch (error) {
    logger.error('Failed to fetch course by id', error);
    return { success: false, error };
  }
}

/**
 * Fetch ratings for a professor (tries multiple possible column names)
 */
export async function fetchRatingsForProfessor(professorId, selectFields = '*') {
  try {
    const client = await initSupabaseClient();
    const table = DB_TABLES.PROFESSOR_REVIEWS;
    const candidateCols = ['profesor_id', 'professor_id', 'professor', 'prof_id'];

    for (const col of candidateCols) {
      const { data, error } = await client.from(table).select(selectFields).eq(col, professorId);
      if (!error && data) return { success: true, data };
    }

    // fallback: try fetching by 'target_id'
    const { data, error } = await client.from(table).select(selectFields).eq('target_id', professorId);
    if (!error && data) return { success: true, data };

    return { success: true, data: [] };
  } catch (error) {
    logger.error('Failed to fetch ratings', error);
    return { success: false, error };
  }
}

/**
 * Save or update a rating. If `id` provided, update; otherwise insert or upsert by professor+user
 */
export async function saveRating({ id = null, professorId, userId, rating, comment = '' }) {
  try {
    const table = DB_TABLES.PROFESSOR_REVIEWS;

    if (!professorId || !userId || typeof rating === 'undefined') {
      throw new Error('Missing required fields for rating');
    }

    // If id provided -> update
    if (id) {
      const updates = { rating, comment };
      const filters = { id };
      return await updateInTable(table, updates, filters);
    }

    // Try to update existing by professor+user
    const existing = await fetchFromTable(table, { profesor_id: professorId, user_id: userId });
    if (existing.success && existing.data && existing.data.length > 0) {
      const existingId = existing.data[0].id;
      return await updateInTable(table, { rating, comment }, { id: existingId });
    }

    // Insert new
    const payload = { profesor_id: professorId, user_id: userId, rating, comment };
    return await insertIntoTable(table, payload);
  } catch (error) {
    logger.error('Failed to save rating', error);
    return { success: false, error };
  }
}

/**
 * Generic subscription helper. Returns an unsubscribe function.
 */
export async function subscribeToTable(tableName, filter = null, handler = () => {}) {
  try {
    const client = await initSupabaseClient();

    const matchesFilter = (row) => {
      if (!filter) return true;
      return Object.entries(filter).every(([k, v]) => row && String(row[k]) === String(v));
    };

    // Prefer new channel API if available
    if (client.channel) {
      const channel = client.channel(`${tableName}-changes`);
      channel.on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
        const row = payload.record || payload.new || payload.old || payload;
        if (!matchesFilter(row)) return;
        handler(payload);
      });

      await channel.subscribe();
      return async () => {
        try {
          await channel.unsubscribe();
        } catch (e) {
          logger.warn('Failed to unsubscribe channel', e);
        }
      };
    }

    // Fallback to older .from(...).on(...).subscribe()
    if (client.from) {
      const sub = client.from(tableName).on('*', (payload) => {
        const row = payload.new || payload.old || payload.record || payload;
        if (!matchesFilter(row)) return;
        handler(payload);
      }).subscribe();

      return async () => {
        try {
          if (sub.unsubscribe) await sub.unsubscribe();
          else if (client.removeSubscription) await client.removeSubscription(sub);
        } catch (e) {
          logger.warn('Failed to remove subscription', e);
        }
      };
    }

    logger.warn('Realtime not supported by client');
    return () => {};
  } catch (error) {
    logger.error('Failed to subscribe to table', error);
    return () => {};
  }
}

/**
 * Subscribe specifically to ratings for a professor (returns unsubscribe)
 */
export async function subscribeToRatings(professorId, handler) {
  // Try common column names in the filter; realtime filter applied client-side
  const filter = { profesor_id: professorId };
  return await subscribeToTable(DB_TABLES.PROFESSOR_REVIEWS, filter, handler);
}

/**
 * Subscribe to courses (optionally scoped to a professor)
 */
export async function subscribeToCourses(professorId = null, handler) {
  const table = DB_TABLES.COURSES || DB_TABLES.COURSES_LEGACY || 'cursuri';
  const filter = professorId ? { profesor_id: professorId } : null;
  return await subscribeToTable(table, filter, handler);
}

/**
 * Get current user profile with role resolution
 */
export async function getCurrentUserProfile(userId, email) {
  try {
    const client = await initSupabaseClient();
    const normalizedEmail = normalizeEmail(email);

    // Try to get from students table
    const { data: studentData, error: studentError } = await client
      .from(DB_TABLES.STUDENTS)
      .select('*')
      .eq('email', normalizedEmail)
      .limit(1)
      .maybeSingle();

    if (!studentError && studentData) {
      return { success: true, data: studentData, role: 'student' };
    }

    // Try professors table
    const { data: professorData, error: professorError } = await client
      .from(DB_TABLES.PROFESSORS)
      .select('*')
      .eq('email', normalizedEmail)
      .limit(1)
      .maybeSingle();

    if (!professorError && professorData) {
      return { success: true, data: professorData, role: 'professor' };
    }

    // Try users table
    const { data: userData, error: userError } = await client
      .from(DB_TABLES.USERS)
      .select('*')
      .eq('email', normalizedEmail)
      .limit(1)
      .maybeSingle();

    if (!userError && userData) {
      return { success: true, data: userData, role: userData.role || 'student' };
    }

    return { success: false, error: 'User profile not found' };
  } catch (error) {
    logger.error('Failed to get user profile', error);
    return { success: false, error };
  }
}
