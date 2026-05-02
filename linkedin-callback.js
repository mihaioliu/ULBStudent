// linkedin-callback.js
// Primește `code` și `state` din LinkedIn OAuth și le trimite către endpoint-ul serverless configurat.
(async function () {
  const statusEl = document.getElementById('status');
  function show(message) {
    if (statusEl) statusEl.textContent = message;
  }

  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const savedState = localStorage.getItem('linkedin_oauth_state');
  const linkedinConfig = window.LINKEDIN_CONFIG || {};
  const exchangeEndpoint = linkedinConfig.exchangeEndpoint || '';

  if (!code) {
    show('Eroare: cod de autorizare lipsă.');
    console.error('Missing code in LinkedIn callback');
    return;
  }

  if (!state || state !== savedState) {
    show('Eroare: starea de securitate nu corespunde.');
    console.error('Invalid OAuth state');
    return;
  }

  if (!exchangeEndpoint) {
    show('LinkedIn este aproape gata. Configurează endpoint-ul serverless în config/env.js.');
    console.warn('Missing LinkedIn exchange endpoint');
    return;
  }

  show('Se finalizează conectarea cu LinkedIn...');

  try {
    const resp = await fetch(exchangeEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirect_uri: linkedinConfig.redirectUri || `${window.location.origin}/linkedin-callback.html` })
    });

    if (!resp.ok) {
      const text = await resp.text();
      show(`Eroare la server: ${resp.status}`);
      console.error('Server error:', resp.status, text);
      return;
    }

    const body = await resp.json();
    if (body.success) {
      show('Conectare reușită. Te redirecționăm...');
      localStorage.setItem('currentUser', JSON.stringify(body.user || {}));
      setTimeout(() => { window.location.href = 'index.html'; }, 900);
    } else {
      show(`Eroare la autentificare: ${body.message || 'răspuns invalid'}`);
      console.error('Auth failed:', body);
    }
  } catch (err) {
    show('Eroare neașteptată. Verifică endpoint-ul LinkedIn și consola.');
    console.error(err);
  }
})();
