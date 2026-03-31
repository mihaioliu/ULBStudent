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
    'raporteaza-problema.html'
  ];
  
  if (publicPages.includes(currentPage)) {
    return;
  }

  const { authenticated } = await checkAuthStatus();
  
  if (!authenticated) {
    console.log('🔒 Page protected. Redirecting to login...');
    window.location.href = 'login.html';
  }
}

/**
 * Update Header with User Info (if logged in)
 */
async function updateHeaderWithUserInfo() {
  try {
    const { authenticated, user } = await checkAuthStatus();
    const headerActions = document.querySelector('.header-actions');
    
    if (!headerActions) return;
    
    // ❌ ALWAYS remove old signin/signup buttons first
    const oldSignIn = headerActions.querySelector('.btn-signin');
    const oldSignUp = headerActions.querySelector('.btn-signup');
    if (oldSignIn) oldSignIn.remove();
    if (oldSignUp) oldSignUp.remove();
    
    // ❌ Remove old user menu
    const oldUserMenu = headerActions.querySelector('.user-menu');
    if (oldUserMenu) oldUserMenu.remove();
    
    if (authenticated && user) {
      // Create user profile menu
      const userMenu = document.createElement('div');
      userMenu.className = 'user-menu';
      userMenu.style.cssText = `
        display: flex;
        align-items: center;
        gap: 1rem;
        background: linear-gradient(135deg, var(--accent) 0%, #d63447 100%);
        padding: 0.5rem 1rem;
        border-radius: 8px;
        cursor: pointer;
      `;
      
      const userEmail = user.email || 'Student';
      const userName = user.user_metadata?.full_name || userEmail.split('@')[0];
      
      userMenu.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <i class="fas fa-user-circle" style="font-size: 1.5rem; color: white;"></i>
          <div style="color: white;">
            <div style="font-weight: 700; font-size: 0.9rem;">${userName}</div>
            <div style="font-size: 0.75rem; opacity: 0.9;">${userEmail}</div>
          </div>
        </div>
        <button id="logoutBtnHeader" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
          <i class="fas fa-sign-out-alt"></i> Logout
        </button>
      `;
      
      headerActions.appendChild(userMenu);
      
      // Add logout handler
      document.getElementById('logoutBtnHeader').addEventListener('click', async () => {
        if (confirm('Ești sigur că vrei să te deconectezi?')) {
          await logoutUser();
        }
      });
    } else {
      // User not logged in - add login buttons
      const signInBtn = document.createElement('button');
      signInBtn.className = 'btn-signin';
      signInBtn.textContent = 'Conectare';
      signInBtn.addEventListener('click', () => window.location.href = 'login.html');
      headerActions.appendChild(signInBtn);
      
      const signUpBtn = document.createElement('button');
      signUpBtn.className = 'btn-signup';
      signUpBtn.textContent = 'Înregistrare';
      signUpBtn.addEventListener('click', () => window.location.href = 'register.html');
      headerActions.appendChild(signUpBtn);
    }
  } catch (error) {
    console.error('Error updating header:', error);
  }
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
