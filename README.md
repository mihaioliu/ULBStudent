# Proiect-WEB (ULBStudent)

Status actualizat: 05.04.2026

Acest README descrie statusul real al proiectului, pe baza codului existent in workspace.

## Ce este implementat si functional (REAL STATE)

### 1. Autentificare, sesiune si roluri ✅ ~90% complet
**Status:** Core authentication werkend, dar cu riscuri de escalare.

**Ce merge:**
- Login/register cu Supabase (email + parola).
- Sesiune persistata in localStorage (token + refresh_token).
- Detectie rol multi-nivel: `student` (default) / `profesor` / `admin`.
Flux: User table check → profesori check (fallback EN+RO naming) → email hardcoded check.
- Protectie pagini cu `protectPage()` pentru admin/profesor.

**Probleme reale:**
- **Risk recursion:** `detectUserRole()` apeleaza `resolveAndCacheUserRole()` care cheama iar detectie role. Nici try/catch explicit nu previne loops daca DB e inchisa.
- **Email hardcoding:** Admin detectat pe `admin@ulbstudent.ro`. Rigid, greu de scalat la 2+ admins.
- **Session XSS risk:** localStorage pa credentiale in plain text. JWT nu e validat cand se restaureaza sesiune.
- **No logout cleanup:** La logout, nu se sterge token din localStorage explicit; se rely pe redirect si localStorage.removeItem() in pagina de login.

**Fisiere afectate:** `auth.js`, `supabase-client.js`, `login.html`, `register.html`

### 2. Profesori + profil profesor + recenzii ✅ ~85% complet
**Status:** Data-driven cu fallback local, dar cu probleme de normalizing si matching.

**Ce merge:**
- Lista profesori din DB (`profesori` table) + fallback hardcoded (`OFFICIAL_PROFESSORS`).
- Filtre pe specializare, departament, cautare textual.
- Profil detaliat cu date dinamice din DB.
- Recenzii cu rating (1-5 stars) + calc mediu, persistate in `recenzii_profesori`.
- Helpful votes pe recenzii cu count (`recenzii_utile` table).

**Probleme reale:**
- **Column name chaos:** In cod exista: `nume_complet` / `full_name`, `materie` / `taught_subject` / `materie_predata`, `prenume` / `nume` separate vs `full_name` in anu. lookup de prof incepe "prof.prenume || prof.first_name || prof.firstName || ''" (line prof-profile.js) - 3 fallback-uri pentru o coloana!
- **Rating calc fragile:** Daca un prof nu are recenzii, rating = 0/5 (nu e clar daca "nu e apreciat" sau "nu a fost evaluat"). UI nu face distinctie.
- **Filtering imprecise:** Filtrul pe specializare e case-insensitive + diacritice OK, dar daca un prof are specialization = NULL in DB, cade in fallback default = 'Calculatoare' (line professors-filtering.js).
- **Modal duplicates:** Exista 2 sisteme modale pentru recenzii: una in `professor-profile.html` + alta injectata din `professors-filtering.js`. Bug daca ambele sunt deschise = UI broken.
- **Reviews count mismatch:** Recenziile sunt load-ed din rel `recenzii_profesori` daca prof are id, altfel fallback = 0 recenzii. Dar daca DB record exista fara PK, nu se gaseste.

**Fisiere afectate:** `profesori.html`, `professors-filtering.js`, `professor-profile.html`, `professor-profile.js`

### 3. Documente ✅ ~75% complet
**Status:** Grid + filtre merge, dar download e fragil si upload dependent on Storage perms.

**Ce merge:**
- Catalog cu grid de documente din `documente` table.
- Filtre pe an studiu, tip (curs/seminar/laborator), materie, specializare, cautare text.
- Sortare pe descarcari/rating.
- Buton previzualizare (direct link deschis in tab nou) + descarcare cu fallback CORS.

**Probleme reale:**
- **Download fallback chain fragile:** Cod incearca fetch + blob download, fallback la window.open() cu ?download=1 param. Daca URL nu are CORS header, cade silent in window.open (user vede 404 in tab nou).
- **Missing validation:** Upload din professor-panel nu valideaza TIP fisier (PDF/DOC/XLS), SIZE (poate fi 1GB), MIME. Input accepta orice.
- **Column naming mess:** `titlu` / `title`, `materie` / `subject` / `taught_subject`, `tip_document` / `type`, `an_studiu` / `year`, `descriptor` / `description`. Codul incearca toate variantele; daca lipsesc toti, se afiseaza "Document" generic.
- **Auth/RLS unclear:** Upload este protejat de `protectPage()` (profesor only), dar RLS policy pe `documente` table nu e specificata clar in README. Profesor poate vedea/modifica doar propriile documente? Nu se vede in interface.
- **Storage path hardcoded:** Bucket = `professor_documents`, path = `professors/${safeName}`. Daca storage nu e setata in Supabase, error: "Blocat de politica RLS pentru tabela documente. Ruleaza scriptul SUPABASE_PRODUCTION_SETUP.sql ..." Mesajul e OK dar incurajaza copy-paste SQL in panica.

**Fisiere afectate:** `documente.html`, `professor-panel.html`, `interactive.js` (document filters/download)

### 4. Discutii / comunitate (postari + comentarii) ✅ ~70% complet
**Status:** Form structure OK, dar save/load logic fuzzy si no real moderation.

**Ce merge:**
- Pagina discutii cu form creare postare (titlu, content, categorie, tag-uri).
- Feed placeholder cu ID `postsFeed`.
- Pagina comentariu individual (`discutie.html`) cu form comentariu.
- Redirect de `subreddit.html` la `comments.html`.

**Probleme reale - CRITICE:**
- **No real save:** Form submit handler al postarii NU se vede in HTML. Nu exista JavaScript `postCreateForm.addEventListener('submit', ...)`. Se apeleaza `initializePostCreation()` dar functia din interactive.js nu face decat injectare HTML, nu actual save la DB!
- **Comments similarly broken:** Form HTML exista in discutie.html, dar no actual save la `comments` table cand submit.
- **DB tables ambiguous:** Comments ar putea merge in `comments`, `comentarii`, sau col in `posts`. Nu se vede schema clarita.
- **URL params ignored:** `discutie.html` cauta param `?post=123` dar nu il foloseste sa incarce data-ul postarii. Load-ul de post NU se intampla.
- **Tag parsing weak:** Tag-uri se trimit ca string "tag1,tag2", nu lista. No parsing/splitting la save.

**Fisiere afectate:** `comments.html`, `discutie.html`, `interactive.js` (postari/comments init)

### 5. Homepage (index.html) ✅ ~70% complet
**Status:** UI ready, dar search + data load-ul e partial si fallback-heavy.

**Ce merge:**
- Structura HTML pentru cautare globala cu checkbox-uri (Profesori, Documente, Postari, Anunturi, Recenzii).
- Functia `initializeGlobalSearch()` care colecteaza date din DOM + DB si face filtrare client-side.
- Resultate dinamice cu link-uri care navigheaza.
- Sectiuni anunturi, recenzii, leaderboard cu placeholder cards.

**Probleme reale:**
- **Anunturi mock + no save:** Anunturile din `index.html` sunt hardcoded HTML cu date statice. Nu exista tabel `anunturi` in SQL script. Admin nu poate crea anunturi noi.
- **Leaderboard fake:** Top studenti sunt hardcoded in HTML (Ana Popescu 245 puncte). Nu se incarca din DB bazat pe activity real (recenzii, postari, upvote-uri). Gamification = theater.
- **Search index async delay:** `collectDatabaseContent()` se apeleaza la click dar nu ar trebui sa bloceze UI. Se foloseste `await Promise.all` care poate fi slow cu 100+ profesori + documente.
- **Review collage glitch:** Featured reviews grid arata card-uri cu prof names (`#featuredProfessorName1`, etc.) dar nu actual data binding. Daca no data in DB, inca vede "Prof. Dr. Alexandru Dinu" hardcoded.
- **No pagination:** Search results nu au paging. Daca sunt 500 resultate, scroll-ul pagina va fi jenat.

**Fisiere afectate:** `index.html`, `interactive.js` (global search, homepage data)

### 6. Admin ✅ ~75% complet
**Status:** CRUD operations exist, dar no audit, no confirmation dialogs, no soft delete.

**Ce merge:**
- Protectie acces (check `role === admin`).
- Load date din `raportari`, `notificari`, `utilizatori` cu fallback ordonare (created_at → id).
- Update status raportari (nou → in_analiza → rezolvat → respins).
- Update rol utilizatori (student ↔ profesor ↔ admin).
- Tab switching pentru diferite table-uri.

**Probleme reale:**
- **No soft delete:** Buton "Delete" in UI nu exista. Data e permanent pe delete din admin, fara restore option.
- **No audit log:** Cine a schimbat ce rol si cand? Nu se logheaza. Daca admin fa un mistake la 100 useri, no trace.
- **UI feedback weak:** Update status are button "Salveaza" dar cand apesi, no loading spinner. User nu stie daca merge, asteapta.
- **Data load fragile:** Exista 3 strategii de sort (created_at DESC, id DESC, unsorted). Daca niciuna nu merge, `data = []` silent. Admin vede "no records" generic.
- **No bulk operations:** Admin trebuie sa schimbe fiecare utilizator manual. 1000 useri = 1000 clicks.
- **Column hidden:** Admin vede ID, name, email, role dar nu last_login, created_at (ar ajuta sa gaseasca inactive accounts).

**Fisiere afectate:** `admin.html` (inline script ~500 lines)

### 7. Panel profesor ✅ ~80% complet
**Status:** Upload logic exist, dar RLS-dependent si no real validation.

**Ce merge:**
- Protectie acces (profesor only check).
- Context load (nume profesor, materii, email).
- Document CRUD table cu edit + delete botoane.
- Upload file cu metadata (titlu, materie, tip, an, descriere).
- Public URL generation dupa upload.

**Probleme reale:**
- **RLS hard dependency:** Daca RLS policy nu e setata in Supabase, save document = auto-fail cu mesaj: "Blocat de politica RLS pentru tabela documente. Ruleaza scriptul SUPABASE_PRODUCTION_SETUP.sql ..." User-ul profesor nu intelege ce inseamna RLS.
- **No file type check:** Upload accepta orice extensie (.exe, .zip, etc.). No MIME validation client-side.
- **Size unlimited:** File input accepta orice size. Large files (>100MB) vor timeout la upload.
- **Storage path collision risk:** Path = `professors/${Date.now()}-${filename}`. Daca 2 profesori upload in acelasi ms, path-ul e unic OK, dar no explicit collision handling.
- **Delete no confirmation:** Click delete = auto-delete din DB. No "Are you sure?" dialog.
- **Edit form unfriendly:** Cand click edit, form se umple cu date dar nu scroll-ul la top. User nu stie sa scroll sus.

**Fisiere afectate:** `professor-panel.html` (inline script ~700 lines)

### 8. Profil, setari, pagini informative ✅ ~75% complet
**Status:** Structure OK, dar formuri nu executa save logic.

**Ce merge:**
- Profil page cu info dinamice (user ID, email, role, stats placeholders).
- Setari pagina cu tab-uri (General, Notificari, Confidentialitate, Aspect).
- Contact form HTML + RaportazaProblema + Termeni + Politica (static, compliant GDPR-wise).

**Probleme reale:**
- **Settings save missing:** Tab-urile exista (limba, regiune, timezone, dark mode) dar no actual `onChange` handler + no `localStorage.setItem()`. Dark mode toggle functioneaza global, dar settings UI nu se conecteaza.
- **Contact form submit:** HTML form exista, dar nu apeleaza functie de send email. Form action = "" → auto-POST la pagina curenta (error 405).
- **Raporteaza problema:** Form exista, si initial merge intr-un try/catch care apeleaza `saveReportQuery()`, dar no success/error UI feedback (silent save). User nu stie daca report-ul a ajuns.
- **Profil edit:** Pagina profil nu arata butoane "Edit". User nu poate schimba datele.
- **Notificari preferences:** Tab Notificari arata checkboxes (email alerts, SMS, etc.) dar nu se salveaza nowhere.

**Fisiere afectate:** `profile.html`, `settings.html`, `contact.html`, `raporteaza-problema.html`

### 9. UI global ✅ ~85% complet
**Status:** Theming merge, footer OK, dar cu edge-case bugs.

**Ce merge:**
- Dark mode toggle button cu icon (luna ↔ soare).
- Tema persistata in localStorage.
- CSS var-uri (`--accent`, `--text`, `--surface`, `--border-color`) applicate pe dark/light.
- Footer injectat from JS pe toate paginile.
- Toast notificari (`showNotification()`) in colt dreapta.
- Smooth scroll, back-to-top button.

**Probleme reale:**
- **Native select dark mode broken:** In dark mode, `<select>` native element in settings page = WHITE background cu BLACK text (invisible pe dark bg). Fix necesitar: `appearance: none; color-scheme: dark` CSS pe fiecare select (nu se vede in styles-global).
- **Notificari stacking:** Daca user declanseaza 5 notificari rapid, toti se suprapun in colt. No queue/dedup logic.
- **Footer inject timing:** Footer se injecteaza in `DOMContentLoaded`, dar daca pagina are deja footer hardcoded (e.g., `comments.html`), se creaza 2 footer-uri.
- **Theme apply delay:** La page load, tema se aplica dupa DOMContentLoaded. Brief flash în light mode inainte sa se aplice dark.
- **Back-to-top lag:** Button se injecteaza in FAB container, dar FAB container nu exista pe toate paginile pre-DOM ready. On pages fara FAB container pre-defined, se creeaza element nou dinamically.

**Fisiere afectate:** `interactive.js` (~2400 linii), `styles-global.css`

## Ce este in dezvoltare (PARTIAL - probleme concrete)

### 1. Uniformizare UI/UX (Actual state: ~40% completa)
**Problema: Stiluri inline ramnase pe multiple pagini**
- `raporteaza-problema.html`: Style inline direct pe `<h3>`, `<div>` (100+ linii de inline style).
- `contact.html`: Idem, Form styling inline.
- `discutie.html`, `comments.html`: Tab styling + form styling inline.
- Result: Greu de mentenut, imposibil sa customizezi tema daca vrei, Lighthouse accessibility score scade.

**Action items:**
1. Extract inline styles in `styles-informative.css` + `styles-community.css`.
2. Rename CSS classes sa fie descriptive (`form-field`, nu `style1`).
3. Reapply dark mode vars pe CSS novo (actual dark inputs in dark mode = invisible).

**Stadiu: BLOCKED** pana tema globala se decide clar (current = 5 CSS files diferite, no cohesione).

### 2. Unificare schema DB + naming (Actual state: ~20% refactored)
**Problema CRITICA: Naming chaos in cod creste cognitive load 10x**

Exemple de duplicare:
```
Profesori table:
  - `profesori` vs `professors` (legacy fallback)
  - `nume_complet` vs `full_name` vs `prenume` + `nume` separate
  - `materie` vs `materie_predata` vs `taught_subject`
  - `departament` vs `department`

Postari table:
  - `postari_forum` (intended) vs `posts` (legacy fallback)

Users table:
  - `utilizatori` (intended) vs `users` (expected by Supabase)
  - `email` vs `institutional_email` vs `email_personal`
```

Cod result:
```javascript
// From professors-filtering.js - normalizeSpecialization()
const v = (value || '').toLowerCase();
if (v.includes('tehnologia')) return 'Tehnologia Informatiei';
if (v.includes('multimedia')) return 'Ingineria Sistemelor Multimedia';
return 'Calculatoare'; // Default fallback

// From professor-profile.js - de 3 ori pe field:
const fullName = currentProfessor.nume_complet || currentProfessor.full_name || 'Profesor';
const specialization = currentProfessor.specializare || currentProfessor.specialization || '-';
```

**Risc:** Daca un prof are `full_name = NULL` dar `nume_complet = 'Ion'` in DB, codul gaseste 'Ion'. But if DB col = NULL, se afiseaza 'Profesor' generic.

**Action items:**
1. Create migration script SQL sa standardizeze date (EN + snake_case):
   - `profesori` → `professors`
   - `nume_complet` → `full_name`
   - `materie_predata` → `taught_subjects` (JSON)
   - etc.
2. Delete fallback-uri din JS dupa migration.
3. Add DB constraint: `NOT NULL` pe coloane required.

**Stadiu: NOT STARTED** - risc database consistency daca faci asta fara backup.

### 3. Flux postari/comentarii complete (Actual state: ~30% wired)
**Problema CRITICA: Save logic NU exista**

- Form HTML exista in `comments.html` si `discutie.html`.
- Form submit handler: NU vad `form.addEventListener('submit', handleSave)` in cod.
- Functie `initializePostCreation()` se apeleaza dar nu implement actual save la DB.
- Result: User completeaza form → apasa "Posteaza" → form se reset dar **nothing happens**. Silent fail.

**Action items:**
1. Implement `handlePostCreate()` + `handleCommentCreate()` in `interactive.js`:
   - Validate input (min 1 char titlu, min 5 char content).
   - Insert in `postari_forum` / `comments` cu user ID.
   - Retrieve fresh post data si re-render feed.
2. Add error handling + UI feedback ("Postare inregistrata cu succes" toast).
3. Wire URL params sa incarce post-ul cand user merge din feed → discutie page.

**Stadiu: DESIGN MISSING** - nu e clar sa am `comments` sau `forum_comments` table.

### 4. Politici RLS + Storage hardening (Actual state: ~60% implemented pero fragile)
**Problema: Warnings in code, no actual testing**

- Upload profesor = protected by `protectPage()`, dar RLS policy pe `documente` table?
  - Profesor trebuie sa vada doar **propriile** documente? Sau toti profesorii vad toate documente?
  - Code: `professor_id` col in documente table se assume dar nu verified daca exista.
- Storage upload → profesor_documents bucket. But what if bucket nu exista? Error message e helpful dar user trebuie sa ruleze SQL script manual.

**Action items:**
1. Add Supabase RLS policy explicit pe `documente` table:
   ```sql
   -- Profesor vede/modifica doar propriile documente
   CREATE POLICY "professor_sees_own_docs" ON public.documente
     FOR SELECT USING (auth.uid() = professor_id)
     FOR UPDATE USING (auth.uid() = professor_id);
   
   -- Students vad documente din specializari proprie (read only)
   CREATE POLICY "student_sees_relevant_docs" ON public.documente
     FOR SELECT USING (specialization = (SELECT specialization FROM utilizatori WHERE user_id = auth.uid()));
   ```
2. Test RLS policies in Supabase UI (role profesor vs student).
3. Add explicit error message in code daca RLS fail vs Storage fail.

**Stadiu: HALF-BAKED** - functionalitate merge pe happy path, dar no test coverage.

### 5. Curatarea documentatiei (Actual state: ~50% outdated)
**Problema: README-ul vechi + SQL script-urile nu se potrivesc perfect**

- `DATABASE_SETUP.md` listeaza ~8 coloane pe `profesori` table, dar cod asteapta 15+ variante.
- `SUPABASE_PRODUCTION_SETUP.sql` add-uleaza coloane cu `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, care inseamna migration nu s-a rulat clean niciodata.
- Seed script `supabase_professors_seed.sql` = 30 profesori, dar data e din 2024 (outdated academic year).

**Action items:**
1. Re-write `DATABASE_SETUP.md` cu actual schema:
   - Table list cu coloane + types + constraints + RLS policies.
   - Relationships (profesori → documente, utilizatori → recenzii_profesori, etc.).
2. Cleanup SQL script:
   - Single CREATE TABLE instead of ALTER TABLE ADD IF NOT.
   - Clear migrations history (clean apply vs incremental patches).
3. Add seed data cu date curente (pentru testing).

**Stadiu: IN PROGRESS** (UPDATE: ai rescris-o partial in README.md)

## Ce NU este facut complet (LIPSURI CRITICE)

### 1. Notificari real-time ❌ 0% functional end-to-end
**Problema: Table exist + admin UI, but no real-time subscription**

- `notificari` table create via SQL script ✅.
- Admin poate update `status` coloanei (nou → in_analiza) ✅.
- **BUT:** No WebSocket subscription din frontend. No badge update in header cand vine notificare noua. No sound/push daca e mobile.
- Code: `initializeAIChat()` function exista (injecteaza chat modal) dar notificari = zero integrace.

**Impact:** User pe pagina = NEVER se vede ca a primit notificare pana nu refresh pagina manual.

**To implement:**
1. Add Supabase Realtime subscription in `interactive.js`:
   ```javascript
   const channel = supabase.channel('public:notificari').on(
     'postgres_changes',
     { event: 'INSERT', schema: 'public', table: 'notificari', filter: `destinatar_id=eq.${user.id}` },
     (payload) => showNotificationBadge(payload)
   ).subscribe();
   ```
2. Add badge HTML in header: `<span id="notificationBadge" class="badge">0</span>`.
3. Add notification center page: list de notificari cu mark-as-read buttons.

**Effort:** ~4-6 oras (WebSocket + UI + badge count logic).

### 2. Moderare comunitate ❌ 0% functional
**Problema: Zero infrastructure pt moderare postari/comentarii**

- Admin panel = management utilizatori + raportari site-wide.
- **Missing:** 
  - Flag/report button pe postari ("This post is offensive").
  - Admin dashboard cu flagged content queue.
  - Actions: hide post, delete post, warn user, ban user.
  - Audit trail: cine a raportat cand, cine a actuat si cand.

**Impact:** Spammer posturi "BUY CRYPTO HERE" = zero recourse. Community degrades.

**To implement:**
1. Add table `post_reports`:
   ```sql
   CREATE TABLE post_reports (
     id BIGINT PRIMARY KEY,
     post_id BIGINT NOT NULL REFERENCES postari_forum(id) ON DELETE CASCADE,
     reporter_id UUID NOT NULL REFERENCES auth.users(id),
     reason TEXT (spam, offensive, ads, nsfw, etc.),
     status TEXT DEFAULT 'pending' (pending, reviewed, dismissed, resolved),
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```
2. Add "Report" button in feed card (`comments.html` post card).
3. Add "Moderation Queue" tab in admin.html.
4. Add "soft delete" logic (post.deleted_at timestamp, not hard delete).

**Effort:** ~8-10 ore (DB + UI + moderation workflow).

### 3. Testare automata + CI/CD ❌ 0% implementat
**Problema: No test suite, no automation**

- Ninguna `*.test.js` sau `*.spec.js` file in repo.
- No GitHub Actions / CI pipeline.
- Manual testing only = regression risk mare la fiecare change.

**To implement (MVP):**
1. Add Jest test suite:
   - `auth.test.js`: Test login/register/logout flows.
   - `professors-filtering.test.js`: Test filter logic.
   - `search.test.js`: Test global search normalization.
2. Add GitHub Actions workflow (`.github/workflows/test.yml`):
   - Run Jest on each PR.
   - Build check (no syntax errors).
   - Deploy to staging on merge to main.
3. Add E2E tests cu Playwright/Cypress (optional, mas time-intensive).

**Effort:** ~20-30 ore (test infrastructure + coverage de 50%).

### 4. Chat AI ❌ 0% functional (UI only, no LLM)
**Problema: Initiative fara execution**

- Button "ULBStudent AI" in FAB container ✅.
- Modal HTML cu message history + input ✅.
- **Missing:** Backend LLM integration. Mesaje se display la user dar nu se trimite nowhere.

**Code in interactive.js (line ~665):**
```javascript
function initializeAIChat() {
  // ... creates modal ...
  function sendMessage() {
    const text = document.getElementById('chatInput').value;
    // BUG: text se adauga in UI dar NU se trimite la LLM!
    // Ai response curat hardcoded:
    const aiResponse = 'Salut! Sunt asistentul AI... ';
  }
}
```

**To implement:**
1. Setup OpenAI API key (sau alt LLM: Claude, Cohere).
2. Supabase Edge Functions wrapper:
   ```javascript
   const response = await fetch('https://your-project.supabase.co/functions/v1/chat-ai', {
     method: 'POST',
     body: JSON.stringify({ message: userMessage, userId: currentUser.id })
   });
   ```
3. Call LLM cu system prompt (ULBStudent helper, catchy tone).
4. Add message history sa fie rezilient (daca reload page, history se pierde now - localStorage fix minimal).

**Effort:** ~6-8 ore (LLM integration sau mock).

### 5. Mesagerie privata ❌ 0% implementat
**Problema: Zero inbox, zero conversations**

- No DM button pe profil profesor.
- No messages table in DB.
- No conversation UI.

**To implement (MVP: 1-to-1 only, nu group):**
1. Add table `messages`:
   ```sql
   CREATE TABLE messages (
     id BIGINT PRIMARY KEY,
     sender_id UUID NOT NULL REFERENCES auth.users(id),
     recipient_id UUID NOT NULL REFERENCES auth.users(id),
     content TEXT NOT NULL,
     read_at TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```
2. Add page `inbox.html` + `conversation.html`.
3. Add real-time subscription sa afiseze mesaje noi (Supabase Realtime).
4. Notification badge cand mesaj nou.

**Effort:** ~10-12 ore.

---

## Rezumat lipsuri:
- **Real-time notificari:** Essential for engagement. Effort ~5h.
- **Moderare:** Essential for community health. Effort ~9h.
- **Tests:** Essential for reliability. Effort ~25h.
- **AI Chat:** Nice-to-have. Effort ~7h.
- **Messaging:** Nice-to-have. Effort ~11h.

**Total to "production-ready":** ~60 hours.

## Stare pe pagini (estimare)

- `index.html`: ~85% (functional, dar cu zone fallback/mix static-dinamic)
- `login.html` + `register.html`: ~95%
- `profesori.html`: ~90%
- `professor-profile.html`: ~90%
- `documente.html`: ~85%
- `comments.html`: ~85%
- `discutie.html`: ~80%
- `professor-panel.html`: ~85%
- `admin.html`: ~80%
- `profile.html`: ~80%
- `settings.html`: ~75%
- pagini informative (`contact.html`, `raporteaza-problema.html`, `termeni-conditii.html`, `politica-confidentialitate.html`): 85-100%

Estimare proiect overall: ~84% functional.

## Idei de dezvoltare (prioritizate)

### Prioritate mare (impact imediat)
1. Standardizare schema DB + query-uri.
- Alege o conventie unica pentru tabele/coloane (ideal: o singura limba, un singur naming style).
- Elimina fallback-urile duplicate din JS dupa migrare.

2. Finalizare real-time notificari.
- Supabase Realtime pe `notificari` + badge global in header + centru notificari dedicat.

3. Moderare comunitate minim viabila.
- Raportare post/comentariu + actiuni admin (hide/delete/restore) + motiv moderare.

4. Harden pe documente.
- Validari upload stricte (tip, dimensiune), metadata consistenta, politici RLS testate pentru profesor/admin/student.

### Prioritate medie
1. Refactor `interactive.js` in module.
- Exemplu: `theme.js`, `search.js`, `documents.js`, `community.js`, `home.js`.

2. Curatare UI si accesibilitate.
- Scoatere stiluri inline in fisiere CSS dedicate.
- Focus states, contrast, keyboard navigation pe componente interactive.

3. Telemetrie minima de produs.
- Evenimente utile (cautari, click pe documente, creari postari) pentru decizii de produs.

### Prioritate mica / nice-to-have
1. Mesagerie privata intre utilizatori.
2. PWA (offline cache + instalare pe mobil).
3. Search ranking mai inteligent (scor pe relevanta + typo tolerance).

## Observatii tehnice

- Setup DB si politici se configureaza din scripturile SQL din repo:
	- `SUPABASE_PRODUCTION_SETUP.sql`
	- `supabase_professors_seed.sql`
- Exista deja ghiduri in repo:
	- `DATABASE_SETUP.md`
	- `CSS_REFACTORING_GUIDE.md`

## Directie recomandata

Focus pe finalizarea fluxurilor deja implementate partial (standardizare schema, realtime notificari, moderare, teste) inainte de a adauga feature-uri noi mari. Asta va reduce bug-urile si costul de mentenanta.

