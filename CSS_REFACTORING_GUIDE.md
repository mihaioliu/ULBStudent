# Structura CSS Refactorizată

Bun venit! CSS-ul a fost reorganizat în mai multe fișiere pentru o mai bună mentenabilitate și performanță. Iată cum usar fiecare pagină HTML:

## Fișiers CSS disponibile

- **styles.css** (original) - Păstrat pentru compatibilitate
- **styles-global.css** - Stiluri globale comune (header, footer, variabile, dark mode)
- **styles-subreddit.css** - Stiluri specifice pentru subreddit.html
- **styles-team-matching.css** - Stiluri specifice pentru team-matching.html
- **styles-documents.css** - Stiluri specifice pentru documente.html
- **styles-professors.css** - Stiluri specifice pentru pagina de profesori

## Cum să incluzi CSS-ul în fiecare pagină HTML

### Pentru pagini simple (index.html, login.html, register.html, profile.html, settings.html, etc.)

Includ doar:
```html
<link rel="stylesheet" href="styles-global.css">
```

### Pentru subreddit.html

Includ:
```html
<link rel="stylesheet" href="styles-global.css">
<link rel="stylesheet" href="styles-subreddit.css">
```

### Pentru team-matching.html

Includ:
```html
<link rel="stylesheet" href="styles-global.css">
<link rel="stylesheet" href="styles-team-matching.css">
```

### Pentru documente.html

Includ:
```html
<link rel="stylesheet" href="styles-global.css">
<link rel="stylesheet" href="styles-documents.css">
```

### Pentru pagina de profesori (dacă exisă) 

Includ:
```html
<link rel="stylesheet" href="styles-global.css">
<link rel="stylesheet" href="styles-professors.css">
```

## Beneficii ai acestei structuri

✅ **Performanță mai bună** - Fiecare pagină încarcă doar CSS-ul necesar
✅ **Mentenabilitate** - Fiecare pagină are propriul set de stiluri organizat
✅ **Reîntrebuințare** - Stiluri comune sunt în styles-global.css
✅ **Ușor de găsit** - CSS pentru o pagină e în propriul fișier
✅ **Caching mai bun** - Browserul cachează stilurile globale separat

## Înainte de a folosi o structură nouă:

1. **Testează** - Deschide fiecare pagină și verifică că arată corect
2. **Verifică tema** - Testează dark mode și night mode pe fiecare pagină
3. **Responsive** - Testează pe mobile pentru a te asigura că merge bine

## Opțional: Setează styles-global.css ca main styles.css

Dacă vrei să faci asta, poti:
1. Șterge styles.css original
2. Renumește styles-global.css în styles.css
3. Actualizeaza path-urile din toate HTML-urile
4. Verifică că totul merge

## Dacă vrei revert

Dacă ceva nu merge, poți reveni la styles.css original și folosi direct acel fișier în toți HTML-urile.

---

**Creat:** 31.03.2026
**Versiune:** 1.0
