# Ghid Setup Bază de Date - ULBStudent

## ⚠️ ACȚIUNE REQUIRATĂ: Crează Tabelele în Supabase

Pentru ca aplicația să funcționeze complet, trebuie să creezi următoarele tabele în baza ta de date Supabase.

### Accesează Supabase SQL Editor:
1. Du-te la [supabase.com](https://supabase.com)
2. Deschide proiectul tău
3. Merge la **SQL Editor** (în stânga)
4. Copiază și rulează fiecare comandă mai jos

---

## 🗄️ Tabele necesare:

### 0️⃣ Tabel pentru PROFESORI + Seed oficial

Rulează fișierul SQL din proiect: `supabase_professors_seed.sql`.

Acest script:
- creează tabelul `professors`
- adaugă politicile RLS necesare
- inserează lista oficială de profesori (upsert după email)

---

### 1️⃣ Tabel pentru ÎNTREBĂRI (index.html)

```sql
CREATE TABLE public.questions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  upvotes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seteaza RLS (Row Level Security) pentru securitate
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Permite oricui sa vada intrebarile
CREATE POLICY "Allow read access for all" ON public.questions
  FOR SELECT USING (true);

-- Permite logat sa creeze intrebari
CREATE POLICY "Allow insert for authenticated users" ON public.questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Permite userului sa se stearga propriile intrebari
CREATE POLICY "Allow delete own questions" ON public.questions
  FOR DELETE USING (auth.uid() = user_id);
```

---

### 2️⃣ Tabel pentru POSTĂRI (subreddit.html)

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

### 3️⃣ Tabel pentru COMENTARII (comments.html)

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

### 4️⃣ Tabel pentru TEAM MATCHING (team-matching.html)

```sql
CREATE TABLE public.matches (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id_1 UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id_2 UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  match_type TEXT DEFAULT 'like',
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read own matches" ON public.matches
  FOR SELECT USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

CREATE POLICY "Allow insert for authenticated users" ON public.matches
  FOR INSERT WITH CHECK (auth.uid() = user_id_1);
```

---

## ✅ Verificare: După ce ai creat tabelele

1. Mergi la **Tabel Editor** în Supabase
2. Ar trebui să vezi 4 tabele noi:
   - ✅ `questions`
   - ✅ `posts`
   - ✅ `comments`
   - ✅ `matches`

3. Testează crearea unui cont și vê dacă posturile se salvează!

---

## 🚀 Funcționalitate după Setup:

### Pe **subreddit.html**:
- ✅ Creezi o postare → Se salvează automat în DB
- ✅ Postarea apare cu username-ul tău
- ✅ Toate postările se pun pe o coadă în DB

### Pe **comments.html**:
- ✅ Adaugi un comentariu → Se salvează în DB
- ✅ Link-urile sunt incluse cu post_id

### Pe **index.html** (în desarrollo):
- 🔄 Salvare automată de întrebări (în lucru)

### Pe **team-matching.html** (în dezvoltare):
- 🔄 Salvare matches în DB (în lucru)

---

## ⚙️ Funcții disponibile în `auth.js`:

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

## 🐛 Troubleshooting

**„Eroare: RLS policy violation"**
- Nu ești logat! Conectează-te înainte de a posta

**„Eroare: Table not found"**
- Tabela nu a fost creată. Rulează SQL-ul din nou

**„Nu se salvează în DB"**
- Verifica console (F12) pentru erori
- Asigură-te că ești logat
- Check RLS policies în Supabase

---

## 📞 Support

Dacă ai probleme:
1. Verifica console-ul browser (F12 → Console)
2. Verifica Supabase logs (Logs → Edge Functions)
3. Asigură-te că ai API key corectă în `auth.js`

