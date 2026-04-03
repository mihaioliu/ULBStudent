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
