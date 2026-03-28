/**
 * INTERACTIVE.JS - ULBStudent Platform Interactivity
 * Gestionează: teme, votare, notificări, căutare, gamificație, theme toggle
 */

document.addEventListener('DOMContentLoaded', function() {
  // Inițializez toate funcțiile interactive când DOM este gata
  initializeThemeToggle();          // 🌓 Tema (Light/Dark/Night)
  initializeVotingSystem();         // 👍 Sistem de upvote/downvote
  initializeNavigation();           // 🔗 Marcaje active în meniu
  initializeScrollEffects();        // 📜 Animații pe scroll
  initializeSearchBar();            // 🔍 Căutare cu focus effect
  initializeQuestionFilters();      // 🎯 Filtrare întrebări
  initializeLikeButton();           // ❤️ Favorite questions
  initializeBackToTop();            // ⬆️ Buton sus
  initializeAuthButtons();          // 🔐 Sign in/up
  initializeGamification();         // 🎮 Puncte și badges
  initializeReviewInteractions();   // ⭐ Click pe recenzii
  initializeAnnouncementButtons();  // 📢 Marcare anunțuri
  initializeGlobalSearch();         // 🔎 Căutare globală
  initializeScrollAnimations();     // ✨ Animații secțiuni pe scroll
  initializeDocumentFilters();      // 📚 Filtrare documente
});

/**
 * 0. THEME TOGGLE - Comută între Light/Dark/Night mode
 * Salvează preferință în localStorage pentru persistență
 */
function initializeThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  
  // Restaurez tema salvată din localStorage (default: light)
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);
  
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      // Determinez next theme: light → dark → night → light
      const isDarkMode = document.body.classList.contains('dark-mode');
      const isNightMode = document.body.classList.contains('night-mode');
      
      let newTheme;
      if (!isDarkMode) newTheme = 'dark';
      else if (isDarkMode && !isNightMode) newTheme = 'night';
      else newTheme = 'light';
      
      applyTheme(newTheme);
      localStorage.setItem('theme', newTheme); // Salvez preferința
    });
  }
}

/**
 * Aplică tema la DOM și actualizez iconul butonului
 */
function applyTheme(theme) {
  const themeToggle = document.getElementById('themeToggle');
  
  if (theme === 'dark') {
    // Dark mode: culori medii, ușor de citit pe durata zilei
    document.body.classList.add('dark-mode');
    document.body.classList.remove('night-mode');
    if (themeToggle) {
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
      themeToggle.title = 'Mod clar';
    }
  } else if (theme === 'night') {
    // Night mode: ultra-dark, pentru studiat noaptea
    document.body.classList.add('dark-mode', 'night-mode');
    if (themeToggle) {
      themeToggle.innerHTML = '<i class="fas fa-star"></i>';
      themeToggle.title = 'Mod noapte';
    }
  } else {
    // Light mode: implicit, culori vive și luminoase
    document.body.classList.remove('dark-mode', 'night-mode');
    if (themeToggle) {
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
      themeToggle.title = 'Mod întunecat';
    }
  }
}

// ============================================
// 0.5 AUTHENTICATION BUTTONS
// ============================================
function initializeAuthButtons() {
  const signInBtn = document.querySelector('.btn-signin');
  const signUpBtn = document.querySelector('.btn-signup');
  
  if (signInBtn) {
    signInBtn.addEventListener('click', showSignInModal);
  }
  
  if (signUpBtn) {
    signUpBtn.addEventListener('click', showSignUpModal);
  }
}

function showSignInModal() {
  showNotification('🔐 Funcția de Sign In va fi disponibilă în curând!');
}

function showSignUpModal() {
  showNotification('📝 Funcția de Sign Up va fi disponibilă în curând!');
}

/**
 * 1. VOTING SYSTEM - Upvote/Downvote cu animații
 * Permite utilizatorilor să voteze pe întrebări cu feedback vizual
 */
let votes = {
  q1: 24,   // Voturi exemplu pentru primele 3 întrebări
  q2: 18,
  q3: 30
};

function initializeVotingSystem() {
  // Selectez toate coloanele de vot pe pagină
  const voteColumns = document.querySelectorAll('.vote-column');
  
  voteColumns.forEach((column, index) => {
    // Găsesc butoanele upvote și downvote în fiecare coloană
    const upButton = column.querySelector('.fa-arrow-up');
    const downButton = column.querySelector('.fa-arrow-down');
    const voteCount = column.querySelector('span'); // Elementul care afișează numărul
    
    // Buton upvote - incrementez și animez cu verde
    if (upButton) {
      upButton.addEventListener('click', function() {
        handleVote('up', voteCount, index);
      });
    }
    
    // Buton downvote - decrementez și animez cu roșu
    if (downButton) {
      downButton.addEventListener('click', function() {
        handleVote('down', voteCount, index);
      });
    }
  });
}

/**
 * Gestionez clic upvote/downvote cu feedback vizual
 */
function handleVote(direction, voteElement, questionIndex) {
  const voteKey = 'q' + (questionIndex + 1);
  const currentVotes = parseInt(voteElement.textContent);
  
  if (direction === 'up') {
    // Upvote: incrementez, color verde, particule
    votes[voteKey]++;
    voteElement.textContent = votes[voteKey];
    voteElement.style.color = '#22c55e';
    createParticles(voteElement, '#22c55e'); // Animație floating particles
  } else {
    // Downvote: decrementez, color roșu, particule
    votes[voteKey]--;
    voteElement.textContent = votes[voteKey];
    voteElement.style.color = '#ef4444';
    createParticles(voteElement, '#ef4444');
  }
  
  // Reset color after animation
  setTimeout(() => {
    voteElement.style.color = '';
  }, 500);
}

/**
 * Creez particule animate care plutesc când click upvote/downvote
 * Particule colorate se ridică și se estompează (feedback engajment)
 */
function createParticles(element, color) {
  const rect = element.getBoundingClientRect();
  const particle = document.createElement('div');
  
  // Setez CSS inline: poziție fixed, cercuri colorate, animație particleFloat
  particle.style.cssText = `
    position: fixed;
    left: ${rect.left + rect.width / 2}px;
    top: ${rect.top}px;
    width: 30px;
    height: 30px;
    background: ${color};
    border-radius: 50%;
    pointer-events: none;
    animation: particleFloat 1s ease-out forwards;
  `;
  
  document.body.appendChild(particle); // Adaug la DOM
  setTimeout(() => particle.remove(), 1000); // Sterg după animație
}

// ============================================
// 2. NAVIGATION EFFECTS - Marcaj activ pe meniu
// ============================================
function initializeNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      // Remove active class from all links
      navLinks.forEach(l => l.classList.remove('active'));
      // Add active class to clicked link
      this.classList.add('active');
    });
  });
}

// ============================================
// 3. SCROLL EFFECTS
// ============================================
function initializeScrollEffects() {
  const header = document.querySelector('header');
  let lastScrollY = 0;
  
  window.addEventListener('scroll', function() {
    if (window.scrollY > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
  
  // Reveal animations on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });
  
  document.querySelectorAll('.question, .doc-card').forEach(el => {
    observer.observe(el);
  });
}

// ============================================
// 4. SEARCH BAR INTERACTIVITY
// ============================================
function initializeSearchBar() {
  const SearchInputs = document.querySelectorAll('.search-input');
  const searchSection = document.querySelector('.search-section');
  
  SearchInputs.forEach(input => {
    input.addEventListener('focus', function() {
      if (searchSection) {
        searchSection.style.transform = 'scale(1.02)';
        searchSection.style.boxShadow = '0 15px 40px rgba(78, 91, 128, 0.2)';
      }
    });
    
    input.addEventListener('blur', function() {
      if (searchSection) {
        searchSection.style.transform = 'scale(1)';
        searchSection.style.boxShadow = 'var(--shadow-lg)';
      }
    });
  });
  
  // Search form submission
  const searchForm = document.querySelector('.search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const professor = document.getElementById('professor')?.value || '';
      const specialization = document.getElementById('specialization')?.value || '';
      const subject = document.getElementById('subject')?.value || '';
      const year = document.getElementById('year')?.value || '';
      
      console.log('Searching for:', { professor, specialization, subject, year });
      showNotification('Căutare efectuată pentru: ' + [professor, specialization, subject, year].filter(Boolean).join(', '));
    });
  }
}

// ============================================
// 5. QUESTION FILTERING
// ============================================
function initializeQuestionFilters() {
  const sortSelect = document.getElementById('sort-select');
  
  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      const questions = document.querySelectorAll('.question');
      const option = this.value;
      
      filterQuestions(questions, option);
    });
  }
}

function filterQuestions(questions, option) {
  const questionsArray = Array.from(questions);
  
  switch(option) {
    case 'Cele mai recente':
      questionsArray.reverse();
      break;
    case 'Cele mai helpful':
      questionsArray.sort((a, b) => {
        const votesA = parseInt(a.querySelector('.vote-column span').textContent);
        const votesB = parseInt(b.querySelector('.vote-column span').textContent);
        return votesB - votesA;
      });
      break;
    case 'Cele mai comentate':
      questionsArray.sort((a, b) => {
        const commentsA = parseInt(a.querySelector('.meta-item:nth-child(3)').textContent);
        const commentsB = parseInt(b.querySelector('.meta-item:nth-child(3)').textContent);
        return commentsB - commentsA;
      });
      break;
  }
  
  const container = document.querySelector('.question-list');
  questionsArray.forEach((q, index) => {
    q.style.animation = 'none';
    setTimeout(() => {
      q.style.animation = `slideUp 0.5s ease-out ${index * 0.1}s forwards`;
    }, 10);
  });
  
  container.append(...questionsArray);
}

// ============================================
// 6. LIKE/FAVORITE FUNCTIONALITY
// ============================================
function initializeLikeButton() {
  const questions = document.querySelectorAll('.question');
  
  questions.forEach((question, index) => {
    const metaSection = question.querySelector('.question-meta');
    
    if (metaSection) {
      const likeBtn = document.createElement('button');
      likeBtn.className = 'like-btn';
      likeBtn.innerHTML = '♡ Favorite';
      likeBtn.setAttribute('data-liked', 'false');
      
      likeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        toggleLike(this);
      });
      
      metaSection.appendChild(likeBtn);
    }
  });
}

function toggleLike(button) {
  const isLiked = button.getAttribute('data-liked') === 'true';
  
  if (isLiked) {
    button.setAttribute('data-liked', 'false');
    button.innerHTML = '♡ Favorite';
    button.style.color = '#888';
  } else {
    button.setAttribute('data-liked', 'true');
    button.innerHTML = '♥ Favorite';
    button.style.color = '#ff69b4';
    createParticles(button, '#ff69b4');
  }
}

// ============================================
// 7. NOTIFICATIONS - Toast messages
// ============================================
/**
 * Afișez notificări toast în colțul jos-dreapta
 * Slide-in cu animație la apariție, dispariție după 3 sec
 */
function showNotification(message) {
  // Creez element div cu clasa 'notification'
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  
  // Stil inline: poziție fixed, gradient roșu, shadow
  notification.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    background: linear-gradient(135deg, #e63946 0%, #d63447 100%);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 8px 20px rgba(230, 57, 70, 0.4);
    z-index: 1000;
    animation: slideInRight 0.5s ease-out;
  `;
  
  document.body.appendChild(notification); // Adaug la pagină
  
  // Auto-dismiss după 3 secunde cu slide-out animație
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.5s ease-out forwards';
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

// ============================================
// 8. BACK TO TOP BUTTON
// ============================================
function initializeBackToTop() {
  const backToTopBtn = document.createElement('button');
  backToTopBtn.id = 'backToTop';
  backToTopBtn.innerHTML = '↑';
  backToTopBtn.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, #e63946 0%, #d63447 100%);
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 24px;
    cursor: pointer;
    display: none;
    z-index: 999;
    box-shadow: 0 8px 20px rgba(230, 57, 70, 0.3);
    transition: all 0.3s ease;
  `;
  
  document.body.appendChild(backToTopBtn);
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopBtn.style.display = 'flex';
      backToTopBtn.style.alignItems = 'center';
      backToTopBtn.style.justifyContent = 'center';
    } else {
      backToTopBtn.style.display = 'none';
    }
  });
  
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  
  backToTopBtn.addEventListener('mouseenter', () => {
    backToTopBtn.style.transform = 'scale(1.1)';
  });
  
  backToTopBtn.addEventListener('mouseleave', () => {
    backToTopBtn.style.transform = 'scale(1)';
  });
}

// ============================================
// CSS ANIMATIONS IN JAVASCRIPT
// ============================================
const styles = document.createElement('style');
styles.textContent = `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes particleFloat {
    to {
      transform: translateY(-100px);
      opacity: 0;
    }
  }
  
  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
  
  .like-btn {
    background: none;
    border: none;
    color: #888;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }
  
  .like-btn:hover {
    background: rgba(255, 105, 180, 0.1);
    transform: scale(1.2);
  }
`;
document.head.appendChild(styles);

// ============================================
// 8. GAMIFICATION SYSTEM
// ============================================
function initializeGamification() {
  // Initialize user reputation from localStorage
  let userReputation = JSON.parse(localStorage.getItem('userReputation')) || {
    points: 450,
    badges: ['Boboc Curios', 'Salvator', 'Expert Math'],
    helpfulUpvotes: 0
  };

  // Handle badge clicks for more info
  const badgeItems = document.querySelectorAll('.badge-item');
  badgeItems.forEach(badge => {
    badge.addEventListener('click', function(e) {
      if (!this.classList.contains('locked')) {
        const badgeName = this.querySelector('.badge-name').textContent;
        const badgeInfo = {
          'Boboc Curios': 'Ai dat deja 10 răspunsuri! 🎓 Bine ai în comunitate!',
          'Salvator': 'Ai ajutat alți studenți cu 50 upvote-uri! 🆘 Ești un erou!',
          'Expert Math': 'Ai postări despre Matematică cu peste 100 upvote-uri! 🔢'
        };
        
        if (badgeInfo[badgeName]) {
          showNotification(badgeInfo[badgeName]);
        }
      }
    });
  });

  localStorage.setItem('userReputation', JSON.stringify(userReputation));
}

// ============================================
// 9. REVIEW INTERACTIONS
// ============================================
function initializeReviewInteractions() {
  const helpfulCounts = document.querySelectorAll('.helpful-count');
  
  helpfulCounts.forEach(helpful => {
    helpful.addEventListener('click', function(e) {
      e.stopPropagation();
      
      // Get current count
      let count = parseInt(this.textContent);
      
      // Increment count
      count++;
      
      // Update display
      this.textContent = `👍 ${count} găsit util`;
      
      // Add animation
      this.style.transform = 'scale(1.15)';
      setTimeout(() => {
        this.style.transform = 'scale(1)';
      }, 150);

      // Show feedback
      showNotification('Mulțumim pentru feedback! ❤️');
      
      // Track reputation (simulate point gain)
      let userReputation = JSON.parse(localStorage.getItem('userReputation')) || { points: 0 };
      userReputation.points += 1;
      localStorage.setItem('userReputation', JSON.stringify(userReputation));
    });

    // Add pointer cursor
    helpful.style.cursor = 'pointer';
  });
}

// ============================================
// 10. ANNOUNCEMENT INTERACTIONS
// ============================================
function initializeAnnouncementButtons() {
  const markReadButtons = document.querySelectorAll('.btn-mark-read');
  
  markReadButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      
      const card = this.closest('.announcement-card');
      
      // Add faded effect
      card.style.opacity = '0.6';
      card.style.pointerEvents = 'none';
      
      // Update button text
      this.textContent = '✓ Citit';
      this.disabled = true;
      
      // Show notification
      showNotification('Anunț marcat ca citit! 📖');
      
      // Save to localStorage
      let readAnnouncements = JSON.parse(localStorage.getItem('readAnnouncements')) || [];
      const announcementId = card.querySelector('h4').textContent;
      if (!readAnnouncements.includes(announcementId)) {
        readAnnouncements.push(announcementId);
      }
      localStorage.setItem('readAnnouncements', JSON.stringify(readAnnouncements));
    });
  });
}

// ============================================
// 11. GLOBAL SEARCH SYSTEM
// ============================================
function initializeGlobalSearch() {
  const globalSearchInput = document.getElementById('globalSearchInput');
  const globalSearchBtn = document.getElementById('globalSearchBtn');
  const searchResults = document.getElementById('searchResults');
  const resultsList = document.getElementById('resultsList');
  const searchQuery = document.getElementById('searchQuery');
  const closeResults = document.querySelector('.btn-close-results');

  // Sample data for search
  const searchableData = {
    professors: [
      { name: 'Prof. Dr. Alexandru Dinu', subject: 'Matematică I', rating: 4.5 },
      { name: 'Prof. Dr. Maria Popescu', subject: 'Fizică II', rating: 4.0 },
      { name: 'Prof. Dr. Ion Cristian', subject: 'Programare I', rating: 4.8 }
    ],
    documents: [
      { title: 'Curs Matematică - Capitolul 1', type: 'PDF', size: '2.5MB' },
      { title: 'Laboratoare Fizică - Soluții', type: 'PDF', size: '1.8MB' },
      { title: 'Probleme Programare C++', type: 'PDF', size: '3.2MB' }
    ],
    posts: [
      { title: 'Cum se rezolvă exerciții de derivate?', author: 'Andrei', comments: 12 },
      { title: 'Sfaturi pentru examenul final', author: 'Maria', comments: 25 },
      { title: 'Tutorial: Pointeri în C', author: 'Ioan', comments: 8 }
    ],
    announcements: [
      { title: 'S-a mutat sala de curs!', type: 'urgent', source: 'Matematică I' },
      { title: 'Termenul pentru proiect a fost prelungit', type: 'important', source: 'Programare I' }
    ],
    reviews: [
      { title: 'Recenzie Matematică I', difficulty: 8, utility: 9 },
      { title: 'Recenzie Fizică II', difficulty: 6, utility: 7 },
      { title: 'Recenzie Programare I', difficulty: 7, utility: 10 }
    ]
  };

  function performSearch() {
    const query = globalSearchInput.value.toLowerCase().trim();
    if (!query) return;

    searchQuery.textContent = query;
    resultsList.innerHTML = '';
    
    const selectedFilters = Array.from(document.querySelectorAll('.filter-checkbox input:checked'))
      .map(input => input.value);

    let hasResults = false;

    // Search in selected categories
    selectedFilters.forEach(category => {
      const items = searchableData[category] || [];
      
      items.forEach(item => {
        const itemText = JSON.stringify(item).toLowerCase();
        if (itemText.includes(query)) {
          hasResults = true;
          const resultItem = createResultItem(item, category);
          resultsList.appendChild(resultItem);
        }
      });
    });

    if (hasResults) {
      searchResults.style.display = 'block';
    } else {
      resultsList.innerHTML = '<div style="padding: 2rem; text-align: center; color: #888;">Nu au fost găsite rezultate pentru "<strong>' + query + '</strong>"</div>';
      searchResults.style.display = 'block';
    }
  }

  function createResultItem(item, category) {
    const div = document.createElement('div');
    div.className = 'result-item';
    
    let html = `<span class="result-type ${category}">${getCategoryLabel(category)}</span>`;
    
    if (category === 'professors') {
      html += `<div class="result-title">${item.name}</div>
               <div class="result-description">${item.subject} • ⭐ ${item.rating}/5</div>`;
    } else if (category === 'documents') {
      html += `<div class="result-title">${item.title}</div>
               <div class="result-description">${item.type} • ${item.size}</div>`;
    } else if (category === 'posts') {
      html += `<div class="result-title">${item.title}</div>
               <div class="result-description">de ${item.author} • ${item.comments} comentarii</div>`;
    } else if (category === 'announcements') {
      html += `<div class="result-title">${item.title}</div>
               <div class="result-description">${item.source}</div>`;
    } else if (category === 'reviews') {
      html += `<div class="result-title">${item.title}</div>
               <div class="result-description">Dificultate: ${item.difficulty}/10 • Utilitate: ${item.utility}/10</div>`;
    }
    
    div.innerHTML = html;
    div.addEventListener('click', () => {
      showNotification('Se deschide: ' + (item.title || item.name) + ' 🔗');
    });
    
    return div;
  }

  function getCategoryLabel(category) {
    const labels = {
      professors: '👨‍🏫 Profesor',
      documents: '📄 Document',
      posts: '💬 Postare',
      announcements: '📢 Anunț',
      reviews: '⭐ Recenzie'
    };
    return labels[category] || category;
  }

  // Event listeners
  globalSearchBtn.addEventListener('click', performSearch);
  globalSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
  });

  closeResults.addEventListener('click', () => {
    searchResults.style.display = 'none';
    globalSearchInput.value = '';
  });
}

/**
 * ✨ SCROLL ANIMATIONS - Animații pentru secțiuni când ajung în viewport
 * Folosesc Intersection Observer pentru a detecta când secțiunile sunt vizibile
 */
function initializeScrollAnimations() {
  const sections = document.querySelectorAll(
    '.statistics-section, .recent-activity-section, .testimonials-section, .reviews-section, .leaderboard-section, .announcements-section'
  );
  
  // Intersection Observer options
  const observerOptions = {
    threshold: 0.1, // Se lansează când 10% din element e vizibil
    rootMargin: '0px 0px -100px 0px' // Déclanchez 100px înainte de bottom
  };
  
  // Creez observer care adaugă class de animație
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Adaug class fade-in-up pentru animație
        entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
        // Dezactivez observer pentru element (nu mai pot observa)
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Incerc observarea pentru fiecare secțiune
  sections.forEach(section => {
    observer.observe(section);
  });
}

/**
 * 📚 DOCUMENT FILTERING - Filtrare documente după an și categorie
 */
function initializeDocumentFilters() {
  const yearFilter = document.getElementById('yearFilter');
  const categoryFilter = document.getElementById('categoryFilter');
  const sortFilter = document.getElementById('sortFilter');
  const docCards = document.querySelectorAll('.doc-card');
  
  if (!yearFilter) return; // Nu șu pe pagina de documente
  
  function filterDocuments() {
    const selectedYear = yearFilter.value;
    const selectedCategory = categoryFilter.value;
    const selectedSort = sortFilter.value;
    
    // Filter
    docCards.forEach(card => {
      const cardYear = card.getAttribute('data-year');
      const cardCategory = card.getAttribute('data-category');
      
      const matchYear = !selectedYear || cardYear === selectedYear;
      const matchCategory = !selectedCategory || cardCategory === selectedCategory;
      
      card.style.display = (matchYear && matchCategory) ? 'flex' : 'none';
      
      if (matchYear && matchCategory) {
        card.style.animation = 'fadeInUp 0.4s ease-out';
      }
    });
  }
  
  yearFilter.addEventListener('change', filterDocuments);
  categoryFilter.addEventListener('change', filterDocuments);
  sortFilter.addEventListener('change', filterDocuments);
}

// ============================================
// HELPER FUNCTIONS BELOW
// ============================================

