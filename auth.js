// Supabase Configuration (centralized through supabase-client.js)
let supabaseClient = null;

const TABLES = {
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

/**
 * Wait for Supabase to load from CDN
 */
async function waitForSupabase() {
  let retries = 0;
  while (!window.supabase && retries < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
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
async function initSupabaseClient() {
  if (!supabaseClient) {
    if (typeof window.getSupabaseClient === 'function') {
      supabaseClient = await window.getSupabaseClient();
    } else {
      // Fallback de compatibilitate daca supabase-client.js nu este inca inclus
      await waitForSupabase();
      const fallbackUrl = window.SUPABASE_CONFIG?.url;
      const fallbackAnonKey = window.SUPABASE_CONFIG?.anonKey;

      if (!fallbackUrl || !fallbackAnonKey) {
        throw new Error('Configurația Supabase lipsește. Include supabase-client.js și completează cheile API.');
      }

      const { createClient } = window.supabase;
      supabaseClient = createClient(fallbackUrl, fallbackAnonKey);
    }

    console.log('Supabase client initialized (central config)');
  }
  return supabaseClient;
}

/**
 * Login with Email and Password
 */
async function loginWithEmail(email, password) {
  try {
    const client = await initSupabaseClient();
    
    if (!client) {
      throw new Error('Supabase client not initialized. Please check your configuration.');
    }

    const { data, error } = await client.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Email sau parolă incorectă');
      }
      throw new Error(error.message || 'Eroare la conectare');
    }

    if (data?.session) {
      // Store session in localStorage
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: data.user
      }));
      
      // Set user as logged in
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      await resolveAndCacheUserRole(data.user);
      
      console.log('Login successful:', data.user.email);
      return { success: true, user: data.user };
    }
  } catch (error) {
    console.error('Login error:', error.message);
    throw error;
  }
}

/**
 * Detect role by checking whether current user exists in `profesori`/`professors` table.
 */
async function detectUserRole(userId, email = '') {
  const client = await initSupabaseClient();
  const normalizedEmail = (email || '').trim().toLowerCase();
  const isDesignatedAdminEmail = normalizedEmail === 'admin@ulbstudent.ro';

  if (!userId) {
    return isDesignatedAdminEmail ? 'admin' : 'student';
  }

  // Admin: DB-first check from utilizatori.role, then strict email fallback.
  try {
    const adminByUserId = await client
      .from(TABLES.USERS)
      .select('role')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (!adminByUserId.error && String(adminByUserId.data?.role || '').toLowerCase() === 'admin') {
      return 'admin';
    }

    if (normalizedEmail) {
      const adminByEmail = await client
        .from(TABLES.USERS)
        .select('role')
        .eq('email', normalizedEmail)
        .limit(1)
        .maybeSingle();

      if (!adminByEmail.error && String(adminByEmail.data?.role || '').toLowerCase() === 'admin') {
        return 'admin';
      }
    }
  } catch (error) {
    console.warn('Could not confirm admin role from users table:', error.message);
  }

  if (isDesignatedAdminEmail) {
    return 'admin';
  }

  // Preferred table name requested by project notes
  const profesoriChecks = [
    client.from('profesori').select('user_id').eq('user_id', userId).limit(1),
    normalizedEmail ? client.from('profesori').select('email').eq('email', normalizedEmail).limit(1) : Promise.resolve({ error: null, data: [] }),
    normalizedEmail ? client.from('profesori').select('institutional_email').eq('institutional_email', normalizedEmail).limit(1) : Promise.resolve({ error: null, data: [] })
  ];

  const profesoriResults = await Promise.all(profesoriChecks);
  if (profesoriResults.some((result) => !result.error && Array.isArray(result.data) && result.data.length > 0)) {
    return 'profesor';
  }

  // Fallback for current schema used in this project
  const professorsByUserId = await client
    .from('professors')
    .select('id,user_id,institutional_email')
    .eq('user_id', userId)
    .limit(1);

  if (!professorsByUserId.error && Array.isArray(professorsByUserId.data) && professorsByUserId.data.length > 0) {
    return 'profesor';
  }

  if (normalizedEmail) {
    const professorsByEmail = await client
      .from('professors')
      .select('id,user_id,institutional_email')
      .eq('institutional_email', normalizedEmail)
      .limit(1);

    if (!professorsByEmail.error && Array.isArray(professorsByEmail.data) && professorsByEmail.data.length > 0) {
    return 'profesor';
  }
  }

  return 'student';
}

async function resolveAndCacheUserRole(user) {
  const normalizedEmail = String(user?.email || '').trim().toLowerCase();

  if (String(user?.user_metadata?.role || '').toLowerCase() === 'admin' || normalizedEmail === 'admin@ulbstudent.ro') {
    localStorage.setItem('role', 'admin');
    return 'admin';
  }

  if (user?.user_metadata?.account_type === 'professor') {
    localStorage.setItem('role', 'profesor');
    return 'profesor';
  }

  if (user?.id) {
    const detectedRole = await detectUserRole(user.id, user.email || '');
    localStorage.setItem('role', detectedRole);
    return detectedRole;
  }

  localStorage.setItem('role', 'student');
  return 'student';
}

/**
 * Resolve role after login and redirect to role-specific page.
 */
async function routeByUserRole(options = {}) {
  const professorDashboard = options.professorDashboard || 'profile.html';
  const studentDashboard = options.studentDashboard || 'index.html';

  const user = await getAuthenticatedUser(false);
  if (!user?.id) {
    throw new Error('Nu există sesiune activă după login.');
  }

  const role = await detectUserRole(user.id, user.email || '');
  localStorage.setItem('role', role);

  const destination = role === 'profesor' ? professorDashboard : studentDashboard;
  window.location.href = destination;
  return role;
}

/**
 * Check if an email is already present in app tables.
 * This is a guardrail before Supabase auth signUp.
 */
async function isEmailAlreadyUsed(email, accountType = 'student') {
  const client = await initSupabaseClient();
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    return false;
  }

  const checks = [
    client.from(TABLES.STUDENTS).select('email').eq('email', normalizedEmail).limit(1).maybeSingle(),
    client.from(TABLES.USERS).select('email').eq('email', normalizedEmail).limit(1).maybeSingle(),
    client.from(TABLES.PROFESSORS).select('email').eq('email', normalizedEmail).limit(1).maybeSingle(),
    client.from(TABLES.PROFESSORS_LEGACY).select('institutional_email').eq('institutional_email', normalizedEmail).limit(1).maybeSingle()
  ];

  const [studentResult, userResult, professorResult, legacyProfessorResult] = await Promise.all(checks);

  const hasStudentMatch = (!studentResult.error && !!studentResult.data) || (!userResult.error && !!userResult.data);
  const hasProfessorMatch = (!professorResult.error && !!professorResult.data) || (!legacyProfessorResult.error && !!legacyProfessorResult.data);

  // If the target table can be queried and has a match, block registration.
  if (accountType === 'professor' && hasProfessorMatch) {
    return true;
  }

  if (accountType !== 'professor' && hasStudentMatch) {
    return true;
  }

  // Also block if email already exists in the other profile table.
  return hasStudentMatch || hasProfessorMatch;
}
/**
 * Register New User
 */
async function registerNewUser(email, password, fullName, year, faculty, accountType = 'student', professorData = {}) {
  try {
    const client = await initSupabaseClient();
    const isProfessor = accountType === 'professor';
    const normalizedEmail = (email || '').trim().toLowerCase();
    const normalizedFullName = (fullName || '').trim() || 'Profesor ULB';

    const metadata = {
      account_type: accountType,
      full_name: normalizedFullName,
      faculty: isProfessor ? professorData.faculty : faculty,
      year: isProfessor ? null : year,
      specialization: isProfessor ? professorData.specialization : faculty,
      taught_subject: isProfessor ? professorData.taughtSubject : null,
      teaching_years: isProfessor ? (professorData.teachingYears || []) : null
    };
    
    if (!client) {
      throw new Error('Supabase client not initialized. Please check your configuration.');
    }

    const alreadyUsed = await isEmailAlreadyUsed(normalizedEmail, accountType);
    if (alreadyUsed) {
      throw new Error('Acest email este deja folosit');
    }

    // PASUL 1: Creează contul
    const { data, error } = await client.auth.signUp({
      email: normalizedEmail,
      password: password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/index.html`
      }
    });

    if (error) {
      if (error.message.includes('already registered')) throw new Error('Acest email este deja folosit');
      if (error.message.includes('Password should be')) throw new Error('Parola nu este suficient de sigură');
      throw new Error(error.message || 'Eroare la creare cont');
    }

    // Supabase may not always return an explicit error for existing users.
    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new Error('Acest email este deja folosit');
    }

    // PASUL 2: INSERARE ÎN TABELUL AFERENT TIPULUI DE CONT
    if (data?.user) {
      if (isProfessor) {
        const professorRows = [
          {
            user_id: data.user.id,
            nume_complet: normalizedFullName,
            email: normalizedEmail,
            specializare: professorData.specialization || null,
            departament: professorData.faculty || null,
            materie_predata: professorData.taughtSubject || null,
            ani_predare: professorData.teachingYears || []
          },
          {
            user_id: data.user.id,
            full_name: normalizedFullName,
            email: normalizedEmail,
            specialization: professorData.specialization || null,
            department: professorData.faculty || null,
            taught_subject: professorData.taughtSubject || null,
            teaching_years: professorData.teachingYears || []
          }
        ];

        let inserted = false;

        for (const row of professorRows) {
          const result = await client.from(TABLES.PROFESSORS).insert([row]);
          if (!result.error) {
            inserted = true;
            break;
          }
        }

        // Fallback schema vechi (professors)
        if (!inserted) {
          const legacyRow = {
            academic_title: 'Prof.',
            full_name: normalizedFullName,
            institutional_email: normalizedEmail,
            specialization: professorData.specialization || null,
            department: professorData.faculty || null,
            taught_subject: professorData.taughtSubject || null,
            teaching_years: professorData.teachingYears || []
          };

          const legacyResult = await client.from(TABLES.PROFESSORS_LEGACY).insert([legacyRow]);
          if (legacyResult.error) {
            if (String(legacyResult.error.message || '').toLowerCase().includes('duplicate')) {
              throw new Error('Acest email este deja folosit');
            }
            console.error('Eroare la salvarea profesorului:', legacyResult.error.message);
          }
        }
      } else {
        const studentRows = [
          {
            user_id: data.user.id,
            email: normalizedEmail,
            nume_complet: normalizedFullName,
            an_studiu: year ? parseInt(year, 10) : null,
            specializare: faculty || null
          },
          {
            user_id: data.user.id,
            email: normalizedEmail,
            full_name: normalizedFullName,
            study_year: year ? parseInt(year, 10) : null,
            specialization: faculty || null
          }
        ];

        let studentInserted = false;
        for (const row of studentRows) {
          const studentInsert = await client.from(TABLES.STUDENTS).insert([row]);
          if (!studentInsert.error) {
            studentInserted = true;
            break;
          }
        }

        // Dublăm și în utilizatori pentru compatibilitatea cu paginile existente.
        const userInsert = await client.from(TABLES.USERS).insert([{
          user_id: data.user.id,
          email: normalizedEmail,
          nume_complet: normalizedFullName,
          an_studiu: year ? parseInt(year, 10) : null,
          specializare: faculty || null
        }]);

        if (!studentInserted && userInsert.error) {
          const errMsg = String(userInsert.error.message || '').toLowerCase();
          if (errMsg.includes('duplicate')) {
            throw new Error('Acest email este deja folosit');
          }
          console.error('Eroare la salvarea profilului student:', userInsert.error.message);
        }
      }
    }

    console.log('Registration successful. Auto-logging in...');
    
    // Auto-login după registrare
    try {
      await loginWithEmail(normalizedEmail, password);
      console.log('User auto-logged in successfully!');
    } catch (loginError) {
      console.warn('Auto-login failed. User will need to login manually.');
    }
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Registration error:', error.message);
    throw error;
  }
}


/**
 * Login with Google OAuth
 */
async function loginWithGoogle() {
  try {
    const client = await initSupabaseClient();
    
    if (!client) {
      throw new Error('Supabase client not initialized. Please check your configuration.');
    }

    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/index.html`
      }
    });

    if (error) {
      throw new Error(error.message || 'Eroare la connectare cu Google');
    }

    console.log('Google OAuth initiated');
    return { success: true };
  } catch (error) {
    console.error('Google OAuth error:', error.message);
    throw error;
  }
}

/**
 * Logout User
 */
async function logoutUser() {
  try {
    const client = await initSupabaseClient();
    
    if (client) {
      const { error } = await client.auth.signOut();
      
      if (error) {
        throw new Error(error.message);
      }
    }

    // Clear localStorage
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('role');
    
    console.log('Logout successful');
    
    // Redirect to login
    window.location.href = 'login.html';
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error.message);
    
    // Force clear localStorage and redirect anyway
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('role');
    window.location.href = 'login.html';
  }
}

/**
 * Check Current Authentication Status
 */
async function checkAuthStatus() {
  try {
    const client = await initSupabaseClient();
    
    if (!client) {
      console.warn('Supabase client not initialized');
      return { authenticated: false, user: null };
    }

    // PRIMARY: Get fresh session from Supabase
    const { data, error } = await client.auth.getSession();
    
    if (!error && data?.session?.user) {
      // Update localStorage with fresh session
      localStorage.setItem('supabase.auth.token', JSON.stringify(data.session));
      localStorage.setItem('currentUser', JSON.stringify(data.session.user));
      await resolveAndCacheUserRole(data.session.user);
      
      console.log('User authenticated (fresh session):', data.session.user.email);
      return { authenticated: true, user: data.session.user };
    }

    // FALLBACK: Check localStorage cache if session fetch failed
    const cachedToken = localStorage.getItem('supabase.auth.token');
    const cachedUser = localStorage.getItem('currentUser');
    
    if (cachedToken && cachedUser) {
      try {
        const userData = JSON.parse(cachedUser);
        await resolveAndCacheUserRole(userData);
        console.log('User authenticated (cached):', userData.email);
        return { authenticated: true, user: userData };
      } catch (e) {
        console.warn('Could not verify cached data:', e.message);
      }
    }

    console.log('ℹ️ No active session');
    return { authenticated: false, user: null };
  } catch (error) {
    console.error('Auth check error:', error.message);
    return { authenticated: false, user: null };
  }
}

/**
 * Initialize Session on Page Load (run this on every page)
 * Restores session from Supabase and updates UI
 */
async function initializeSession() {
  try {
    const { authenticated, user } = await checkAuthStatus();
    
    if (authenticated && user) {
      console.log(`Session initialized for ${user.email}`);
      return { authenticated: true, user };
    }
    
    console.log('ℹ️ No session on page load');
    return { authenticated: false, user: null };
  } catch (error) {
    console.error('Session initialization failed:', error.message);
    return { authenticated: false, user: null };
  }
}

let authStateSubscription = null;

async function syncSessionCache(session) {
  if (!session?.user) {
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('role');
    return;
  }

  localStorage.setItem('supabase.auth.token', JSON.stringify(session));
  localStorage.setItem('currentUser', JSON.stringify(session.user));

  try {
    await resolveAndCacheUserRole(session.user);
  } catch (error) {
    console.warn('Could not refresh role cache from auth state:', error.message);
  }
}

async function initializeAuthStateListener() {
  if (authStateSubscription) {
    return;
  }

  const client = await initSupabaseClient();
  const { data } = client.auth.onAuthStateChange(async (_event, session) => {
    await syncSessionCache(session);

    // Keep header in sync with the latest session state without forcing a reload.
    updateHeaderWithUserInfo().catch((error) => {
      console.warn('Could not refresh header after auth state change:', error.message);
    });
  });

  authStateSubscription = data?.subscription || null;

  const { data: sessionData } = await client.auth.getSession();
  await syncSessionCache(sessionData?.session || null);
}

/**
 * Get Current User
 */
function getCurrentUser() {
  try {
    const cached = localStorage.getItem('currentUser');
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

function isValidUuid(value) {
  if (!value || typeof value !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Resolve the currently authenticated user from Supabase session first.
 * Optionally falls back to cached localStorage data.
 */
async function getAuthenticatedUser(allowCachedFallback = true) {
  try {
    const client = await initSupabaseClient();
    const { data, error } = await client.auth.getSession();

    if (!error && data?.session?.user) {
      const sessionUser = data.session.user;
      localStorage.setItem('currentUser', JSON.stringify(sessionUser));
      localStorage.setItem('supabase.auth.token', JSON.stringify(data.session));
      await resolveAndCacheUserRole(sessionUser);
      return sessionUser;
    }

    const cachedUser = allowCachedFallback ? getCurrentUser() : null;
    if (cachedUser) {
      await resolveAndCacheUserRole(cachedUser);
    }
    return cachedUser;
  } catch (error) {
    console.warn('Could not resolve authenticated user from session:', error.message);
    const cachedUser = allowCachedFallback ? getCurrentUser() : null;
    if (cachedUser) {
      await resolveAndCacheUserRole(cachedUser);
    }
    return cachedUser;
  }
}

/**
 * Get logged-in user's profile row from `utilizatori`
 */
async function getCurrentUserProfileData() {
  try {
    const client = await initSupabaseClient();
    const user = await getAuthenticatedUser(false);

    if (!user?.email) {
      return { success: false, data: null };
    }

    const role = await resolveAndCacheUserRole(user);
    const accountType = role === 'profesor' ? 'professor' : 'student';

    if (role === 'profesor') {
      const professorChecks = [
        client.from(TABLES.PROFESSORS).select('*').eq('email', user.email).limit(1).maybeSingle(),
        client.from(TABLES.PROFESSORS).select('*').eq('user_id', user.id).limit(1).maybeSingle(),
        client.from(TABLES.PROFESSORS_LEGACY).select('*').eq('institutional_email', user.email).limit(1).maybeSingle()
      ];

      for (const check of professorChecks) {
        const { data: professorRow, error: professorError } = await check;
        if (!professorError && professorRow) {
          return {
            success: true,
            data: {
              source: TABLES.PROFESSORS,
              account_type: 'professor',
              email: user.email,
              full_name: professorRow.full_name || professorRow.nume_complet || user.user_metadata?.full_name || user.email,
              faculty: professorRow.department || professorRow.departament || user.user_metadata?.faculty || 'Departament necunoscut',
              specialization: professorRow.specialization || professorRow.specializare || user.user_metadata?.specialization || '-',
              academic_title: professorRow.academic_title || professorRow.titlu_academic || 'Prof.',
              taught_subject: professorRow.taught_subject || professorRow.materie_predata || user.user_metadata?.taught_subject || '-',
              teaching_years: professorRow.teaching_years || professorRow.ani_predare || user.user_metadata?.teaching_years || []
            }
          };
        }
      }
    }

    const { data: studentData, error: studentError } = await client
      .from(TABLES.STUDENTS)
      .select('*')
      .eq('email', user.email)
      .limit(1)
      .maybeSingle();

    const { data, error } = !studentError && studentData
      ? { data: studentData, error: null }
      : await client
          .from(TABLES.USERS)
          .select('*')
          .eq('email', user.email)
          .limit(1)
          .maybeSingle();

    if (error) {
      console.warn('Could not fetch utilizatori profile:', error.message);
      return {
        success: true,
        data: {
          source: 'auth_metadata',
          account_type: accountType,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email,
          year: user.user_metadata?.year || '-',
          specialization: user.user_metadata?.specialization || user.user_metadata?.faculty || '-'
        }
      };
    }

    return {
      success: true,
      data: {
        source: 'utilizatori',
        account_type: accountType,
        email: user.email,
        full_name: data?.nume_complet || user.user_metadata?.full_name || user.email,
        year: data?.an_studiu || user.user_metadata?.year || '-',
        specialization: data?.specializare || user.user_metadata?.specialization || user.user_metadata?.faculty || '-'
      }
    };
  } catch (error) {
    console.error('Error fetching user profile data:', error.message);
    return { success: false, data: null };
  }
}

/**
 * Save current user's profile data back to database and auth metadata.
 */
async function updateCurrentUserProfileData(profileUpdates = {}) {
  try {
    const client = await initSupabaseClient();
    const user = await getAuthenticatedUser(false);

    if (!user?.email) {
      throw new Error('User not authenticated');
    }

    const accountType = await resolveAndCacheUserRole(user);
    const normalizedEmail = user.email.trim().toLowerCase();
    const userId = isValidUuid(user?.id) ? user.id : null;

    const attemptUpdate = async (table, payload, criteria = []) => {
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined)
      );

      for (const criterion of criteria) {
        const { column, value } = criterion;
        if (value === undefined || value === null || value === '') continue;
        const { data, error } = await client
          .from(table)
          .update(cleanPayload)
          .eq(column, value)
          .select('id');
        if (!error && Array.isArray(data) && data.length > 0) {
          return { success: true, data };
        }
        if (error) {
          return { success: false, error };
        }
      }
      return { success: false, error: null };
    };

    if (accountType === 'profesor') {
      const updatePayload = {
        full_name: profileUpdates.full_name,
        nume_complet: profileUpdates.full_name,
        specialization: profileUpdates.specialization,
        specializare: profileUpdates.specialization,
        department: profileUpdates.faculty,
        departament: profileUpdates.faculty,
        taught_subject: profileUpdates.taught_subject,
        materie_predata: profileUpdates.taught_subject,
        teaching_years: profileUpdates.teaching_years,
        ani_predare: profileUpdates.teaching_years
      };

      const primaryUpdate = await attemptUpdate(TABLES.PROFESSORS, updatePayload, [
        { column: 'user_id', value: userId },
        { column: 'email', value: normalizedEmail }
      ]);

      if (!primaryUpdate.success) {
        const legacyUpdate = await attemptUpdate(TABLES.PROFESSORS_LEGACY, {
          full_name: profileUpdates.full_name,
          specialization: profileUpdates.specialization,
          department: profileUpdates.faculty,
          taught_subject: profileUpdates.taught_subject,
          teaching_years: profileUpdates.teaching_years
        }, [
          { column: 'institutional_email', value: normalizedEmail },
          { column: 'email', value: normalizedEmail }
        ]);

        if (legacyUpdate.error) throw new Error(legacyUpdate.error.message);
      }

      await attemptUpdate(TABLES.USERS, {
        nume_complet: profileUpdates.full_name,
        an_studiu: null,
        specializare: profileUpdates.specialization,
        role: 'profesor'
      }, [
        { column: 'user_id', value: userId },
        { column: 'email', value: normalizedEmail }
      ]);

      const { error: authError } = await client.auth.updateUser({
        data: {
          ...user.user_metadata,
          full_name: profileUpdates.full_name || user.user_metadata?.full_name,
          faculty: profileUpdates.faculty || user.user_metadata?.faculty,
          specialization: profileUpdates.specialization || user.user_metadata?.specialization,
          taught_subject: profileUpdates.taught_subject || user.user_metadata?.taught_subject,
          teaching_years: profileUpdates.teaching_years || user.user_metadata?.teaching_years || [],
          account_type: accountType === 'profesor' ? 'professor' : 'student'
        }
      });

      if (authError) throw new Error(authError.message);
      return { success: true };
    }

    const studentPayload = {
      nume_complet: profileUpdates.full_name,
      full_name: profileUpdates.full_name,
      an_studiu: profileUpdates.year ? parseInt(profileUpdates.year, 10) : null,
      study_year: profileUpdates.year ? parseInt(profileUpdates.year, 10) : null,
      specializare: profileUpdates.specialization,
      specialization: profileUpdates.specialization
    };

    const studentUpdate = await attemptUpdate(TABLES.STUDENTS, studentPayload, [
      { column: 'user_id', value: userId },
      { column: 'email', value: normalizedEmail }
    ]);

    const userUpdate = await attemptUpdate(TABLES.USERS, {
      nume_complet: profileUpdates.full_name,
      an_studiu: profileUpdates.year ? parseInt(profileUpdates.year, 10) : null,
      specializare: profileUpdates.specialization
    }, [
      { column: 'user_id', value: userId },
      { column: 'email', value: normalizedEmail }
    ]);

    if (studentUpdate.error && userUpdate.error) {
      throw new Error(userUpdate.error.message || studentUpdate.error.message);
    }

    const { error: authError } = await client.auth.updateUser({
      data: {
        ...user.user_metadata,
        full_name: profileUpdates.full_name || user.user_metadata?.full_name,
        year: profileUpdates.year || user.user_metadata?.year,
        specialization: profileUpdates.specialization || user.user_metadata?.specialization
      }
    });

    if (authError) throw new Error(authError.message);

    return { success: true };
  } catch (error) {
    console.error('Error updating user profile data:', error.message);
    return { success: false, error: error.message };
  }
}

// ========================================
// DATABASE OPERATIONS - Întrebări, Postări, Comentarii
// ========================================

/**
 * Save Question to Database
 */
async function saveQuestion(title, description) {
  try {
    const client = await initSupabaseClient();
    const user = getCurrentUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await client
      .from(TABLES.QUESTIONS)
      .insert([{
        user_id: user.id,
        title: title,
        description: description,
        upvotes: 0
      }])
      .select();

    if (error) throw new Error(error.message);
    
    console.log('Question saved to database:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error saving question:', error.message);
    throw error;
  }
}

/**
 * Save Post to Database (Subreddit)
 */
async function savePost(title, content) {
  try {
    const client = await initSupabaseClient();
    const user = await getAuthenticatedUser(false);
    const userId = isValidUuid(user?.id) ? user.id : null;
    const pollStatus = {
      attempted: false,
      saved: false,
      warning: ''
    };
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Prefer tabla legacy `posts` pentru compatibilitate cu FK-ul uzual din `comments.post_id`.
    const primaryInsert = await client
      .from(TABLES.POSTS_LEGACY)
      .insert([{
        user_id: userId,
        title,
        content,
        votes: 0
      }])
      .select();

    let data = primaryInsert.data;
        pollStatus.attempted = true;
    let error = primaryInsert.error;

    // Fallback pentru schema noua
    if (error) {
      const fallbackInsert = await client
        .from(TABLES.FORUM_POSTS)
        .insert([{
          user_id: userId,
          title,
          content,
          votes: 0
        }])
        .select();
      data = fallbackInsert.data;
      error = fallbackInsert.error;
    }

    if (error) throw new Error(error.message);

    const pollMatch = String(content || '').match(/\[SONDAJ\]([\s\S]*?)\[\/SONDAJ\]/i);
    if (pollMatch && data?.[0]?.id) {
      const pollLines = pollMatch[1]
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      let questionText = String(title || '').trim();
      let allowMultipleAnswers = false;
      const options = [];

      pollLines.forEach((line, index) => {
        const lower = line.toLowerCase();
        const value = line.includes(':') ? line.split(':').slice(1).join(':').trim() : line.trim();

        if ((lower.startsWith('întrebare:') || lower.startsWith('intrebare:')) && value) {
          questionText = value;
          return;
        }

        if (lower.startsWith('mod:') || lower.startsWith('tip:')) {
          allowMultipleAnswers = /multi/i.test(value);
          return;
        }

        if (line.startsWith('-')) {
          options.push(line.replace(/^-\s*/, '').trim());
          return;
        }

        if (index === 0 && !questionText) {
          questionText = line;
        }
      });

      if (options.length >= 2) {
        const pollInsert = await client
          .from('polls')
          .insert([{
            post_id: data[0].id,
            author_id: userId,
            question: questionText || title,
            allow_multiple_answers: allowMultipleAnswers
          }])
          .select()
          .single();

        if (!pollInsert.error && pollInsert.data?.id) {
          const pollId = pollInsert.data.id;
          const pollOptions = options.map((option, index) => ({
            poll_id: pollId,
            option_text: option,
            position: index
          }));

          const pollOptionsInsert = await client.from('poll_options').insert(pollOptions);
          if (pollOptionsInsert.error) {
            console.warn('Poll options could not be saved:', pollOptionsInsert.error.message);
            pollStatus.warning = 'Postarea s-a salvat, dar sondajul nu a putut fi sincronizat complet.';
            try {
              await client.from('polls').delete().eq('id', pollId);
            } catch (rollbackError) {
              console.warn('Poll rollback failed:', rollbackError?.message || rollbackError);
            }
          } else {
            pollStatus.saved = true;
          }
        } else if (pollInsert.error) {
          console.warn('Poll could not be saved:', pollInsert.error.message);
          pollStatus.warning = 'Postarea s-a salvat, dar sondajul nu a putut fi creat în baza de date.';
        }
      } else {
        pollStatus.warning = 'Postarea s-a salvat, dar sondajul are nevoie de minimum 2 opțiuni valide.';
      }
    }
    
    console.log('Post saved to database:', data);
    return { success: true, data, poll: pollStatus };
  } catch (error) {
    console.error('Error saving post:', error.message);
    throw error;
  }
}

/**
 * Save Comment to Database
 */
async function saveComment(postId, name, email, content) {
  try {
    const client = await initSupabaseClient();
    const user = await getAuthenticatedUser(false);
    const userId = isValidUuid(user?.id) ? user.id : null;

    const numericPostId = Number(postId);
    const postIdCandidates = [
      postId,
      Number.isFinite(numericPostId) ? numericPostId : null
    ].filter((value, index, array) => value !== null && array.indexOf(value) === index);

    const attempts = [];
    postIdCandidates.forEach((candidate) => {
      attempts.push({
        table: TABLES.COMMENTS,
        payload: {
          post_id: candidate,
          user_id: userId,
          name,
          email,
          content
        }
      });
      attempts.push({
        table: TABLES.COMMENTS,
        payload: {
          id_post: candidate,
          user_id: userId,
          nume: name,
          email,
          comentariu: content,
          content
        }
      });
      attempts.push({
        table: TABLES.COMMENTS_LEGACY,
        payload: {
          post_id: candidate,
          user_id: userId,
          name,
          email,
          content
        }
      });
      attempts.push({
        table: TABLES.COMMENTS_LEGACY,
        payload: {
          id_post: candidate,
          user_id: userId,
          nume: name,
          email,
          comentariu: content,
          content
        }
      });
    });

    let data = null;
    let lastError = null;
    for (const attempt of attempts) {
      const result = await client
        .from(attempt.table)
        .insert([attempt.payload])
        .select();

      if (!result.error) {
        data = result.data;
        lastError = null;
        break;
      }
      lastError = result.error;
    }

    if (lastError) throw new Error(lastError.message);
    
    console.log('Comment saved to database:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error saving comment:', error.message);
    throw error;
  }
}

async function saveSupportContactMessage(payload = {}) {
  try {
    const client = await initSupabaseClient();
    const authUser = await getAuthenticatedUser(false);

    const name = String(payload.name || '').trim();
    const email = String(payload.email || authUser?.email || '').trim().toLowerCase();
    const subject = String(payload.subject || 'contact').trim();
    const message = String(payload.message || '').trim();

    if (!name || !email || !subject || !message) {
      throw new Error('Date de contact incomplete.');
    }

    const fallbackDetails = `CONTACT\nNume: ${name}\nEmail: ${email}\nSubiect: ${subject}\nMesaj: ${message}`;

    const attempts = [
      {
        table: 'raportari',
        payload: {
          user_id: authUser?.id || null,
          email,
          type: 'contact',
          title: `Mesaj contact: ${subject}`,
          page: 'contact.html',
          severity: 'low',
          description: fallbackDetails,
          status: 'nou'
        }
      },
      {
        table: 'raportari',
        payload: {
          user_id: authUser?.id || null,
          email,
          tip: 'contact',
          titlu: `Mesaj contact: ${subject}`,
          pagina: 'contact.html',
          severitate: 'low',
          descriere: fallbackDetails,
          status: 'nou'
        }
      },
      {
        table: 'raportari',
        payload: {
          user_id: authUser?.id || null,
          email,
          tip: 'contact',
          titlu: `Mesaj contact: ${subject}`,
          descriere: fallbackDetails,
          status: 'nou'
        }
      },
      {
        table: 'raportari',
        payload: {
          email,
          type: 'contact',
          title: `Mesaj contact: ${subject}`,
          page: 'contact.html',
          severity: 'low',
          description: fallbackDetails,
          status: 'nou'
        }
      },
      {
        table: 'raportari',
        payload: {
          email,
          tip: 'contact',
          titlu: `Mesaj contact: ${subject}`,
          pagina: 'contact.html',
          severitate: 'low',
          descriere: fallbackDetails,
          status: 'nou'
        }
      },
      {
        table: 'notificari',
        payload: {
          type: 'contact',
          tip: 'contact',
          title: `Mesaj contact: ${subject}`,
          titlu: `Mesaj contact: ${subject}`,
          message: fallbackDetails,
          descriere: fallbackDetails,
          email,
          status: 'nou'
        }
      },
      {
        table: 'notificari',
        payload: {
          user_id: authUser?.id || null,
          type: 'contact',
          tip: 'contact',
          title: `Mesaj contact: ${subject}`,
          titlu: `Mesaj contact: ${subject}`,
          message: fallbackDetails,
          descriere: fallbackDetails,
          email,
          status: 'nou'
        }
      }
    ];

    let lastError = null;
    for (const attempt of attempts) {
      const result = await client
        .from(attempt.table)
        .insert([attempt.payload])
        .select();

      if (!result.error) {
        return { success: true, data: result.data || [] };
      }
      lastError = result.error;
    }

    throw new Error(lastError?.message || 'Nu s-a putut salva mesajul de contact.');
  } catch (error) {
    console.error('Error saving contact message:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

async function saveBugReport(payload = {}) {
  try {
    const client = await initSupabaseClient();
    const authUser = await getAuthenticatedUser(false);

    const bugType = String(payload.type || '').trim();
    const affectedPage = String(payload.page || '').trim();
    const severity = String(payload.severity || '').trim();
    const description = String(payload.description || '').trim();
    const steps = String(payload.steps || '').trim();
    const expected = String(payload.expected || '').trim();
    const actual = String(payload.actual || '').trim();
    const browser = String(payload.browser || '').trim();
    const device = String(payload.device || '').trim();
    const reporterEmail = String(payload.email || authUser?.email || '').trim().toLowerCase();

    if (!bugType || !affectedPage || !severity || !description) {
      throw new Error('Datele raportului sunt incomplete.');
    }

    const mergedDescription = [
      `Tip: ${bugType}`,
      `Pagina: ${affectedPage}`,
      `Severitate: ${severity}`,
      `Descriere: ${description}`,
      steps ? `Pași: ${steps}` : '',
      expected ? `Așteptat: ${expected}` : '',
      actual ? `Actual: ${actual}` : '',
      browser ? `Browser: ${browser}` : '',
      device ? `Device: ${device}` : ''
    ].filter(Boolean).join('\n');

    const attempts = [
      {
        table: 'raportari',
        payload: {
          user_id: authUser?.id || null,
          email: reporterEmail || null,
          type: bugType,
          title: `Raport ${severity.toUpperCase()}: ${affectedPage}`,
          page: affectedPage,
          severity,
          description: mergedDescription,
          status: 'nou'
        }
      },
      {
        table: 'raportari',
        payload: {
          user_id: authUser?.id || null,
          email: reporterEmail || null,
          tip: bugType,
          titlu: `Raport ${severity.toUpperCase()}: ${affectedPage}`,
          pagina: affectedPage,
          severitate: severity,
          descriere: mergedDescription,
          status: 'nou'
        }
      },
      {
        table: 'raportari',
        payload: {
          user_id: authUser?.id || null,
          email: reporterEmail || null,
          tip: bugType,
          titlu: `Raport ${severity.toUpperCase()}: ${affectedPage}`,
          descriere: mergedDescription,
          status: 'nou'
        }
      },
      {
        table: 'notificari',
        payload: {
          user_id: authUser?.id || null,
          type: 'bug_report',
          tip: 'bug_report',
          title: `Raport ${severity.toUpperCase()}: ${affectedPage}`,
          titlu: `Raport ${severity.toUpperCase()}: ${affectedPage}`,
          message: mergedDescription,
          descriere: mergedDescription,
          email: reporterEmail || null,
          status: 'nou'
        }
      },
      {
        table: 'raportari',
        payload: {
          email: reporterEmail || null,
          type: bugType,
          title: `Raport ${severity.toUpperCase()}: ${affectedPage}`,
          page: affectedPage,
          severity,
          description: mergedDescription,
          status: 'nou'
        }
      },
      {
        table: 'raportari',
        payload: {
          email: reporterEmail || null,
          tip: bugType,
          titlu: `Raport ${severity.toUpperCase()}: ${affectedPage}`,
          pagina: affectedPage,
          severitate: severity,
          descriere: mergedDescription,
          status: 'nou'
        }
      },
      {
        table: 'notificari',
        payload: {
          type: 'bug_report',
          tip: 'bug_report',
          title: `Raport ${severity.toUpperCase()}: ${affectedPage}`,
          titlu: `Raport ${severity.toUpperCase()}: ${affectedPage}`,
          message: mergedDescription,
          descriere: mergedDescription,
          email: reporterEmail || null,
          status: 'nou'
        }
      }
    ];

    let lastError = null;
    for (const attempt of attempts) {
      const result = await client
        .from(attempt.table)
        .insert([attempt.payload])
        .select();

      if (!result.error) {
        return { success: true, data: result.data || [] };
      }
      lastError = result.error;
    }

    throw new Error(lastError?.message || 'Nu s-a putut salva raportul.');
  } catch (error) {
    console.error('Error saving bug report:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

async function saveUserSettings(settings = {}) {
  try {
    const client = await initSupabaseClient();
    const current = await getAuthenticatedUser(false);

    if (!current?.id) {
      throw new Error('Trebuie să fii autentificat pentru a salva setările.');
    }

    const existingMetadata = current.user_metadata || {};
    const mergedSettings = {
      ...(existingMetadata.app_settings || {}),
      ...settings
    };

    const { data, error } = await client.auth.updateUser({
      data: {
        ...existingMetadata,
        app_settings: mergedSettings
      }
    });

    if (error) throw new Error(error.message);
    return { success: true, data: data?.user?.user_metadata?.app_settings || mergedSettings };
  } catch (error) {
    console.error('Error saving user settings:', error.message);
    return { success: false, data: {}, error: error.message };
  }
}

async function loadUserSettings() {
  try {
    const user = await getAuthenticatedUser(false);
    if (!user?.id) {
      return { success: true, data: {} };
    }

    return {
      success: true,
      data: user.user_metadata?.app_settings || {}
    };
  } catch (error) {
    console.error('Error loading user settings:', error.message);
    return { success: false, data: {}, error: error.message };
  }
}

/**
 * Get All Questions from Database
 */
async function getQuestions() {
  try {
    const client = await initSupabaseClient();
    const { data, error } = await client
      .from(TABLES.QUESTIONS)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    
    console.log('Questions fetched from database:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching questions:', error.message);
    return { success: false, data: [] };
  }
}

/**
 * Get All Posts from Database
 */
async function getPosts() {
  try {
    const client = await initSupabaseClient();
    const primarySelect = await client
      .from(TABLES.POSTS_LEGACY)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(60);

    let data = primarySelect.data;
    let error = primarySelect.error;

    if (error) {
      const fallbackSelect = await client
        .from(TABLES.FORUM_POSTS)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(60);
      data = fallbackSelect.data;
      error = fallbackSelect.error;
    }

    if (error) throw new Error(error.message);
    
    console.log('Posts fetched from database:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching posts:', error.message);
    return { success: false, data: [] };
  }
}

/**
 * Get a single post by id
 */
async function getPostById(postId) {
  try {
    const client = await initSupabaseClient();

    const primarySelect = await client
      .from(TABLES.POSTS_LEGACY)
      .select('*')
      .eq('id', postId)
      .limit(1)
      .maybeSingle();

    let data = primarySelect.data;
    let error = primarySelect.error;

    if (error || !data) {
      const fallbackSelect = await client
        .from(TABLES.FORUM_POSTS)
        .select('*')
        .eq('id', postId)
        .limit(1)
        .maybeSingle();
      data = fallbackSelect.data;
      error = fallbackSelect.error;
    }

    if (error) throw new Error(error.message);

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching single post:', error.message);
    return { success: false, data: null };
  }
}

/**
 * Get Comments for a Post
 */
async function getComments(postId) {
  try {
    const client = await initSupabaseClient();

    const numericPostId = Number(postId);
    const postIdCandidates = [
      postId,
      Number.isFinite(numericPostId) ? numericPostId : null
    ].filter((value, index, array) => value !== null && array.indexOf(value) === index);

    const attempts = [];
    postIdCandidates.forEach((candidate) => {
      attempts.push({ table: TABLES.COMMENTS, column: 'post_id', value: candidate });
      attempts.push({ table: TABLES.COMMENTS, column: 'id_post', value: candidate });
      attempts.push({ table: TABLES.COMMENTS_LEGACY, column: 'post_id', value: candidate });
      attempts.push({ table: TABLES.COMMENTS_LEGACY, column: 'id_post', value: candidate });
    });

    let data = [];
    let lastError = null;

    for (const attempt of attempts) {
      const result = await client
        .from(attempt.table)
        .select('*')
        .eq(attempt.column, attempt.value)
        .order('created_at', { ascending: true });

      if (!result.error) {
        data = Array.isArray(result.data) ? result.data : [];
        if (data.length > 0) {
          lastError = null;
          break;
        }
        lastError = null;
        continue;
      }

      lastError = result.error;
    }

    if (lastError) throw new Error(lastError.message);
    
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching comments:', error.message);
    return { success: false, data: [] };
  }
}

async function getAllComments() {
  try {
    const client = await initSupabaseClient();
    const attempts = [
      { table: TABLES.COMMENTS },
      { table: TABLES.COMMENTS_LEGACY }
    ];

    let lastError = null;
    for (const attempt of attempts) {
      const result = await client
        .from(attempt.table)
        .select('id,name,email,user_id,content,comentariu,created_at,post_id,id_post')
        .order('created_at', { ascending: false });

      if (!result.error) {
        const rows = Array.isArray(result.data) ? result.data : [];
        return {
          success: true,
          data: rows.map((row) => ({
            ...row,
            content: row.content || row.comentariu || ''
          }))
        };
      }

      lastError = result.error;
    }

    throw new Error(lastError?.message || 'Nu s-au putut încărca comentariile.');
  } catch (error) {
    console.error('Error fetching all comments:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Get all professors from database
 */
async function getProfessors() {
  try {
    const client = await initSupabaseClient();

    const primarySelect = await client
      .from(TABLES.PROFESSORS)
      .select('*, recenzii_profesori(rating)')
      .order('nume_complet', { ascending: true });

    let rawRows = primarySelect.data;
    let error = primarySelect.error;

    if (error) {
      const simplePrimarySelect = await client
        .from(TABLES.PROFESSORS)
        .select('*')
        .order('nume_complet', { ascending: true });

      if (!simplePrimarySelect.error) {
        rawRows = simplePrimarySelect.data;
        error = null;
      }
    }

    if (error || !rawRows?.length) {
      const fallbackSelect = await client
        .from(TABLES.PROFESSORS_LEGACY)
        .select('*')
        .order('full_name', { ascending: true });
      if (!fallbackSelect.error && fallbackSelect.data?.length) {
        rawRows = fallbackSelect.data;
        error = null;
      } else if (error) {
        rawRows = fallbackSelect.data;
        error = fallbackSelect.error;
      }
    }

    if (error) throw new Error(error.message);

    const data = (rawRows || []).map((row) => ({
      ...row,
      full_name: row.full_name || row.nume_complet || 'Profesor',
      institutional_email: row.institutional_email || row.email || '',
      specialization: row.specialization || row.specializare || '-',
      department: row.department || row.departament || '',
      academic_title: row.academic_title || row.titlu_academic || 'Prof.',
      recenzii_profesori: Array.isArray(row.recenzii_profesori) ? row.recenzii_profesori : []
    }));

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching professors:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Upsert professors list into database
 */
async function upsertProfessors(professors) {
  try {
    const client = await initSupabaseClient();
    const user = getCurrentUser();

    if (!user?.id) {
      throw new Error('Trebuie să fii autentificat ca să imporți profesori');
    }

    const payload = (professors || []).map((row) => ({
      user_id: row.user_id || null,
      titlu_academic: row.academic_title,
      academic_title: row.academic_title,
      nume_complet: row.full_name,
      full_name: row.full_name,
      email: row.institutional_email || row.email,
      institutional_email: row.institutional_email || row.email,
      specializare: row.specialization,
      specialization: row.specialization,
      departament: row.department || 'Departamentul de Calculatoare și Inginerie Electrică',
      department: row.department || 'Departamentul de Calculatoare și Inginerie Electrică',
      rating: row.rating || 4.6,
      reviews_count: row.reviews_count || 0,
      courses_count: row.courses_count || 0
    }));

    const primaryUpsert = await client
      .from(TABLES.PROFESSORS)
      .upsert(payload, { onConflict: 'email' })
      .select();

    let data = primaryUpsert.data;
    let error = primaryUpsert.error;

    if (error) {
      const fallbackPayload = payload.map((row) => ({
        academic_title: row.academic_title,
        full_name: row.full_name,
        institutional_email: row.institutional_email,
        specialization: row.specialization,
        department: row.department,
        rating: row.rating,
        reviews_count: row.reviews_count,
        courses_count: row.courses_count
      }));

      const fallbackUpsert = await client
        .from(TABLES.PROFESSORS_LEGACY)
        .upsert(fallbackPayload, { onConflict: 'institutional_email' })
        .select();
      data = fallbackUpsert.data;
      error = fallbackUpsert.error;
    }

    if (error) throw new Error(error.message);
    return { success: true, data };
  } catch (error) {
    console.error('Error upserting professors:', error.message);
    return { success: false, data: [], error: error.message };
  }
}


/**
 * Update Post Votes (Upvote/Downvote)
 * Saves the vote change to the database
 */
async function updatePostVotes(postId, voteDirection) {
  try {
    const client = await initSupabaseClient();
    const user = await getAuthenticatedUser(false);

    const normalizeDirection = voteDirection === 'down' ? 'down' : 'up';

    const applyVoteModel = async (tableName) => {
      const { data: currentPost, error: fetchError } = await client
        .from(tableName)
        .select('id,votes')
        .eq('id', postId)
        .limit(1)
        .maybeSingle();

      if (fetchError || !currentPost) {
        return { error: fetchError || new Error('Post not found') };
      }

      if (!user?.id) {
        const newVotes = Number(currentPost.votes || 0) + (normalizeDirection === 'up' ? 1 : -1);
        const { data, error } = await client
          .from(tableName)
          .update({ votes: newVotes })
          .eq('id', postId)
          .select();

        return { data: data?.[0], error, newVotes, userVote: normalizeDirection };
      }

      const existingVote = await client
        .from(TABLES.VOTES)
        .select('id,vote_type')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .limit(1)
        .maybeSingle();

      if (existingVote.error && existingVote.error.code !== 'PGRST116') {
        return { error: existingVote.error };
      }

      let delta = 0;
      let nextUserVote = normalizeDirection;
      if (existingVote.data?.id) {
        if (existingVote.data.vote_type === normalizeDirection) {
          const deleteResult = await client
            .from(TABLES.VOTES)
            .delete()
            .eq('id', existingVote.data.id);

          if (deleteResult.error) return { error: deleteResult.error };
          delta = normalizeDirection === 'up' ? -1 : 1;
          nextUserVote = null;
        } else {
          const updateResult = await client
            .from(TABLES.VOTES)
            .update({ vote_type: normalizeDirection, updated_at: new Date().toISOString() })
            .eq('id', existingVote.data.id);

          if (updateResult.error) return { error: updateResult.error };
          delta = normalizeDirection === 'up' ? 2 : -2;
        }
      } else {
        const insertResult = await client
          .from(TABLES.VOTES)
          .insert([{ user_id: user.id, post_id: postId, vote_type: normalizeDirection }]);

        if (insertResult.error) return { error: insertResult.error };
        delta = normalizeDirection === 'up' ? 1 : -1;
      }

      const newVotes = Number(currentPost.votes || 0) + delta;
      const { data, error } = await client
        .from(tableName)
        .update({ votes: newVotes })
        .eq('id', postId)
        .select();

      return { data: data?.[0], error, newVotes, userVote: nextUserVote };
    };
    
    const tryUpdate = async (tableName) => {
      const { data: currentPost, error: fetchError } = await client
        .from(tableName)
        .select('votes')
        .eq('id', postId)
        .limit(1)
        .maybeSingle();

      if (fetchError || !currentPost) {
        return { error: fetchError || new Error('Post not found') };
      }

      const newVotes = Number(currentPost.votes || 0) + (voteDirection === 'up' ? 1 : -1);
      const { data, error } = await client
        .from(tableName)
        .update({ votes: newVotes })
        .eq('id', postId)
        .select();

      return { data: data?.[0], error, newVotes, userVote: normalizeDirection };
    };

    // Prefer per-user voting model; fallback to legacy increment if voturi table is unavailable.
    let result = await applyVoteModel(TABLES.FORUM_POSTS);
    if (result.error) {
      const couldUseLegacyFallback = String(result.error.message || '').toLowerCase().includes('voturi')
        || String(result.error.message || '').toLowerCase().includes('does not exist')
        || String(result.error.code || '').toLowerCase() === '42p01';

      if (couldUseLegacyFallback) {
        result = await tryUpdate(TABLES.FORUM_POSTS);
      }
    }

    if (result.error) {
      result = await applyVoteModel(TABLES.POSTS_LEGACY);
      if (result.error) {
        const couldUseLegacyFallback = String(result.error.message || '').toLowerCase().includes('voturi')
          || String(result.error.message || '').toLowerCase().includes('does not exist')
          || String(result.error.code || '').toLowerCase() === '42p01';

        if (couldUseLegacyFallback) {
          result = await tryUpdate(TABLES.POSTS_LEGACY);
        }
      }
    }

    if (result.error) throw new Error(result.error.message || 'Nu s-a putut actualiza votul');
    
    return { success: true, data: result.data, newVotes: result.newVotes, userVote: result.userVote ?? null };
  } catch (error) {
    console.error('Error updating post votes:', error.message);
    return { success: false, error: error.message };
  }
}

async function getCurrentUserPostVotes(postIds = []) {
  try {
    const normalizedIds = Array.from(new Set((postIds || []).map((id) => String(id)).filter(Boolean)));
    if (normalizedIds.length === 0) {
      return { success: true, data: {} };
    }

    const user = await getAuthenticatedUser(false);
    if (!user?.id) {
      return { success: true, data: {} };
    }

    const client = await initSupabaseClient();
    const { data, error } = await client
      .from(TABLES.VOTES)
      .select('post_id,vote_type')
      .eq('user_id', user.id)
      .in('post_id', normalizedIds);

    if (error) {
      const message = String(error.message || '').toLowerCase();
      if (message.includes('voturi') || message.includes('does not exist') || String(error.code || '').toLowerCase() === '42p01') {
        return { success: true, data: {} };
      }
      throw new Error(error.message);
    }

    const map = {};
    (data || []).forEach((row) => {
      if (row?.post_id) {
        map[String(row.post_id)] = row.vote_type === 'down' ? 'down' : 'up';
      }
    });

    return { success: true, data: map };
  } catch (error) {
    console.warn('Could not load user post votes:', error.message);
    return { success: false, data: {}, error: error.message };
  }
}

async function getCurrentUserQuestionVotes(questionIds = []) {
  try {
    const normalizedIds = Array.from(new Set((questionIds || []).map((id) => String(id)).filter(Boolean)));
    if (normalizedIds.length === 0) {
      return { success: true, data: {} };
    }

    const user = await getAuthenticatedUser(false);
    if (!user?.id) {
      return { success: true, data: {} };
    }

    const client = await initSupabaseClient();
    const { data, error } = await client
      .from(TABLES.VOTES)
      .select('question_id,vote_type')
      .eq('user_id', user.id)
      .in('question_id', normalizedIds);

    if (error) {
      const message = String(error.message || '').toLowerCase();
      if (message.includes('voturi') || message.includes('does not exist') || String(error.code || '').toLowerCase() === '42p01') {
        return { success: true, data: {} };
      }
      throw new Error(error.message);
    }

    const map = {};
    (data || []).forEach((row) => {
      if (row?.question_id) {
        map[String(row.question_id)] = row.vote_type === 'down' ? 'down' : 'up';
      }
    });

    return { success: true, data: map };
  } catch (error) {
    console.warn('Could not load user question votes:', error.message);
    return { success: false, data: {}, error: error.message };
  }
}

/**
 * Update Question Votes (Upvote/Downvote)
 * Saves the vote change to the database
 */
async function updateQuestionVotes(questionId, voteDirection) {
  try {
    const client = await initSupabaseClient();
    const user = await getAuthenticatedUser(false);
    const normalizeDirection = voteDirection === 'down' ? 'down' : 'up';
    
    // Fetch current votes
    const { data: currentQuestion, error: fetchError } = await client
      .from(TABLES.QUESTIONS)
      .select('upvotes')
      .eq('id', questionId)
      .limit(1)
      .maybeSingle();
    
    if (fetchError || !currentQuestion) {
      throw new Error('Could not fetch current question');
    }

    let delta = normalizeDirection === 'up' ? 1 : -1;
    let nextUserVote = normalizeDirection;

    if (user?.id) {
      const existingVote = await client
        .from(TABLES.VOTES)
        .select('id,vote_type')
        .eq('user_id', user.id)
        .eq('question_id', questionId)
        .limit(1)
        .maybeSingle();

      if (existingVote.error && existingVote.error.code !== 'PGRST116') {
        const message = String(existingVote.error.message || '').toLowerCase();
        const isMissingVotesTable = message.includes('voturi')
          || message.includes('does not exist')
          || String(existingVote.error.code || '').toLowerCase() === '42p01';
        if (!isMissingVotesTable) {
          throw new Error(existingVote.error.message);
        }
      }

      if (existingVote.data?.id) {
        if (existingVote.data.vote_type === normalizeDirection) {
          const deleteResult = await client
            .from(TABLES.VOTES)
            .delete()
            .eq('id', existingVote.data.id);
          if (deleteResult.error) throw new Error(deleteResult.error.message);
          delta = normalizeDirection === 'up' ? -1 : 1;
          nextUserVote = null;
        } else {
          const updateResult = await client
            .from(TABLES.VOTES)
            .update({ vote_type: normalizeDirection, updated_at: new Date().toISOString() })
            .eq('id', existingVote.data.id);
          if (updateResult.error) throw new Error(updateResult.error.message);
          delta = normalizeDirection === 'up' ? 2 : -2;
        }
      } else {
        const insertVote = await client
          .from(TABLES.VOTES)
          .insert([{ user_id: user.id, question_id: questionId, vote_type: normalizeDirection }]);
        if (insertVote.error) {
          const message = String(insertVote.error.message || '').toLowerCase();
          const isMissingVotesTable = message.includes('voturi')
            || message.includes('does not exist')
            || String(insertVote.error.code || '').toLowerCase() === '42p01';
          if (!isMissingVotesTable) {
            throw new Error(insertVote.error.message);
          }
        }
      }
    }

    const newVotes = Number(currentQuestion.upvotes || 0) + delta;
    
    // Update the votes in database
    const { data, error } = await client
      .from(TABLES.QUESTIONS)
      .update({ upvotes: newVotes })
      .eq('id', questionId)
      .select();
    
    if (error) throw new Error(error.message);
    
    return { success: true, data: data?.[0], newVotes, userVote: nextUserVote };
  } catch (error) {
    console.error('Error updating question votes:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Documente (tabel: documente)
 */
async function getDocuments() {
  try {
    const client = await initSupabaseClient();
    const attempts = [
      () => client.from(TABLES.DOCUMENTS).select('*').order('created_at', { ascending: false }),
      () => client.from(TABLES.DOCUMENTS).select('*').order('id', { ascending: false }),
      () => client.from(TABLES.DOCUMENTS).select('*')
    ];

    let lastError = null;
    for (const run of attempts) {
      const result = await run();
      if (!result.error) {
        return { success: true, data: result.data || [] };
      }
      lastError = result.error;
    }

    throw new Error(lastError?.message || 'Nu s-au putut încărca documentele.');
  } catch (error) {
    console.error('Error fetching documente:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

function normalizeProfessorSubjectList(value) {
  const raw = String(value || '').trim();
  if (!raw) return [];

  return raw
    .split(/[,;/|\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function getCurrentProfessorContext() {
  const user = await getAuthenticatedUser(false);
  if (!user?.id) {
    return { success: false, user: null, professor: null };
  }

  const client = await initSupabaseClient();
  const email = String(user.email || '').trim().toLowerCase();

  const professorAttempts = [
    () => client.from(TABLES.PROFESSORS).select('*').eq('user_id', user.id).limit(1).maybeSingle(),
    () => client.from(TABLES.PROFESSORS).select('*').eq('email', email).limit(1).maybeSingle(),
    () => client.from(TABLES.PROFESSORS).select('*').eq('institutional_email', email).limit(1).maybeSingle(),
    () => client.from(TABLES.PROFESSORS_LEGACY).select('*').eq('user_id', user.id).limit(1).maybeSingle(),
    () => client.from(TABLES.PROFESSORS_LEGACY).select('*').eq('email', email).limit(1).maybeSingle(),
    () => client.from(TABLES.PROFESSORS_LEGACY).select('*').eq('institutional_email', email).limit(1).maybeSingle()
  ];

  let professor = null;
  for (const run of professorAttempts) {
    const result = await run();
    if (result?.data) {
      professor = result.data;
      break;
    }
  }

  return { success: true, user, professor };
}

async function getProfessorDocuments(professorId, professorEmail = '') {
  try {
    const client = await initSupabaseClient();
    const normalizedProfessorId = String(professorId || '').trim();
    const normalizedEmail = String(professorEmail || '').trim().toLowerCase();

    const baseQuery = () => client.from(TABLES.DOCUMENTS).select('*');
    const attempts = normalizedProfessorId ? [
      { run: () => baseQuery().eq('profesor_id', normalizedProfessorId), acceptEmpty: false },
      { run: () => baseQuery().eq('professor_id', normalizedProfessorId), acceptEmpty: false },
      { run: () => baseQuery().eq('user_id', normalizedProfessorId), acceptEmpty: false },
      { run: () => baseQuery().eq('created_by', normalizedProfessorId), acceptEmpty: false }
    ] : [];

    if (normalizedEmail) {
      attempts.push(
        { run: () => baseQuery().eq('email', normalizedEmail), acceptEmpty: false },
        { run: () => baseQuery().eq('author_email', normalizedEmail), acceptEmpty: false },
        { run: () => baseQuery().eq('uploaded_by_email', normalizedEmail), acceptEmpty: false }
      );
    }

    attempts.push(
      { run: () => baseQuery().order('created_at', { ascending: false }), acceptEmpty: true },
      { run: () => baseQuery().order('id', { ascending: false }), acceptEmpty: true },
      { run: () => baseQuery(), acceptEmpty: true }
    );

    let lastError = null;
    for (const attempt of attempts) {
      const result = await attempt.run();
      if (!result.error) {
        const rows = Array.isArray(result.data) ? result.data : [];
        if (rows.length > 0 || attempt.acceptEmpty) {
          return { success: true, data: rows };
        }
        continue;
      }
      lastError = result.error;
    }

    throw new Error(lastError?.message || 'Nu s-au putut încărca documentele profesorului.');
  } catch (error) {
    console.error('Error fetching professor documents:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

function buildProfessorDocumentPayloadVariants(baseData = {}) {
  const title = String(baseData.title || baseData.titlu || '').trim();
  const description = String(baseData.description || baseData.descriere || '').trim();
  const subject = String(baseData.subject || baseData.materie || '').trim();
  const type = String(baseData.type || baseData.tip_document || 'curs').trim();
  const fileUrl = String(baseData.file_url || baseData.url_fisier || baseData.url || '').trim();
  const professorName = String(baseData.professor_name || baseData.nume_profesor || '').trim();
  const professorEmail = String(baseData.professor_email || baseData.email || '').trim().toLowerCase();
  const professorId = String(baseData.professor_id || baseData.user_id || '').trim();
  const department = String(baseData.department || baseData.departament || '').trim() || 'Departamentul de Calculatoare și Inginerie Electrică';
  const year = String(baseData.year || baseData.an_studiu || '').trim();
  const resolvedFilePath = String(
    baseData.fisier_path
    || baseData.file_path
    || baseData.storage_path
    || baseData.url_fisier
    || baseData.file_url
    || baseData.file_name
    || 'manual/fisier-neprecizat'
  ).trim();

  return [
    {
      user_id: professorId || null,
      profesor_id: professorId || null,
      nume_profesor: professorName || null,
      professor_name: professorName || null,
      email: professorEmail || null,
      author_email: professorEmail || null,
      title,
      titlu: title,
      description,
      descriere: description,
      subject,
      materie: subject,
      type,
      tip_document: type,
      file_url: fileUrl || null,
      url_fisier: fileUrl || null,
      fisier_path: resolvedFilePath,
      file_path: resolvedFilePath,
      department,
      departament: department,
      status: baseData.status || 'activ'
    },
    {
      user_id: professorId || null,
      profesor_id: professorId || null,
      email: professorEmail || null,
      title,
      description,
      subject,
      type,
      file_url: fileUrl || null,
      fisier_path: resolvedFilePath,
      file_path: resolvedFilePath,
      department,
      status: baseData.status || 'activ'
    },
    {
      profesor_id: professorId || null,
      nume_profesor: professorName || null,
      title,
      titlu: title,
      descriere: description,
      materie: subject,
      tip_document: type,
      url_fisier: fileUrl || null,
      fisier_path: resolvedFilePath,
      file_path: resolvedFilePath,
      departament: department,
      status: baseData.status || 'activ'
    },
    {
      user_id: professorId || null,
      profesor_id: professorId || null,
      title,
      description,
      subject,
      type,
      file_url: fileUrl || null,
      fisier_path: resolvedFilePath,
      file_path: resolvedFilePath,
      status: baseData.status || 'activ'
    },
    {
      profesor_id: professorId || null,
      titlu: title,
      descriere: description,
      materie: subject,
      tip_document: type,
      url_fisier: fileUrl || null,
      fisier_path: resolvedFilePath,
      file_path: resolvedFilePath,
      status: baseData.status || 'activ'
    }
  ];
}

function getMissingSchemaColumn(errorMessage = '') {
  const text = String(errorMessage || '');
  const postgrestMatch = text.match(/Could not find the '([^']+)' column/i);
  if (postgrestMatch?.[1]) return postgrestMatch[1];

  const postgresMatch = text.match(/column\s+"([^"]+)"/i);
  if (postgresMatch?.[1]) return postgresMatch[1];

  return '';
}

async function executeDocumentMutationWithSchemaFallback(client, mode, payloadVariants, documentId = null) {
  let lastError = null;

  for (const variant of payloadVariants) {
    const candidate = { ...variant };

    for (let guard = 0; guard < 8; guard += 1) {
      const query = mode === 'insert'
        ? client.from(TABLES.DOCUMENTS).insert([candidate]).select()
        : client.from(TABLES.DOCUMENTS).update(candidate).eq('id', documentId).select();

      const result = await query;
      if (!result.error) {
        return { success: true, data: result.data || [] };
      }

      lastError = result.error;
      const missingColumn = getMissingSchemaColumn(result.error.message || '');
      if (!missingColumn || !(missingColumn in candidate)) {
        break;
      }

      delete candidate[missingColumn];
    }
  }

  return { success: false, data: [], error: lastError?.message || 'Eroare la salvarea documentului.' };
}

async function saveProfessorDocument(documentData = {}) {
  try {
    const client = await initSupabaseClient();
    const context = await getCurrentProfessorContext();

    if (!context.user?.id || !context.professor) {
      throw new Error('Contul conectat nu este asociat unui profesor.');
    }

    const professorName = context.professor.full_name || context.professor.nume_complet || context.user.user_metadata?.full_name || context.user.email || 'Profesor';
    const professorEmail = context.professor.institutional_email || context.professor.email || context.user.email || '';
    const professorId = context.professor.user_id || context.user.id;
    const subjectOptions = normalizeProfessorSubjectList(context.professor.materie || context.professor.materie_predata || context.professor.taught_subject || context.professor.specialization);
    const selectedSubject = String(documentData.subject || documentData.materie || '').trim();

    if (!String(documentData.title || documentData.titlu || '').trim()) {
      throw new Error('Titlul documentului este obligatoriu.');
    }

    if (!subjectOptions.length) {
      throw new Error('Nu există o materie atribuită pentru acest profesor.');
    }

    if (!subjectOptions.some((item) => item.toLowerCase() === selectedSubject.toLowerCase())) {
      throw new Error('Trebuie sa alegi o materie atribuita acestui profesor.');
    }

    const payloadVariants = buildProfessorDocumentPayloadVariants({
      ...documentData,
      professor_id: professorId,
      user_id: professorId,
      professor_name: professorName,
      nume_profesor: professorName,
      professor_email: professorEmail,
      email: professorEmail,
      subject: selectedSubject,
      materie: selectedSubject,
      department: context.professor.department || context.professor.departament,
      departament: context.professor.department || context.professor.departament
    });

    const mutationResult = await executeDocumentMutationWithSchemaFallback(client, 'insert', payloadVariants);
    if (mutationResult.success) {
      return mutationResult;
    }

    throw new Error(mutationResult.error || 'Nu s-a putut salva documentul profesorului.');
  } catch (error) {
    console.error('Error saving professor document:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

async function updateProfessorDocument(documentId, documentData = {}) {
  try {
    const client = await initSupabaseClient();
    const context = await getCurrentProfessorContext();

    if (!context.user?.id || !context.professor) {
      throw new Error('Contul conectat nu este asociat unui profesor.');
    }

    const selectedSubject = String(documentData.subject || documentData.materie || '').trim();
    const professorName = context.professor.full_name || context.professor.nume_complet || context.user.user_metadata?.full_name || context.user.email || 'Profesor';
    const professorEmail = context.professor.institutional_email || context.professor.email || context.user.email || '';

    const payloadVariants = buildProfessorDocumentPayloadVariants({
      ...documentData,
      professor_id: context.professor.user_id || context.user.id,
      user_id: context.professor.user_id || context.user.id,
      professor_name: professorName,
      nume_profesor: professorName,
      professor_email: professorEmail,
      email: professorEmail,
      subject: selectedSubject,
      materie: selectedSubject,
      department: context.professor.department || context.professor.departament,
      departament: context.professor.department || context.professor.departament
    });

    const mutationResult = await executeDocumentMutationWithSchemaFallback(client, 'update', payloadVariants, documentId);
    if (mutationResult.success) {
      return mutationResult;
    }

    throw new Error(mutationResult.error || 'Nu s-a putut actualiza documentul.');
  } catch (error) {
    console.error('Error updating professor document:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

async function deleteProfessorDocument(documentId) {
  try {
    const client = await initSupabaseClient();
    const context = await getCurrentProfessorContext();

    if (!context.user?.id || !context.professor) {
      throw new Error('Contul conectat nu este asociat unui profesor.');
    }

    const result = await client.from(TABLES.DOCUMENTS).delete().eq('id', documentId);
    if (result.error) throw new Error(result.error.message);

    return { success: true };
  } catch (error) {
    console.error('Error deleting professor document:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Recenzii profesori (tabel: recenzii_profesori)
 */
function buildProfessorIdCandidates(rawProfessorId) {
  const asString = String(rawProfessorId ?? '').trim();
  const asNumber = Number(asString);
  const candidates = [asString];

  if (Number.isFinite(asNumber) && asString !== '') {
    candidates.push(asNumber);
  }

  return candidates.filter((value, index, list) => value !== '' && list.indexOf(value) === index);
}

async function getProfessorReviews(professorId) {
  try {
    const client = await initSupabaseClient();
    if (!professorId) {
      const base = await client
        .from(TABLES.PROFESSOR_REVIEWS)
        .select('*')
        .order('created_at', { ascending: false });

      if (base.error) throw new Error(base.error.message);
      return { success: true, data: base.data || [] };
    }

    const idCandidates = buildProfessorIdCandidates(professorId);
    const columnCandidates = ['id_profesor', 'profesor_id', 'professor_id'];

    let lastError = null;
    let bestData = [];

    for (const column of columnCandidates) {
      for (const candidate of idCandidates) {
        const result = await client
          .from(TABLES.PROFESSOR_REVIEWS)
          .select('*')
          .eq(column, candidate)
          .order('created_at', { ascending: false });

        if (!result.error) {
          const rows = Array.isArray(result.data) ? result.data : [];
          if (rows.length > 0) {
            return { success: true, data: rows };
          }
          bestData = rows;
          lastError = null;
          continue;
        }

        lastError = result.error;
      }
    }

    if (lastError) throw new Error(lastError.message);
    return { success: true, data: bestData };
  } catch (error) {
    console.error('Error fetching recenzii_profesori:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

async function saveProfessorReview(professorId, rating, reviewText, reviewContext = {}) {
  try {
    const client = await initSupabaseClient();
    const user = await getAuthenticatedUser(true);

    const normalizedProfessorId = String(professorId || '').trim();
    const normalizedReviewText = String(reviewText || '').trim();
    const normalizedRating = Number(rating);
    const userId = user?.id || null;

    if (!normalizedProfessorId) {
      throw new Error('Profesor invalid pentru recenzie.');
    }

    if (!normalizedReviewText) {
      throw new Error('Comentariul recenziei este obligatoriu.');
    }

    if (!Number.isFinite(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
      throw new Error('Rating invalid.');
    }

    const numericProfessorId = Number(normalizedProfessorId);
    const numericProfessorCandidate = Number.isFinite(numericProfessorId) ? numericProfessorId : null;

    const professorName = String(reviewContext.professorName || '').trim();
    const professorSubject = String(reviewContext.professorSubject || '').trim();
    const professorEmail = String(reviewContext.professorEmail || '').trim().toLowerCase();

    const payloadVariants = [
      {
        id_profesor: numericProfessorCandidate,
        user_id: userId,
        rating: normalizedRating,
        comentariu: normalizedReviewText,
        title: professorName,
        materie: professorSubject,
        email: professorEmail
      },
      {
        id_profesor: normalizedProfessorId,
        user_id: userId,
        rating: normalizedRating,
        review_text: normalizedReviewText,
        title: professorName,
        subject: professorSubject,
        email: professorEmail
      },
      {
        profesor_id: normalizedProfessorId,
        user_id: userId,
        rating: normalizedRating,
        comentariu: normalizedReviewText,
        professor_name: professorName,
        materie: professorSubject,
        email: professorEmail
      },
      {
        professor_id: normalizedProfessorId,
        user_id: userId,
        rating: normalizedRating,
        review_text: normalizedReviewText,
        professor_name: professorName,
        subject: professorSubject,
        email: professorEmail
      }
    ].map((variant) => {
      const cleaned = {};
      Object.entries(variant).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          cleaned[key] = value;
        }
      });
      return cleaned;
    });

    let lastError = null;
    for (const payload of payloadVariants) {
      const result = await client
        .from(TABLES.PROFESSOR_REVIEWS)
        .insert([payload])
        .select();

      if (!result.error) {
        return { success: true, data: result.data || [] };
      }

      lastError = result.error;
    }

    throw new Error(lastError?.message || 'Nu s-a putut salva recenzia.');
  } catch (error) {
    console.error('Error saving recenzie_profesor:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

async function getProfessorReviewHelpfulCount(reviewId) {
  try {
    const client = await initSupabaseClient();
    const normalizedReviewId = String(reviewId || '').trim();

    if (!normalizedReviewId) {
      return { success: false, count: 0 };
    }

    const { count, error } = await client
      .from(TABLES.REVIEW_HELPFUL_VOTES)
      .select('id', { count: 'exact', head: true })
      .eq('review_id', normalizedReviewId);

    if (error) throw new Error(error.message);

    return { success: true, count: count || 0 };
  } catch (error) {
    console.warn('Could not load review helpful count:', error.message);
    return { success: false, count: 0, error: error.message };
  }
}

async function toggleProfessorReviewHelpful(reviewId) {
  try {
    const client = await initSupabaseClient();
    const user = await getAuthenticatedUser(false);
    const normalizedReviewId = String(reviewId || '').trim();

    if (!normalizedReviewId) {
      throw new Error('Review ID invalid');
    }

    if (!user?.id) {
      throw new Error('Trebuie sa fii conectat pentru a trimite feedback util.');
    }

    const existingVote = await client
      .from(TABLES.REVIEW_HELPFUL_VOTES)
      .select('id')
      .eq('review_id', normalizedReviewId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingVote?.data?.id) {
      const { error: deleteError } = await client
        .from(TABLES.REVIEW_HELPFUL_VOTES)
        .delete()
        .eq('id', existingVote.data.id);

      if (deleteError) throw new Error(deleteError.message);
    } else {
      const { error: insertError } = await client
        .from(TABLES.REVIEW_HELPFUL_VOTES)
        .insert([{ review_id: normalizedReviewId, user_id: user.id }]);

      if (insertError) throw new Error(insertError.message);
    }

    const countResult = await getProfessorReviewHelpfulCount(normalizedReviewId);
    return {
      success: true,
      count: countResult.count || 0,
      added: !existingVote?.data?.id
    };
  } catch (error) {
    console.warn('Could not toggle review helpful vote:', error.message);
    return { success: false, count: 0, error: error.message };
  }
}

/**
 * Protect Pages - Redirect to Login if Not Authenticated
 */
async function protectPage() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  // Pages that don't require authentication
  const publicPages = [
    'login.html',
    'register.html',
    'termeni-conditii.html',
    'politica-confidentialitate.html',
    'contact.html',
    'raporteaza-problema.html',
    'index.html',
    'documente.html',
    'subreddit.html',
    'comments.html',
    'discutie.html',
    'profesori.html',
    'professor-profile.html'
  ];
  
  // Protected pages - require authentication
  const protectedPages = [
    'profile.html',
    'settings.html',
    'admin.html',
    'professor-panel.html'
  ];
  
  if (publicPages.includes(currentPage)) {
    return; // No protection needed
  }
  
  if (protectedPages.includes(currentPage)) {
    const { authenticated, user } = await checkAuthStatus();
    
    if (!authenticated) {
      console.log('Page protected. Redirecting to login...');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('role');
      window.location.href = 'login.html?redirect=' + encodeURIComponent(currentPage);
      return;
    }

    // Server-validated role checks for sensitive pages.
    const restrictedPagesByRole = {
      'admin.html': ['admin'],
      'professor-panel.html': ['profesor', 'admin']
    };

    const allowedRoles = restrictedPagesByRole[currentPage];
    if (allowedRoles) {
      const role = await resolveAndCacheUserRole(user || getCurrentUser());
      if (!allowedRoles.includes(role)) {
        console.warn(`⛔ Access denied for ${currentPage}. Required roles: ${allowedRoles.join(', ')}, got: ${role}`);
        window.location.href = 'index.html';
      }
    }
  }
}

/**
 * Update Header with User Info (if logged in)
 * INSTANT display from localStorage, then verify async in background
 */
async function updateHeaderWithUserInfo() {
  try {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;
    
    // Step 1: Check localStorage INSTANTLY (no await)
    const storedUser = localStorage.getItem('currentUser');
    const storedAuth = localStorage.getItem('supabase.auth.token');
    
    let displayUser = null;
    let hasValidStorage = false;
    
    if (storedUser && storedAuth) {
      try {
        displayUser = JSON.parse(storedUser);
        hasValidStorage = true;
      } catch (e) {
        console.warn('Invalid stored user data');
      }
    }
    
    // Step 2: Display user from localStorage INSTANTLY
    if (hasValidStorage && displayUser) {
      const resolvedRole = await resolveAndCacheUserRole(displayUser);
      showUserMenuInHeader(headerActions, displayUser, resolvedRole);
      
      // Step 3: Verify authentication async in background (non-blocking)
      checkAuthStatus().then(({ authenticated, user }) => {
        if (!authenticated) {
          // Session expired, redirect
          localStorage.removeItem('currentUser');
          localStorage.removeItem('supabase.auth.token');
          window.location.href = 'login.html';
        }
      }).catch(err => {
        console.warn('Background auth check failed:', err);
        // Silently fail - user can continue if stored session is still valid
      });
    } else {
      // No stored session - show login buttons
      showLoginButtonsInHeader(headerActions);
      
      // Still verify in background
      checkAuthStatus().then(({ authenticated, user }) => {
        if (authenticated && user) {
          resolveAndCacheUserRole(user).then((resolvedRole) => {
            showUserMenuInHeader(headerActions, user, resolvedRole);
          });
        }
      }).catch(err => {
        console.warn('Auth check failed:', err);
      });
    }
  } catch (error) {
    console.error('Error updating header:', error);
  }
}

/**
 * Display login/signup buttons in header
 */
function showLoginButtonsInHeader(headerActions) {
  // Remove existing menu if any
  const oldMenu = headerActions.querySelector('.user-menu');
  if (oldMenu) oldMenu.remove();
  
  // Remove old buttons
  const oldSignIn = headerActions.querySelector('.btn-signin');
  const oldSignUp = headerActions.querySelector('.btn-signup');
  if (oldSignIn) oldSignIn.remove();
  if (oldSignUp) oldSignUp.remove();
  
  // Add new buttons
  const signIn = document.createElement('button');
  signIn.className = 'btn-signin';
  signIn.textContent = 'Conectare';
  signIn.addEventListener('click', () => window.location.href = 'login.html');
  
  const signUp = document.createElement('button');
  signUp.className = 'btn-signup';
  signUp.textContent = 'Înregistrare';
  signUp.addEventListener('click', () => window.location.href = 'register.html');
  
  headerActions.appendChild(signIn);
  headerActions.appendChild(signUp);
}

/**
 * Display user menu in header with profile info
 */
function showUserMenuInHeader(headerActions, user, resolvedRole = null) {
  // Remove login buttons if any
  const oldSignIn = headerActions.querySelector('.btn-signin');
  const oldSignUp = headerActions.querySelector('.btn-signup');
  if (oldSignIn) oldSignIn.remove();
  if (oldSignUp) oldSignUp.remove();
  
  // Remove old menu if any
  const oldMenu = headerActions.querySelector('.user-menu');
  if (oldMenu) oldMenu.remove();
  
  // Create user profile menu
  const userMenu = document.createElement('div');
  userMenu.className = 'user-menu';
  
  const isMobileScreen = window.innerWidth <= 768;
  
  userMenu.style.cssText = `
    display: flex;
    align-items: center;
    gap: ${isMobileScreen ? '0.45rem' : '0.75rem'};
    background: linear-gradient(135deg, rgba(212, 175, 55, 0.16) 0%, rgba(212, 175, 55, 0.26) 100%);
    border: 1px solid rgba(212, 175, 55, 0.35);
    box-shadow: 0 8px 18px rgba(212, 175, 55, 0.18);
    backdrop-filter: blur(10px);
    padding: ${isMobileScreen ? '0.42rem 0.62rem' : '0.45rem 0.78rem'};
    border-radius: 10px;
    cursor: pointer;
    position: relative;
    font-size: ${isMobileScreen ? '0.76rem' : '0.86rem'};
  `;
  
  const userEmail = user.email || 'Student';
  const userName = user.user_metadata?.full_name || userEmail.split('@')[0];
  const accountIsAdmin = resolvedRole === 'admin' || String(user.user_metadata?.role || '').toLowerCase() === 'admin' || String(userEmail).toLowerCase() === 'admin@ulbstudent.ro';
  const accountIsProfessor = resolvedRole === 'profesor' || resolvedRole === 'professor' || user.user_metadata?.account_type === 'professor';
  const accountType = accountIsAdmin ? 'ADMIN' : (accountIsProfessor ? 'Profesor' : 'Student');
  const roleColor = accountIsAdmin ? 'rgba(212, 175, 55, 1)' : (accountIsProfessor ? '#f97316' : '#0ea5e9');
  
  const showEmail = window.innerWidth > 480; // Hide email on very small screens
  
  userMenu.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.5rem;">
      <i class="fa-solid fa-user-circle" style="font-size: ${isMobileScreen ? '1.05rem' : '1.28rem'}; color: var(--accent);"></i>
      <div style="color: var(--text); display: flex; flex-direction: column;">
        <div style="font-weight: 700; font-size: ${isMobileScreen ? '0.74rem' : '0.82rem'};">${escapeHtml(userName)}</div>
        <div style="font-size: 0.65rem; opacity: 1; color: ${accountIsAdmin ? 'rgba(212, 175, 55, 1)' : (accountIsProfessor ? '#ffd166' : roleColor)}; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;">${accountType}</div>
        ${showEmail ? `<div style="font-size: 0.66rem; opacity: 0.82;">${escapeHtml(userEmail)}</div>` : ''}
      </div>
    </div>
    <i class="fa-solid fa-chevron-down" style="color: var(--text); font-size: 0.66rem;"></i>
  `;
  
  // Create dropdown menu
  const dropdownMenu = document.createElement('div');
  dropdownMenu.className = 'user-dropdown-menu';
  
  // Check if we're on mobile/tablet
  const isMobile = window.innerWidth <= 768;
  
  dropdownMenu.style.cssText = `
    position: absolute;
    top: 100%;
    ${isMobile ? 'left: 50%; transform: translateX(-50%);' : 'right: 0;'}
    background: var(--surface);
    color: var(--text);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: 0 18px 36px rgba(0,0,0,0.22);
    min-width: 200px;
    margin-top: 0.5rem;
    display: none;
    z-index: 9999;
    overflow: hidden;
    max-width: 90vw;
    backdrop-filter: blur(12px);
  `;
  
  const adminMenuItem = accountIsAdmin
    ? `
    <a href="admin.html" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.8rem 1rem; color: inherit; text-decoration: none; transition: background 0.2s;" class="dropdown-item">
      <i class="fa-solid fa-user-shield"></i> Admin Panel
    </a>
    `
    : '';

  const professorMenuItem = accountIsProfessor
    ? `
    <a href="professor-panel.html" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.8rem 1rem; color: inherit; text-decoration: none; transition: background 0.2s;" class="dropdown-item">
      <i class="fa-solid fa-chalkboard-user"></i> Panou profesor
    </a>
    `
    : '';

  dropdownMenu.innerHTML = `
    <a href="profile.html" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.8rem 1rem; color: inherit; text-decoration: none; transition: background 0.2s;" class="dropdown-item">
      <i class="fa-solid fa-user"></i> Profilul Meu
    </a>
    <a href="settings.html" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.8rem 1rem; color: inherit; text-decoration: none; transition: background 0.2s;" class="dropdown-item">
      <i class="fa-solid fa-gear"></i> Setări
    </a>
    ${professorMenuItem}
    ${adminMenuItem}
    <hr style="margin: 0; border: none; border-top: 1px solid var(--border-color);">
    <button id="logoutBtn" style="width: 100%; display: flex; align-items: center; gap: 0.75rem; padding: 0.8rem 1rem; background: transparent; border: none; color: #e63946; font-weight: 600; cursor: pointer; transition: background 0.2s;" class="dropdown-item">
      <i class="fa-solid fa-right-from-bracket"></i> Deconectare
    </button>
  `;
  
  // Toggle dropdown on click
  userMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = dropdownMenu.style.display !== 'none';
    dropdownMenu.style.display = isVisible ? 'none' : 'block';
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    dropdownMenu.style.display = 'none';
  });
  
  // Style dropdown items on hover
  document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.style.background = 'var(--light-gray)';
    });
    item.addEventListener('mouseleave', () => {
      item.style.background = 'transparent';
    });
  });
  
  // Logout button
  const logoutBtn = dropdownMenu.querySelector('#logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await logoutUser();
    });
  }
  
  userMenu.appendChild(dropdownMenu);
  headerActions.appendChild(userMenu);
}

/**
 * Initialize Auth on Page Load
 * Call this function on every page that needs authentication
 */
async function initAuthOnPageLoad(protectPage = true) {
  console.log('Initializing authentication...');
  
  // Initialize Supabase client
  await initSupabaseClient();
  
  // Check authentication
  if (protectPage) {
    await protectPage();
  }
  
  // Update header if user is logged in
  await updateHeaderWithUserInfo();
}

function initializeSearchableDropdowns() {
  if (!document.getElementById('searchable-select-styles')) {
    const styles = document.createElement('style');
    styles.id = 'searchable-select-styles';
    styles.textContent = `
      .searchable-select {
        display: grid;
        gap: 0.4rem;
      }

      .searchable-select .searchable-select-input[hidden] {
        display: none !important;
      }

      .searchable-select.is-open .searchable-select-input {
        display: block;
      }

      .searchable-select-input {
        width: 100%;
        padding: 0.55rem 0.7rem;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background: var(--surface);
        color: var(--text);
        font-size: 0.92rem;
      }

      .searchable-select-input::placeholder {
        color: var(--text-secondary);
      }

      .searchable-select-empty select {
        outline: 2px solid rgba(230, 57, 70, 0.25);
      }
    `;
    document.head.appendChild(styles);
  }

  const selects = Array.from(document.querySelectorAll('select')).filter((select) => {
    if (select.dataset.searchable === 'false') return false;
    if (select.closest('.admin-inline-actions')) return false;
    if (select.dataset.searchEnhanced === 'true') return false;
    return select.dataset.dropdownSearch === 'true';
  });

  selects.forEach((select) => {
    if (select.dataset.searchEnhanced === 'true') return;

    const wrapper = document.createElement('div');
    wrapper.className = 'searchable-select';
    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'searchable-select-input';
    searchInput.placeholder = 'Caută în listă...';
    searchInput.setAttribute('aria-label', 'Caută în dropdown');
    searchInput.hidden = true;
    wrapper.insertBefore(searchInput, select);

    const originalOptions = Array.from(select.options).map((option) => ({
      text: option.textContent || '',
      disabled: option.disabled
    }));

    const applyFilter = () => {
      const query = searchInput.value.trim().toLowerCase();
      let visibleCount = 0;

      Array.from(select.options).forEach((option, index) => {
        const optionData = originalOptions[index];
        if (!optionData) return;

        const matches = !query || optionData.text.toLowerCase().includes(query);
        option.hidden = !matches;
        option.disabled = optionData.disabled;
        if (matches) visibleCount += 1;
      });

      select.classList.toggle('searchable-select-empty', visibleCount === 0);
    };

    const openSearch = () => {
      wrapper.classList.add('is-open');
      searchInput.hidden = false;
    };

    const closeSearch = () => {
      if (document.activeElement === searchInput) return;
      searchInput.hidden = true;
      wrapper.classList.remove('is-open');
    };

    searchInput.addEventListener('input', applyFilter);
    searchInput.addEventListener('focus', applyFilter);
    select.addEventListener('focus', openSearch);
    select.addEventListener('click', openSearch);
    select.addEventListener('blur', () => window.setTimeout(closeSearch, 120));
    searchInput.addEventListener('blur', () => window.setTimeout(closeSearch, 120));
    document.addEventListener('click', (event) => {
      if (!wrapper.contains(event.target)) {
        closeSearch();
      }
    });

    select.dataset.searchEnhanced = 'true';
    applyFilter();
  });
}

// Auto-initialize on page load for non-login/register pages
/**
 * Utility Functions
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text?.replace(/[&<>"']/g, m => map[m]) || '';
}

Object.assign(window, {
  loginWithEmail,
  loginWithGoogle,
  logoutUser,
  checkAuthStatus,
  initializeSession,
  initializeAuthStateListener,
  getCurrentUser,
  getAuthenticatedUser,
  routeByUserRole,
  protectPage,
  updateHeaderWithUserInfo,
  saveQuestion,
  savePost,
  saveComment,
  getQuestions,
  getPosts,
  getComments,
  getAllComments,
  getProfessors,
  getDocuments,
  getCurrentUserPostVotes,
  getCurrentUserQuestionVotes,
  updatePostVotes,
  updateQuestionVotes,
  getProfessorReviews,
  saveProfessorReview
});

document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const isAuthPage = currentPage === 'login.html' || currentPage === 'register.html';

  // Render quickly from cached data first to avoid visible delays in account UI.
  const headerRenderPromise = updateHeaderWithUserInfo().catch((error) => {
    console.warn('Initial header render failed:', error.message);
  });

  // Initialize auth stack in background so page interactivity is never blocked.
  initializeAuthStateListener().catch((error) => {
    console.warn('Auth state listener init failed:', error.message);
  });

  initSupabaseClient()
    .then(() => {
      if (!isAuthPage) {
        return protectPage().catch((error) => {
          console.warn('Page protection check failed:', error.message);
        });
      }
      return null;
    })
    .finally(() => {
      headerRenderPromise.finally(() => {
        updateHeaderWithUserInfo().catch((error) => {
          console.warn('Header refresh failed:', error.message);
        });
      });
    });

  initializeSearchableDropdowns();
});
