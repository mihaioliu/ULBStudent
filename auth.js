// Supabase Configuration
const SUPABASE_URL = 'https://wjxedaygcaoktwhucagn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1Qa6uuCo8hKdMwXLDMF8Nw_KTgpbm9K';

let supabaseClient = null;

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
    await waitForSupabase();
    const { createClient } = window.supabase;
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase client initialized');
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
      
      console.log('✅ Login successful:', data.user.email);
      return { success: true, user: data.user };
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    throw error;
  }
}
/**
 * Register New User
 */
async function registerNewUser(email, password, fullName, year, faculty) {
  try {
    const client = await initSupabaseClient();
    
    if (!client) {
      throw new Error('Supabase client not initialized. Please check your configuration.');
    }

    // PASUL 1: Creează contul
    const { data, error } = await client.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
          year: year,
          faculty: faculty
        },
        emailRedirectTo: `${window.location.origin}/index.html`
      }
    });

    if (error) {
      if (error.message.includes('already registered')) throw new Error('Acest email este deja folosit');
      if (error.message.includes('Password should be')) throw new Error('Parola nu este suficient de sigură');
      throw new Error(error.message || 'Eroare la creare cont');
    }

    // 🚀 PASUL 2: INSERAREA ÎN TABELUL TĂU "utilizatori"
    if (data?.user) {
      const { error: dbError } = await client
        .from('utilizatori') 
        .insert([{ 
          email: email, 
          nume_complet: fullName, 
          an_studiu: parseInt(year), 
          specializare: faculty 
        }]);

      if (dbError) {
        console.error('❌ Eroare la salvarea în tabel:', dbError.message);
      } else {
        console.log('✅ Datele au intrat cu succes în tabelul utilizatori!');
      }
    }

    console.log('✅ Registration successful. Auto-logging in...');
    
    // ✅ Auto-login după registrare
    try {
      await loginWithEmail(email, password);
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
    
    console.log('✅ Logout successful');
    
    // Redirect to login
    window.location.href = 'login.html';
    return { success: true };
  } catch (error) {
    console.error('❌ Logout error:', error.message);
    
    // Force clear localStorage and redirect anyway
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('currentUser');
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
 * Get logged-in user's profile row from `utilizatori`
 */
async function getCurrentUserProfileData() {
  try {
    const client = await initSupabaseClient();
    const user = getCurrentUser();

    if (!user?.email) {
      return { success: false, data: null };
    }

    const { data, error } = await client
      .from('utilizatori')
      .select('*')
      .eq('email', user.email)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('⚠️ Could not fetch utilizatori profile:', error.message);
      return { success: false, data: null };
    }

    return { success: true, data };
  } catch (error) {
    console.error('❌ Error fetching user profile data:', error.message);
    return { success: false, data: null };
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
      .from('questions')
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

    const { data, error } = await client
      .from('posts')
      .insert([{
        user_id: user.id,
        title: title,
        content: content,
        votes: 0
      }])
      .select();

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
      .from('comments')
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
      .from('questions')
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

    const { data, error } = await client
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

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

    const { data, error } = await client
      .from('posts')
      .select('*')
      .eq('id', postId)
      .limit(1)
      .maybeSingle();

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
      .from('comments')
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

    const { data, error } = await client
      .from('professors')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) throw new Error(error.message);
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
      academic_title: row.academic_title,
      full_name: row.full_name,
      institutional_email: row.institutional_email,
      specialization: row.specialization,
      department: row.department || 'Departamentul de Calculatoare și Inginerie Electrică',
      rating: row.rating || 4.6,
      reviews_count: row.reviews_count || 0,
      courses_count: row.courses_count || 0
    }));

    const { data, error } = await client
      .from('professors')
      .upsert(payload, { onConflict: 'institutional_email' })
      .select();

    if (error) throw new Error(error.message);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error upserting professors:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Save Team Match to Database
 * Preferred table: team_matches
 * Fallback table: matches
 */
async function saveTeamMatch(profile, matchType) {
  try {
    const client = await initSupabaseClient();
    const user = getCurrentUser();

    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const preferredPayload = {
      user_id: user.id,
      profile_id: String(profile.id),
      profile_name: profile.name,
      profile_year: profile.year,
      profile_specialization: profile.specialization,
      profile_skills: profile.skills,
      match_type: matchType
    };

    // Try team_matches first (rich payload)
    const preferredInsert = await client
      .from('team_matches')
      .insert([preferredPayload])
      .select();

    if (!preferredInsert.error) {
      return { success: true, data: preferredInsert.data, source: 'team_matches' };
    }

    // Fallback for existing `matches` table
    const fallbackPayload = {
      user_id_1: user.id,
      user_id_2: null,
      match_type: `${matchType}:${profile.name}`
    };

    const fallbackInsert = await client
      .from('matches')
      .insert([fallbackPayload])
      .select();

    if (fallbackInsert.error) {
      throw new Error(fallbackInsert.error.message);
    }

    return { success: true, data: fallbackInsert.data, source: 'matches' };
  } catch (error) {
    console.error('❌ Error saving team match:', error.message);
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
    
    // Fetch current votes
    const { data: currentPost, error: fetchError } = await client
      .from('posts')
      .select('votes')
      .eq('id', postId)
      .limit(1)
      .maybeSingle();
    
    if (fetchError || !currentPost) {
      throw new Error('Could not fetch current post');
    }
    
    const newVotes = currentPost.votes + (voteDirection === 'up' ? 1 : -1);
    
    // Update the votes in database
    const { data, error } = await client
      .from('posts')
      .update({ votes: newVotes })
      .eq('id', postId)
      .select();
    
    if (error) throw new Error(error.message);
    
    return { success: true, data: data?.[0], newVotes };
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
      .from('questions')
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
      .from('questions')
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
 * Get Team Matches from Database
 */
async function getTeamMatches() {
  try {
    const client = await initSupabaseClient();
    const user = getCurrentUser();

    if (!user?.id) {
      return { success: false, data: [] };
    }

    // Try team_matches first
    const preferredSelect = await client
      .from('team_matches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!preferredSelect.error) {
      return { success: true, data: preferredSelect.data, source: 'team_matches' };
    }

    // Fallback to matches
    const fallbackSelect = await client
      .from('matches')
      .select('*')
      .eq('user_id_1', user.id)
      .order('created_at', { ascending: false });

    if (fallbackSelect.error) {
      throw new Error(fallbackSelect.error.message);
    }

    return { success: true, data: fallbackSelect.data, source: 'matches' };
  } catch (error) {
    console.error('❌ Error loading team matches:', error.message);
    return { success: false, data: [] };
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
    'team-matching.html',
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
          showUserMenuInHeader(headerActions, user);
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
    gap: ${isMobileScreen ? '0.5rem' : '1rem'};
    background: linear-gradient(135deg, var(--accent) 0%, #d63447 100%);
    padding: ${isMobileScreen ? '0.5rem 0.75rem' : '0.5rem 1rem'};
    border-radius: 8px;
    cursor: pointer;
    position: relative;
    font-size: ${isMobileScreen ? '0.8rem' : '0.9rem'};
  `;
  
  const userEmail = user.email || 'Student';
  const userName = user.user_metadata?.full_name || userEmail.split('@')[0];
  
  const showEmail = window.innerWidth > 480; // Hide email on very small screens
  
  userMenu.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.5rem;">
      <i class="fas fa-user-circle" style="font-size: ${isMobileScreen ? '1.2rem' : '1.5rem'}; color: white;"></i>
      <div style="color: white; display: flex; flex-direction: column;">
        <div style="font-weight: 700; font-size: ${isMobileScreen ? '0.8rem' : '0.9rem'};">${escapeHtml(userName)}</div>
        ${showEmail ? `<div style="font-size: 0.7rem; opacity: 0.9;">${escapeHtml(userEmail)}</div>` : ''}
      </div>
    </div>
    <i class="fas fa-chevron-down" style="color: white; font-size: 0.7rem;"></i>
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
    background: white;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: 0 8px 20px rgba(0,0,0,0.15);
    min-width: 200px;
    margin-top: 0.5rem;
    display: none;
    z-index: 1000;
    overflow: hidden;
    max-width: 90vw;
  `;
  
  dropdownMenu.innerHTML = `
    <a href="profile.html" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.8rem 1rem; color: var(--text); text-decoration: none; transition: background 0.2s;" class="dropdown-item">
      <i class="fas fa-user"></i> Profilul Meu
    </a>
    <a href="settings.html" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.8rem 1rem; color: var(--text); text-decoration: none; transition: background 0.2s;" class="dropdown-item">
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
  
  // Initialize Supabase on all pages
  await initSupabaseClient();
  
  // Protect pages and update header on all pages
  if (currentPage !== 'login.html' && currentPage !== 'register.html') {
    await protectPage();
  }
  
  // Update header with user info on all pages
  await updateHeaderWithUserInfo();
});
