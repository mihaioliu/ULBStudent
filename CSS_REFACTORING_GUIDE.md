# Structura CSS Refactorizata

Bun venit! CSS-ul a fost reorganizat in mai multe fisiere pentru mentenabilitate si performanta mai bune.

## Fisiere CSS disponibile

- **styles.css** (original) - pastrat pentru compatibilitate
- **styles-global.css** - stiluri globale comune (header, footer, variabile, dark mode)
- **styles-subreddit.css** - stiluri specifice pentru subreddit.html
- **styles-documents.css** - stiluri specifice pentru documente.html
- **styles-professors.css** - stiluri specifice pentru profesori.html

## Cum incluzi CSS-ul in fiecare pagina

### Pagini simple (index, login, register, profile, settings etc.)

```html
<link rel="stylesheet" href="styles-global.css">
```

### subreddit.html

```html
<link rel="stylesheet" href="styles-global.css">
<link rel="stylesheet" href="styles-subreddit.css">
```

### documente.html

```html
<link rel="stylesheet" href="styles-global.css">
<link rel="stylesheet" href="styles-documents.css">
```

### profesori.html

```html
<link rel="stylesheet" href="styles-global.css">
<link rel="stylesheet" href="styles-professors.css">
```

## Beneficii

- Incarcare mai eficienta: fiecare pagina ia doar CSS-ul necesar
- Mentenabilitate mai buna: stilurile sunt separate pe zone clare
- Reutilizare corecta: stilurile comune stau in styles-global.css
- Debugging mai simplu: gasesti rapid unde trebuie modificat

## Checklist de verificare

1. Verifica fiecare pagina pe desktop.
2. Verifica fiecare pagina pe mobil.
3. Testeaza tema dark mode pe toate paginile.
4. Verifica elementele de header/footer si formularele.

## Optional: foloseste styles-global.css ca styles.css principal

1. Sterge styles.css original.
2. Redenumeste styles-global.css in styles.css.
3. Actualizeaza link-urile din paginile HTML.
4. Ruleaza verificari vizuale dupa schimbare.

## Revert

Daca ceva nu merge, revino la styles.css original si la includerile initiale.

---

**Creat:** 31.03.2026
**Versiune:** 1.1
