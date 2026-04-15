# ULBStudent - Platform Status

Actualizat: 15.04.2026

## Ce merge acum

- Autentificare si sesiune: login/register, persistenta sesiunii Supabase, listener de auth si redirect dupa autentificare.
- Roluri student/profesor/admin: detectie din baza de date pentru afisarea corecta a UI-ului si a paginilor protejate.
- Catalog profesori: listare, filtrare, profil profesor, recenzii si helpful votes.
- Recenzii profesori: adaugare recenzie din [profesori.html](profesori.html) si [professor-profile.html](professor-profile.html), inclusiv fallback pe schema mixta.
- Discutii si comentarii: salvare postari, citire/salvare comentarii si voturi pe postari/intrebari.
- Homepage data-driven: statistici, leaderboard, activitate recenta, testimoniale si anunturi renderizate din datele din DB.
- Cautare globala: filtreaza documente, postari, profesori, anunturi si recenzii din UI.
- Setari simplificate pentru ULBS: regiune/zone orara eliminate, tema si animatii persistate.
- Panel profesor: validare upload fisier (extensie, MIME, limita 25MB).
- UI si accesibilitate: toast-uri, loading states, meniu mobil responsive, lazy-loading media si imbunatatiri ARIA.

## Ce trebuie inca facut

- RLS final in Supabase pentru tabelele folosite de forum, comentarii, recenzii, documente si roluri.
- Curatarea completa a fallback-urilor locale pentru roluri; accesul final trebuie sa depinda de sesiunea si politicile din backend.
- Cautare server-side pentru continut mare sau dinamic; filtrarea actuala din browser este utila, dar nu suficienta ca solutie finala.
- Flux complet pentru documente in productie: upload real in Supabase Storage, URL-uri valide si gestionare a fisierelor lipsa.
- Real-time notifications (badge + subscribe Realtime).
- Moderare comunitate (report queue, flagging).
- Mesagerie privata.
- Audit logs, bulk operations, soft delete.
- Teste automate si CI (Jest/Cypress/Playwright/GitHub Actions).

## Ce nu este implementat

- Chat in timp real.
- Notificari live pentru voturi/comentarii/mesaje.
- Moderare avansata cu panou de review pentru raportari.
- Sistem complet de mesaje private.
- Analytics sau audit trail pentru actiunile importante.
- Acoperire automata de testare end-to-end.

## Setup rapid

1. Ruleaza [SUPABASE_PRODUCTION_SETUP.sql](SUPABASE_PRODUCTION_SETUP.sql) in Supabase SQL Editor.
2. Ruleaza [supabase_professors_seed.sql](supabase_professors_seed.sql) pentru seed profesori legacy.
3. Configureaza [supabase-client.js](supabase-client.js) cu URL + anon key.
4. Serveste proiectul local (ex: python -m http.server 5500).

## Modificari importante din ultimul update

1. Consolidare auth si sesiune:
	- [auth.js](auth.js): listener de auth, redirectionare dupa login si afisare corecta a rolului in UI.
	- [auth.js](auth.js): rolul afisat nu mai depinde de cache-ul local ca sursa principala.
2. Hardened homepage si cautare:
	- [index.html](index.html): anunturile pornesc cu un singur placeholder, fara seed-uri statice duplicat.
	- [interactive.js](interactive.js): rezultate de cautare escapate inainte de randare.
	- [index.html](index.html): adaugat H1 semantic ascuns pentru SEO si accesibilitate.
3. Functionalitati deja stabilizate:
	- [auth.js](auth.js): voturi pe postari si intrebari, plus citire voturi per user.
	- [interactive.js](interactive.js): notificari toast, meniu mobil responsive si incarcarea media pe lazy-load.
4. Stabilitate pe recenzii si setari:
	- [SUPABASE_PRODUCTION_SETUP.sql](SUPABASE_PRODUCTION_SETUP.sql): schema pentru recenzii si politici RLS extinse.
	- [settings.html](settings.html): setari simplificate pentru UX mai clar.

## Teste

### Teste statice executate

- Verificare erori VS Code Problems pentru fisierele modificate:
  - [auth.js](auth.js)
  - [professor-profile.js](professor-profile.js)
  - [professors-filtering.js](professors-filtering.js)
  - [SUPABASE_PRODUCTION_SETUP.sql](SUPABASE_PRODUCTION_SETUP.sql)
  - [settings.html](settings.html)
- Rezultat: fara erori.

### Teste functionale recomandate (manual, dupa SQL update)

1. Recenzie din lista profesori:
	- Deschide [profesori.html](profesori.html)
	- Click Adauga recenzie pe un profesor
	- Completeaza rating + comentariu
	- Verifica mesajul de succes si rating-ul actualizat.

2. Recenzie din profil profesor:
	- Deschide [professor-profile.html](professor-profile.html?id=...)
	- Trimite recenzie noua
	- Verifica aparitia recenziei in lista si recalculul mediei.

3. Verificare DB Supabase:
	- Confirma insert in tabelul recenzii_profesori.
	- Confirma read din recenzii_profesori pe id_profesor/profesor_id/professor_id.

4. Regression check discutii:
	- Creeaza postare in [comments.html](comments.html)
	- Adauga comentariu in [discutie.html](discutie.html?post=...)
	- Verifica persistenta dupa refresh.

5. Verificare homepage si cautare:
	- Deschide [index.html](index.html)
	- Confirma ca anunturile, statisticile si activity feed se incarca o singura data.
	- Ruleaza o cautare globala cu un text existent si unul inexistent.

6. Verificare roluri si sesiune:
	- Logheaza-te cu un cont student si unul profesor.
	- Verifica afisarea meniului corect si accesul la pagini protejate.
	- Da refresh si confirma ca sesiunea ramane activa.

## Observatie

Daca proiectul Supabase nu are inca structura actualizata, recenziile pot pica pana rulezi [SUPABASE_PRODUCTION_SETUP.sql](SUPABASE_PRODUCTION_SETUP.sql) (versiunea noua din repo).
