# ULBStudent - Performance si QA

Proiectul este static-first: HTML/CSS/JS se servesc direct, iar datele dinamice vin din Supabase. Obiectivul este incarcare rapida, fara bundle greu si fara dependinte inutile in browser.

## Optimizari active

- CSS impartit pe zone: global, polish, documente, profesori, discutii, toast.
- Assets locale pentru logo/icon, fara imagini externe obligatorii.
- Service worker in `public/sw.js` pentru fallback offline si cache static. Include doar resurse utile pentru navigare reală și exclude fișierele opționale dacă vrei un cache mai mic.
- `public/manifest.webmanifest` pentru instalare PWA.
- Lazy loading utilitar in `src/utils/lazy-loader.js`.
- Cache helper in `src/utils/cache-manager.js`.
- Animatii cu respect pentru `prefers-reduced-motion`.
- Linkuri locale verificate pentru deploy static.

## Cache Supabase/API

Pentru requesturi cache-uite, foloseste helperul:

```javascript
import { cachedFetch } from './src/utils/cache-manager.js';

const response = await cachedFetch(`${window.SUPABASE_CONFIG.url}/rest/v1/profesori`, {
  headers: {
    apikey: window.SUPABASE_CONFIG.anonKey,
    Authorization: `Bearer ${window.SUPABASE_CONFIG.anonKey}`
  },
  maxAge: 10 * 60 * 1000
});
```

Nu folosi endpointuri `/api/...` daca nu exista backend separat.

## Buget recomandat

- HTML/CSS/JS static sub 1 MB per prima incarcare.
- Imagini sub 500 KB cand este posibil.
- LCP sub 2.5 secunde.
- CLS sub 0.1.
- Interactiuni fara layout shift vizibil pe mobil.

## Verificari inainte de deploy

```bash
npm run build
npm run lint
npm run format:check
```

Daca nu ai Node instalat, ruleaza cel putin:

```bash
python -m http.server 5500
```

si verifica manual paginile principale in browser.

## Checklist browser

- Desktop, tableta si telefon.
- Light mode si dark mode.
- Meniu mobil.
- Formulare: login, register, contact, raportare, documente, profil, recenzii, postari, comentarii.
- Sondaje: single choice, multiple choice, adaugare/stergere optiuni, vot si rezultate.
- Fallback: `404.html`, `offline.html`.
- Console fara erori critice.
