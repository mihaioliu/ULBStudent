/**
 * INTERACTIVE.JS - ULBStudent Platform Interactivity
 * Gestionează: teme, votare, notificări, căutare, gamificație, theme toggle
 */

document.addEventListener('DOMContentLoaded', function() {
  // Inițializez toate funcțiile interactive când DOM este gata
  initializeUnifiedFooter();       // 🧩 Footer unificat pe toate paginile
  initializeThemeToggle();          // 🌓 Tema (Light/Dark/Night)
  initializeVotingSystem();         // 👍 Sistem de upvote/downvote
  initializeNavigation();           // 🔗 Marcaje active în meniu
  initializeScrollEffects();        // 📜 Animații pe scroll
  initializeSearchBar();            // 🔍 Căutare cu focus effect
  initializeQuestionFilters();      // 🎯 Filtrare întrebări
  initializeLikeButton();           // ❤️ Favorite questions
  initializeBackToTop();            // ⬆️ Buton sus
  initializeAIChat();               // 🤖 Chat AI
  initializeSmoothScrollLinks();    // 📜 Smooth scroll pentru anchor links
  handleAnchorOnPageLoad();         // 🎯 Scroll la anchor dacă URL are #
  initializePostActions();          // 🔗 Acțiuni pe postări (comentează, share)
  initializeAuthButtons();          // 🔐 Sign in/up
  initializeGamification();         // 🎮 Puncte și badges
  initializeReviewInteractions();   // ⭐ Click pe recenzii
  initializeAnnouncementButtons();  // 📢 Marcare anunțuri
  initializeGlobalSearch();         // 🔎 Căutare globală
  initializeScrollAnimations();     // ✨ Animații secțiuni pe scroll
  initializeDocumentsData();        // 📄 Documente din tabelul `documente`
  initializeDocumentFilters();      // 📚 Filtrare documente
  initializePostCreation();         // 📝 Sistem de postări
  initializeQuestionsData();        // ❓ Întrebări din baza de date
  initializeSubredditData();        // 👤 Profil + postări din baza de date
  initializeCommentsData();         // 💬 Comentarii din baza de date
  initializeFeaturedProfessors();    // 👨‍🏫 Nume profesori din baza de date
  initializeHomepageData();          // 🏠 Secțiuni homepage alimentate din DB
  initializeSearchableDropdowns();    // 🔎 Căutare în dropdown-uri mari

  // Show page only after initialization to avoid flash between navigations
  document.body.classList.add('page-ready');
});

/**
 * Normalizez footer-ul la aceeași structură pe toate paginile.
 */
function initializeUnifiedFooter() {
  const footer = document.querySelector('footer');
  if (!footer || footer.dataset.lockedFooter === 'true') {
    return;
  }

  const year = new Date().getFullYear();

  footer.innerHTML = `
    <div class="footer-content">
      <div class="footer-section">
        <img src="assets/Logos%20and%20icons/ulbsfmi-logo-white.png" alt="ULBS FMI" class="footer-brand-logo">
        <p>Comunitate pentru studentii ULBS: intrebari, resurse, colaborare si progres academic.</p>
      </div>
      <div class="footer-section">
        <h4>Pagini importante</h4>
        <ul>
          <li><a href="index.html">Acasa</a></li>
          <li><a href="subreddit.html">Forum</a></li>
          <li><a href="documente.html">Documente</a></li>
          <li><a href="profesori.html">Profesori</a></li>
        </ul>
      </div>
      <div class="footer-section">
        <h4>Cont si suport</h4>
        <ul>
          <li><a href="contact.html">Contact</a></li>
          <li><a href="raporteaza-problema.html">Raporteaza problema</a></li>
        </ul>
      </div>
      <div class="footer-section">
        <h4>Legal</h4>
        <ul>
          <li><a href="termeni-conditii.html">Termeni si conditii</a></li>
          <li><a href="politica-confidentialitate.html">Politica de confidentialitate</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; ${year} ULBS Student Hub. Toate drepturile rezervate.</p>
    </div>
  `;
}

/**
 * 0. THEME TOGGLE - Comută între Light/Dark/Night mode
 * Salvează preferință în localStorage pentru persistență
 */
function initializeThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  
  // Restaurez tema salvată din localStorage (default: light)
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme === 'light' ? 'light' : 'dark');
  
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      // Determinez next theme: light -> dark -> light
      const isDarkMode = document.body.classList.contains('dark-mode');
      const newTheme = isDarkMode ? 'light' : 'dark';
      
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
    // Dark mode
    document.body.classList.add('dark-mode');
    document.documentElement.classList.add('dark-mode');
    if (themeToggle) {
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
      themeToggle.title = 'Mod clar';
    }
  } else {
    // Light mode: implicit, culori vive și luminoase
    document.body.classList.remove('dark-mode');
    document.documentElement.classList.remove('dark-mode');
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
  window.location.href = 'login.html';
}

function showSignUpModal() {
  window.location.href = 'register.html';
}

function initializeSearchableDropdowns() {
  const selects = Array.from(document.querySelectorAll('select')).filter((select) => {
    if (select.dataset.searchable === 'false') return false;
    if (select.closest('.admin-inline-actions')) return false;
    if (select.dataset.searchEnhanced === 'true') return false;
    return select.dataset.dropdownSearch === 'true';
  });

  selects.forEach((select) => {
    if (select.dataset.searchEnhanced === 'true') return;

    const wrapper = document.createElement('div');
    wrapper.className = 'searchable-select';
    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'searchable-select-input';
    searchInput.placeholder = 'Caută în listă...';
    searchInput.setAttribute('aria-label', 'Caută în dropdown');
    searchInput.hidden = true;
    wrapper.insertBefore(searchInput, select);

    const originalOptions = Array.from(select.options).map((option) => ({
      value: option.value,
      text: option.textContent || '',
      disabled: option.disabled,
      selected: option.selected
    }));

    const applyFilter = () => {
      const query = searchInput.value.trim().toLowerCase();
      let visibleCount = 0;

      Array.from(select.options).forEach((option, index) => {
        const optionData = originalOptions[index];
        if (!optionData) return;

        const matches = !query || optionData.text.toLowerCase().includes(query);
        option.hidden = !matches;
        option.disabled = optionData.disabled;

        if (matches) visibleCount += 1;
      });

      if (visibleCount === 0) {
        select.classList.add('searchable-select-empty');
      } else {
        select.classList.remove('searchable-select-empty');
      }
    };

    const openSearch = () => {
      wrapper.classList.add('is-open');
      searchInput.hidden = false;
    };

    const closeSearch = () => {
      if (document.activeElement === searchInput) return;
      searchInput.hidden = true;
      wrapper.classList.remove('is-open');
    };

    searchInput.addEventListener('input', applyFilter);
    searchInput.addEventListener('focus', applyFilter);
    select.addEventListener('focus', openSearch);
    select.addEventListener('click', openSearch);
    select.addEventListener('blur', () => window.setTimeout(closeSearch, 120));
    searchInput.addEventListener('blur', () => window.setTimeout(closeSearch, 120));
    document.addEventListener('click', (event) => {
      if (!wrapper.contains(event.target)) {
        closeSearch();
      }
    });

    select.dataset.searchEnhanced = 'true';
    applyFilter();
  });
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
  // Vote on postări (posts)
  document.addEventListener('click', async function(e) {
    const upButton = e.target.closest('.post-votes .fa-arrow-up');
    const downButton = e.target.closest('.post-votes .fa-arrow-down');
    
    if (!upButton && !downButton) return;
    
    const postCard = e.target.closest('.post-card');
    if (!postCard) return;
    
    const postId = postCard.getAttribute('data-post-id');
    if (!postId) return;
    
    const direction = upButton ? 'up' : 'down';
    const voteSpan = postCard.querySelector('.post-votes > span');
    
    if (!voteSpan) return;
    
    try {
      const result = await updatePostVotes(postId, direction);
      if (result.success) {
        voteSpan.textContent = result.newVotes;
        // Feedback visual
        voteSpan.style.color = direction === 'up' ? '#22c55e' : '#ef4444';
        createParticles(voteSpan, direction === 'up' ? '#22c55e' : '#ef4444');
        setTimeout(() => {
          voteSpan.style.color = '';
        }, 500);
      } else {
        showNotification('❌ Eroare la salvarea votului.');
      }
    } catch (error) {
      showNotification('❌ Eroare: ' + error.message);
    }
  });
  
  // Vote on questions
  document.addEventListener('click', async function(e) {
    const upButton = e.target.closest('.vote-column .fa-arrow-up');
    const downButton = e.target.closest('.vote-column .fa-arrow-down');
    
    if (!upButton && !downButton) return;
    
    const question = e.target.closest('.question');
    if (!question) return;
    
    const questionId = question.getAttribute('data-question-id');
    if (!questionId) return;
    
    const direction = upButton ? 'up' : 'down';
    const voteSpan = question.querySelector('.vote-column > span');
    
    if (!voteSpan) return;
    
    try {
      const result = await updateQuestionVotes(questionId, direction);
      if (result.success) {
        voteSpan.textContent = result.newVotes;
        // Feedback visual
        voteSpan.style.color = direction === 'up' ? '#22c55e' : '#ef4444';
        createParticles(voteSpan, direction === 'up' ? '#22c55e' : '#ef4444');
        setTimeout(() => {
          voteSpan.style.color = '';
        }, 500);
      } else {
        showNotification('❌ Eroare la salvarea votului.');
      }
    } catch (error) {
      showNotification('❌ Eroare: ' + error.message);
    }
  });
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
      const terms = [professor, specialization, subject, year].filter(Boolean);
      
      console.log('Searching for:', { professor, specialization, subject, year });

      if (terms.length === 0) {
        showNotification('⚠️ Completează cel puțin un filtru de căutare.');
        return;
      }

      const query = terms.join(' ');
      localStorage.setItem('advancedSearchQuery', query);
      window.location.href = `comments.html?q=${encodeURIComponent(query)}`;
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
      // Keep original order (most recent first) - reverse current order
      questionsArray.reverse();
      break;
      
    case 'Cele mai helpful':
      // Sort by votes descending
      questionsArray.sort((a, b) => {
        const votesA = parseInt(a.querySelector('.vote-column span').textContent) || 0;
        const votesB = parseInt(b.querySelector('.vote-column span').textContent) || 0;
        return votesB - votesA;
      });
      break;
      
    case 'Cele mai comentate':
      // Sort by comments descending
      questionsArray.sort((a, b) => {
        // Extract comments count from the meta item with the comment icon
        const metaItemsA = a.querySelectorAll('.meta-item');
        const metaItemsB = b.querySelectorAll('.meta-item');
        
        let commentsA = 0;
        let commentsB = 0;
        
        metaItemsA.forEach(item => {
          const text = item.textContent;
          if (text.includes('comentar')) {
            commentsA = parseInt(text.match(/\d+/)?.[0] || 0);
          }
        });
        
        metaItemsB.forEach(item => {
          const text = item.textContent;
          if (text.includes('comentar')) {
            commentsB = parseInt(text.match(/\d+/)?.[0] || 0);
          }
        });
        
        return commentsB - commentsA;
      });
      break;
  }
  
  const container = document.querySelector('.question-list');
  
  if (container) {
    // Animate reordering
    questionsArray.forEach((q, index) => {
      q.style.opacity = '0';
      q.style.transform = 'translateY(10px)';
    });
    
    setTimeout(() => {
      questionsArray.forEach((q) => {
        container.appendChild(q);
      });
      
      questionsArray.forEach((q, index) => {
        q.style.animation = 'none';
        setTimeout(() => {
          q.style.opacity = '1';
          q.style.transform = 'translateY(0)';
          q.style.transition = 'all 0.3s ease-out';
        }, 10);
      });
    }, 50);
  }
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
let notificationCount = 0;

function showNotification(message) {
  // Creez element div cu clasa 'notification'
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  
  // Calculez poziția basată pe numărul de notificări existente
  const bottomPosition = 30 + (notificationCount * 90);
  
  // Stil inline: poziție fixed, gradient roșu, shadow
  notification.style.cssText = `
    position: fixed;
    bottom: ${bottomPosition}px;
    right: 30px;
    background: linear-gradient(135deg, #e63946 0%, #d63447 100%);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 8px 20px rgba(230, 57, 70, 0.4);
    z-index: ${1000 + notificationCount};
    animation: slideInRight 0.5s ease-out;
    max-width: 350px;
    word-wrap: break-word;
  `;
  
  notificationCount++;
  document.body.appendChild(notification); // Adaug la pagină
  
  // Auto-dismiss după 3 secunde cu slide-out animație
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.5s ease-out forwards';
    setTimeout(() => {
      notification.remove();
      notificationCount = Math.max(0, notificationCount - 1);
      
      // Reajustez poziția notificărilor rămase
      const remainingNotifications = document.querySelectorAll('.notification');
      remainingNotifications.forEach((notif, index) => {
        notif.style.bottom = (30 + (index * 90)) + 'px';
        notif.style.zIndex = 1000 + index;
      });
    }, 500);
  }, 3000);
}

// ============================================
// 8. FLOATING ACTION BUTTONS (Back to Top + AI Chat)
// ============================================
function initializeBackToTop() {
  // Creare container FAB
  const fabContainer = document.createElement('div');
  fabContainer.id = 'fab-container';
  
  // Creare buton Back to Top
  const backToTopBtn = document.createElement('button');
  backToTopBtn.id = 'backToTop';
  backToTopBtn.className = 'fab-button';
  backToTopBtn.innerHTML = '↑';
  backToTopBtn.title = 'Mergi sus';
  
  // Adăugare în container
  fabContainer.appendChild(backToTopBtn);
  document.body.appendChild(fabContainer);
  
  // Scroll event listener
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add('show');
    } else {
      backToTopBtn.classList.remove('show');
    }
  });
  
  // Click handler
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ============================================
// 8.1 AI CHAT BUTTON & MODAL
// ============================================
function initializeAIChat() {
  // Obținere container FAB (deja creat de initializeBackToTop)
  let fabContainer = document.getElementById('fab-container');
  if (!fabContainer) {
    fabContainer = document.createElement('div');
    fabContainer.id = 'fab-container';
    document.body.appendChild(fabContainer);
  }
  
  // Creare buton AI Chat
  const aiChatBtn = document.createElement('button');
  aiChatBtn.id = 'aiChatBtn';
  aiChatBtn.className = 'fab-button show';
  aiChatBtn.innerHTML = '<img src="assets/Logos%20and%20icons/ulbstudent-icon-circle-border.png" alt="AI" class="ai-btn-icon">';
  aiChatBtn.title = 'Deschide chat AI';
  aiChatBtn.setAttribute('aria-label', 'Deschide chat AI');
  
  fabContainer.insertBefore(aiChatBtn, fabContainer.firstChild);
  
  // Creare modal chat
  const chatModal = document.createElement('div');
  chatModal.id = 'chatModal';
  chatModal.innerHTML = `
    <div class="chat-window">
      <div class="chat-header">
        <h3><i class="fas fa-robot" style="margin-right: 8px;"></i>ULBStudent AI</h3>
        <button class="chat-close-btn" id="chatCloseBtn">&times;</button>
      </div>
      <div class="chat-messages" id="chatMessages">
        <div class="chat-message ai">
          <div class="message-bubble">Salut! Sunt asistentul AI al ULBStudent. Cum te pot ajuta astazi?</div>
        </div>
      </div>
      <div class="chat-input-area">
        <input 
          type="text" 
          id="chatInput" 
          placeholder="Scrie mesajul tau..." 
          autocomplete="off"
        />
        <button id="chatSendBtn"><i class="fas fa-paper-plane"></i></button>
      </div>
    </div>
  `;
  
  document.body.appendChild(chatModal);
  
  // Event listeners
  aiChatBtn.addEventListener('click', () => {
    chatModal.classList.add('active');
    document.getElementById('chatInput').focus();
  });
  
  document.getElementById('chatCloseBtn').addEventListener('click', () => {
    chatModal.classList.remove('active');
  });
  
  // Închidere modal pe click în afara (background overlay)
  chatModal.addEventListener('click', (e) => {
    if (e.target === chatModal) {
      chatModal.classList.remove('active');
    }
  });
  
  // Trimitere mesaj cu buton
  document.getElementById('chatSendBtn').addEventListener('click', sendMessage);
  
  // Trimitere mesaj cu Enter
  document.getElementById('chatInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  
  // Funcție trimitere mesaj
  function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (message === '') return;
    
    // Adăugare mesaj utilizator
    addChatMessage(message, 'user');
    input.value = '';
    
    // Simulare răspuns AI (în viitor se va integra cu AI real)
    setTimeout(() => {
      const responses = [
        'Interesant! Doresti mai multe informatii?',
        'Am inteles. Cum pot continua sa te ajut?',
        'Buna intrebare! Iti pot oferi detalii mai specifice.',
        'Sigur! Sa ma gandesc la cea mai buna solutie pentru tine.',
        'Este o observatie foarte buna. Vreau sa iti explic mai bine.'
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      addChatMessage(randomResponse, 'ai');
    }, 500);
  }
  
  // Funcție adăugare mesaj în chat
  function addChatMessage(text, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    messageDiv.innerHTML = `<div class="message-bubble">${text}</div>`;
    messagesContainer.appendChild(messageDiv);
    
    // Scroll automat la ultimul mesaj
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

// ============================================
// 8.5 SMOOTH SCROLL FOR ALL ANCHOR LINKS
// ============================================
/**
 * Inițializează smooth scroll pentru toți anchor links
 * Functionează pentru linkuri interne (#header, #section, etc)
 */
function initializeSmoothScrollLinks() {
  // Smooth scroll pentru toate linkurile cu href="#..."
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      
      // Skip dacă href este doar "#"
      if (href === '#') return;
      
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        e.preventDefault();
        
        // Smooth scroll cu offset pentru header
        const headerHeight = document.querySelector('header')?.offsetHeight || 0;
        const targetPosition = targetElement.offsetTop - headerHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
        
        // Update URL fără reload
        window.history.pushState(null, '', href);
      }
    });
  });
}

// ============================================
// 8.6 SCROLL TO SECTION (From Navigation)
// ============================================
/**
 * Funcție universală pentru scroll la o secțiune
 * Folosit de navigation menu
 */
function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId);
  
  if (element) {
    const headerHeight = document.querySelector('header')?.offsetHeight || 0;
    const targetPosition = element.offsetTop - headerHeight;
    
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth',
      duration: 800
    });
  }
}

// ============================================
// 8.7 SMOOTH SCROLL ON PAGE LOAD (if URL has anchor)
// ============================================
function handleAnchorOnPageLoad() {
  // Daca URL are un anchor (#...), scroll la el smooth
  const anchor = window.location.hash;
  if (anchor) {
    // Astepți puțin pentru ca pagina să se șargă complet
    setTimeout(() => {
      const targetId = anchor.substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        const headerHeight = document.querySelector('header')?.offsetHeight || 0;
        const targetPosition = targetElement.offsetTop - headerHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    }, 500);
  }
}

// ============================================
// 8.8 POST ACTIONS (Comments, Share)
// ============================================
/**
 * Inițializează acțiunile pe postări (comentează, share)
 * Folosește event delegation pentru eficiență
 */
function initializePostActions() {
  // Intercept click pe action buttons din post-uri
  document.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('.action-btn');
    if (!actionBtn) return;
    
    const action = actionBtn.getAttribute('data-action');
    const postCard = actionBtn.closest('[data-post-id]');
    const postId = postCard?.getAttribute('data-post-id');
    
    if (action === 'comments' && postId) {
      // Redirect la pagina dedicata discutiei pentru postarea selectata
      window.location.href = `discutie.html?post=${encodeURIComponent(postId)}`;
    } else if (action === 'share') {
      // Share functionality - copia link direct catre discutia postarii
      const shareUrl = new URL(`discutie.html?post=${encodeURIComponent(postId)}`, window.location.href).toString();
      navigator.clipboard.writeText(shareUrl).then(() => {
        // Show visual feedback
        const originalText = actionBtn.innerHTML;
        actionBtn.innerHTML = '✅ Link copiat!';
        setTimeout(() => {
          actionBtn.innerHTML = originalText;
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy:', err);
        if (typeof showNotification === 'function') {
          showNotification('Nu s-a putut copia linkul. Deschide postarea pentru URL.');
        }
      });
    }
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

  .searchable-select {
    display: grid;
    gap: 0.4rem;
  }

  .searchable-select .searchable-select-input[hidden] {
    display: none !important;
  }

  .searchable-select.is-open .searchable-select-input {
    display: block;
  }

  .searchable-select-input {
    width: 100%;
    padding: 0.55rem 0.7rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--surface);
    color: var(--text);
    font-size: 0.92rem;
  }

  .searchable-select-input::placeholder {
    color: var(--text-secondary);
  }

  .searchable-select-empty select {
    outline: 2px solid rgba(230, 57, 70, 0.25);
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
    badges: ['Boboc Curios', 'Salvator', 'Expert Calculatoare'],
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
          'Expert Calculatoare': 'Ai postări despre Calculatoare cu peste 100 upvote-uri! 💻'
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
    helpful.addEventListener('click', async function(e) {
      e.stopPropagation();

      const reviewId = this.dataset.reviewId || '';
      if (reviewId && typeof toggleProfessorReviewHelpful === 'function') {
        const result = await toggleProfessorReviewHelpful(reviewId);
        if (!result.success) {
          showNotification(result.error || 'Nu s-a putut salva feedback-ul util.');
          return;
        }

        this.textContent = `👍 ${result.count} găsit util`;
        this.style.transform = 'scale(1.15)';
        setTimeout(() => {
          this.style.transform = 'scale(1)';
        }, 150);

        showNotification(result.added ? 'Mulțumim pentru feedback! ❤️' : 'Feedback-ul util a fost retras.');

        let userReputation = JSON.parse(localStorage.getItem('userReputation')) || { points: 0 };
        userReputation.points += result.added ? 1 : 0;
        localStorage.setItem('userReputation', JSON.stringify(userReputation));
        return;
      }
      
      // Extract the first number from text (e.g. "👍 425 găsit util").
      const countMatch = String(this.textContent || '').match(/\d+/);
      let count = countMatch ? parseInt(countMatch[0], 10) : 0;
      
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
  if (window.__announcementButtonsBound) return;
  window.__announcementButtonsBound = true;

  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-mark-read');
    if (!btn) return;

    e.stopPropagation();

    const card = btn.closest('.announcement-card');
    if (!card || btn.disabled) return;

    card.style.opacity = '0.6';
    card.style.pointerEvents = 'none';
    btn.textContent = '✓ Citit';
    btn.disabled = true;

    showNotification('Anunț marcat ca citit! 📖');

    const readAnnouncements = JSON.parse(localStorage.getItem('readAnnouncements')) || [];
    const announcementId = card.dataset.announcementId || card.querySelector('h4')?.textContent || 'announcement';
    if (!readAnnouncements.includes(announcementId)) {
      readAnnouncements.push(announcementId);
    }
    localStorage.setItem('readAnnouncements', JSON.stringify(readAnnouncements));
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

  if (!globalSearchInput || !globalSearchBtn || !searchResults || !resultsList || !searchQuery || !closeResults) {
    return;
  }

  const searchableData = {
    professors: [],
    documents: [],
    posts: [],
    announcements: [],
    reviews: [],
    questions: []
  };

  const normalizeText = (value) => String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const matchesQuery = (item, query, fields) => {
    const normalizedQuery = normalizeText(query);
    return fields.some((field) => normalizeText(item?.[field]).includes(normalizedQuery));
  };

  function collectDomContent() {
    searchableData.documents = Array.from(document.querySelectorAll('.doc-card, .document-card')).map((card) => ({
      title: card.querySelector('h3, h4')?.textContent?.trim() || 'Document',
      type: card.querySelector('.doc-type')?.textContent?.trim() || 'Document',
      size: card.querySelector('.doc-size')?.textContent?.trim() || '',
      fileUrl: card.querySelector('.btn-download, .btn-preview')?.getAttribute('href') || ''
    }));

    searchableData.announcements = Array.from(document.querySelectorAll('.announcement-card')).map((card) => ({
      title: card.querySelector('h4, h3')?.textContent?.trim() || 'Anunț',
      type: card.querySelector('.announcement-tag')?.textContent?.trim() || 'info',
      source: card.querySelector('.announcement-meta')?.textContent?.trim() || 'Comunitate'
    }));

    searchableData.reviews = Array.from(document.querySelectorAll('.review-card')).map((card) => ({
      title: card.querySelector('h4')?.textContent?.trim() || 'Recenzie',
      difficulty: card.querySelector('.stats .stat-item')?.textContent?.trim() || '-',
      utility: card.querySelectorAll('.stats .stat-item')?.[1]?.textContent?.trim() || '-'
    }));

    searchableData.questions = Array.from(document.querySelectorAll('.question')).map((card) => ({
      title: card.querySelector('h3')?.textContent?.trim() || 'Întrebare',
      excerpt: card.querySelector('.question-excerpt')?.textContent?.trim() || '',
      meta: card.querySelector('.question-meta')?.textContent?.trim() || ''
    }));
  }

  async function collectDatabaseContent() {
    try {
      const requests = [];

      if (typeof getProfessors === 'function') requests.push(getProfessors().then((result) => ({ type: 'professors', result })));
      if (typeof getDocuments === 'function') requests.push(getDocuments().then((result) => ({ type: 'documents', result })));
      if (typeof getPosts === 'function') requests.push(getPosts().then((result) => ({ type: 'posts', result })));
      if (typeof getQuestions === 'function') requests.push(getQuestions().then((result) => ({ type: 'questions', result })));
      if (typeof getProfessorReviews === 'function') requests.push(getProfessorReviews().then((result) => ({ type: 'reviews', result })));

      const settled = await Promise.all(requests);

      settled.forEach(({ type, result }) => {
        if (!result?.success || !Array.isArray(result.data)) return;

        if (type === 'professors') {
          searchableData.professors = result.data.map((item) => ({
            id: item.id,
            name: item.full_name || item.nume_complet || 'Profesor',
            subject: item.taught_subject || item.materie_predata || item.specialization || 'Specializare',
            rating: item.rating || 0,
            email: item.institutional_email || item.email || '',
            department: item.department || item.departament || ''
          }));
        }

        if (type === 'documents') {
          searchableData.documents = result.data.map((item) => ({
            title: item.titlu || item.title || 'Document',
            type: item.tip_document || item.type || 'Document',
            size: item.dimensiune || item.size || '',
            specialization: item.specializare || item.specialization || '',
            year: item.an || item.year || '',
            fileUrl: item.file_url || item.url_fisier || item.url || ''
          }));
        }

        if (type === 'posts') {
          searchableData.posts = result.data.map((item) => ({
            id: item.id,
            title: item.title || item.titlu || 'Postare',
            author: item.user_id || item.autor || 'student',
            content: item.content || item.descriere || '',
            category: item.category || item.categorie || ''
          }));
        }

        if (type === 'questions') {
          searchableData.questions = result.data.map((item) => ({
            id: item.id,
            title: item.title || item.titlu || 'Întrebare',
            content: item.description || item.descriere || '',
            author: item.author || item.user_id || 'student'
          }));
        }

        if (type === 'reviews') {
          searchableData.reviews = result.data.map((item) => ({
            professorId: item.profesor_id || item.professor_id || item.id_profesor || '',
            title: item.title || item.subject || item.materie || 'Recenzie',
            rating: Number(item.rating || 0),
            comment: item.comentariu || item.comment || item.review_text || ''
          }));
        }
      });

      if (searchableData.professors.length === 0 && Array.isArray(window.OFFICIAL_PROFESSORS)) {
        searchableData.professors = window.OFFICIAL_PROFESSORS.map((item, index) => ({
          id: index + 1,
          name: item.full_name || item.name || 'Profesor',
          subject: item.specialization || item.subject || 'Specializare',
          rating: 0,
          email: item.institutional_email || item.email || '',
          department: item.department || item.faculty || ''
        }));
      }
    } catch (error) {
      console.warn('Search DB preload failed:', error.message);
      if (searchableData.professors.length === 0 && Array.isArray(window.OFFICIAL_PROFESSORS)) {
        searchableData.professors = window.OFFICIAL_PROFESSORS.map((item, index) => ({
          id: index + 1,
          name: item.full_name || item.name || 'Profesor',
          subject: item.specialization || item.subject || 'Specializare',
          rating: 0,
          email: item.institutional_email || item.email || '',
          department: item.department || item.faculty || ''
        }));
      }
    }
  }

  collectDomContent();
  collectDatabaseContent();
  window.refreshGlobalSearchIndex = async function() {
    collectDomContent();
    await collectDatabaseContent();
  };

  function performSearch() {
    const query = globalSearchInput.value.trim();
    if (!query) return;

    searchQuery.textContent = query;
    resultsList.innerHTML = '';
    
    const selectedFilters = Array.from(document.querySelectorAll('.filter-checkbox input:checked'))
      .map(input => input.value);

    let hasResults = false;

    // Search in selected categories
    selectedFilters.forEach((category) => {
      const items = searchableData[category] || [];
      
      items.forEach((item) => {
        const searchFields = {
          professors: ['name', 'subject', 'email', 'department'],
          documents: ['title', 'type', 'size', 'specialization', 'year'],
          posts: ['title', 'content', 'author', 'category'],
          announcements: ['title', 'type', 'source'],
          reviews: ['title', 'comment', 'rating'],
          questions: ['title', 'content', 'author']
        }[category] || Object.keys(item);

        if (matchesQuery(item, query, searchFields)) {
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
               <div class="result-description">de ${item.author} • ${item.category || 'postare'}${item.content ? ' • ' + item.content.slice(0, 90) : ''}</div>`;
    } else if (category === 'announcements') {
      html += `<div class="result-title">${item.title}</div>
               <div class="result-description">${item.source}</div>`;
    } else if (category === 'reviews') {
      html += `<div class="result-title">${item.title}</div>
               <div class="result-description">⭐ ${item.rating}/5 • ${item.comment.slice(0, 90)}</div>`;
    } else if (category === 'questions') {
      html += `<div class="result-title">${item.title}</div>
               <div class="result-description">${item.content ? item.content.slice(0, 90) : ''}</div>`;
    }
    
    div.innerHTML = html;
    div.addEventListener('click', () => {
      if (category === 'professors' && item.id) {
        window.location.href = `professor-profile.html?id=${encodeURIComponent(item.id)}&name=${encodeURIComponent(item.name)}&specializare=${encodeURIComponent(item.subject || '')}`;
        return;
      }

      if (category === 'documents' && item.fileUrl) {
        window.open(item.fileUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      if (category === 'posts' && item.id) {
        window.location.href = `discutie.html?post=${encodeURIComponent(item.id)}`;
        return;
      }

      if (category === 'reviews' && item.professorId) {
        window.location.href = `professor-profile.html?id=${encodeURIComponent(item.professorId)}&name=${encodeURIComponent(item.title || '')}`;
        return;
      }

      if (category === 'questions' && item.id) {
        window.location.href = `comments.html#question-${encodeURIComponent(item.id)}`;
        return;
      }

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
  globalSearchBtn.addEventListener('click', async () => {
    await collectDatabaseContent();
    performSearch();
  });
  globalSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      collectDatabaseContent().then(performSearch);
    }
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
  const categoryFilter = document.getElementById('categoryFilter') || document.getElementById('docTypeFilter');
  const disciplineFilter = document.getElementById('discipleFilter');
  const sortFilter = document.getElementById('sortFilter');
  const searchInput = document.getElementById('docSearch');
  const resetButton = document.getElementById('resetDocsFiltersBtn');
  const docsGrid = document.getElementById('docsGrid');
  const specializationInputs = Array.from(document.querySelectorAll('.faculties-list input[type="checkbox"]'));
  
  if (!yearFilter) return; // Nu șu pe pagina de documente

  const normalizeText = (value) => String(value || '')
    .toLowerCase()
    .replace(/-/g, ' ')
    .replace(/ă/g, 'a')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/ș/g, 's')
    .replace(/ț/g, 't')
    .replace(/[^a-z0-9\s-]/g, ' ');

  const getSelectedSpecializations = () => specializationInputs
    .filter((input) => input.checked)
    .map((input) => normalizeText(input.value || ''));

  function resetDocumentFilters() {
    if (searchInput) searchInput.value = '';
    if (yearFilter) yearFilter.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (disciplineFilter) disciplineFilter.value = '';
    if (sortFilter) sortFilter.value = '';
    specializationInputs.forEach((input) => { input.checked = false; });

    const cards = docsGrid ? docsGrid.querySelectorAll('.doc-card') : document.querySelectorAll('.doc-card');
    cards.forEach((card) => {
      card.style.display = 'flex';
    });
  }
  
  function filterDocuments() {
    const selectedYear = yearFilter.value;
    const selectedCategory = categoryFilter?.value || '';
    const selectedDiscipline = disciplineFilter?.value || '';
    const selectedSort = sortFilter?.value || '';
    const selectedSearch = normalizeText(searchInput?.value || '');
    const selectedSpecializations = getSelectedSpecializations();
    const docCards = docsGrid ? docsGrid.querySelectorAll('.doc-card') : document.querySelectorAll('.doc-card');
    
    // Filter
    docCards.forEach(card => {
      const cardMeta = (card.querySelector('.doc-meta')?.textContent || '').toLowerCase();
      const cardText = normalizeText(card.textContent || '');
      const cardYear = card.getAttribute('data-year') || cardMeta.match(/anul\s*(\d+)/i)?.[1] || '';
      const cardCategory = card.getAttribute('data-category') || cardMeta;
      const cardSpecialization = normalizeText(card.getAttribute('data-specialization') || cardMeta);
      
      const matchYear = !selectedYear || cardYear === selectedYear;
      const matchCategory = !selectedCategory || cardCategory.includes(selectedCategory.toLowerCase());
      const matchDiscipline = !selectedDiscipline || normalizeText(cardMeta).includes(normalizeText(selectedDiscipline.replace(/-/g, ' ')));
      const matchSearch = !selectedSearch || cardText.includes(selectedSearch);
      const matchSpecialization = selectedSpecializations.length === 0 || selectedSpecializations.some((spec) => cardSpecialization.includes(spec));
      
      card.style.display = (matchYear && matchCategory && matchDiscipline && matchSearch && matchSpecialization) ? 'flex' : 'none';
      
      if (matchYear && matchCategory && matchDiscipline && matchSearch && matchSpecialization) {
        card.style.animation = 'fadeInUp 0.4s ease-out';
      }
    });

    // Sortare simpla pe numar descarcari sau rating cand selectul exista.
    if (selectedSort && docsGrid) {
      const visibleCards = Array.from(docsGrid.querySelectorAll('.doc-card')).filter((card) => card.style.display !== 'none');
      visibleCards.sort((a, b) => {
        if (selectedSort === 'Cele mai noi') return 0;
        const aStats = (a.querySelector('.doc-stats')?.textContent || '').match(/\d+/g) || ['0', '0'];
        const bStats = (b.querySelector('.doc-stats')?.textContent || '').match(/\d+/g) || ['0', '0'];
        if (selectedSort.toLowerCase().includes('descar')) {
          return Number(bStats[0]) - Number(aStats[0]);
        }
        return Number(bStats[1]) - Number(aStats[1]);
      });
      visibleCards.forEach((card) => docsGrid.appendChild(card));
    }
  }
  
  yearFilter?.addEventListener('change', filterDocuments);
  categoryFilter?.addEventListener('change', filterDocuments);
  sortFilter?.addEventListener('change', filterDocuments);
  disciplineFilter?.addEventListener('change', filterDocuments);
  searchInput?.addEventListener('input', filterDocuments);
  specializationInputs.forEach((checkbox) => checkbox.addEventListener('change', filterDocuments));
  resetButton?.addEventListener('click', (event) => {
    event.preventDefault();
    resetDocumentFilters();
    filterDocuments();
  });
}

function renderDynamicDocumentCard(documentRow) {
  const card = document.createElement('div');
  card.className = 'doc-card';

  const title = escapeHtml(documentRow.titlu || documentRow.title || 'Document');
  const specialization = escapeHtml(documentRow.specializare || documentRow.specialization || 'General');
  const subject = escapeHtml(documentRow.materie || documentRow.subject || documentRow.taught_subject || specialization || 'General');
  const year = String(documentRow.an_studiu || documentRow.year || '-');
  const type = escapeHtml(documentRow.tip || documentRow.type || 'Material');
  const department = escapeHtml(documentRow.departament || documentRow.department || 'Departament ULB');
  const professorName = escapeHtml(documentRow.nume_profesor || documentRow.professor_name || documentRow.full_name || documentRow.author_name || 'Profesor');
  const description = escapeHtml(documentRow.descriere || documentRow.description || 'Fara descriere');
  const downloads = Number(documentRow.downloads || documentRow.numar_descarcari || 0);
  const rating = Number(documentRow.rating || 0);
  const fileUrl = documentRow.file_url || documentRow.url_fisier || '#';

  card.innerHTML = `
    <div class="doc-header">
      <i class="fas fa-file-pdf"></i>
      <h3>${title}</h3>
    </div>
    <p class="doc-meta">${subject} | Anul ${year} | ${type}</p>
    <p class="doc-faculty">${department}</p>
    <p class="doc-author">👨‍🏫 ${professorName}</p>
    <p class="doc-description">${description}</p>
    <div class="doc-stats">
      <span class="doc-stat">📥 ${downloads} descarcari</span>
      <span class="doc-stat">⭐ ${rating || '-'}/5</span>
    </div>
    <div class="doc-actions">
      <a class="btn-download" href="${fileUrl}" target="_blank" rel="noopener noreferrer"><i class="fas fa-download"></i> Descarca</a>
      <a class="btn-preview" href="${fileUrl}" target="_blank" rel="noopener noreferrer"><i class="fas fa-eye"></i> Previzualizare</a>
    </div>
  `;

  return card;
}

async function initializeDocumentsData() {
  const docsGrid = document.getElementById('docsGrid');
  if (!docsGrid || typeof getDocuments !== 'function') return;

  try {
    const result = await getDocuments();
    docsGrid.innerHTML = '';

    const sanitizedDocuments = Array.isArray(result.data) ? result.data : [];

    if (!result.success || !Array.isArray(result.data) || sanitizedDocuments.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'grid-column: 1/-1; padding: 1.1rem; border: 1px dashed var(--border-color); border-radius: 10px; color: var(--text-secondary); background: var(--light-gray);';
      empty.textContent = 'Nu exista documente in Supabase pentru moment.';
      docsGrid.appendChild(empty);
      return;
    }

    sanitizedDocuments.forEach((row) => docsGrid.appendChild(renderDynamicDocumentCard(row)));
  } catch (error) {
    console.warn('Nu s-au putut incarca documentele din DB:', error.message);
  }
}

// ============================================
// 12. DATABASE-DRIVEN QUESTIONS / POSTS / COMMENTS
// ============================================
function formatTimeAgo(isoDate) {
  if (!isoDate) return 'acum câteva secunde';
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'acum câteva secunde';
  if (minutes < 60) return `acum ${minutes} min`;
  if (hours < 24) return `acum ${hours} ore`;
  return `acum ${days} zile`;
}

function renderQuestionCard(question) {
  const wrapper = document.createElement('div');
  wrapper.className = 'question';
  wrapper.setAttribute('data-question-id', question.id);
  wrapper.innerHTML = `
    <div class="vote-column">
      <i class="fa-solid fa-arrow-up"></i>
      <span>${question.upvotes || 0}</span>
      <i class="fa-solid fa-arrow-down"></i>
    </div>
    <div class="question-content">
      <div class="question-header">
        <h3>${escapeHtml(question.title || 'Întrebare fără titlu')}</h3>
        <span class="question-tag">General</span>
      </div>
      <p class="question-excerpt">${escapeHtml(question.description || 'Fără descriere')}</p>
      <div class="question-meta">
        <span class="meta-item"><i class="fa-solid fa-user"></i> de Student</span>
        <span class="meta-item"><i class="fa-solid fa-calendar"></i> ${formatTimeAgo(question.created_at)}</span>
        <span class="meta-item"><i class="fa-solid fa-comment"></i> 0 comentarii</span>
      </div>
    </div>
  `;
  return wrapper;
}

async function initializeQuestionsData() {
  const questionList = document.querySelector('.question-list');
  const questionForm = document.getElementById('questionCreateForm');
  const titleInput = document.getElementById('questionTitleInput');
  const descriptionInput = document.getElementById('questionDescriptionInput');
  const emptyState = document.getElementById('questionsEmptyState');

  if (!questionList) return;

  const loaded = await getQuestions();
  questionList.querySelectorAll('.question').forEach(item => item.remove());

  if (!loaded.success || loaded.data.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
  } else {
    if (emptyState) emptyState.style.display = 'none';
    loaded.data.forEach(question => questionList.appendChild(renderQuestionCard(question)));
  }

  if (!questionForm) return;
  questionForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const title = (titleInput?.value || '').trim();
    const description = (descriptionInput?.value || '').trim();

    if (!title || !description) {
      showNotification('⚠️ Completează titlul și descrierea întrebării.');
      return;
    }

    try {
      const saved = await saveQuestion(title, description);
      const row = saved?.data?.[0];
      if (row) {
        if (emptyState) emptyState.style.display = 'none';
        questionList.prepend(renderQuestionCard(row));
      }
      questionForm.reset();
      showNotification('✅ Întrebarea a fost publicată în baza de date.');
    } catch (error) {
      showNotification('❌ Nu s-a putut salva întrebarea.');
    }
  });
}

function normalizeHomepageValue(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function formatHomepageAuthor(row = {}) {
  const name = normalizeHomepageValue(row.name || row.full_name || row.nume_complet || row.author_name, '');
  if (name) return name;

  const email = normalizeHomepageValue(row.email || row.institutional_email || row.contact_email, '');
  if (email) return email.split('@')[0];

  const userId = normalizeHomepageValue(row.user_id || row.author || row.owner_id, '');
  if (userId) return `Utilizator ${userId.slice(0, 6)}`;

  return 'Student activ';
}

function buildHomepageTimeline({ documents = [], posts = [], questions = [], reviews = [] }) {
  const items = [];

  documents.slice(0, 3).forEach((item) => {
    items.push({
      id: `doc-${item.id}`,
      type: 'document',
      title: normalizeHomepageValue(item.titlu || item.title, 'Document nou'),
      meta: `${normalizeHomepageValue(item.tip_document || item.type, 'Document')} • ${normalizeHomepageValue(item.specializare || item.specialization, 'Toate specializările')}`,
      time: item.created_at,
      badge: 'Doc',
      tone: 'info'
    });
  });

  posts.slice(0, 3).forEach((item) => {
    items.push({
      id: `post-${item.id}`,
      type: 'post',
      title: normalizeHomepageValue(item.title || item.titlu, 'Postare nouă'),
      meta: `${formatHomepageAuthor(item)} • postare în forum`,
      time: item.created_at,
      badge: 'Forum',
      tone: 'success'
    });
  });

  questions.slice(0, 3).forEach((item) => {
    items.push({
      id: `question-${item.id}`,
      type: 'question',
      title: normalizeHomepageValue(item.title || item.titlu, 'Întrebare nouă'),
      meta: `${formatHomepageAuthor(item)} • întrebare din comunitate`,
      time: item.created_at,
      badge: 'Q&A',
      tone: 'warning'
    });
  });

  reviews.slice(0, 3).forEach((item) => {
    items.push({
      id: `review-${item.id}`,
      type: 'review',
      title: normalizeHomepageValue(item.comentariu || item.comment || item.review_text, 'Recenzie nouă'),
      meta: `${normalizeHomepageValue(item.title || item.materie || item.subject, 'Profesor')} • ⭐ ${Number(item.rating || 0).toFixed(1)}/5`,
      time: item.created_at,
      badge: 'Review',
      tone: 'accent'
    });
  });

  return items
    .filter((item) => item.title)
    .sort((left, right) => new Date(right.time || 0).getTime() - new Date(left.time || 0).getTime())
    .slice(0, 3);
}

function renderHomepageAnnouncement(item) {
  const card = document.createElement('div');
  card.className = `announcement-card ${item.tone || 'info'}`;
  card.dataset.announcementId = item.id;
  card.innerHTML = `
    <div class="announcement-badge">${item.badge}</div>
    <h4>${escapeHtml(item.title)}</h4>
    <p class="announcement-meta">${escapeHtml(item.meta)}</p>
    <p class="announcement-text">${escapeHtml(item.text || 'Informație actualizată din baza de date.')}</p>
    <div class="announcement-footer">
      <span class="posted-time">⏰ ${formatTimeAgo(item.time)}</span>
      <button class="btn-mark-read">Marchez ca citit</button>
    </div>
  `;
  return card;
}

function renderHomepageActivityItem(item) {
  const card = document.createElement('div');
  card.className = 'activity-item';
  card.innerHTML = `
    <div class="activity-avatar">${escapeHtml(item.avatar || 'UL')}</div>
    <div class="activity-content">
      <h4>${escapeHtml(item.title)}</h4>
      <p>${escapeHtml(item.text)}</p>
      <span class="activity-time">${escapeHtml(formatTimeAgo(item.time))}</span>
    </div>
    <div class="activity-badge">${escapeHtml(item.badge)}</div>
  `;
  return card;
}

function renderHomepageLeaderboardItem(item, rank) {
  const card = document.createElement('div');
  card.className = `leaderboard-item rank${Math.min(rank, 3)}`;
  card.innerHTML = `
    <div class="rank">${rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}</div>
    <div class="user-info">
      <h4>${escapeHtml(item.name)}</h4>
      <span class="badge ${escapeHtml(item.badgeClass)}">${escapeHtml(item.badge)}</span>
    </div>
    <div class="stats-right">
      <span>${item.points} puncte</span>
      <div class="progress-bar">
        <div class="progress" style="width: ${item.progress}%"></div>
      </div>
    </div>
  `;
  return card;
}

function renderHomepageTestimonial(item) {
  const card = document.createElement('div');
  card.className = 'testimonial-card';
  const stars = '★'.repeat(Math.max(1, Math.min(5, Math.round(Number(item.rating || 5)))));
  card.innerHTML = `
    <div class="stars-testimonial">${escapeHtml(stars)}</div>
    <p class="testimonial-text">"${escapeHtml(item.comment)}"</p>
    <div class="testimonial-author">
      <div class="author-avatar">${escapeHtml(item.avatar)}</div>
      <div>
        <h4>${escapeHtml(item.author)}</h4>
        <span>${escapeHtml(item.meta)}</span>
      </div>
    </div>
  `;
  return card;
}

async function initializeHomepageData() {
  const statsGrid = document.getElementById('platformStatsGrid');
  const announcementsFeed = document.getElementById('announcementsFeed');
  const leaderboardFeed = document.getElementById('leaderboardFeed');
  const activityFeed = document.getElementById('recentActivityFeed');
  const testimonialsGrid = document.getElementById('testimonialsGrid');

  if (!statsGrid && !announcementsFeed && !leaderboardFeed && !activityFeed && !testimonialsGrid) {
    return;
  }

  try {
    const [professorsResult, documentsResult, postsResult, questionsResult, reviewsResult] = await Promise.all([
      typeof getProfessors === 'function' ? getProfessors() : Promise.resolve({ success: false, data: [] }),
      typeof getDocuments === 'function' ? getDocuments() : Promise.resolve({ success: false, data: [] }),
      typeof getPosts === 'function' ? getPosts() : Promise.resolve({ success: false, data: [] }),
      typeof getQuestions === 'function' ? getQuestions() : Promise.resolve({ success: false, data: [] }),
      typeof getProfessorReviews === 'function' ? getProfessorReviews() : Promise.resolve({ success: false, data: [] })
    ]);

    const client = typeof initSupabaseClient === 'function' ? await initSupabaseClient() : null;
    const commentsResult = client
      ? await client.from('comments').select('id,name,email,user_id,content,created_at,post_id').order('created_at', { ascending: false })
      : { data: [], error: null };

    const professors = Array.isArray(professorsResult.data) ? professorsResult.data : [];
    const documents = Array.isArray(documentsResult.data) ? documentsResult.data : [];
    const posts = Array.isArray(postsResult.data) ? postsResult.data : [];
    const questions = Array.isArray(questionsResult.data) ? questionsResult.data : [];
    const reviews = Array.isArray(reviewsResult.data) ? reviewsResult.data : [];
    const comments = Array.isArray(commentsResult.data) ? commentsResult.data : [];

    const averageReview = reviews.length
      ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
      : 0;

    if (statsGrid) {
      const statCards = Array.from(statsGrid.querySelectorAll('.stat-card'));
      const values = [
        `${professors.length}`,
        `${documents.length}`,
        `${posts.length + questions.length + comments.length}`,
        averageReview ? `${averageReview.toFixed(1)}/5` : 'N/A'
      ];
      const labels = [
        'Profesori în baza de date',
        'Documente indexate',
        'Contribuții comunității',
        'Rating mediu al recenziilor'
      ];

      statCards.forEach((card, index) => {
        const valueEl = card.querySelector('h3');
        const labelEl = card.querySelector('.stat-content p');
        if (valueEl && values[index]) valueEl.textContent = values[index];
        if (labelEl && labels[index]) labelEl.textContent = labels[index];
      });
    }

    if (announcementsFeed) {
      const timeline = buildHomepageTimeline({ documents, posts, questions, reviews });
      announcementsFeed.innerHTML = '';

      if (timeline.length === 0) {
        announcementsFeed.innerHTML = '<div class="announcement-card info"><h4>Nimic nou pentru moment</h4><p class="announcement-meta">Baza de date nu are încă anunțuri, documente sau postări recente.</p><p class="announcement-text">Revino după ce apar noi materiale sau discuții în comunitate.</p></div>';
      } else {
        timeline.forEach((item) => {
          const announcement = renderHomepageAnnouncement({
            ...item,
            text: item.type === 'review'
              ? 'Citește recenzia completă și verifică utilitatea ei în pagina profesorului.'
              : item.type === 'question'
                ? 'Apasă pentru a ajunge la discuția completă din forum.'
                : item.type === 'post'
                  ? 'Discuție nouă din comunitate, generată direct din baza de date.'
                  : 'Material adăugat recent în biblioteca de documente.'
          });
          announcementsFeed.appendChild(announcement);
        });
      }
    }

    if (activityFeed) {
      const activityItems = buildHomepageTimeline({ documents, posts, questions, reviews }).map((item) => ({
        avatar: item.type === 'document' ? 'DOC' : item.type === 'review' ? 'REV' : item.type === 'question' ? 'Q&A' : 'FOR',
        title: item.title,
        text: item.meta,
        time: item.time,
        badge: item.badge
      }));

      activityFeed.innerHTML = '';
      if (activityItems.length === 0) {
        activityFeed.innerHTML = '<div class="activity-item"><div class="activity-avatar">UL</div><div class="activity-content"><h4>Fără activitate nouă</h4><p>Așteptăm prima contribuție în baza de date.</p><span class="activity-time">Acum</span></div><div class="activity-badge">Info</div></div>';
      } else {
        activityItems.forEach((item) => activityFeed.appendChild(renderHomepageActivityItem(item)));
      }
    }

    if (leaderboardFeed) {
      const authorStats = new Map();
      const addContribution = (label, type, points, badge, badgeClass) => {
        if (!label) return;
        const key = label.toLowerCase();
        const current = authorStats.get(key) || { name: label, posts: 0, questions: 0, comments: 0, points: 0, badge, badgeClass };
        current[type] += 1;
        current.points += points;
        current.badge = badge || current.badge;
        current.badgeClass = badgeClass || current.badgeClass;
        authorStats.set(key, current);
      };

      posts.forEach((post) => addContribution(formatHomepageAuthor(post), 'posts', 10, 'Forum activ', 'active'));
      questions.forEach((question) => addContribution(formatHomepageAuthor(question), 'questions', 12, 'Q&A util', 'curious'));
      comments.forEach((comment) => addContribution(formatHomepageAuthor(comment), 'comments', 6, 'Ajutor în discuții', 'expert'));

      const ranked = Array.from(authorStats.values())
        .sort((left, right) => right.points - left.points)
        .slice(0, 3);

      leaderboardFeed.innerHTML = '';
      if (ranked.length === 0) {
        leaderboardFeed.innerHTML = '<div class="leaderboard-item"><div class="rank">#1</div><div class="user-info"><h4>Fără activitate încă</h4><span class="badge active">În așteptare</span></div><div class="stats-right"><span>0 puncte</span><div class="progress-bar"><div class="progress" style="width: 10%"></div></div></div></div>';
      } else {
        const maxPoints = ranked[0].points || 1;
        ranked.forEach((item, index) => {
          const leaderboardItem = renderHomepageLeaderboardItem({
            name: item.name,
            points: item.points,
            badge: item.badge,
            badgeClass: item.badgeClass,
            progress: Math.max(12, Math.round((item.points / maxPoints) * 100))
          }, index + 1);
          leaderboardFeed.appendChild(leaderboardItem);
        });
      }
    }

    if (testimonialsGrid) {
      const testimonials = reviews.slice(0, 3).map((review) => {
        const professorName = review.title || review.professor_name || review.materie || 'Profesor';
        const comment = review.comentariu || review.comment || review.review_text || 'Recenzie salvată în baza de date.';
        const rating = Number(review.rating || 5);
        return {
          author: formatHomepageAuthor(review),
          avatar: (formatHomepageAuthor(review).slice(0, 2) || 'UL').toUpperCase(),
          comment,
          rating,
          meta: `${professorName} • ${rating.toFixed(1)}/5`
        };
      });

      testimonialsGrid.innerHTML = '';
      if (testimonials.length === 0) {
        testimonialsGrid.innerHTML = '<div class="testimonial-card"><div class="stars-testimonial">★★★★★</div><p class="testimonial-text">"Nu există încă recenzii suficiente în baza de date."</p><div class="testimonial-author"><div class="author-avatar">UL</div><div><h4>ULBStudent</h4><span>Feedback în așteptare</span></div></div></div>';
      } else {
        testimonials.forEach((item) => testimonialsGrid.appendChild(renderHomepageTestimonial(item)));
      }
    }
  } catch (error) {
    console.warn('Nu s-au putut încărca datele homepage din baza de date:', error.message);
  } finally {
    if (typeof window.refreshGlobalSearchIndex === 'function') {
      window.refreshGlobalSearchIndex().catch(() => {});
    }
  }
}

function renderPostCard(post, currentUser) {
  const card = document.createElement('div');
  card.className = 'post-card';
  card.setAttribute('data-post-id', post.id);
  const author = currentUser?.email ? currentUser.email.split('@')[0] : 'student';
  card.innerHTML = `
    <div class="post-votes">
      <i class="fa-solid fa-arrow-up"></i>
      <span>${post.votes || 0}</span>
      <i class="fa-solid fa-arrow-down"></i>
    </div>
    <div class="post-body">
      <span class="post-meta">Postat de u/${escapeHtml(author)} • ${formatTimeAgo(post.created_at)}</span>
      <h4>${escapeHtml(post.content || post.title || 'Postare fără conținut')}</h4>
      <div class="post-actions">
        <button class="action-btn" data-action="comments">💬 Comentează</button>
        <button class="action-btn" data-action="share">↗️ Share</button>
      </div>
    </div>
  `;
  return card;
}

async function initializeSubredditData() {
  const postsFeed = document.getElementById('postsFeed');
  const emptyState = document.getElementById('postsEmptyState');
  if (!postsFeed) return;

  const currentUser = getCurrentUser();
  const profileResult = await getCurrentUserProfileData();
  const profile = profileResult?.data || {};

  const profileName = document.getElementById('subredditProfileName');
  const profileFaculty = document.getElementById('subredditProfileFaculty');
  const profileYear = document.getElementById('subredditProfileYear');
  const profileInitials = document.getElementById('subredditProfileInitials');

  if (profileName && currentUser) {
    const fullName = profile.nume_complet || currentUser.user_metadata?.full_name || currentUser.email;
    profileName.textContent = fullName;
    profileFaculty.textContent = profile.specializare ? `Specializare: ${profile.specializare}` : 'Specializare necompletată';
    profileYear.textContent = profile.an_studiu || '-';
    if (profileInitials) {
      const initials = fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      profileInitials.textContent = initials || 'ST';
    }
  }

  const loaded = await getPosts();
  postsFeed.innerHTML = '';

  if (!loaded.success || loaded.data.length === 0) {
    if (emptyState) emptyState.style.display = 'flex';
  } else {
    if (emptyState) emptyState.style.display = 'none';
    loaded.data.forEach(post => postsFeed.appendChild(renderPostCard(post, currentUser)));
  }

  const postsCount = document.getElementById('subredditPostsCount');
  if (postsCount && loaded.success) {
    postsCount.textContent = String(loaded.data.length);
  }

  const commentsCount = document.getElementById('subredditCommentsCount');
  if (commentsCount && currentUser?.email) {
    try {
      const client = await initSupabaseClient();
      const { count } = await client
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('email', currentUser.email);
      commentsCount.textContent = String(count || 0);
    } catch {
      commentsCount.textContent = '0';
    }
  }
}

function initializePostCreation() {
  const postForm = document.getElementById('postCreateForm');
  const postTitleInput = document.getElementById('postTitleInput');
  const postInput = document.getElementById('postContentInput');
  const postCategoryInput = document.getElementById('postCategoryInput');
  const postTagsInput = document.getElementById('postTagsInput');
  const postTestBtn = document.getElementById('postTestBtn');
  const postSubmitBtn = document.querySelector('.post-submit-btn');
  const postsFeed = document.getElementById('postsFeed');
  const emptyState = document.getElementById('postsEmptyState');

  if (!postForm) return;

  postForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const title = (postTitleInput?.value || '').trim() || 'Postare comunitate';
    const content = (postInput?.value || '').trim();
    const category = (postCategoryInput?.value || 'general').trim();
    const tags = (postTagsInput?.value || '').trim();

    if (!content) {
      showNotification('⚠️ Scrie ceva înainte de a posta!');
      return;
    }

    const user = getCurrentUser();
    if (!user) {
      showNotification('❌ Trebuie să fii conectat pentru a posta.');
      return;
    }

    try {
      const saved = await savePost(`[${category}] ${title}`, tags ? `${content}\n\n#taguri: ${tags}` : content);
      const newPost = saved?.data?.[0];
      if (!newPost) {
        showNotification('❌ Eroare la salvarea postării.');
        return;
      }

      if (emptyState && postsFeed) emptyState.style.display = 'none';
      if (postsFeed) postsFeed.prepend(renderPostCard(newPost, user));
      postForm.reset();
      showNotification('✅ Postare salvată în baza de date.');
      
      // Actualizeaza profilul și numărarea postărilor
      const postsCount = document.getElementById('subredditPostsCount');
      if (postsCount) {
        postsCount.textContent = String(parseInt(postsCount.textContent || '0') + 1);
      }
    } catch (error) {
      showNotification('❌ Eroare la postare: ' + error.message);
    }
  });

  if (postTestBtn) {
    postTestBtn.addEventListener('click', () => {
      const title = (postTitleInput?.value || '').trim() || 'Postare test';
      const content = (postInput?.value || '').trim();

      if (!content) {
        showNotification('⚠️ Scrie ceva înainte de test.');
        return;
      }

      const tempPost = {
        id: `test-${Date.now()}`,
        title: `[TEST] ${title}`,
        content,
        votes: 0,
        created_at: new Date().toISOString(),
        user_id: 'test-user'
      };

      if (emptyState && postsFeed) emptyState.style.display = 'none';
      if (postsFeed) postsFeed.prepend(renderPostCard(tempPost, getCurrentUser() || { email: 'test@ulbstudent.ro' }));
      postForm.reset();
      showNotification('🧪 Postare test afișată local. Dispare la refresh.');
    });
  }

  // Handle action buttons on posts
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.action-btn');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const postCard = btn.closest('.post-card');
    const postId = postCard?.getAttribute('data-post-id');

    if (action === 'comments' && postId) {
      window.location.href = `discutie.html?post=${encodeURIComponent(postId)}`;
      return;
    }

    if (action === 'share') {
      navigator.clipboard?.writeText(window.location.href);
      showNotification('↗️ Link copiat.');
    }
  });
}

function renderCommentCard(comment) {
  const item = document.createElement('div');
  item.style.cssText = 'background: var(--light-gray); padding: 1.5rem; border-radius: 8px; border-left: 3px solid var(--accent);';
  item.innerHTML = `
    <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
      <div style="font-size: 1.8rem;">💬</div>
      <div>
        <h4 style="margin: 0; color: var(--text);">${escapeHtml(comment.name || 'Anonim')}</h4>
        <p style="margin: 0; color: #888; font-size: 0.85rem;">${formatTimeAgo(comment.created_at)}</p>
      </div>
    </div>
    <p style="margin: 0; color: var(--text-secondary); line-height: 1.6;">${escapeHtml(comment.content || '')}</p>
  `;
  return item;
}

async function initializeCommentsData() {
  const form = document.getElementById('commentForm');
  const commentsList = document.getElementById('commentsList');
  const commentsTitle = document.getElementById('commentsTitle');
  const emptyState = document.getElementById('commentsEmptyState');
  const postContainer = document.getElementById('commentsPostContainer');
  if (!commentsList) return;

  const params = new URLSearchParams(window.location.search);
  const postId = String(params.get('post') || '').trim();

  if (!postId) {
    if (emptyState) emptyState.style.display = 'block';
    if (commentsTitle) commentsTitle.textContent = '💭 0 Comentarii';
    if (form) {
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) submitButton.disabled = true;
    }
    return;
  }

  const postResult = await getPostById(postId);
  if (postResult.success && postResult.data && postContainer) {
    postContainer.innerHTML = `
      <h2 style="color: var(--text); margin: 0 0 1rem 0;">${escapeHtml(postResult.data.title || 'Postare')}</h2>
      <p style="color: var(--text-secondary); line-height: 1.6; margin: 0;">${escapeHtml(postResult.data.content || '')}</p>
    `;
  }

  const loadAndRender = async () => {
    const loaded = await getComments(postId);
    commentsList.innerHTML = '';
    const rows = loaded.success ? loaded.data : [];
    if (commentsTitle) commentsTitle.textContent = `💭 ${rows.length} Comentarii`;

    if (rows.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    rows.forEach(row => commentsList.appendChild(renderCommentCard(row)));
  };

  await loadAndRender();

  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('commentName').value || 'Anonim';
    const email = document.getElementById('commentEmail').value || '';
    const comment = document.getElementById('commentText').value;

    if (!comment.trim()) {
      showNotification('⚠️ Scrie un comentariu înainte de trimitere.');
      return;
    }

    try {
      await saveComment(postId, name, email, comment.trim());
      form.reset();
      await loadAndRender();
      showNotification('✅ Comentariu salvat în baza de date.');
    } catch (error) {
      showNotification('❌ Eroare la salvarea comentariului.');
    }
  });
}

async function initializeFeaturedProfessors() {
  const reviewCards = Array.from(document.querySelectorAll('.reviews-grid .review-card'));

  if (reviewCards.length === 0) {
    return;
  }

  try {
    const [professorsResult, documentsResult, postsResult, reviewsResult] = await Promise.all([
      typeof getProfessors === 'function' ? getProfessors() : Promise.resolve({ success: false, data: [] }),
      typeof getDocuments === 'function' ? getDocuments() : Promise.resolve({ success: false, data: [] }),
      typeof getPosts === 'function' ? getPosts() : Promise.resolve({ success: false, data: [] }),
      typeof getProfessorReviews === 'function' ? getProfessorReviews() : Promise.resolve({ success: false, data: [] })
    ]);

    const professors = Array.isArray(professorsResult.data) ? professorsResult.data : [];
    const documents = Array.isArray(documentsResult.data) ? documentsResult.data : [];
    const posts = Array.isArray(postsResult.data) ? postsResult.data : [];
    const reviews = Array.isArray(reviewsResult.data) ? reviewsResult.data : [];

    const reviewByProfessor = new Map();
    reviews.forEach((row) => {
      const key = String(row.profesor_id || row.professor_id || row.id_profesor || '');
      if (!key) return;
      if (!reviewByProfessor.has(key)) reviewByProfessor.set(key, []);
      reviewByProfessor.get(key).push(row);
    });

    const featuredProfessors = professors.length > 0 ? professors.slice(0, 3) : [];

    for (const [index, card] of reviewCards.entries()) {
      const professor = featuredProfessors[index] || null;
      if (!professor) continue;

      const professorName = professor.full_name || professor.nume_complet || 'Profesor';
      const subject = professor.taught_subject || professor.materie_predata || professor.specialization || 'Specializare';
      const rows = reviewByProfessor.get(String(professor.id)) || [];
      const primaryReviewId = rows[0]?.id || '';
      const avgRating = rows.length ? rows.reduce((sum, row) => sum + Number(row.rating || 0), 0) / rows.length : Number(professor.rating || 0);
      const difficulty = rows.length ? Math.max(1, Math.min(10, Math.round(11 - avgRating * 1.6))) : 0;
      const utility = rows.length ? Math.max(1, Math.min(10, Math.round(avgRating * 2))) : 0;
      const helpful = primaryReviewId && typeof getProfessorReviewHelpfulCount === 'function'
        ? (await getProfessorReviewHelpfulCount(primaryReviewId)).count || 0
        : rows.reduce((sum, row) => sum + Number(row.helpful_count || row.utile || row.likes || row.useful_likes || 0), 0) || rows.length * 12;
      const advice = rows[0]?.advice || rows[0]?.sfat || rows[0]?.comment || rows[0]?.comentariu || 'Nimic încă';
      const reviewText = rows[0]?.comment || rows[0]?.comentariu || rows[0]?.review_text || 'Nu există recenzii suficient de multe încă.';

      const titleEl = card.querySelector('h4');
      const professorNameEl = card.querySelector('.professor-name');
      const statsItems = card.querySelectorAll('.stats .stat-item');
      const reviewTextEl = card.querySelector('.review-text');
      const helpfulEl = card.querySelector('.helpful-count');
      const stars = card.querySelectorAll('.stars .star');

      if (titleEl) titleEl.textContent = subject;
      if (professorNameEl) professorNameEl.textContent = `${professor.academic_title || 'Prof.'} ${professorName}`;
      if (statsItems[0]) statsItems[0].textContent = `📊 Dificultate: ${difficulty}/10`;
      if (statsItems[1]) statsItems[1].textContent = `✅ Utilitate: ${utility}/10`;
      if (statsItems[2]) statsItems[2].textContent = `💡 Sfat: ${advice}`;
      if (reviewTextEl) reviewTextEl.textContent = reviewText;
      if (helpfulEl) helpfulEl.textContent = `👍 ${helpful} găsit util`;
      if (helpfulEl) helpfulEl.dataset.reviewId = primaryReviewId;

      stars.forEach((star, starIndex) => {
        star.classList.toggle('filled', starIndex < Math.round(avgRating || 0));
      });
    }

  } catch (error) {
    console.warn('Could not load featured professors from database:', error.message);
  }
}

/**
 * Escapes HTML characters to prevent XSS
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
// HELPER FUNCTIONS BELOW
// ============================================

