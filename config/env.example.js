// Copiază acest fișier ca `config/env.js` doar dacă vrei configurare separată de cod.
// Include `config/env.js` înainte de `supabase-client.js` în paginile HTML.
window.SUPABASE_CONFIG = {
  url: 'https://your-project.supabase.co',
  anonKey: 'your_supabase_anon_key_here'
};

window.LINKEDIN_CONFIG = {
  clientId: 'your_linkedin_client_id_here',
  redirectUri: `${window.location.origin}/linkedin-callback.html`,
  exchangeEndpoint: '/.netlify/functions/linkedin-exchange'
};
