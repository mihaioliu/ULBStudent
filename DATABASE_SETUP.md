# Ghid Setup Baza de Date - ULBStudent

## Actiune necesara: creeaza tabelele in Supabase

Pentru ca aplicatia sa functioneze corect, trebuie sa creezi tabelele de mai jos in proiectul tau Supabase.

### Acces in SQL Editor

1. Intra pe https://supabase.com
2. Deschide proiectul tau
3. Mergi la SQL Editor
4. Ruleaza comenzile de mai jos

---

## Tabele necesare

### 0) Tabel profesori + seed oficial

Ruleaza fisierul SQL din proiect: `supabase_professors_seed.sql`.

Acest script:
- creeaza tabelul `professors`
- adauga politicile RLS necesare
- insereaza lista oficiala de profesori (upsert dupa email)

---

### 1) Tabel pentru intrebari (index.html)

```sql
CREATE TABLE public.questions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  upvotes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for all" ON public.questions
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for authenticated users" ON public.questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow delete own questions" ON public.questions
  FOR DELETE USING (auth.uid() = user_id);
```

---

### 2) Tabel pentru postari (subreddit.html)

```sql
CREATE TABLE public.posts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  votes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for all" ON public.posts
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for authenticated users" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow delete own posts" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);
```

---

### 3) Tabel pentru comentarii (comments.html)

```sql
CREATE TABLE public.comments (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  post_id BIGINT REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT 'Anonim',
  email TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for all" ON public.comments
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for all" ON public.comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow delete own comments" ON public.comments
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);
```

---

### 4) Tabel pentru feedback util pe recenzii

```sql
CREATE TABLE public.recenzii_utile (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  review_id BIGINT REFERENCES public.recenzii_profesori(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (review_id, user_id)
);

ALTER TABLE public.recenzii_utile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read all helpful votes" ON public.recenzii_utile
  FOR SELECT USING (true);

CREATE POLICY "Allow insert own helpful votes" ON public.recenzii_utile
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow delete own helpful votes" ON public.recenzii_utile
  FOR DELETE USING (auth.uid() = user_id);
```

---

### 5) Rol admin in `utilizatori`

```sql
ALTER TABLE public.utilizatori
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

UPDATE public.utilizatori
SET role = 'admin'
WHERE lower(email) = 'admin@ulbstudent.ro';
```

---

### 6) Tabele pentru Contact si Raportari

```sql
CREATE TABLE IF NOT EXISTS public.raportari (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  type TEXT,
  page TEXT,
  severity TEXT,
  description TEXT,
  status TEXT DEFAULT 'nou',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notificari (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT,
  title TEXT,
  message TEXT,
  email TEXT,
  status TEXT DEFAULT 'nou',
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.raportari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificari ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rls_read" ON public.raportari;
DROP POLICY IF EXISTS "rls_insert" ON public.raportari;
DROP POLICY IF EXISTS "rls_update" ON public.raportari;
DROP POLICY IF EXISTS "rls_delete" ON public.raportari;

CREATE POLICY "rls_read" ON public.raportari
  FOR SELECT USING (true);

CREATE POLICY "rls_insert" ON public.raportari
  FOR INSERT WITH CHECK (true);

CREATE POLICY "rls_update" ON public.raportari
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "rls_delete" ON public.raportari
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "rls_read" ON public.notificari;
DROP POLICY IF EXISTS "rls_insert" ON public.notificari;
DROP POLICY IF EXISTS "rls_update" ON public.notificari;
DROP POLICY IF EXISTS "rls_delete" ON public.notificari;

CREATE POLICY "rls_read" ON public.notificari
  FOR SELECT USING (true);

CREATE POLICY "rls_insert" ON public.notificari
  FOR INSERT WITH CHECK (true);

CREATE POLICY "rls_update" ON public.notificari
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "rls_delete" ON public.notificari
  FOR DELETE USING (auth.uid() = user_id);
```

---

## Verificare dupa setup

1. Mergi in Table Editor.
2. Verifica existenta tabelelor:
   - `questions`
   - `posts`
   - `comments`
3. Testeaza creare cont si postare/comentariu.

---

## Functionalitate disponibila in auth.js

```javascript
// SALVARE
await saveQuestion(title, description);
await savePost(title, content);
await saveComment(postId, name, email, content);

// CITIRE
await getQuestions();
await getPosts();
await getComments(postId);
```

---

## Troubleshooting

**Eroare: RLS policy violation**
- Nu esti logat. Conecteaza-te inainte de a posta.

**Eroare: Table not found**
- Tabela nu a fost creata. Ruleaza SQL-ul din nou.

**Nu se salveaza in DB**
- Verifica consola browserului (F12).
- Verifica daca esti autentificat.
- Verifica politicile RLS din Supabase.

---

## Support

Daca ai probleme:
1. Verifica consola browserului (F12 -> Console)
2. Verifica Supabase logs (Logs -> Edge Functions)
3. Verifica API key-ul din `auth.js`
