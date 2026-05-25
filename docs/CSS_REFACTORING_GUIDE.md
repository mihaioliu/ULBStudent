# ULBStudent - Sistem CSS

CSS-ul este impartit pe niveluri ca sa ramana usor de mentinut si coerent vizual.

## Fisiere active

- `styles-global.css` - baza globala, layout, header, footer, formulare, dark mode si responsive.
- `app-polish.css` - strat premium peste toate paginile: carduri, umbre, glass, butoane, spacing.
- `styles-documents.css` - biblioteca de documente.
- `styles-professors.css` - catalog profesori, profil profesor si recenzii.
- `styles-subreddit.css` - forum, postari, comentarii si sondaje.
- `toast-notifications.css` - notificari/toast.

## Reguli de lucru

1. Pastreaza variabilele globale in `styles-global.css`.
2. Pune finisajele transversale in `app-polish.css`.
3. Pune stilurile de pagina in fisierul dedicat paginii.
4. Nu crea CSS duplicat pentru acelasi component daca exista deja clasa globala.
5. Testeaza mereu light mode, dark mode si mobil.

## Includere recomandata

Paginile trebuie sa includa cel putin:

```html
<link rel="stylesheet" href="styles-global.css" />
<link rel="stylesheet" href="app-polish.css" />
```

Paginile specializate mai includ fisierul dedicat:

```html
<link rel="stylesheet" href="styles-documents.css" />
<link rel="stylesheet" href="styles-professors.css" />
<link rel="stylesheet" href="styles-subreddit.css" />
```

## Checklist QA vizual

- Header si meniu mobil functionale.
- Textul nu iese din container.
- Butoanele au hover/focus.
- Formularele au stari de loading/error/success.
- Cardurile au spacing si border-radius consistent.
- Footerul este coerent pe desktop si mobil.
- Nu exista overflow orizontal pe telefon.
