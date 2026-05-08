# ULBStudent - Setup Supabase

Nu crea manual tabele fragmentate din exemple vechi. Schema de productie este centralizata in fisiere SQL idempotente.

## Ordine recomandata

Ruleaza in Supabase SQL Editor:

```text
SUPABASE_PRODUCTION_SETUP.sql
SUPABASE_POLLS_MIGRATION.sql
supabase_professors_seed.sql
```

## Ce creeaza SQL-ul principal

`SUPABASE_PRODUCTION_SETUP.sql` acopera:

- profiluri si roluri: `utilizatori`, `studenti`
- profesori: `profesori`, fallback `professors`
- cursuri: `cursuri`, fallback `courses`
- documente: `documente`
- forum: `posts`, `postari_forum`, `comments`, `comentarii`, `questions`, `voturi`
- recenzii: `recenzii_profesori`, `recenzii_utile`
- suport: `raportari`, `notificari`
- Storage buckets: `documente`, `post-attachments`
- RLS policies pentru citire publica, creare autentificata si editare/stergere doar de autor sau admin.

`SUPABASE_POLLS_MIGRATION.sql` acopera sondajele reale:

- `polls`
- `poll_options`
- `poll_votes`
- `allow_multiple_answers`
- unicitate vot per utilizator si sondaj
- trigger care valideaza optiunile selectate si blocheaza voturile multiple la sondaje single-choice.

`supabase_professors_seed.sql` populeaza lista legacy `professors` pentru compatibilitate.

## Normalizare recomandata

Pentru productie, foloseste ca sursa canonica:

```text
posts, comments, profesori, studenti, cursuri, documente,
polls, poll_options, poll_votes
```

Tabelele `postari_forum`, `comentarii`, `professors`, `courses` raman fallback pentru date existente.

## Atentie la migrari live

Daca in baza live `voturi.post_id` este `uuid`, iar `posts.id` este `bigint`, nu face conversie directa fara backup. Creeaza o coloana noua compatibila sau migreaza intr-o fereastra controlata.

Daca `profesori.id` nu este identity, scriptul incearca sa seteze identity in mod sigur; daca Supabase refuza din cauza datelor existente, verifica manual coloana.

## Storage

- `documente`: public, fisiere de curs/laborator/seminar.
- `post-attachments`: public, atasamente pentru forum.
- `avatars`: optional, creeaza-l doar daca activezi upload avatar.

## Edge Function

Pentru `Ajutor AI`:

```bash
supabase functions deploy chat-facultate
supabase secrets set GEMINI_API_KEY=cheia_ta_gemini
```

Secretul ramane in Supabase, nu in browser.
