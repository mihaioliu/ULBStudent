# ULBStudent

ULBStudent este o platformă web premium pentru studenții ULBS: profesori, documente, discuții, sondaje, recenzii, profil, setări, suport și resurse academice. Proiectul rămâne ușor de urcat pe hosting static, iar funcțiile dinamice sunt conectate prin Supabase.

## Structură

- `index.html` - landing page premium cu hero, beneficii, funcționalități, impact și testimonials.
- `profesori.html`, `professor-profile.html`, `professor-panel.html` - catalog, profil și panel profesor.
- `documente.html` - bibliotecă de documente, filtre și descărcare reală.
- `comments.html`, `discutie.html`, `subreddit.html` - comunitate, postări, comentarii și sondaje.
- `login.html`, `register.html`, `profile.html`, `settings.html`, `admin.html` - cont, profil, preferințe și administrare.
- `contact.html`, `raporteaza-problema.html` - suport și raportări.
- `404.html`, `offline.html`, `public/sw.js`, `public/manifest.webmanifest` - fallback, PWA și metadata.
- `styles-global.css`, `app-polish.css`, `styles-documents.css`, `styles-professors.css`, `styles-subreddit.css`, `toast-notifications.css` - sistem vizual.
- `interactive.js`, `auth.js`, `supabase-client.js`, `professors-filtering.js`, `professor-profile.js` - funcționalitate frontend și Supabase.

## Rulare Locală

```bash
python -m http.server 5500
```

Deschide `http://localhost:5500/index.html`.

Dacă ai Node instalat:

```bash
npm install
npm run dev
npm run build
```

`npm run build` nu generează bundle; confirmă doar că proiectul este static și pregătit de upload.

## Configurare Supabase

1. Copiază `.env.example` și păstrează valorile reale în mediul tău privat.
2. Pentru hosting static fără build, modifică `supabase-client.js` sau creează `config/env.js` pornind de la `config/env.example.js`.
3. Rulează în Supabase SQL Editor:

```text
SUPABASE_PRODUCTION_SETUP.sql
SUPABASE_POLLS_MIGRATION.sql
supabase_professors_seed.sql
```

Nu folosi niciodată `service_role` în frontend. Cheia permisă în browser este anon/public key, cu RLS activ.

Pentru asistentul AI `Ajutor AI`, deployează funcția Supabase Edge:

```bash
supabase functions deploy chat-facultate
supabase secrets set GEMINI_API_KEY=cheia_ta_gemini
```

Secretul `GEMINI_API_KEY` este server-side și nu se pune în HTML, JS public sau `config/env.js`.

## Tabele Folosite Real

Codul folosește activ: `utilizatori`, `studenti`, `profesori`, `professors`, `cursuri`, `courses`, `documente`, `posts`, `postari_forum`, `comments`, `comentarii`, `questions`, `voturi`, `recenzii_profesori`, `recenzii_utile`, `raportari`, `notificari`, `polls`, `poll_options`, `poll_votes`.

Canon recomandat pentru producție: `posts`, `comments`, `profesori`, `studenti`, `cursuri`, `documente`, `polls`, `poll_options`, `poll_votes`. Variantele `postari_forum`, `comentarii`, `professors`, `courses` sunt păstrate ca fallback pentru schema existentă.

## Storage Buckets

Configurează prin SQL sau Dashboard:

- `documente` - public, pentru fișiere încărcate de profesori.
- `post-attachments` - public, pentru atașamente forum.
- `avatars` - opțional, public sau privat după politica de profil dacă adaugi upload avatar.

## Edge Functions

- `supabase/functions/chat-facultate` - endpoint real pentru butonul `Ajutor AI`; folosește `GEMINI_API_KEY` din Supabase Secrets și răspunde prin `/functions/v1/chat-facultate`.

## Sondaje

Pagina `comments.html` are editor real de sondaj: întrebare, minimum 2 opțiuni, adăugare/ștergere opțiuni, single choice și multiple choice. Voturile persistă în `poll_votes` după rularea `SUPABASE_POLLS_MIGRATION.sql`; migrația validează în DB opțiunile, previne votul duplicat per utilizator și blochează voturile multiple pe sondaje single choice.

## Pachet Local

Folderul `downloads/` conține un pachet local opțional pentru materiale auxiliare sau livrabile manuale.
UI-ul public nu mai expune un buton de download, iar arhiva poate fi păstrată doar dacă vrei să o distribui manual sau să o publici separat.

## Upload Pe Server

1. Urcă fișierele `.html`, `.css`, `.js` și folderele `assets/`, `public/`, `config/`.
2. Setează `index.html` ca pagină principală.
3. Configurează fallback către `404.html`.
4. Actualizează `sitemap.xml`, `robots.txt`, `SITE_URL` și URL-urile OAuth după domeniul final.
5. Verifică în Supabase Dashboard RLS, Auth providers, Storage buckets și URL-urile permise.

## Ce Modifici Rapid

- Texte landing: `index.html`.
- Design global: `app-polish.css` și `styles-global.css`.
- Documente: `styles-documents.css`, `documente.html`, `auth.js`.
- Profesori/recenzii: `styles-professors.css`, `profesori.html`, `professor-profile.js`.
- Forum/sondaje: `comments.html`, `interactive.js`, `styles-subreddit.css`.
- Supabase: `supabase-client.js`, `SUPABASE_PRODUCTION_SETUP.sql`, `SUPABASE_POLLS_MIGRATION.sql`.

## Servicii Externe

Funcțiile reale depind de Supabase Auth, Database și Storage. Google OAuth se configurează în Supabase Auth Providers. LinkedIn este opțional și necesită `LINKEDIN_CLIENT_ID` plus un endpoint serverless de token exchange; fără configurare, butonul afișează un mesaj clar și nu pornește un flux fals.
