# ULBStudent - Setup si Deploy

Acest proiect este o aplicatie web statica pentru comunitatea studentilor ULBS. Frontendul ruleaza din fisiere HTML/CSS/JS, iar functiile dinamice folosesc Supabase Database, Auth, Storage si Edge Functions.

## Cerinte locale

- Browser modern.
- Python 3 pentru server static rapid sau Node.js 18+ daca vrei scripturile npm.
- Cont Supabase pentru functiile reale.

## Pornire locala

```bash
python -m http.server 5500
```

Deschide:

```text
http://localhost:5500/index.html
```

Cu Node.js instalat:

```bash
npm install
npm run dev
npm run build
```

`npm run build` confirma ca proiectul este static si poate fi urcat direct pe server.

## Configurare frontend

Pentru hosting static, foloseste una dintre variante:

1. Editeaza valorile publice din `supabase-client.js`.
2. Creeaza `config/env.js` dupa modelul `config/env.example.js` si include-l inainte de `supabase-client.js`.

Nu pune niciodata `service_role` in frontend.

## Configurare Supabase

Ruleaza in Supabase SQL Editor, in aceasta ordine:

```text
SUPABASE_PRODUCTION_SETUP.sql
SUPABASE_POLLS_MIGRATION.sql
supabase_professors_seed.sql
```

Tabele folosite de site:

```text
utilizatori, studenti, profesori, professors, cursuri, courses, documente,
posts, postari_forum, comments, comentarii, questions, voturi,
recenzii_profesori, recenzii_utile, raportari, notificari,
polls, poll_options, poll_votes
```

## Storage

SQL-ul creeaza/configureaza:

- `documente` - public, pentru materiale incarcate de profesori.
- `post-attachments` - public, pentru atasamente forum.

`avatars` este optional daca adaugi upload de avatar.

## Edge Function AI

Butonul `Ajutor AI` apeleaza:

```text
/functions/v1/chat-facultate
```

Deploy:

```bash
supabase functions deploy chat-facultate
supabase secrets set GEMINI_API_KEY=cheia_ta_gemini
```

Optional:

```bash
supabase secrets set GEMINI_MODEL=gemini-2.5-flash
```

Cheia Gemini este secret server-side, nu se pune in fisiere publice.

## Deploy pe server

Urcă:

```text
*.html
*.css
*.js
assets/
config/
public/
supabase/
robots.txt
sitemap.xml
```

Adaugă `downloads/` doar dacă vrei să distribui separat un pachet local sau o arhivă de livrare; nu este necesar pentru funcționarea site-ului.

Configureaza:

- `index.html` ca pagina principala.
- fallback 404 catre `404.html`.
- domeniul final in `sitemap.xml`, `robots.txt`, Supabase Auth redirect URLs si OAuth providers.

## Verificare inainte de publicare

- Toate paginile se incarca.
- Login/register functioneaza cu Supabase Auth.
- Documentele se citesc din `documente`.
- Postarile/comentariile/voturile se salveaza.
- Sondajele folosesc `polls`, `poll_options`, `poll_votes`.
- Recenziile profesorilor se salveaza in `recenzii_profesori`.
- Raportarile ajung in `raportari`.
- Notificarile sunt protejate prin RLS.
- Nu exista `service_role` sau chei private in frontend.
