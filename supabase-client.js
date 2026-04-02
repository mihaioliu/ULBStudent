/**
 * Supabase client centralizat pentru tot proiectul.
 *
 * IMPORTANT:
 * 1) Completeaza valorile de mai jos cu URL-ul si ANON KEY din proiectul tau Supabase.
 * 2) Include acest fisier dupa CDN-ul oficial Supabase, in <head>.
 */
window.SUPABASE_CONFIG = window.SUPABASE_CONFIG || {
  url: 'https://wjxedaygcaoktwhucagn.supabase.co',
  anonKey: 'sb_publishable_1Qa6uuCo8hKdMwXLDMF8Nw_KTgpbm9K'
};

// Aplic tema salvata cat mai devreme pentru a evita flash-ul intre pagini.
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
    throw new Error('Biblioteca Supabase nu a fost incarcata. Verifica scriptul CDN din <head>.');
  }

  return window.supabase;
}

async function getSupabaseClient() {
  if (__supabaseClient) {
    return __supabaseClient;
  }

  const supabaseGlobal = await waitForSupabaseGlobal();
  const config = window.SUPABASE_CONFIG || {};

  if (!config.url || !config.anonKey || config.url.includes('YOUR-PROJECT') || config.anonKey.includes('YOUR_SUPABASE')) {
    throw new Error('Config Supabase invalida. Completeaza window.SUPABASE_CONFIG in supabase-client.js.');
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
