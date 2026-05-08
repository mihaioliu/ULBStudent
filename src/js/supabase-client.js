/**
 * Supabase client centralizat pentru tot proiectul.
 *
 * IMPORTANT:
 * 1. În producție folosește anon/public key, niciodată service_role key în frontend.
 * 2. Pentru static hosting poți suprascrie configurația înainte de acest fișier cu:
 *    window.SUPABASE_CONFIG = { url: '...', anonKey: '...' };
 * 3. Fallback-ul de mai jos este public și poate fi înlocuit cu valorile proiectului tău.
 */
const DEFAULT_SUPABASE_CONFIG = {
  url: 'https://wjxedaygcaoktwhucagn.supabase.co',
  anonKey: 'sb_publishable_1Qa6uuCo8hKdMwXLDMF8Nw_KTgpbm9K'
};

function readSupabaseConfig() {
  const explicitConfig = window.SUPABASE_CONFIG || window.ULBSTUDENT_ENV || {};
  const metaUrl = document.querySelector('meta[name="supabase-url"]')?.getAttribute('content') || '';
  const metaAnonKey = document.querySelector('meta[name="supabase-anon-key"]')?.getAttribute('content') || '';

  return {
    url: explicitConfig.url || explicitConfig.SUPABASE_URL || metaUrl || DEFAULT_SUPABASE_CONFIG.url,
    anonKey: explicitConfig.anonKey || explicitConfig.SUPABASE_ANON_KEY || metaAnonKey || DEFAULT_SUPABASE_CONFIG.anonKey
  };
}

window.SUPABASE_CONFIG = readSupabaseConfig();

// Aplic tema salvată cât mai devreme pentru a evita flash-ul între pagini.
try {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark-mode');
  }
} catch (error) {
  console.warn('Theme preload failed:', error.message);
}

let __supabaseClient = null;

async function waitForSupabaseGlobal() {
  let retries = 0;
  while (!window.supabase && retries < 50) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    retries += 1;
  }

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    throw new Error('Biblioteca Supabase nu a fost încărcată. Verifică scriptul CDN din <head>.');
  }

  return window.supabase;
}

async function getSupabaseClient() {
  if (__supabaseClient) {
    return __supabaseClient;
  }

  const supabaseGlobal = await waitForSupabaseGlobal();
  const config = readSupabaseConfig();
  window.SUPABASE_CONFIG = config;

  if (!config.url || !config.anonKey || config.url.includes('YOUR-PROJECT') || config.anonKey.includes('YOUR_SUPABASE')) {
    throw new Error('Config Supabase invalidă. Completează window.SUPABASE_CONFIG sau valorile din supabase-client.js.');
  }

  __supabaseClient = supabaseGlobal.createClient(config.url, config.anonKey);
  return __supabaseClient;
}

function setSupabaseConfig(url, anonKey) {
  window.SUPABASE_CONFIG = { url, anonKey };
  __supabaseClient = null;
}

window.waitForSupabaseGlobal = waitForSupabaseGlobal;
window.getSupabaseClient = getSupabaseClient;
window.setSupabaseConfig = setSupabaseConfig;
