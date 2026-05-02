/**
 * Constants and Database Table Mappings
 */

export const DB_TABLES = {
  STUDENTS: 'studenti',
  USERS: 'utilizatori',
  PROFESSORS: 'profesori',
  PROFESSORS_LEGACY: 'professors',
  DOCUMENTS: 'documente',
  FORUM_POSTS: 'postari_forum',
  POSTS_LEGACY: 'posts',
  COMMENTS: 'comments',
  COMMENTS_LEGACY: 'comentarii',
  VOTES: 'voturi',
  QUESTIONS: 'questions',
  PROFESSOR_REVIEWS: 'recenzii_profesori',
  REVIEW_HELPFUL_VOTES: 'recenzii_utile'
};

// Added courses mapping (primary and legacy fallback)
DB_TABLES.COURSES = 'cursuri';
DB_TABLES.COURSES_LEGACY = 'courses';

export const ROLES = {
  STUDENT: 'student',
  PROFESSOR: 'profesor',
  ADMIN: 'admin'
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'supabase.auth.token',
  CURRENT_USER: 'currentUser',
  USER_ROLE: 'role',
  THEME: 'theme',
  ANIMATIONS_ENABLED: 'animations_enabled'
};

export const ADMIN_EMAIL = 'admin@ulbstudent.ro';

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Email sau parolă incorectă',
  EMAIL_ALREADY_USED: 'Acest email este deja folosit',
  WEAK_PASSWORD: 'Parola nu este suficient de sigură',
  USER_NOT_AUTHENTICATED: 'Utilizatorul nu este autentificat',
  SUPABASE_NOT_INITIALIZED: 'Supabase client nu este inițializat. Verifică configurația.',
  SUPABASE_FAILED_TO_LOAD: 'Supabase nu s-a putut încărca. Verifică conexiunea la internet.'
};

export const PAGE_REDIRECT = {
  PROFESSOR_DASHBOARD: 'profile.html',
  STUDENT_DASHBOARD: 'index.html',
  LOGIN: 'login.html'
};
