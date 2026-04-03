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
  QUESTIONS: 'questions',
  MATCHES: 'matches',
  PROFESSOR_REVIEWS: 'recenzii_profesori'
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
    throw new Error('❌ Supabase failed to load. Check your internet connection.');
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
        throw new Error('Configuratia Supabase lipseste. Include supabase-client.js si completeaza cheile API.');
      }

      const { createClient } = window.supabase;
      supabaseClient = createClient(fallbackUrl, fallbackAnonKey);
    }

    console.log('✅ Supabase client initialized (central config)');
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
      
      console.log('✅ Login successful:', data.user.email);
      return { success: true, user: data.user };
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    throw error;
  }
}

/**
 * Detect role by checking whether current user exists in `profesori`/`professors` table.
 */
async function detectUserRole(userId, email = '') {
  const client = await initSupabaseClient();
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!userId) {
    return 'student';
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
  const cachedRole = localStorage.getItem('role');

  if (user?.user_metadata?.account_type === 'professor') {
    localStorage.setItem('role', 'profesor');
    return 'profesor';
  }

  if (cachedRole === 'professor') {
    localStorage.setItem('role', 'profesor');
    return 'profesor';
  }

  if (user?.id) {
    const detectedRole = await detectUserRole(user.id, user.email || '');
    localStorage.setItem('role', detectedRole);
    return detectedRole;
  }

  if (cachedRole === 'profesor' || cachedRole === 'student') {
    return cachedRole;
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

    // 🚀 PASUL 2: INSERARE ÎN TABELUL AFERENT TIPULUI DE CONT
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
            console.error('❌ Eroare la salvarea profesorului:', legacyResult.error.message);
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

        // Dublam si in utilizatori pentru compatibilitatea cu paginile existente.
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
          console.error('❌ Eroare la salvarea profilului student:', userInsert.error.message);
        }
      }
    }

    console.log('✅ Registration successful. Auto-logging in...');
    
    // ✅ Auto-login după registrare
    try {
      await loginWithEmail(normalizedEmail, password);
      console.log('✅ User auto-logged in successfully!');
    } catch (loginError) {
      console.warn('⚠️ Auto-login failed. User will need to login manually.');
    }
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error('❌ Registration error:', error.message);
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

    console.log('✅ Google OAuth initiated');
    return { success: true };
  } catch (error) {
    console.error('❌ Google OAuth error:', error.message);
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
    
    console.log('✅ Logout successful');
    
    // Redirect to login
    window.location.href = 'login.html';
    return { success: true };
  } catch (error) {
    console.error('❌ Logout error:', error.message);
    
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
      console.warn('⚠️ Supabase client not initialized');
      return { authenticated: false, user: null };
    }

    // Check localStorage for cached session
    const cachedToken = localStorage.getItem('supabase.auth.token');
    const cachedUser = localStorage.getItem('currentUser');
    
    if (cachedToken && cachedUser) {
      try {
        const tokenData = JSON.parse(cachedToken);
        const userData = JSON.parse(cachedUser);
        
        // Verify token is still valid
        const { data, error } = await client.auth.getUser(tokenData.access_token);
        
        if (!error && data?.user) {
          await resolveAndCacheUserRole(userData);
          console.log('✅ User authenticated (cached):', userData.email);
          return { authenticated: true, user: userData };
        }
      } catch (e) {
        console.warn('⚠️ Could not verify cached token:', e.message);
      }
    }

    // Try to get session from Supabase
    const { data, error } = await client.auth.getSession();
    
    if (error) {
      console.warn('⚠️ Could not get session:', error.message);
      return { authenticated: false, user: null };
    }

    if (data?.session?.user) {
      // Update localStorage with fresh session
      localStorage.setItem('supabase.auth.token', JSON.stringify(data.session));
      localStorage.setItem('currentUser', JSON.stringify(data.session.user));
      await resolveAndCacheUserRole(data.session.user);
      
      console.log('✅ User authenticated:', data.session.user.email);
      return { authenticated: true, user: data.session.user };
    }

    console.log('ℹ️ No active session');
    return { authenticated: false, user: null };
  } catch (error) {
    console.error('❌ Auth check error:', error.message);
    return { authenticated: false, user: null };
  }
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
    console.warn('⚠️ Could not resolve authenticated user from session:', error.message);
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
      console.warn('⚠️ Could not fetch utilizatori profile:', error.message);
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
    console.error('❌ Error fetching user profile data:', error.message);
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

      const cleanPayload = Object.fromEntries(
        Object.entries(updatePayload).filter(([, value]) => value !== undefined)
      );

      const dbUpdate = await client
        .from(TABLES.PROFESSORS)
        .update(cleanPayload)
        .eq('email', normalizedEmail);

      if (dbUpdate.error) {
        const legacyUpdate = await client
          .from(TABLES.PROFESSORS_LEGACY)
          .update({
            full_name: profileUpdates.full_name,
            specialization: profileUpdates.specialization,
            department: profileUpdates.faculty
          })
          .eq('institutional_email', normalizedEmail);

        if (legacyUpdate.error) throw new Error(legacyUpdate.error.message);
      }

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

    const cleanStudentPayload = Object.fromEntries(
      Object.entries(studentPayload).filter(([, value]) => value !== undefined)
    );

    const studentUpdate = await client
      .from(TABLES.STUDENTS)
      .update(cleanStudentPayload)
      .eq('email', normalizedEmail);

    const userUpdate = await client
      .from(TABLES.USERS)
      .update({
        nume_complet: profileUpdates.full_name,
        an_studiu: profileUpdates.year ? parseInt(profileUpdates.year, 10) : null,
        specializare: profileUpdates.specialization
      })
      .eq('email', normalizedEmail);

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
    console.error('❌ Error updating user profile data:', error.message);
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
    
    console.log('✅ Question saved to database:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error saving question:', error.message);
    throw error;
  }
}

/**
 * Save Post to Database (Subreddit)
 */
async function savePost(title, content) {
  try {
    const client = await initSupabaseClient();
    const user = getCurrentUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const primaryInsert = await client
      .from(TABLES.FORUM_POSTS)
      .insert([{
        user_id: user.id,
        title,
        content,
        votes: 0
      }])
      .select();

    let data = primaryInsert.data;
    let error = primaryInsert.error;

    // Fallback pentru schema veche
    if (error) {
      const fallbackInsert = await client
        .from(TABLES.POSTS_LEGACY)
        .insert([{
          user_id: user.id,
          title,
          content,
          votes: 0
        }])
        .select();
      data = fallbackInsert.data;
      error = fallbackInsert.error;
    }

    if (error) throw new Error(error.message);
    
    console.log('✅ Post saved to database:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error saving post:', error.message);
    throw error;
  }
}

/**
 * Save Comment to Database
 */
async function saveComment(postId, name, email, content) {
  try {
    const client = await initSupabaseClient();
    const user = getCurrentUser();

    const { data, error } = await client
      .from(TABLES.COMMENTS)
      .insert([{
        post_id: postId,
        user_id: user?.id || null,
        name: name,
        email: email,
        content: content
      }])
      .select();

    if (error) throw new Error(error.message);
    
    console.log('✅ Comment saved to database:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error saving comment:', error.message);
    throw error;
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
    
    console.log('✅ Questions fetched from database:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error fetching questions:', error.message);
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
      .from(TABLES.FORUM_POSTS)
      .select('*')
      .order('created_at', { ascending: false });

    let data = primarySelect.data;
    let error = primarySelect.error;

    if (error) {
      const fallbackSelect = await client
        .from(TABLES.POSTS_LEGACY)
        .select('*')
        .order('created_at', { ascending: false });
      data = fallbackSelect.data;
      error = fallbackSelect.error;
    }

    if (error) throw new Error(error.message);
    
    console.log('✅ Posts fetched from database:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error fetching posts:', error.message);
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
      .from(TABLES.FORUM_POSTS)
      .select('*')
      .eq('id', postId)
      .limit(1)
      .maybeSingle();

    let data = primarySelect.data;
    let error = primarySelect.error;

    if (error) {
      const fallbackSelect = await client
        .from(TABLES.POSTS_LEGACY)
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
    console.error('❌ Error fetching single post:', error.message);
    return { success: false, data: null };
  }
}

/**
 * Get Comments for a Post
 */
async function getComments(postId) {
  try {
    const client = await initSupabaseClient();

    const { data, error } = await client
      .from(TABLES.COMMENTS)
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error fetching comments:', error.message);
    return { success: false, data: [] };
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
      const fallbackSelect = await client
        .from(TABLES.PROFESSORS_LEGACY)
        .select('*')
        .order('full_name', { ascending: true });
      rawRows = fallbackSelect.data;
      error = fallbackSelect.error;
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
    console.error('❌ Error fetching professors:', error.message);
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
      departament: row.department || 'Departamentul de Calculatoare si Inginerie Electrica',
      department: row.department || 'Departamentul de Calculatoare si Inginerie Electrica',
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
    console.error('❌ Error upserting professors:', error.message);
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

      return { data: data?.[0], error, newVotes };
    };

    let result = await tryUpdate(TABLES.FORUM_POSTS);
    if (result.error) {
      result = await tryUpdate(TABLES.POSTS_LEGACY);
    }

    if (result.error) throw new Error(result.error.message || 'Nu s-a putut actualiza votul');
    
    return { success: true, data: result.data, newVotes: result.newVotes };
  } catch (error) {
    console.error('❌ Error updating post votes:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Update Question Votes (Upvote/Downvote)
 * Saves the vote change to the database
 */
async function updateQuestionVotes(questionId, voteDirection) {
  try {
    const client = await initSupabaseClient();
    
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
    
    const newVotes = currentQuestion.upvotes + (voteDirection === 'up' ? 1 : -1);
    
    // Update the votes in database
    const { data, error } = await client
      .from(TABLES.QUESTIONS)
      .update({ upvotes: newVotes })
      .eq('id', questionId)
      .select();
    
    if (error) throw new Error(error.message);
    
    return { success: true, data: data?.[0], newVotes };
  } catch (error) {
    console.error('❌ Error updating question votes:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Documente (tabel: documente)
 */
async function getDocuments() {
  try {
    const client = await initSupabaseClient();
    const { data, error } = await client
      .from(TABLES.DOCUMENTS)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('❌ Error fetching documente:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Recenzii profesori (tabel: recenzii_profesori)
 */
async function getProfessorReviews(professorId) {
  try {
    const client = await initSupabaseClient();
    const base = client
      .from(TABLES.PROFESSOR_REVIEWS)
      .select('*')
      .order('created_at', { ascending: false });

    if (!professorId) {
      const { data, error } = await base;
      if (error) throw new Error(error.message);
      return { success: true, data: data || [] };
    }

    const primary = await client
      .from(TABLES.PROFESSOR_REVIEWS)
      .select('*')
      .eq('profesor_id', professorId)
      .order('created_at', { ascending: false });

    if (!primary.error) {
      return { success: true, data: primary.data || [] };
    }

    const fallback = await client
      .from(TABLES.PROFESSOR_REVIEWS)
      .select('*')
      .eq('professor_id', professorId)
      .order('created_at', { ascending: false });

    if (fallback.error) throw new Error(fallback.error.message);
    return { success: true, data: fallback.data || [] };
  } catch (error) {
    console.error('❌ Error fetching recenzii_profesori:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

async function saveProfessorReview(professorId, rating, reviewText) {
  try {
    const client = await initSupabaseClient();
    const user = await getAuthenticatedUser(true);

    const normalizedProfessorId = String(professorId || '').trim();
    const normalizedReviewText = String(reviewText || '').trim();
    const normalizedRating = Number(rating);
    const userId = user?.id || null;

    const payloadVariants = [
      {
        id_profesor: normalizedProfessorId,
        user_id: userId,
        rating: normalizedRating,
        comentariu: normalizedReviewText
      },
      {
        id_profesor: normalizedProfessorId,
        user_id: userId,
        rating: normalizedRating,
        review_text: normalizedReviewText
      },
      {
        profesor_id: normalizedProfessorId,
        user_id: userId,
        rating: normalizedRating,
        comentariu: normalizedReviewText
      },
      {
        professor_id: normalizedProfessorId,
        user_id: userId,
        rating: normalizedRating,
        comment: normalizedReviewText
      }
    ];

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
    console.error('❌ Error saving recenzie_profesor:', error.message);
    return { success: false, data: [], error: error.message };
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
    'comments.html'
  ];
  
  // Protected pages - require authentication
  const protectedPages = [
    'profile.html',
    'settings.html'
  ];
  
  if (publicPages.includes(currentPage)) {
    return; // No protection needed
  }
  
  if (protectedPages.includes(currentPage)) {
    const { authenticated } = await checkAuthStatus();
    
    if (!authenticated) {
      console.log('🔒 Page protected. Redirecting to login...');
      window.location.href = 'login.html';
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
      await resolveAndCacheUserRole(displayUser);
      showUserMenuInHeader(headerActions, displayUser);
      
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
          resolveAndCacheUserRole(user).then(() => {
          showUserMenuInHeader(headerActions, user);
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
function showUserMenuInHeader(headerActions, user) {
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
    background: linear-gradient(135deg, rgba(230, 57, 70, 0.16) 0%, rgba(230, 57, 70, 0.26) 100%);
    border: 1px solid rgba(230, 57, 70, 0.35);
    box-shadow: 0 8px 18px rgba(230, 57, 70, 0.18);
    backdrop-filter: blur(10px);
    padding: ${isMobileScreen ? '0.42rem 0.62rem' : '0.45rem 0.78rem'};
    border-radius: 10px;
    cursor: pointer;
    position: relative;
    font-size: ${isMobileScreen ? '0.76rem' : '0.86rem'};
  `;
  
  const userEmail = user.email || 'Student';
  const userName = user.user_metadata?.full_name || userEmail.split('@')[0];
  const storedRole = localStorage.getItem('role');
  const accountIsProfessor = storedRole === 'profesor' || storedRole === 'professor' || user.user_metadata?.account_type === 'professor';
  const accountType = accountIsProfessor ? 'Profesor' : 'Student';
  const roleColor = accountIsProfessor ? '#f97316' : '#0ea5e9';
  
  const showEmail = window.innerWidth > 480; // Hide email on very small screens
  
  userMenu.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.5rem;">
      <i class="fas fa-user-circle" style="font-size: ${isMobileScreen ? '1.05rem' : '1.28rem'}; color: var(--accent);"></i>
      <div style="color: var(--text); display: flex; flex-direction: column;">
        <div style="font-weight: 700; font-size: ${isMobileScreen ? '0.74rem' : '0.82rem'};">${escapeHtml(userName)}</div>
        <div style="font-size: 0.65rem; opacity: 1; color: ${accountIsProfessor ? '#ffd166' : roleColor}; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;">${accountType}</div>
        ${showEmail ? `<div style="font-size: 0.66rem; opacity: 0.82;">${escapeHtml(userEmail)}</div>` : ''}
      </div>
    </div>
    <i class="fas fa-chevron-down" style="color: var(--text); font-size: 0.66rem;"></i>
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
    z-index: 1000;
    overflow: hidden;
    max-width: 90vw;
    backdrop-filter: blur(12px);
  `;
  
  dropdownMenu.innerHTML = `
    <a href="profile.html" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.8rem 1rem; color: inherit; text-decoration: none; transition: background 0.2s;" class="dropdown-item">
      <i class="fas fa-user"></i> Profilul Meu
    </a>
    <a href="settings.html" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.8rem 1rem; color: inherit; text-decoration: none; transition: background 0.2s;" class="dropdown-item">
      <i class="fas fa-cog"></i> Setări
    </a>
    <hr style="margin: 0; border: none; border-top: 1px solid var(--border-color);">
    <button id="logoutBtn" style="width: 100%; display: flex; align-items: center; gap: 0.75rem; padding: 0.8rem 1rem; background: transparent; border: none; color: #e63946; font-weight: 600; cursor: pointer; transition: background 0.2s;" class="dropdown-item">
      <i class="fas fa-sign-out-alt"></i> Deconectare
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
  console.log('🔐 Initializing authentication...');
  
  // Initialize Supabase client
  await initSupabaseClient();
  
  // Check authentication
  if (protectPage) {
    await protectPage();
  }
  
  // Update header if user is logged in
  await updateHeaderWithUserInfo();
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

document.addEventListener('DOMContentLoaded', async () => {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const isAuthPage = currentPage === 'login.html' || currentPage === 'register.html';

  // Render quickly from local cache first to avoid visible delay in header account box.
  const headerRenderPromise = updateHeaderWithUserInfo();
  
  // Initialize Supabase on all pages
  await initSupabaseClient();
  
  // Protect pages and update header on all pages
  if (!isAuthPage) {
    await protectPage();
  }
  
  // Ensure first render completed, then refresh with latest session state.
  await headerRenderPromise;
  await updateHeaderWithUserInfo();
});
