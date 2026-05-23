/**
 * INTERACTIVE.JS - ULBStudent Platform Interactivity
 * Gestionează: teme, votare, notificări, căutare, gamificație, theme toggle
 */

// Restore saved theme as early as possible to avoid flash and ensure persistence
(function restoreSavedThemeEarly() {
  try {
    const saved = localStorage.getItem('theme');
    const isDark = saved === 'dark';
    if (typeof document !== 'undefined') {
      if (isDark) {
        document.documentElement.classList.add('dark-mode');
        document.body && document.body.classList.add('dark-mode');
      } else {
        document.documentElement.classList.remove('dark-mode');
        document.body && document.body.classList.remove('dark-mode');
      }
      // If logos exist on the page, try to set an appropriate src quickly
      try {
        const logos = document.querySelectorAll('img.header-logo');
        logos.forEach((logo) => {
          const src = logo.getAttribute('src') || '';
          if (isDark && src && !src.includes('white')) {
            logo.src = src.replace(/logo-color/i, 'logo-white');
          } else if (!isDark && src && src.includes('logo-white')) {
            logo.src = src.replace(/logo-white/i, 'logo-color');
          }
        });
      } catch (e) {
        // noop
      }
    }
  } catch (e) {
    // ignore
  }
})();

// Sync theme across tabs/windows and respond to external changes
window.addEventListener('storage', (ev) => {
  if (!ev) return;
  try {
    if (ev.key === 'theme') {
      const newTheme = ev.newValue === 'light' ? 'light' : 'dark';
      // applyTheme is defined later; guard-call if available else set classes directly
      if (typeof applyTheme === 'function') {
        applyTheme(newTheme);
      } else {
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark-mode');
          document.body && document.body.classList.add('dark-mode');
        } else {
          document.documentElement.classList.remove('dark-mode');
          document.body && document.body.classList.remove('dark-mode');
        }
      }
    }
  } catch (e) {
    // noop
  }
});

document.addEventListener('DOMContentLoaded', function() {
  // Initialize core interactions FIRST (non-blocking)
  initializeShellPolish();
  initializeUnifiedFooter();       // 🧩 Footer unificat pe toate paginile
  initializeAppSettings();         // ⚙️ Preferinte persistente (tema/font/animații)
  initializeThemeToggle();          // Tema (Light/Dark/Night)
  initializeVotingSystem();         // Sistem de upvote/downvote
  initializeNavigation();           // Marcaje active în meniu
  initializeMobileNavigation();     // Hamburger menu pe mobil
  initializeAccessibilityEnhancements(); // ♿ Atribute ARIA de bază
  initializeLazyMedia();            // Lazy-loading imagini/media
  initializeScrollEffects();        // Animații pe scroll
  initializeSearchBar();            // Căutare cu focus effect
  initializeQuestionFilters();      // Filtrare întrebări
  initializeLikeButton();           // Favorite questions
  initializeBackToTop();            // ⬆️ Buton sus
  initializeAIChat();               // 🤖 Chat AI
  initializeSmoothScrollLinks();    // Smooth scroll pentru anchor links
  handleAnchorOnPageLoad();         // Scroll la anchor dacă URL are #
  initializePostActions();          // Acțiuni pe postări (comentează, share)
  initializeAuthButtons();          // Sign in/up
  initializeGamification();         // Puncte și badges
  initializeReviewInteractions();   // ⭐ Click pe recenzii
  initializeAnnouncementButtons();  // Marcare anunțuri
  initializeGlobalSearch();         // Căutare globală
  initializeScrollAnimations();     // ✨ Animații secțiuni pe scroll
  initializePremiumLandingInteractions(); // Micro-interacțiuni pentru landing premium
  initializeCommandPalette();        // Ctrl + K pentru navigare rapidă
  initializeStatCounters();          // Counter animation pentru impact
  initializeDocumentsData();        // Documente din tabelul `documente`
  initializeDocumentDownloadActions(); // ⬇️ Descărcare reală documente
  initializeDocumentFilters();      // Filtrare documente
  initializePostCreation();         // Sistem de postări
  initializeQuestionsData();        // ❓ Întrebări din baza de date
  initializeSubredditData();        // Profil + postări din baza de date
  initializeCommentsData();         // Comentarii din baza de date
  initializeFeaturedProfessors();    // Nume profesori din baza de date
  initializeHomepageData();          // Secțiuni homepage alimentate din DB
  initializeHomeSectionSliders();    // ↔️ Slider pe secțiuni homepage
  initializeReviewLoadMore();        // 📄 Load-more pentru recenzii pe mobil
  initializeSearchableDropdowns();    // Căutare în dropdown-uri mari

  // ASYNC: Protect pages and initialize session in BACKGROUND (non-blocking)
  Promise.all([
    protectPage().catch(err => console.warn('Page protection check failed:', err.message)),
    updateHeaderWithUserInfo().catch(err => console.warn('Header update failed:', err.message))
  ]).finally(() => {
    // Always mark page as ready, even if auth checks fail
    console.log('Page initialization complete');
  });

  // Show page only after core initialization
  document.body.classList.add('page-ready');
});

function initializeShellPolish() {
  const header = document.querySelector('header');
  if (!header) return;

  const headerContent = header.querySelector('.header-content');
  const existingLogo = headerContent?.querySelector('img.header-logo');
  const textBrand = headerContent?.querySelector('h1');

  if (headerContent && !existingLogo && textBrand?.textContent?.trim().toLowerCase() === 'ulbstudent') {
    const homeHref = window.location.pathname.includes('/src/pages/') ? '../../index.html' : 'index.html';
    headerContent.innerHTML = `
      <a href="${homeHref}" class="header-logo-link" aria-label="ULBStudent acasă">
        <img src="${getAssetUrl('ulbstudent-logo-color.png')}" alt="ULBStudent Logo" class="header-logo">
      </a>
    `;
  }

  const nav = header.querySelector('nav');
  if (nav && !nav.getAttribute('aria-label')) {
    nav.setAttribute('aria-label', 'Navigare principală');
  }

  header.querySelectorAll('.nav-link').forEach((link) => {
    const normalized = link.textContent.trim().toLowerCase();
    if (normalized.includes('pagina princip')) {
      link.textContent = 'Acasă';
    }
  });

  const signInBtn = header.querySelector('.btn-signin');
  const signUpBtn = header.querySelector('.btn-signup');
  const themeBtn = header.querySelector('.btn-theme-toggle');

  if (signInBtn) {
    signInBtn.type = 'button';
    signInBtn.setAttribute('aria-label', 'Conectare în cont');
  }

  if (signUpBtn) {
    signUpBtn.type = 'button';
    signUpBtn.setAttribute('aria-label', 'Creare cont nou');
  }

  if (themeBtn) {
    themeBtn.type = 'button';
    themeBtn.setAttribute('aria-label', 'Schimbă tema');
  }
}

function initializeAppSettings() {
  let settings = {};
  try {
    settings = JSON.parse(localStorage.getItem('app_settings_cache') || '{}');
  } catch {
    settings = {};
  }

  const appearance = settings?.appearance || {};
  const cachedTheme = localStorage.getItem('theme') || '';
  const preferredTheme = String(cachedTheme || appearance.theme || 'light').toLowerCase();
  const normalizedTheme = preferredTheme === 'light' ? 'light' : 'dark';

  localStorage.setItem('theme', normalizedTheme);

  const fontSize = String(appearance.fontSize || 'normal').toLowerCase();
  const validFontSize = ['small', 'normal', 'large'].includes(fontSize) ? fontSize : 'normal';
  document.documentElement.setAttribute('data-font-size', validFontSize);

  const animationsEnabled = appearance.animations !== false;
  document.documentElement.setAttribute('data-animations', animationsEnabled ? 'on' : 'off');
}

/**
 * Normalizez footer-ul la aceeași structură pe toate paginile.
 */
function initializeUnifiedFooter() {
  const footer = document.querySelector('footer');
  if (!footer || footer.dataset.lockedFooter === 'true') {
    return;
  }

  const year = new Date().getFullYear();
  const footerPageUrl = (pageName) => {
    const isInsidePagesFolder = window.location.pathname.includes('/src/pages/');
    if (pageName.startsWith('index.html')) {
      return isInsidePagesFolder ? '../../' + pageName : './' + pageName;
    }

    return isInsidePagesFolder ? pageName : 'src/pages/' + pageName;
  };

  footer.innerHTML = `
    <div class="footer-content">
      <div class="footer-section">
        <img src="${getAssetUrl('ulbstudent-logo-white.png')}" alt="ULBStudent" class="footer-brand-logo">
        <p>Comunitate digitală pentru studenții ULBS: profesori, documente, întrebări, progres academic și decizii mai clare.</p>
        <div class="footer-socials" aria-label="Social media ULBStudent">
          <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i class="fab fa-facebook-f" aria-hidden="true"></i></a>
          <a href="https://discord.com" target="_blank" rel="noopener noreferrer" aria-label="Discord"><i class="fab fa-discord" aria-hidden="true"></i></a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><i class="fab fa-github" aria-hidden="true"></i></a>
        </div>
      </div>
      <div class="footer-section">
        <h4>Pagini importante</h4>
        <ul>
          <li><a href="${footerPageUrl('index.html')}">Acasă</a></li>
          <li><a href="${footerPageUrl('index.html')}#platforma">Despre proiect</a></li>
          <li><a href="${footerPageUrl('index.html')}#functionalitati">Funcționalități</a></li>
          <li><a href="${footerPageUrl('subreddit.html')}">Forum</a></li>
          <li><a href="${footerPageUrl('documente.html')}">Documente</a></li>
          <li><a href="${footerPageUrl('profesori.html')}">Profesori</a></li>
        </ul>
      </div>
      <div class="footer-section">
        <h4>Cont și suport</h4>
        <ul>
          <!-- Download link removed per design: keep site navigation consistent -->
          <li><a href="${footerPageUrl('contact.html')}">Contact</a></li>
          <li><a href="${footerPageUrl('raporteaza-problema.html')}">Raportează problema</a></li>
        </ul>
      </div>
      <div class="footer-section">
        <h4>Legal</h4>
        <ul>
          <li><a href="${footerPageUrl('termeni-conditii.html')}">Termeni și condiții</a></li>
          <li><a href="${footerPageUrl('politica-confidentialitate.html')}">Politica de confidențialitate</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; ${year} ULBStudent. Toate drepturile rezervate.</p>
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

      // Sincronizez și cache-ul de setări pentru persistență între pagini.
      try {
        const settings = JSON.parse(localStorage.getItem('app_settings_cache') || '{}');
        const merged = {
          ...settings,
          appearance: {
            ...(settings.appearance || {}),
            theme: newTheme
          }
        };
        localStorage.setItem('app_settings_cache', JSON.stringify(merged));
      } catch {
        // noop
      }
    });
  }
}

/**
 * Aplică tema la DOM și actualizez iconul butonului
 */
function applyTheme(theme) {
  const themeToggle = document.getElementById('themeToggle');
  const logoColor = getAssetUrl('ulbstudent-logo-color.png');
  const logoWhite = getAssetUrl('ulbstudent-logo-white.png');
  
  if (theme === 'dark') {
    // Dark mode
    document.body.classList.add('dark-mode');
    document.documentElement.classList.add('dark-mode');
    document.querySelectorAll('img.header-logo').forEach((logo) => {
      logo.src = logoWhite;
    });
    if (themeToggle) {
      themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
      themeToggle.title = 'Mod clar';
    }
  } else {
    // Light mode: implicit, culori vive și luminoase
    document.body.classList.remove('dark-mode');
    document.documentElement.classList.remove('dark-mode');
    document.querySelectorAll('img.header-logo').forEach((logo) => {
      logo.src = logoColor;
    });
    if (themeToggle) {
      themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
      themeToggle.title = 'Mod întunecat';
    }
  }
}

// ============================================
// 0.5 AUTHENTICATION BUTTONS
// ============================================
function getAuthPageUrl(pageName) {
  const currentPath = window.location.pathname;
  if (currentPath.includes('/src/pages/')) {
    return pageName;
  }
  return 'src/pages/' + pageName;
}

function getAssetUrl(assetName) {
  const currentPath = window.location.pathname;
  if (currentPath.includes('/src/pages/')) {
    return '../../assets/Logos%20and%20icons/' + assetName;
  }
  return 'assets/Logos%20and%20icons/' + assetName;
}

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
  window.location.href = getAuthPageUrl('login.html');
}

function showSignUpModal() {
  window.location.href = getAuthPageUrl('register.html');
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

function initializeHomeSectionSliders() {
  const sliderButtons = document.querySelectorAll('.section-slider-btn[data-slider-target][data-direction]');
  if (!sliderButtons.length) return;

  const getVisibleIndex = (track, cards) => {
    if (!track || !cards.length) return 0;
    try {
      const trackRect = track.getBoundingClientRect();
      const center = track.scrollLeft + (track.clientWidth / 2);
      let bestIndex = 0;
      let bestDistance = Infinity;
      cards.forEach((card, idx) => {
        const cardLeft = card.offsetLeft;
        const cardCenter = cardLeft + (card.offsetWidth / 2);
        const dist = Math.abs(cardCenter - center);
        if (dist < bestDistance) {
          bestDistance = dist;
          bestIndex = idx;
        }
      });
      return bestIndex;
    } catch (e) {
      return 0;
    }
  };

  const updateActiveCardState = (track) => {
    if (!track) return;
    const cards = Array.from(track.children || []);
    if (!cards.length) return;

    const visibleIndex = getVisibleIndex(track, cards);
    cards.forEach((card, index) => {
      card.classList.toggle('is-active', index === visibleIndex);
    });
  };

  const updateControls = (track) => {
    if (!track) return;
    const controls = document.querySelectorAll(`.section-slider-btn[data-slider-target="${track.id}"]`);
    if (!controls.length) return;

    const cards = Array.from(track.children || []);
    const hasMultipleCards = cards.length > 1;
    controls.forEach((btn) => {
      btn.disabled = !hasMultipleCards;
      btn.style.opacity = hasMultipleCards ? '1' : '0.35';
      btn.style.pointerEvents = hasMultipleCards ? 'auto' : 'none';
    });
  };

  sliderButtons.forEach((button) => {
    if (button.dataset.bound === 'true') return;
    button.dataset.bound = 'true';

    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-slider-target');
      const direction = Number(button.getAttribute('data-direction') || 1);
      const track = targetId ? document.getElementById(targetId) : null;
      if (!track) return;

      const cards = Array.from(track.children || []);
      if (!cards.length) return;

      const visibleIndex = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
      const nextIndex = Math.max(0, Math.min(cards.length - 1, visibleIndex + direction));
      const nextCard = cards[nextIndex];
      if (!nextCard) return;

      // Compute precise scroll target to CENTER the card inside the track
      const targetLeft = Math.max(
        0,
        Math.round(nextCard.offsetLeft - (track.clientWidth - nextCard.offsetWidth) / 2)
      );

      track.classList.add('is-sliding');
      track.scrollTo({ left: targetLeft, behavior: 'smooth' });

      // After animation: ensure exact alignment (fix fractional pixels) and update state
      window.setTimeout(() => {
        try {
          track.classList.remove('is-sliding');
          track.scrollLeft = targetLeft; // snap exactly to center
          updateActiveCardState(track);
        } catch (e) {
          // noop
        }
      }, 420);
    });
  });

  const uniqueTrackIds = new Set(
    Array.from(sliderButtons)
      .map((button) => button.getAttribute('data-slider-target'))
      .filter(Boolean)
  );

  uniqueTrackIds.forEach((trackId) => {
    const track = document.getElementById(trackId);
    if (!track) return;

    updateActiveCardState(track);
    updateControls(track);

    const observer = new MutationObserver(() => updateControls(track));
    observer.observe(track, { childList: true });

    let scrollTicking = false;
    track.addEventListener('scroll', () => {
      if (scrollTicking) return;
      scrollTicking = true;
      window.requestAnimationFrame(() => {
        updateActiveCardState(track);
        scrollTicking = false;
      });
    }, { passive: true });

      // Snap to nearest card when touch/pointer interaction ends
      const snapToClosest = () => {
        const cards = Array.from(track.children || []);
        if (!cards.length) return;
        // choose nearest by center
        const center = track.scrollLeft + (track.clientWidth / 2);
        let bestIndex = 0;
        let bestDistance = Infinity;
        cards.forEach((card, idx) => {
          const cardCenter = card.offsetLeft + (card.offsetWidth / 2);
          const dist = Math.abs(cardCenter - center);
          if (dist < bestDistance) {
            bestDistance = dist;
            bestIndex = idx;
          }
        });
        const targetCard = cards[bestIndex];
        if (!targetCard) return;
        const targetLeft = Math.max(
          0,
          Math.round(targetCard.offsetLeft - (track.clientWidth - targetCard.offsetWidth) / 2)
        );
        track.scrollTo({ left: targetLeft, behavior: 'smooth' });
        window.setTimeout(() => {
          track.scrollLeft = targetLeft;
          updateActiveCardState(track);
        }, 320);
      };

      track.addEventListener('pointerup', snapToClosest);
      track.addEventListener('touchend', snapToClosest);
      track.addEventListener('pointercancel', snapToClosest);
      track.addEventListener('mouseleave', snapToClosest);

    window.setTimeout(() => updateActiveCardState(track), 80);
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

function applyVoteVisualState(voteContainer, selectedVote) {
  if (!voteContainer) return;

  const upIcon = voteContainer.querySelector('.fa-arrow-up');
  const downIcon = voteContainer.querySelector('.fa-arrow-down');

  if (upIcon) {
    upIcon.classList.toggle('is-active-up', selectedVote === 'up');
  }

  if (downIcon) {
    downIcon.classList.toggle('is-active-down', selectedVote === 'down');
  }
}

async function syncPostVoteState(postsFeed, posts = []) {
  if (!postsFeed || typeof getCurrentUserPostVotes !== 'function') return;

  const postIds = posts.map((post) => String(post?.id || '')).filter(Boolean);
  if (postIds.length === 0) return;

  const votesResult = await getCurrentUserPostVotes(postIds);
  const votesMap = votesResult?.data || {};

  postsFeed.querySelectorAll('.post-card').forEach((card) => {
    const postId = String(card.getAttribute('data-post-id') || '');
    const selectedVote = votesMap[postId] || null;
    applyVoteVisualState(card.querySelector('.post-votes'), selectedVote);
  });
}

async function syncQuestionVoteState(questionList, questions = []) {
  if (!questionList || typeof getCurrentUserQuestionVotes !== 'function') return;

  const questionIds = questions.map((question) => String(question?.id || '')).filter(Boolean);
  if (questionIds.length === 0) return;

  const votesResult = await getCurrentUserQuestionVotes(questionIds);
  const votesMap = votesResult?.data || {};

  questionList.querySelectorAll('.question').forEach((card) => {
    const questionId = String(card.getAttribute('data-question-id') || '');
    const selectedVote = votesMap[questionId] || null;
    applyVoteVisualState(card.querySelector('.vote-column'), selectedVote);
  });
}

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
        applyVoteVisualState(postCard.querySelector('.post-votes'), result.userVote || null);
        // Feedback visual
        voteSpan.style.color = direction === 'up' ? '#22c55e' : '#ef4444';
        createParticles(voteSpan, direction === 'up' ? '#22c55e' : '#ef4444');
        setTimeout(() => {
          voteSpan.style.color = '';
        }, 500);
      } else {
        showToast(result.error || 'Eroare la salvarea votului.', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Eroare la votare.', 'error');
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
        applyVoteVisualState(question.querySelector('.vote-column'), result.userVote || null);
        // Feedback visual
        voteSpan.style.color = direction === 'up' ? '#22c55e' : '#ef4444';
        createParticles(voteSpan, direction === 'up' ? '#22c55e' : '#ef4444');
        setTimeout(() => {
          voteSpan.style.color = '';
        }, 500);
      } else {
        showToast(result.error || 'Eroare la salvarea votului.', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Eroare la votare.', 'error');
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
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  // Page name mappings for matching
  const pageAliases = {
    '': 'index.html',
    'index': 'index.html',
    'index.html': 'index.html',
    'subreddit.html': 'subreddit.html',
    'subreddit': 'subreddit.html',
    'documente.html': 'documente.html',
    'documente': 'documente.html',
    'comments.html': 'comments.html',
    'comments': 'comments.html',
    'discutie.html': 'discutie.html',
    'discutie': 'discutie.html',
    'profesori.html': 'profesori.html',
    'profesori': 'profesori.html',
    'profile.html': 'profile.html',
    'profile': 'profile.html',
    'settings.html': 'settings.html',
    'settings': 'settings.html'
  };
  
  const normalizedPage = pageAliases[currentPage] || pageAliases[currentPage.split('.')[0]] || currentPage;
  
  // Set active on page load
  navLinks.forEach(link => {
    const href = link.getAttribute('href') || '';
    const linkPage = href.split('/').pop() || '';
    const normalizedLink = pageAliases[linkPage] || pageAliases[linkPage.split('.')[0]] || linkPage;
    
    // Match current page with link
    if (normalizedPage === normalizedLink || 
        (normalizedPage === 'index.html' && (linkPage === '' || linkPage === 'index.html' || linkPage === 'index'))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
  
  // Click handler for manual navigation
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      // Remove active class from all links
      navLinks.forEach(l => l.classList.remove('active'));
      // Add active class to clicked link
      this.classList.add('active');
    });
  });
  
  // Also watch for hash changes and page navigation
  window.addEventListener('hashchange', () => {
    updateNavigationActive();
  });
}

function initializeMobileNavigation() {
  const header = document.querySelector('header');
  const nav = header?.querySelector('nav');
  const navList = nav?.querySelector('ul');

  if (!header || !nav || !navList) return;

  let toggleBtn = header.querySelector('.nav-toggle-btn');
  if (!toggleBtn) {
    toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'nav-toggle-btn';
    toggleBtn.setAttribute('aria-label', 'Deschide meniul de navigare');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i><span>Meniu</span>';
    header.insertBefore(toggleBtn, nav);
  }

  // Create a mobile controls container for the nav toggle + theme toggle
  let mobileControls = header.querySelector('.mobile-controls');
  if (!mobileControls) {
    mobileControls = document.createElement('div');
    mobileControls.className = 'mobile-controls';
    // place it before nav so it's above the collapsible menu
    header.insertBefore(mobileControls, nav);
  }

  const themeBtn = header.querySelector('.btn-theme-toggle');

  function arrangeMobileControls() {
    if (window.innerWidth <= 768) {
      // Ensure mobileControls contains the toggle and theme button
      if (!mobileControls.contains(toggleBtn)) mobileControls.appendChild(toggleBtn);
      if (themeBtn && !mobileControls.contains(themeBtn)) mobileControls.appendChild(themeBtn);
      // Move user menu (if present) into mobile controls as well
      const userMenu = header.querySelector('.user-menu');
      if (userMenu && !mobileControls.contains(userMenu)) {
        // hide original location to avoid duplicates
        const headerActions = header.querySelector('.header-actions');
        if (headerActions) {
          const orig = headerActions.querySelector('.user-menu');
          if (orig) orig.style.display = 'none';
        }
        mobileControls.appendChild(userMenu);
      }
      // hide header-actions' theme button (we moved it)
      if (header.querySelector('.header-actions')) {
        const haTheme = header.querySelector('.header-actions .btn-theme-toggle');
        if (haTheme) haTheme.style.display = 'none';
      }
    } else {
      // move elements back to their original locations on larger screens
      // restore theme toggle inside header-actions
      const headerActions = header.querySelector('.header-actions');
      if (headerActions && themeBtn && !headerActions.contains(themeBtn)) {
        headerActions.insertBefore(themeBtn, headerActions.firstChild);
        themeBtn.style.display = '';
      }
      // put toggle back before nav (in case layout relies on it)
      if (!header.contains(toggleBtn)) header.insertBefore(toggleBtn, nav);
      // restore user menu back to header-actions
      const userMenu = mobileControls.querySelector('.user-menu');
      if (userMenu && headerActions && !headerActions.contains(userMenu)) {
        headerActions.appendChild(userMenu);
        userMenu.style.display = '';
      }
    }
  }

  // arrange controls initially and on resize
  arrangeMobileControls();
  window.addEventListener('resize', arrangeMobileControls);

  // Move only the signin/signup buttons into the mobile nav on small screens.
  const headerActions = header.querySelector('.header-actions');
  const signInBtn = header.querySelector('.btn-signin');
  const signUpBtn = header.querySelector('.btn-signup');
  let mobileSignInLi = null;
  let mobileSignUpLi = null;

  function moveActionsToNav() {
    if (!headerActions || !navList) return;
    // clean up any legacy full-action clones that might exist
    const legacyClone = nav.querySelector('.mobile-cloned-actions');
    if (legacyClone) {
      legacyClone.remove();
    }
    if (window.innerWidth <= 768) {
      // create cloned li items only once
      if (!mobileSignInLi && signInBtn) {
        mobileSignInLi = document.createElement('li');
        mobileSignInLi.className = 'mobile-nav-action';
        const clone = signInBtn.cloneNode(true);
        clone.classList.remove('btn-theme-toggle');
        mobileSignInLi.appendChild(clone);
      }

      if (!mobileSignUpLi && signUpBtn) {
        mobileSignUpLi = document.createElement('li');
        mobileSignUpLi.className = 'mobile-nav-action';
        const clone = signUpBtn.cloneNode(true);
        mobileSignUpLi.appendChild(clone);
      }

      // append clones to nav list if not present
      if (mobileSignInLi && !navList.contains(mobileSignInLi)) {
        navList.appendChild(mobileSignInLi);
      }
      if (mobileSignUpLi && !navList.contains(mobileSignUpLi)) {
        navList.appendChild(mobileSignUpLi);
      }

      // hide original signin/signup in header but keep theme toggle visible
      if (signInBtn) signInBtn.style.display = 'none';
      if (signUpBtn) signUpBtn.style.display = 'none';
      // ensure theme toggle stays visible
      const themeBtn = header.querySelector('.btn-theme-toggle');
      if (themeBtn) themeBtn.style.display = '';
    } else {
      // restore originals and remove clones
      if (mobileSignInLi && navList.contains(mobileSignInLi)) navList.removeChild(mobileSignInLi);
      if (mobileSignUpLi && navList.contains(mobileSignUpLi)) navList.removeChild(mobileSignUpLi);
      if (signInBtn) signInBtn.style.display = '';
      if (signUpBtn) signUpBtn.style.display = '';
    }
  }

  // Initial placement and on resize
  moveActionsToNav();
  window.addEventListener('resize', moveActionsToNav);

  const closeMenu = () => {
    header.classList.remove('nav-open');
    toggleBtn.setAttribute('aria-expanded', 'false');
  };

  toggleBtn.addEventListener('click', () => {
    const isOpen = header.classList.toggle('nav-open');
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
  });

  navList.addEventListener('click', (event) => {
    if (event.target.closest('.nav-link')) {
      closeMenu();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
    }
  });
}

/* Load-more for featured reviews on mobile: show a small batch and reveal more on demand */
function initializeReviewLoadMore() {
  const track = document.getElementById('featuredReviewsGrid');
  if (!track) return;

  const items = Array.from(track.children || []);
  const total = items.length;
  const perPage = 3;
  if (total <= perPage) return;

  // Create load more button after the track
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'reviews-loadmore-btn';
  btn.textContent = 'Arată mai multe';
  btn.setAttribute('aria-expanded', 'false');
  track.after(btn);

  // Helper to update visible items depending on screen size and current count
  const update = (reset = false) => {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) {
      // show all on larger screens
      items.forEach(el => el.style.display = 'block');
      btn.style.display = 'none';
      return;
    }

    // On mobile show only a limited number
    let shown = Number(btn.dataset.shownCount) || perPage;
    if (reset) shown = perPage;
    items.forEach((el, idx) => {
      el.style.display = idx < shown ? 'block' : 'none';
    });

    if (shown >= total) {
      btn.textContent = 'Arată mai puține';
      btn.setAttribute('aria-expanded', 'true');
    } else {
      btn.textContent = 'Arată mai multe';
      btn.setAttribute('aria-expanded', 'false');
    }

    btn.style.display = total > perPage ? 'inline-flex' : 'none';
    btn.dataset.shownCount = shown;
  };

  // Click handler toggles between expanding by perPage or collapsing
  btn.addEventListener('click', () => {
    const shown = Number(btn.dataset.shownCount) || perPage;
    if (shown >= total) {
      // collapse
      btn.dataset.shownCount = perPage;
      update(true);
      // scroll to top of section to keep context
      track.parentElement && track.parentElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // expand by next batch
      const next = Math.min(total, shown + perPage);
      btn.dataset.shownCount = next;
      update(false);
    }
  });

  // Initial update and responsive handling
  update(true);
  window.addEventListener('resize', () => update(true));
}

function initializeAccessibilityEnhancements() {
  const main = document.querySelector('main');
  if (main && !main.getAttribute('role')) {
    main.setAttribute('role', 'main');
  }

  const primaryNav = document.querySelector('header nav');
  if (primaryNav && !primaryNav.getAttribute('aria-label')) {
    primaryNav.setAttribute('aria-label', 'Navigare principala');
  }

  document.querySelectorAll('.btn-theme-toggle:not([aria-label])').forEach((btn) => {
    btn.setAttribute('aria-label', 'Schimbă tema');
  });

  document.querySelectorAll('button:not([aria-label])').forEach((btn) => {
    const hasVisibleText = (btn.textContent || '').trim().length > 0;
    if (hasVisibleText) return;

    const fallbackLabel = btn.getAttribute('title') || btn.getAttribute('data-action') || 'Buton';
    btn.setAttribute('aria-label', fallbackLabel);
  });

  document.querySelectorAll('.action-btn:not([aria-label])').forEach((btn) => {
    const title = btn.getAttribute('title') || btn.getAttribute('data-action') || 'Actiune';
    btn.setAttribute('aria-label', title);
  });

  document.querySelectorAll('input:not([type="hidden"]):not([aria-label])').forEach((input) => {
    const id = input.getAttribute('id');
    if (id && document.querySelector(`label[for="${id}"]`)) {
      return;
    }

    const placeholder = input.getAttribute('placeholder');
    if (placeholder) {
      input.setAttribute('aria-label', placeholder);
    }
  });
}

function updateNavigationActive() {
  const navLinks = document.querySelectorAll('.nav-link');
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const pageAliases = {
    '': 'index.html',
    'index': 'index.html',
    'index.html': 'index.html',
    'subreddit.html': 'subreddit.html',
    'comments.html': 'comments.html',
    'discutie.html': 'discutie.html',
    'documente.html': 'documente.html',
    'profesori.html': 'profesori.html'
  };
  
  const normalizedPage = pageAliases[currentPage] || currentPage;
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href') || '';
    const linkPage = href.split('/').pop() || '';
    const normalizedLink = pageAliases[linkPage] || linkPage;
    
    if (normalizedPage === normalizedLink) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
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
        showNotification('Completează cel puțin un filtru de căutare.');
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
/**
 * Toast Notification System - Enhanced
 * Supports: success, error, warning, info types
 * Auto-dismisses after 4 seconds or on close click
 */

function initToastContainer() {
  if (document.getElementById('toast-container')) return;
  
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.setAttribute('role', 'region');
  container.setAttribute('aria-live', 'polite');
  container.setAttribute('aria-label', 'Notificări aplicație');
  document.body.appendChild(container);
}

function initializeLazyMedia() {
  const images = Array.from(document.querySelectorAll('img'));
  images.forEach((img, index) => {
    if (!img.getAttribute('loading')) {
      img.setAttribute('loading', index === 0 ? 'eager' : 'lazy');
    }

    if (!img.getAttribute('decoding')) {
      img.setAttribute('decoding', 'async');
    }
  });
}

function showToast(message, type = 'info', duration = 4000) {
  initToastContainer();
  const container = document.getElementById('toast-container');
  
  // Determine icon and styling based on type
  const icons = {
    success: '✓',
    error: '✕',
    warning: '!',
    info: 'ⓘ'
  };
  
  const icon = icons[type] || icons.info;
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  toast.innerHTML = `
    <div class="toast-content">
      <i class="toast-icon">${icon}</i>
      <span class="toast-text">${escapeHtml(message)}</span>
    </div>
    <button class="toast-close" aria-label="Închide notificare">×</button>
  `;
  
  container.appendChild(toast);
  
  // Close button handler
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => removeToast(toast));
  
  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => removeToast(toast), duration);
  }
  
  return toast;
}

function removeToast(toastEl) {
  toastEl.classList.add('removing');
  setTimeout(() => toastEl.remove(), 300);
}

// Backwards compatibility - showNotification now uses toast system
function showNotification(message, type = 'info') {
  const cleanMessage = String(message || '').replace(/^[^\p{L}\p{N}]+/u, '').trim();
  if (/succes|salvat|actualizat|creat/i.test(cleanMessage)) {
    showToast(cleanMessage, 'success');
  } else if (/eroare|eșuat|invalid|nu s-a/i.test(cleanMessage)) {
    showToast(cleanMessage, 'error');
  } else if (/avertis|atenție|trebuie/i.test(cleanMessage)) {
    showToast(cleanMessage, 'warning');
  } else {
    showToast(cleanMessage || message, type);
  }
}

// ============================================
// POST SORTING UTILITIES
// ============================================

/**
 * Sort posts array by specified type
 * Types: recent, popular, trending, oldest
 */
function sortPostsByType(posts, sortType = 'recent') {
  const now = new Date();
  
  const postsWithMetadata = posts.map(post => {
    const createdAt = post.created_at ? new Date(post.created_at) : now;
    const hoursOld = (now - createdAt) / (1000 * 60 * 60);
    const votes = Number(post.votes || 0);
    
    // Trending score: more votes + more recent = higher score
    const trendingScore = votes * Math.max(1, 10 - hoursOld);
    
    return { ...post, createdAt, hoursOld, votes, trendingScore };
  });
  
  switch(sortType) {
    case 'recent':
      return postsWithMetadata.sort((a, b) => b.createdAt - a.createdAt);
    case 'popular':
      return postsWithMetadata.sort((a, b) => b.votes - a.votes || b.createdAt - a.createdAt);
    case 'trending':
      return postsWithMetadata.sort((a, b) => b.trendingScore - a.trendingScore);
    case 'oldest':
      return postsWithMetadata.sort((a, b) => a.createdAt - b.createdAt);
    default:
      return postsWithMetadata;
  }
}

/**
 * Sort and re-render posts in the feed
 */
function sortAndRenderPosts(postElements, sortType, container, user) {
  // Extract post data from DOM elements
  const posts = Array.from(postElements).map(el => {
    return {
      id: el.dataset.postId || '',
      title: el.querySelector('.post-title')?.textContent || '',
      content: el.querySelector('.post-body p')?.textContent || '',
      votes: Number(el.querySelector('.vote-count')?.textContent || 0),
      created_at: el.dataset.createdAt || new Date().toISOString()
    };
  });
  
  if (!container) return;
  
  const sorted = sortPostsByType(posts, sortType);
  container.innerHTML = '';
  sorted.forEach(post => {
    const postEl = postElements.find(el => el.dataset.postId === post.id);
    if (postEl) {
      container.appendChild(postEl.cloneNode(true));
    }
  });
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
  aiChatBtn.innerHTML = '<img src="/assets/Logos and icons/ulbstudent-icon-circle.png" alt="ULBStudent" aria-hidden="true" style="width: 3rem; height:3rem; object-fit: contain; flex-shrink: 0;" /><span class="fab-label">Ajutor AI</span>';
  aiChatBtn.title = 'Deschide asistentul ULBStudent';
  aiChatBtn.setAttribute('aria-label', 'Deschide asistentul ULBStudent');
  
  fabContainer.insertBefore(aiChatBtn, fabContainer.firstChild);
  
  // Creare modal chat
  const chatModal = document.createElement('div');
  chatModal.id = 'chatModal';
  chatModal.innerHTML = `
    <div class="chat-window">
      <div class="chat-header">
        <h3>
          <img src="/assets/Logos and icons/ulbstudent-icon-minimalist-bg-transparent.png" alt="ULBStudent" aria-hidden="true" style="width: 3.5rem; height: 3.5rem; object-fit: contain; flex-shrink: 0;" />
          Eliot
        </h3>
        <button class="chat-close-btn" id="chatCloseBtn" aria-label="Închide asistentul">&times;</button>
      </div>
      <div class="chat-messages" id="chatMessages">
        <div class="chat-message ai">
          <div class="message-bubble">Salut! Sunt Eliot, asistentul ULBStudent. Cum te pot ajuta astăzi?</div>
        </div>
      </div>
      <div class="chat-input-area">
        <input 
          type="text" 
          id="chatInput" 
          placeholder="Scrie mesajul tău..."
          autocomplete="off"
        />
        <button id="chatSendBtn"><i class="fa-solid fa-paper-plane"></i></button>
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
  document.getElementById('chatSendBtn').addEventListener('click', () => {
    sendMessage();
  });
  
  // Trimitere mesaj cu Enter
  document.getElementById('chatInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  
  // Funcție trimitere mesaj
  async function sendMessage() {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');
    const message = input.value.trim();
    
    if (message === '') return;
    
    // Adăugare mesaj utilizator
    addChatMessage(message, 'user');
    input.value = '';

    const config = window.SUPABASE_CONFIG || {};
    const baseUrl = typeof config.url === 'string' ? config.url.replace(/\/$/, '') : '';
    const anonKey = config.anonKey || '';

    if (!baseUrl || !anonKey) {
      addChatMessage('Configurația Supabase lipsește. Verifică fișierul supabase-client.js.', 'ai');
      return;
    }

    const functionUrl = `${baseUrl}/functions/v1/chat-facultate`;

    const typingId = `typing-${Date.now()}`;
    addChatMessage('Se generează răspunsul...', 'ai', typingId);

    input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;

    try {
      let authToken = anonKey;

      if (typeof initSupabaseClient === 'function') {
        const client = await initSupabaseClient();
        const { data } = await client.auth.getSession();
        if (data?.session?.access_token) {
          authToken = data.session.access_token;
        }
      }

      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ prompt: message })
      });

      const rawBody = await res.text();
      let data = {};

      try {
        data = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        data = { error: rawBody || 'Răspuns invalid de la server.' };
      }

      const typingMessage = document.querySelector(`[data-chat-id="${typingId}"]`);
      if (typingMessage) typingMessage.remove();

      if (!res.ok) {
        const errorText = data?.error || `Serverul a răspuns cu codul ${res.status}.`;
        addChatMessage(errorText, 'ai');
        return;
      }

      const reply = data?.reply || 'Nu am primit un răspuns valid de la server.';
      addChatMessage(reply, 'ai');
    } catch (error) {
      const typingMessage = document.querySelector(`[data-chat-id="${typingId}"]`);
      if (typingMessage) typingMessage.remove();
      addChatMessage(`Eroare de conexiune: ${error.message}`, 'ai');
    } finally {
      input.disabled = false;
      if (sendBtn) sendBtn.disabled = false;
      input.focus();
    }
  }
  
  // Funcție adăugare mesaj în chat
  function addChatMessage(text, sender, messageId = '') {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;

    if (messageId) {
      messageDiv.dataset.chatId = messageId;
    }

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = escapeHtml(String(text || ''));
    messageDiv.appendChild(bubble);

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
      // Redirect la pagina dedicată discutiei pentru postarea selectata
      window.location.href = `discutie.html?post=${encodeURIComponent(postId)}`;
    } else if (action === 'share') {
      // Share functionality - copiază link direct către discuția postării.
      const shareUrl = new URL(`discutie.html?post=${encodeURIComponent(postId)}`, window.location.href).toString();
      navigator.clipboard.writeText(shareUrl).then(() => {
        // Show visual feedback
        const originalText = actionBtn.innerHTML;
        actionBtn.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Link copiat';
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
          'Boboc Curios': 'Ai dat deja 10 răspunsuri. Bine ai în comunitate!',
          'Salvator': 'Ai ajutat alți studenți cu 50 upvote-uri. Ești un membru de bază al comunității!',
          'Expert Calculatoare': 'Ai postări despre Calculatoare cu peste 100 upvote-uri.'
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

        this.innerHTML = `<i class="fa-solid fa-thumbs-up" aria-hidden="true"></i> ${result.count} găsit util`;
        this.style.transform = 'scale(1.15)';
        setTimeout(() => {
          this.style.transform = 'scale(1)';
        }, 150);

        showNotification(result.added ? 'Mulțumim pentru feedback.' : 'Feedback-ul util a fost retras.');

        let userReputation = JSON.parse(localStorage.getItem('userReputation')) || { points: 0 };
        userReputation.points += result.added ? 1 : 0;
        localStorage.setItem('userReputation', JSON.stringify(userReputation));
        return;
      }
      
      // Extract the first number from the helpful counter.
      const countMatch = String(this.textContent || '').match(/\d+/);
      let count = countMatch ? parseInt(countMatch[0], 10) : 0;
      
      // Increment count
      count++;
      
      // Update display
      this.innerHTML = `<i class="fa-solid fa-thumbs-up" aria-hidden="true"></i> ${count} găsit util`;
      
      // Add animation
      this.style.transform = 'scale(1.15)';
      setTimeout(() => {
        this.style.transform = 'scale(1)';
      }, 150);

      // Show feedback
      showNotification('Mulțumim pentru feedback.');
      
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

    showNotification('Anunț marcat ca citit.');

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
      resultsList.innerHTML = '<div style="padding: 2rem; text-align: center; color: #888;">Nu au fost găsite rezultate pentru "<strong>' + escapeHtml(query) + '</strong>"</div>';
      searchResults.style.display = 'block';
    }
  }

  function createResultItem(item, category) {
    const div = document.createElement('div');
    div.className = 'result-item';
    
    let html = `<span class="result-type ${category}">${escapeHtml(getCategoryLabel(category))}</span>`;
    
    if (category === 'professors') {
      html += `<div class="result-title">${escapeHtml(item.name)}</div>
               <div class="result-description">${escapeHtml(item.subject)} • ⭐ ${escapeHtml(item.rating)}/5</div>`;
    } else if (category === 'documents') {
      html += `<div class="result-title">${escapeHtml(item.title)}</div>
               <div class="result-description">${escapeHtml(item.type)} • ${escapeHtml(item.size)}</div>`;
    } else if (category === 'posts') {
      html += `<div class="result-title">${escapeHtml(item.title)}</div>
               <div class="result-description">de ${escapeHtml(item.author)} • ${escapeHtml(item.category || 'postare')}${item.content ? ' • ' + escapeHtml(item.content.slice(0, 90)) : ''}</div>`;
    } else if (category === 'announcements') {
      html += `<div class="result-title">${escapeHtml(item.title)}</div>
               <div class="result-description">${escapeHtml(item.source)}</div>`;
    } else if (category === 'reviews') {
      html += `<div class="result-title">${escapeHtml(item.title)}</div>
               <div class="result-description">⭐ ${escapeHtml(item.rating)}/5 • ${escapeHtml(item.comment.slice(0, 90))}</div>`;
    } else if (category === 'questions') {
      html += `<div class="result-title">${escapeHtml(item.title)}</div>
               <div class="result-description">${item.content ? escapeHtml(item.content.slice(0, 90)) : ''}</div>`;
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

      showToast('Se deschide: ' + (item.title || item.name), 'info');
    });
    
    return div;
  }

  function getCategoryLabel(category) {
    const labels = {
      professors: 'Profesor',
      documents: 'Document',
      posts: 'Postare',
      announcements: 'Anunț',
      reviews: 'Recenzie'
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
    '.studio-section, .feature-showcase-section, .advanced-search-section, .statistics-section, .recent-activity-section, .testimonials-section, .reviews-section, .leaderboard-section, .announcements-section'
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

function initializePremiumLandingInteractions() {
  const home = document.getElementById('home');
  if (!home) return;

  const interactiveCards = home.querySelectorAll(
    '.value-card, .studio-board-card, .feature-tile, .hero-product-panel, .review-card, .testimonial-card, .stat-card'
  );

  interactiveCards.forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      card.style.setProperty('--tilt-x', `${(-y * 3).toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${(x * 3).toFixed(2)}deg`);
      card.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
      card.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
    });

    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--tilt-x');
      card.style.removeProperty('--tilt-y');
      card.style.removeProperty('--spot-x');
      card.style.removeProperty('--spot-y');
    });
  });

  home.querySelectorAll('.hero-cta, .feature-tile, .value-card').forEach((element) => {
    element.addEventListener('pointerdown', () => {
      element.classList.remove('is-pressing');
      void element.offsetWidth;
      element.classList.add('is-pressing');
      window.setTimeout(() => element.classList.remove('is-pressing'), 360);
    });
  });
}

function initializeCommandPalette() {
  if (document.getElementById('commandPalette')) return;

  const commands = [
    { label: 'Acasă', hint: 'Deschide landing page-ul ULBStudent', href: 'index.html', icon: 'fa-house' },
    { label: 'Profesori', hint: 'Caută profesori și recenzii', href: 'profesori.html', icon: 'fa-user-tie' },
    { label: 'Documente', hint: 'Biblioteca de resurse academice', href: 'documente.html', icon: 'fa-folder-open' },
    { label: 'Discuții', hint: 'Forum și întrebări ale comunității', href: 'comments.html', icon: 'fa-comments' },
    { label: 'Profil', hint: 'Vezi contul și progresul tău', href: 'profile.html', icon: 'fa-user' },
    { label: 'Setări', hint: 'Temă, notificări și preferințe', href: 'settings.html', icon: 'fa-sliders' },
    { label: 'Contact', hint: 'Suport și feedback', href: 'contact.html', icon: 'fa-paper-plane' },
    { label: 'Raportează problemă', hint: 'Trimite un bug sau o sugestie', href: 'raporteaza-problema.html', icon: 'fa-shield-halved' }
  ];

  const palette = document.createElement('div');
  palette.id = 'commandPalette';
  palette.className = 'command-palette';
  palette.setAttribute('role', 'dialog');
  palette.setAttribute('aria-modal', 'true');
  palette.setAttribute('aria-label', 'Command palette ULBStudent');
  palette.innerHTML = `
    <div class="command-palette-panel">
      <div class="command-palette-search">
        <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        <input id="commandPaletteInput" type="search" placeholder="Caută pagini, resurse sau acțiuni..." autocomplete="off">
        <span class="command-palette-kbd">Esc</span>
      </div>
      <div class="command-palette-list" id="commandPaletteList"></div>
    </div>
  `;

  document.body.appendChild(palette);

  const input = palette.querySelector('#commandPaletteInput');
  const list = palette.querySelector('#commandPaletteList');

  const normalize = (value) => String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const openPalette = () => {
    palette.classList.add('is-open');
    document.body.classList.add('command-palette-open');
    renderCommands(input.value);
    window.setTimeout(() => input.focus(), 0);
  };

  const closePalette = () => {
    palette.classList.remove('is-open');
    document.body.classList.remove('command-palette-open');
    input.value = '';
  };

  const runCommand = (command) => {
    closePalette();
    if (command.download) {
      const link = document.createElement('a');
      link.href = command.href;
      link.download = '';
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }
    window.location.href = command.href;
  };

  const renderCommands = (query = '') => {
    const needle = normalize(query);
    const filtered = commands.filter((command) => {
      const haystack = normalize(`${command.label} ${command.hint}`);
      return haystack.includes(needle);
    });

    if (!filtered.length) {
      list.innerHTML = '<div class="command-palette-empty">Nu am găsit o comandă potrivită.</div>';
      return;
    }

    list.innerHTML = filtered.map((command, index) => `
      <button class="command-palette-item" type="button" data-command-index="${commands.indexOf(command)}" aria-selected="${index === 0 ? 'true' : 'false'}">
        <i class="fa-solid ${command.icon}" aria-hidden="true"></i>
        <span>
          <strong>${command.label}</strong>
          <span>${command.hint}</span>
        </span>
      </button>
    `).join('');
  };

  document.addEventListener('keydown', (event) => {
    const isCommandShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
    if (isCommandShortcut) {
      event.preventDefault();
      if (palette.classList.contains('is-open')) {
        closePalette();
      } else {
        openPalette();
      }
    }

    if (event.key === 'Escape' && palette.classList.contains('is-open')) {
      closePalette();
    }
  });

  input.addEventListener('input', () => renderCommands(input.value));

  list.addEventListener('click', (event) => {
    const button = event.target.closest('.command-palette-item');
    if (!button) return;
    const command = commands[Number(button.dataset.commandIndex)];
    if (command) runCommand(command);
  });

  palette.addEventListener('click', (event) => {
    if (event.target === palette) {
      closePalette();
    }
  });
}

function initializeStatCounters() {
  const statValues = document.querySelectorAll('#platformStatsGrid .stat-content h3, .hero-trust-row strong');
  if (!statValues.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || entry.target.dataset.counted === 'true') return;

      const element = entry.target;
      const original = element.textContent.trim();
      const match = original.match(/([\d.,]+)/);
      if (!match) {
        element.dataset.counted = 'true';
        observer.unobserve(element);
        return;
      }

      const numeric = Number(match[1].replace(/\./g, '').replace(',', '.'));
      if (!Number.isFinite(numeric)) {
        element.dataset.counted = 'true';
        observer.unobserve(element);
        return;
      }

      const suffix = original.replace(match[1], '');
      const usesDecimal = match[1].includes(',') || match[1].includes('.');
      const duration = 900;
      const start = performance.now();

      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = numeric * eased;
        const display = usesDecimal && numeric < 10
          ? current.toFixed(1).replace('.', ',')
          : Math.round(current).toLocaleString('ro-RO');
        element.textContent = `${display}${suffix}`;
        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          element.textContent = original;
        }
      }

      element.dataset.counted = 'true';
      requestAnimationFrame(tick);
      observer.unobserve(element);
    });
  }, { threshold: 0.4 });

  statValues.forEach((value) => observer.observe(value));
}

/**
 * DOCUMENT FILTERING - Filtrare documente după an și categorie
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
  
  if (!yearFilter) return; // Nu suntem pe pagina de documente

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
      const rawMeta = card.querySelector('.doc-meta')?.textContent || '';
      const cardMeta = normalizeText(rawMeta);
      const cardText = normalizeText(card.textContent || '');
      const cardYear = String(card.getAttribute('data-year') || rawMeta.match(/anul\s*(\d+)/i)?.[1] || '').trim();
      const cardCategory = normalizeText(card.getAttribute('data-category') || rawMeta);
      const cardSpecialization = normalizeText(card.getAttribute('data-specialization') || rawMeta);
      const cardDiscipline = normalizeText(card.getAttribute('data-discipline') || rawMeta);
      const normalizedDiscipline = normalizeText(selectedDiscipline.replace(/-/g, ' '));

      const matchYear = !selectedYear || cardYear === selectedYear;
      const matchCategory = !selectedCategory || cardCategory.includes(normalizeText(selectedCategory));
      const matchDiscipline = !normalizedDiscipline || cardMeta.includes(normalizedDiscipline) || cardDiscipline.includes(normalizedDiscipline);
      const matchSearch = !selectedSearch || cardText.includes(selectedSearch);
      const matchSpecialization = selectedSpecializations.length === 0 || selectedSpecializations.some((spec) => cardSpecialization.includes(spec));
      
      card.style.display = (matchYear && matchCategory && matchDiscipline && matchSearch && matchSpecialization) ? 'flex' : 'none';
      
      if (matchYear && matchCategory && matchDiscipline && matchSearch && matchSpecialization) {
        card.style.animation = 'fadeInUp 0.4s ease-out';
      }
    });

    // Sortare simplă pe număr de descărcări sau rating când selectul există.
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
  const description = escapeHtml(documentRow.descriere || documentRow.description || 'Fără descriere');
  const downloads = Number(documentRow.downloads || documentRow.numar_descarcari || 0);
  const rating = Number(documentRow.rating || 0);
  const fileUrl = documentRow.file_url || documentRow.url_fisier || '#';
  const fileName = escapeHtml(documentRow.file_name || documentRow.nume_fisier || `${(documentRow.titlu || documentRow.title || 'document').toString().trim() || 'document'}.pdf`);

  const normalizeDepartment = (value) => String(value || '').toLowerCase();
  const deptValue = normalizeDepartment(department);
  let deptGroup = 'engineering';
  if (/(medicin|farmacie|sanitar)/.test(deptValue)) deptGroup = 'medical';
  else if (/(socio|uman|litere|psih|educatie|comunicare|istor|filosof|arte)/.test(deptValue)) deptGroup = 'socio';
  else if (/(arte|muzic|teatru|design)/.test(deptValue)) deptGroup = 'arts';
  else if (/(drept|juridic|lege)/.test(deptValue)) deptGroup = 'law';

  card.setAttribute('data-year', year === '-' ? '' : year);
  card.setAttribute('data-category', type);
  card.setAttribute('data-specialization', specialization);
  card.setAttribute('data-discipline', subject);
  card.setAttribute('data-dept-group', deptGroup);

  card.innerHTML = `
    <div class="doc-header">
      <i class="fa-solid fa-file-pdf"></i>
      <h3>${title}</h3>
    </div>
    <p class="doc-meta">${subject} | Anul ${year} | ${type}</p>
    <p class="doc-faculty">${department}</p>
    <p class="doc-author"><i class="fa-solid fa-user-tie" aria-hidden="true"></i> ${professorName}</p>
    <p class="doc-description">${description}</p>
    <div class="doc-stats">
      <span class="doc-stat"><i class="fa-solid fa-download" aria-hidden="true"></i> ${downloads} descărcări</span>
      <span class="doc-stat"><i class="fa-solid fa-star" aria-hidden="true"></i> ${rating || '-'}/5</span>
    </div>
    <div class="doc-actions">
      <button type="button" class="btn-download" data-file-url="${escapeHtml(fileUrl)}" data-file-name="${fileName}"><i class="fa-solid fa-download"></i> Descarcă</button>
      <a class="btn-preview" href="${fileUrl}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-eye"></i> Previzualizare</a>
    </div>
  `;

  return card;
}

function initializeDocumentDownloadActions() {
  document.addEventListener('click', async (event) => {
    const btn = event.target.closest('.btn-download[data-file-url]');
    if (!btn) return;

    event.preventDefault();
    const fileUrl = btn.getAttribute('data-file-url') || '';
    const fileName = btn.getAttribute('data-file-name') || 'document';

    if (!fileUrl || fileUrl === '#') {
      showNotification('Fișier indisponibil pentru descărcare.');
      return;
    }

    try {
      const response = await fetch(fileUrl, { method: 'GET' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1200);
    } catch (error) {
      // Fallback to direct URL with download hint when CORS blocks fetch.
      try {
        const parsed = new URL(fileUrl, window.location.origin);
        parsed.searchParams.set('download', '1');
        window.open(parsed.toString(), '_blank', 'noopener,noreferrer');
      } catch (_) {
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
      }
      showToast('Descărcare directă inițiată în tab nou.', 'info');
    }
  });

  // Document cards without a real file still give clear feedback instead of no-op buttons.
  document.addEventListener('click', (event) => {
    const downloadBtn = event.target.closest('.doc-card .btn-download:not([data-file-url])');
    if (downloadBtn) {
      event.preventDefault();
      showToast('Nu există încă fișier atașat pentru acest document.', 'info');
      return;
    }

    const previewBtn = event.target.closest('.doc-card .btn-preview:not([href])');
    if (previewBtn) {
      event.preventDefault();
      showToast('Previzualizarea nu este disponibilă fără un fișier atașat.', 'warning');
    }
  });
}

async function initializeDocumentsData() {
  const docsGrid = document.getElementById('docsGrid');
  const disciplineFilter = document.getElementById('discipleFilter');
  if (!docsGrid || typeof getDocuments !== 'function') return;

  try {
    const result = await getDocuments();
    docsGrid.innerHTML = '';

    const sanitizedDocuments = Array.isArray(result.data) ? result.data : [];

    if (!result.success || !Array.isArray(result.data) || sanitizedDocuments.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state-card';
      empty.innerHTML = `
        <i class="fa-solid fa-folder-open" aria-hidden="true"></i>
        <h3>Biblioteca este pregatita</h3>
        <p>Nu există documente publicate încă. După conectarea conținutului din Supabase, materialele vor apărea automat aici.</p>
      `;
      docsGrid.appendChild(empty);
      return;
    }

    if (disciplineFilter) {
      const seen = new Set();
      const disciplines = [];

      sanitizedDocuments.forEach((row) => {
        const value = String(row.materie || row.subject || row.taught_subject || row.disciplina || '').trim();
        if (!value) return;
        const key = value.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        disciplines.push(value);
      });

      disciplines.sort((a, b) => a.localeCompare(b));

      const options = ['<option value="">Toate disciplinele</option>'];
      disciplines.forEach((name) => {
        options.push(`<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`);
      });
      disciplineFilter.innerHTML = options.join('');
    }

    sanitizedDocuments.forEach((row) => docsGrid.appendChild(renderDynamicDocumentCard(row)));
  } catch (error) {
    console.warn('Nu s-au putut încărca documentele din DB:', error.message);
    docsGrid.innerHTML = `
      <div class="empty-state-card">
        <i class="fa-solid fa-cloud" aria-hidden="true"></i>
        <h3>Nu am putut încărca documentele</h3>
        <p>Verifică setările Supabase sau conexiunea și reîncarcă pagina.</p>
      </div>
    `;
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
    await syncQuestionVoteState(questionList, loaded.data);
  }

  if (!questionForm) return;
  questionForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const title = (titleInput?.value || '').trim();
    const description = (descriptionInput?.value || '').trim();
    const submitBtn = questionForm.querySelector('button[type="submit"]');
    const originalSubmitText = submitBtn?.textContent || 'Publică întrebarea';

    if (!title || !description) {
      showToast('Completează titlul și descrierea întrebării.', 'warning');
      return;
    }

    if (title.length < 6) {
      showToast('Titlul trebuie să aibă minim 6 caractere.', 'warning');
      return;
    }

    if (description.length < 10) {
      showToast('Descrierea trebuie să aibă minim 10 caractere.', 'warning');
      return;
    }

    if (description.length > 3000) {
      showToast('Descrierea nu poate depăși 3000 de caractere.', 'warning');
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('is-loading');
        submitBtn.textContent = 'Se publică...';
      }

      const saved = await saveQuestion(title, description);
      const row = saved?.data?.[0];
      if (row) {
        if (emptyState) emptyState.style.display = 'none';
        questionList.prepend(renderQuestionCard(row));
        await syncQuestionVoteState(questionList, [row]);
      }
      questionForm.reset();
      showToast('Întrebarea a fost publicată cu succes.', 'success');
    } catch (error) {
      showToast(error.message || 'Nu s-a putut salva întrebarea.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('is-loading');
        submitBtn.textContent = originalSubmitText;
      }
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

    const commentsResult = typeof getAllComments === 'function'
      ? await getAllComments()
      : { success: false, data: [] };

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

function parsePostDisplay(title = '', content = '') {
  const safeTitle = String(title || '');
  const safeContent = String(content || '');
  const categoryMatch = safeTitle.match(/^\s*\[([^\]]+)\]\s*/i);
  const rawCategory = categoryMatch ? categoryMatch[1].trim().toLowerCase() : '';

  const categoryLabels = {
    general: 'General',
    intrebare: 'Întrebare',
    resursa: 'Resursă',
    anunt: 'Anunț'
  };

  const categoryLabel = categoryLabels[rawCategory] || 'General';
  const cleanedTitle = safeTitle.replace(/^\s*\[[^\]]+\]\s*/i, '').trim();
  const cleanedContent = safeContent.replace(/\n\n#taguri:.*$/is, '').trim();

  return {
    categoryLabel,
    title: cleanedTitle,
    content: cleanedContent
  };
}

function parsePollDisplay(content = '') {
  const rawContent = String(content || '');
  const pollMatch = rawContent.match(/\[SONDAJ\]([\s\S]*?)(?:\[\/SONDAJ\]|$)/i);

  if (!pollMatch) return null;

  const lines = pollMatch[1]
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return null;

  let question = '';
  let mode = 'single';
  const options = [];

  lines.forEach((line, index) => {
    const lower = line.toLowerCase();
    const value = line.includes(':') ? line.split(':').slice(1).join(':').trim() : line.trim();

    if (lower.startsWith('întrebare:') || lower.startsWith('intrebare:')) {
      question = value;
      return;
    }

    if (lower.startsWith('mod:') || lower.startsWith('tip:')) {
      mode = /multi/i.test(value) ? 'multiple' : 'single';
      return;
    }

    if (lower.startsWith('opțiuni:') || lower.startsWith('optiuni:')) {
      return;
    }

    if (line.startsWith('-')) {
      options.push(line.replace(/^-\s*/, '').trim());
      return;
    }

    if (index === 0 && !question) {
      question = line;
    }
  });

  const cleanedOptions = options.filter(Boolean);

  if (!question) {
    question = lines[0] || 'Sondaj fără întrebare';
  }

  if (!cleanedOptions.length) {
    return null;
  }

  return {
    question,
    mode,
    options: cleanedOptions
  };
}

function getPollStorageKey(postId) {
  return `ulbstudent_poll_votes_${postId}`;
}

function loadPollState(postId, optionCount) {
  const fallback = {
    counts: Array.from({ length: optionCount }, () => 0),
    selected: [],
    voted: false
  };

  try {
    const parsed = JSON.parse(localStorage.getItem(getPollStorageKey(postId)) || 'null');
    if (!parsed || !Array.isArray(parsed.counts)) return fallback;

    return {
      counts: Array.from({ length: optionCount }, (_, index) => Number(parsed.counts[index] || 0)),
      selected: Array.isArray(parsed.selected) ? parsed.selected.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value >= 0) : [],
      voted: Boolean(parsed.voted)
    };
  } catch {
    return fallback;
  }
}

function savePollState(postId, state) {
  localStorage.setItem(getPollStorageKey(postId), JSON.stringify(state));
}

function buildPollMarkup(post, poll) {
  const state = loadPollState(post.id, poll.options.length);
  const totalVotes = state.counts.reduce((sum, value) => sum + Number(value || 0), 0);
  const inputType = poll.mode === 'multiple' ? 'checkbox' : 'radio';
  const modeLabel = poll.mode === 'multiple' ? 'Mai multe răspunsuri' : 'Un singur răspuns';

  const optionsMarkup = poll.options.map((option, index) => {
    const votes = Number(state.counts[index] || 0);
    const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
    const inputId = `poll-${post.id}-${index}`;
    return `
      <label class="post-poll-option" for="${escapeHtml(inputId)}">
        <input id="${escapeHtml(inputId)}" type="${inputType}" name="poll-${escapeHtml(String(post.id))}" value="${index}" ${state.voted && state.selected.includes(index) ? 'checked' : ''} ${state.voted ? 'disabled' : ''}>
        <span>${escapeHtml(option)}</span>
        <span class="poll-option-meta">${percent}%</span>
      </label>
      <div class="poll-result-track" aria-hidden="true"><span class="poll-result-fill" style="width: ${percent}%"></span></div>
    `;
  }).join('');

  return `
    <div class="post-poll-card" data-poll-state="${state.voted ? 'voted' : 'fresh'}">
      <div class="post-poll-head">
        <div>
          <span class="post-category-label">Sondaj</span>
          <p class="post-poll-question">${escapeHtml(poll.question)}</p>
        </div>
        <span class="poll-mode-badge">${escapeHtml(modeLabel)}</span>
      </div>
      <div class="post-poll-options">
        ${optionsMarkup}
      </div>
      <div class="post-poll-footer">
        <span>${totalVotes} voturi</span>
        <button type="button" class="poll-submit-btn" data-poll-submit ${state.voted ? 'disabled' : ''}>${state.voted ? 'Ai votat' : 'Trimite votul'}</button>
      </div>
    </div>
  `;
}

async function hydratePollCard(card, post) {
  if (!card || !post?.id || typeof initSupabaseClient !== 'function') return;

  try {
    const client = await initSupabaseClient();
    const user = await getAuthenticatedUser(false);
    const { data: pollRow } = await client
      .from('polls')
      .select('id, allow_multiple_answers, question')
      .eq('post_id', post.id)
      .maybeSingle();

    if (!pollRow?.id) return;

    const [{ data: optionRows }, { data: voteRows }, { data: userVoteRow }] = await Promise.all([
      client.from('poll_options').select('id, option_text, position').eq('poll_id', pollRow.id).order('position', { ascending: true }),
      client.from('poll_votes').select('voter_id, selected_option_ids').eq('poll_id', pollRow.id),
      user?.id ? client.from('poll_votes').select('id, selected_option_ids').eq('poll_id', pollRow.id).eq('voter_id', user.id).maybeSingle() : Promise.resolve({ data: null })
    ]);

    if (!optionRows?.length) return;

    const counts = optionRows.map(() => 0);
    (voteRows || []).forEach((row) => {
      const selectedIds = Array.isArray(row.selected_option_ids) ? row.selected_option_ids : [];
      selectedIds.forEach((optionId) => {
        const index = optionRows.findIndex((option) => String(option.id) === String(optionId));
        if (index >= 0) counts[index] += 1;
      });
    });

    const totalVotes = counts.reduce((sum, value) => sum + value, 0);
    const optionNodes = Array.from(card.querySelectorAll('.post-poll-option'));
    const trackNodes = Array.from(card.querySelectorAll('.poll-result-track .poll-result-fill'));
    const footer = card.querySelector('.post-poll-footer span');
    const submitBtn = card.querySelector('[data-poll-submit]');

    optionNodes.forEach((optionNode, index) => {
      const meta = optionNode.querySelector('.poll-option-meta');
      if (meta) {
        const percent = totalVotes > 0 ? Math.round((counts[index] / totalVotes) * 100) : 0;
        meta.textContent = `${percent}%`;
      }
    });

    trackNodes.forEach((fillNode, index) => {
      const percent = totalVotes > 0 ? Math.round((counts[index] / totalVotes) * 100) : 0;
      fillNode.style.width = `${percent}%`;
    });

    if (footer) footer.textContent = `${totalVotes} voturi`;
    if (userVoteRow?.id && submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Ai votat';
    }
  } catch (error) {
    console.warn('Poll hydration failed:', error?.message || error);
  }
}

function renderPostCard(post, currentUser) {
  const card = document.createElement('div');
  card.className = 'post-card';
  card.setAttribute('data-post-id', post.id);
  const author = currentUser?.email ? currentUser.email.split('@')[0] : 'student';
  const parsed = parsePostDisplay(post.title, post.content);
  const poll = parsePollDisplay(parsed.content);
  const displayText = poll ? 'Sondaj publicat' : (parsed.title || parsed.content || 'Postare fără conținut');
  card.innerHTML = `
    <div class="post-votes">
      <i class="fa-solid fa-arrow-up"></i>
      <span>${post.votes || 0}</span>
      <i class="fa-solid fa-arrow-down"></i>
    </div>
    <div class="post-body">
      <span class="post-meta">Postat de u/${escapeHtml(author)} • ${formatTimeAgo(post.created_at)}</span>
      <h4><span class="post-category-label">${escapeHtml(parsed.categoryLabel)}</span> ${escapeHtml(displayText)}</h4>
      ${poll ? buildPollMarkup(post, poll) : ''}
      <div class="post-actions">
        <button class="action-btn" data-action="comments"><i class="fa-solid fa-comment" aria-hidden="true"></i> Comentează</button>
        <button class="action-btn" data-action="share"><i class="fa-solid fa-share" aria-hidden="true"></i> Distribuie</button>
      </div>
    </div>
  `;

  if (poll) {
    const submitBtn = card.querySelector('[data-poll-submit]');
    const pollInputs = Array.from(card.querySelectorAll('.post-poll-option input'));

    if (submitBtn) {
      submitBtn.addEventListener('click', async () => {
        const selectedIndexes = pollInputs
          .filter((input) => input.checked)
          .map((input) => Number(input.value))
          .filter((value) => Number.isInteger(value));

        if (selectedIndexes.length === 0) {
          showToast('Alege cel puțin o opțiune înainte de vot.', 'warning');
          return;
        }

        if (poll.mode !== 'multiple' && selectedIndexes.length > 1) {
          showToast('Acest sondaj permite un singur răspuns.', 'warning');
          return;
        }

        let persistedInDatabase = false;
        const originalLabel = submitBtn.textContent || 'Trimite votul';
        submitBtn.disabled = true;
        submitBtn.classList.add('is-loading');
        submitBtn.textContent = 'Se trimite...';

        try {
          const client = await initSupabaseClient();
          const user = await getAuthenticatedUser(false);

          if (user?.id) {
            const { data: pollRow, error: pollError } = await client
              .from('polls')
              .select('id, allow_multiple_answers')
              .eq('post_id', post.id)
              .maybeSingle();

            if (pollError) throw pollError;

            if (pollRow?.id) {
              const { data: optionRows, error: optionError } = await client
                .from('poll_options')
                .select('id, position')
                .eq('poll_id', pollRow.id)
                .order('position', { ascending: true });

              if (optionError) throw optionError;

              const existingVote = await client
                .from('poll_votes')
                .select('id')
                .eq('poll_id', pollRow.id)
                .eq('voter_id', user.id)
                .maybeSingle();

              if (existingVote.data?.id) {
                showToast('Ai votat deja acest sondaj.', 'warning');
                return;
              }

              const selectedOptionIds = selectedIndexes
                .map((index) => optionRows?.[index]?.id)
                .filter(Boolean);

              if (!selectedOptionIds.length) {
                showToast('Nu s-au găsit opțiunile sondajului.', 'error');
                return;
              }

              if (!pollRow.allow_multiple_answers && selectedOptionIds.length > 1) {
                showToast('Acest sondaj permite un singur răspuns.', 'warning');
                return;
              }

              const { error: voteError } = await client.from('poll_votes').insert([{
                poll_id: pollRow.id,
                voter_id: user.id,
                selected_option_ids: selectedOptionIds
              }]);

              if (voteError) throw voteError;
              persistedInDatabase = true;
            }
          }
        } catch (error) {
          console.warn('Poll vote persistence failed; local state was used:', error?.message || error);
        } finally {
          if (submitBtn.isConnected) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('is-loading');
            submitBtn.textContent = originalLabel;
          }
        }

        const nextState = loadPollState(post.id, poll.options.length);
        selectedIndexes.forEach((index) => {
          nextState.counts[index] = Number(nextState.counts[index] || 0) + 1;
        });
        nextState.selected = selectedIndexes;
        nextState.voted = true;
        savePollState(post.id, nextState);

        card.replaceWith(renderPostCard(post, currentUser));
        showToast(
          persistedInDatabase
            ? 'Votul a fost salvat în Supabase.'
            : 'Votul a fost salvat local. Rulează migrația de sondaje pentru sincronizare completă.',
          persistedInDatabase ? 'success' : 'info'
        );
      });
    }

    hydratePollCard(card, post);
  }

  return card;
}

let postsRealtimeSubscription = null;
let commentsRealtimeSubscription = null;

async function setupRealtimePosts(postsFeed, currentUser) {
  if (!postsFeed || postsRealtimeSubscription) return;
  const client = await initSupabaseClient();

  const handleInsert = (payload) => {
    const newPost = payload?.new;
    if (!newPost?.id) return;
    if (postsFeed.querySelector(`[data-post-id="${newPost.id}"]`)) return;
    postsFeed.prepend(renderPostCard(newPost, currentUser));
  };

  postsRealtimeSubscription = client
    .channel('realtime-posts')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, handleInsert)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'postari_forum' }, handleInsert)
    .subscribe();
}

async function setupRealtimeComments(postId, commentsList, commentsTitle, emptyState) {
  if (!postId || !commentsList || commentsRealtimeSubscription) return;
  const client = await initSupabaseClient();

  const normalize = (value) => String(value ?? '').trim();
  const normalizedPostId = normalize(postId);

  const handleInsert = (payload) => {
    const newComment = payload?.new;
    if (!newComment) return;

    const commentPostId = normalize(newComment.post_id || newComment.id_post);
    if (!commentPostId || commentPostId !== normalizedPostId) return;

    commentsList.appendChild(renderCommentCard(newComment));
    if (emptyState) emptyState.style.display = 'none';

    if (commentsTitle) {
      const currentCount = Number((commentsTitle.textContent || '').match(/\d+/)?.[0] || 0);
      commentsTitle.textContent = `${currentCount + 1} comentarii`;
    }
  };

  commentsRealtimeSubscription = client
    .channel(`realtime-comments-${normalizedPostId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, handleInsert)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comentarii' }, handleInsert)
    .subscribe();
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
    const fragment = document.createDocumentFragment();
    loaded.data.forEach(post => fragment.appendChild(renderPostCard(post, currentUser)));
    postsFeed.appendChild(fragment);
    await syncPostVoteState(postsFeed, loaded.data);
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

  await setupRealtimePosts(postsFeed, currentUser);
}

function initializePostCreation() {
  const postForm = document.getElementById('postCreateForm');
  const postTitleInput = document.getElementById('postTitleInput');
  const postInput = document.getElementById('postContentInput');
  const postCategoryInput = document.getElementById('postCategoryInput');
  const postTagsInput = document.getElementById('postTagsInput');
  const postAttachmentInput = document.getElementById('postAttachmentInput');
  const postAttachmentList = document.getElementById('postAttachmentList');
  const postSubmitBtn = document.querySelector('.post-submit-btn');
  const postsFeed = document.getElementById('postsFeed');
  const emptyState = document.getElementById('postsEmptyState');
  const pollModal = document.getElementById('pollComposerModal');
  const pollQuestionInput = document.getElementById('pollQuestionInput');
  const pollOptionsList = document.getElementById('pollOptionsList');
  const pollAddOptionBtn = document.getElementById('pollAddOptionBtn');
  const pollSaveBtn = document.getElementById('pollSaveBtn');
  const pollComposerError = document.getElementById('pollComposerError');
  const pollModeButtons = pollModal ? Array.from(pollModal.querySelectorAll('[data-poll-mode]')) : [];
  const pollCloseButtons = pollModal ? Array.from(pollModal.querySelectorAll('[data-poll-close]')) : [];
  let activePollMode = 'single';

  if (!postForm) return;

  const clearPollError = () => {
    if (pollComposerError) pollComposerError.textContent = '';
  };

  const setPollError = (message) => {
    if (pollComposerError) pollComposerError.textContent = message || '';
  };

  const setPollSaveLoading = (isLoading) => {
    if (!pollSaveBtn) return;

    pollSaveBtn.disabled = isLoading;
    pollSaveBtn.classList.toggle('is-loading', isLoading);
    pollSaveBtn.textContent = isLoading ? 'Se pregătește...' : 'Adaugă sondajul';

    [pollQuestionInput, pollAddOptionBtn, ...pollModeButtons].forEach((element) => {
      if (!element) return;
      element.disabled = isLoading;
      element.setAttribute('aria-disabled', String(isLoading));
    });

    pollOptionsList?.querySelectorAll('input, button').forEach((element) => {
      element.disabled = isLoading;
      element.setAttribute('aria-disabled', String(isLoading));
    });
  };

  const setPollMode = (mode) => {
    activePollMode = mode === 'multiple' ? 'multiple' : 'single';
    pollModeButtons.forEach((button) => {
      const isActive = button.dataset.pollMode === activePollMode;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  };

  const createPollOptionRow = (value = '') => {
    if (!pollOptionsList) return null;
    const row = document.createElement('div');
    row.className = 'poll-option-row';
    row.innerHTML = `
      <input type="text" class="post-input poll-option-input" maxlength="120" placeholder="Opțiune" value="${escapeHtml(value)}" />
      <button type="button" class="poll-option-remove" aria-label="Șterge opțiunea">
        <i class="fa-solid fa-trash" aria-hidden="true"></i>
      </button>
    `;

    const removeBtn = row.querySelector('.poll-option-remove');
    removeBtn?.addEventListener('click', () => {
      if (pollOptionsList.querySelectorAll('.poll-option-row').length <= 2) {
        showToast('Sondajul trebuie să aibă cel puțin 2 opțiuni.', 'warning');
        return;
      }
      row.remove();
    });

    return row;
  };

  const ensurePollRows = () => {
    if (!pollOptionsList) return;
    if (!pollOptionsList.children.length) {
      pollOptionsList.appendChild(createPollOptionRow('Da'));
      pollOptionsList.appendChild(createPollOptionRow('Nu'));
    }
  };

  const openPollModal = () => {
    if (!pollModal) return;
    if (pollOptionsList) {
      pollOptionsList.innerHTML = '';
      pollOptionsList.appendChild(createPollOptionRow('Da'));
      pollOptionsList.appendChild(createPollOptionRow('Nu'));
    }
    clearPollError();
    setPollMode('single');
    pollQuestionInput && (pollQuestionInput.value = '');
    pollModal.classList.add('is-open');
    pollModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    pollQuestionInput?.focus();
  };

  const closePollModal = () => {
    if (!pollModal) return;
    pollModal.classList.remove('is-open');
    pollModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    clearPollError();
  };

  const collectPollData = () => {
    const question = String(pollQuestionInput?.value || '').trim();
    const rawOptions = Array.from(pollOptionsList?.querySelectorAll('.poll-option-input') || [])
      .map((input) => String(input.value || '').trim());
    const hasEmptyOption = rawOptions.some((option) => option.length === 0);
    const options = rawOptions.filter(Boolean);

    if (!question) {
      return { error: 'Adaugă o întrebare pentru sondaj.' };
    }

    if (hasEmptyOption) {
      return { error: 'Nu lăsa opțiuni goale.' };
    }

    if (options.length < 2) {
      return { error: 'Sondajul are nevoie de minimum 2 opțiuni valide.' };
    }

    return {
      question,
      mode: activePollMode,
      options
    };
  };

  const buildPollBlock = ({ question, mode, options }) => {
    return [
      '[SONDAJ]',
      `Întrebare: ${question}`,
      `Mod: ${mode}`,
      'Opțiuni:',
      ...options.map((option) => `- ${option}`),
      '[/SONDAJ]'
    ].join('\n');
  };

  if (pollModal) {
    pollModal.querySelectorAll('[data-poll-close]').forEach((button) => {
      button.addEventListener('click', closePollModal);
    });
    pollModal.addEventListener('click', (event) => {
      if (event.target === pollModal) {
        closePollModal();
      }
    });
    pollModeButtons.forEach((button) => {
      button.addEventListener('click', () => setPollMode(button.dataset.pollMode || 'single'));
    });
    pollAddOptionBtn?.addEventListener('click', () => {
      ensurePollRows();
      const nextRow = createPollOptionRow('');
      if (nextRow) {
        pollOptionsList.appendChild(nextRow);
        nextRow.querySelector('input')?.focus();
      }
    });
    pollSaveBtn?.addEventListener('click', async () => {
      const pollData = collectPollData();
      if ('error' in pollData) {
        setPollError(pollData.error);
        showToast(pollData.error, 'warning');
        return;
      }

      setPollSaveLoading(true);

      try {
        if (postTitleInput) postTitleInput.value = pollData.question;
        if (postInput) postInput.value = buildPollBlock(pollData);

        showToast('Sondajul a fost pregătit pentru postare.', 'success');
        closePollModal();
      } finally {
        setPollSaveLoading(false);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && pollModal.classList.contains('is-open')) {
        closePollModal();
      }
    });
  }

  const appendAttachmentToContent = (url, label) => {
    if (!postInput) return;
    const prefix = postInput.value.trim().length > 0 ? '\n\n' : '';
    postInput.value = `${postInput.value}${prefix}${label || 'Atașament'}: ${url}`.trim();
  };

  const uploadPostAttachment = async (file) => {
    const client = await initSupabaseClient();
    const user = await getAuthenticatedUser(false);

    if (!user?.id) {
      throw new Error('Trebuie să fii conectat pentru a încărca fișiere.');
    }

    const bucketName = 'post-attachments';
    const safeName = String(file.name || 'fișier')
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    const storagePath = `${user.id}/${Date.now()}-${safeName}`;

    const { data, error } = await client.storage
      .from(bucketName)
      .upload(storagePath, file, { upsert: false, cacheControl: '3600' });

    if (error) {
      throw new Error(error.message || 'Nu s-a putut încărca fișierul.');
    }

    const publicUrl = client.storage.from(bucketName).getPublicUrl(data.path).data.publicUrl;
    if (!publicUrl) {
      throw new Error('Nu s-a putut genera URL public pentru fișier.');
    }

    return publicUrl;
  };

  const mediaButtons = postForm.querySelectorAll('.media-uploads .action-btn');
  mediaButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action || '';

      if (action === 'image') {
        if (postAttachmentInput) postAttachmentInput.click();
        return;
      }

      if (action === 'link') {
        const link = window.prompt('Introdu un link valid:');
        if (link && link.trim()) {
          appendAttachmentToContent(link.trim(), 'Link');
          showToast('Link adăugat în postare.', 'success');
        }
        return;
      }
      if (action === 'poll') {
        ensurePollRows();
        openPollModal();
        return;
      }
    });
  });

  if (postAttachmentInput) {
    postAttachmentInput.addEventListener('change', async () => {
      const file = postAttachmentInput.files?.[0];
      if (!file) return;

      try {
        showToast('Se încarcă fișierul...', 'info');
        const url = await uploadPostAttachment(file);
        appendAttachmentToContent(url, 'Atașament');

        if (postAttachmentList) {
          postAttachmentList.textContent = `Fișier atașat: ${file.name}`;
        }

        showToast('Fișier atașat cu succes!', 'success');
      } catch (error) {
        showToast(error.message || 'Eroare la încărcare fișier.', 'error');
      } finally {
        postAttachmentInput.value = '';
      }
    });
  }

  postForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Input validation
    const title = (postTitleInput?.value || '').trim() || 'Postare comunitate';
    const content = (postInput?.value || '').trim();
    const category = (postCategoryInput?.value || 'general').trim();
    const tags = (postTagsInput?.value || '').trim();
    
    // Validation checks with clear feedback
    if (!title) {
      showToast('Titlul postării este obligatoriu', 'warning');
      return;
    }
    
    if (!content) {
      showToast('Conținutul postării este obligatoriu', 'warning');
      postInput?.focus();
      return;
    }
    
    if (content.length < 10) {
      showToast('Postarea trebuie să conțină cel puțin 10 caractere', 'warning');
      return;
    }
    
    if (content.length > 5000) {
      showToast('Postarea nu poate depăși 5000 de caractere', 'warning');
      return;
    }
    
    const user = getCurrentUser();
    if (!user) {
      showToast('Trebuie să fii conectat pentru a posta', 'error');
      setTimeout(() => window.location.href = getAuthPageUrl('login.html'), 1500);
      return;
    }
    
    // Show loading state
    postSubmitBtn.disabled = true;
    postSubmitBtn.classList.add('is-loading');
    const originalText = postSubmitBtn.textContent;
    postSubmitBtn.textContent = 'Se salvează...';
    
    try {
      const saved = await savePost(`[${category}] ${title}`, tags ? `${content}\n\n#taguri: ${tags}` : content);
      const newPost = saved?.data?.[0];
      
      if (!newPost) {
        showToast('Eroare la salvarea postării în baza de date', 'error');
        postSubmitBtn.disabled = false;
        postSubmitBtn.classList.remove('is-loading');
        postSubmitBtn.textContent = originalText;
        return;
      }
      
      // Success feedback
      if (emptyState && postsFeed) emptyState.style.display = 'none';
      if (postsFeed) postsFeed.prepend(renderPostCard(newPost, user));
      postForm.reset();
      showToast('Postare adăugată cu succes.', 'success');
      if (saved?.poll?.attempted && !saved?.poll?.saved && saved?.poll?.warning) {
        showToast(saved.poll.warning, 'warning');
      }
      
      // Update posts count
      const postsCount = document.getElementById('subredditPostsCount');
      if (postsCount) {
        postsCount.textContent = String(parseInt(postsCount.textContent || '0') + 1);
      }
      
      // Reset button
      postSubmitBtn.disabled = false;
      postSubmitBtn.classList.remove('is-loading');
      postSubmitBtn.textContent = originalText;
      
    } catch (error) {
      console.error('Post creation error:', error);
      showToast(error.message || 'Eroare la creare postare', 'error');
      postSubmitBtn.disabled = false;
      postSubmitBtn.classList.remove('is-loading');
      postSubmitBtn.textContent = originalText;
    }
  });

  // Add sort and refresh handlers
  const sortSelect = document.getElementById('postSortSelect');
  const refreshBtn = document.getElementById('refreshPostsBtn');
  
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      const sortType = sortSelect.value;
      const posts = Array.from(postsFeed?.querySelectorAll('.post-card') || []);
      if (posts.length > 0) {
        sortAndRenderPosts(posts, sortType, postsFeed, getCurrentUser());
      }
    });
  }
  
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i>';
      refreshBtn.disabled = true;
      
      try {
        // Reload posts from database
        const loaded = await getPosts();
        const currentUser = getCurrentUser();
        const sortType = sortSelect ? sortSelect.value : 'recent';
        
        postsFeed.innerHTML = '';
        if (loaded.success && loaded.data.length > 0) {
          if (emptyState) emptyState.style.display = 'none';
          const sortedPosts = sortPostsByType(loaded.data, sortType);
          sortedPosts.forEach(post => postsFeed.appendChild(renderPostCard(post, currentUser)));
          await syncPostVoteState(postsFeed, sortedPosts);
        } else {
          if (emptyState) emptyState.style.display = 'flex';
        }
        
        showToast('Postări reîncărcate cu succes', 'success');
      } catch (error) {
        console.error('Error refreshing posts:', error);
        showToast('Eroare la reîncărcarea postărilor', 'error');
      } finally {
        refreshBtn.innerHTML = '<i class="fa-solid fa-rotate"></i>';
        refreshBtn.disabled = false;
      }
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
      navigator.clipboard?.writeText(window.location.href)
        .then(() => showToast('Link copiat în clipboard.', 'success'))
        .catch(() => showToast('Nu s-a putut copia linkul.', 'error'));
    }
  });
}

function renderCommentCard(comment) {
  const item = document.createElement('article');
  item.className = 'comment-card';

  const authorName = String(comment.name || comment.nume || comment.author || comment.created_by_name || 'Anonim').trim() || 'Anonim';
  const commentText = String(comment.content || comment.comentariu || comment.comment || '').trim();
  const initials = authorName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('').slice(0, 2) || 'AN';
  const email = String(comment.email || comment.notification_email || '').trim();
  const replyCount = Number(comment.reply_count || comment.replies || 0);

  item.innerHTML = `
    <div class="comment-card-head">
      <div class="comment-author">
        <div class="comment-avatar" aria-hidden="true">${escapeHtml(initials)}</div>
        <div>
          <h4>${escapeHtml(authorName)}</h4>
          <div class="comment-time">${formatTimeAgo(comment.created_at)}</div>
        </div>
      </div>
    </div>
    <p class="comment-body">${commentText ? escapeHtml(commentText) : '<span style="color: var(--text-secondary); font-style: italic;">Recenzie fără comentariu</span>'}</p>
    <div class="comment-meta">
      ${email ? `<span class="comment-meta-pill"><i class="fa-regular fa-envelope"></i> ${escapeHtml(email)}</span>` : ''}
      <span class="comment-meta-pill"><i class="fa-solid fa-reply"></i> ${replyCount} răspunsuri</span>
    </div>
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

  const setLoadingState = () => {
    if (postContainer) {
      postContainer.classList.add('is-loading');
      postContainer.innerHTML = `
        <div class="thread-skeleton" aria-hidden="true" style="display:grid; gap:0.75rem;">
          <span class="skeleton-chip" style="width:92px;"></span>
          <span class="skeleton-line" style="width:78%; height:18px;"></span>
          <span class="skeleton-line" style="width:58%;"></span>
          <span class="skeleton-line" style="width:92%; height:14px;"></span>
          <span class="skeleton-line" style="width:88%; height:14px;"></span>
        </div>`;
    }

    if (commentsList) {
      commentsList.parentElement?.classList.add('is-loading');
      commentsList.innerHTML = `
        <div class="comment-skeleton" aria-hidden="true" style="display:grid; gap:0.75rem;">
          <div style="display:flex; gap:0.75rem; align-items:center;">
            <span class="skeleton-block" style="width:44px; height:44px; border-radius:14px;"></span>
            <div style="flex:1; display:grid; gap:0.45rem;">
              <span class="skeleton-line" style="width:38%; height:14px;"></span>
              <span class="skeleton-line" style="width:24%; height:12px;"></span>
            </div>
          </div>
          <span class="skeleton-line" style="width:92%; height:14px;"></span>
          <span class="skeleton-line" style="width:84%; height:14px;"></span>
        </div>
      `;
    }

    if (commentsTitle) commentsTitle.textContent = 'Se încarcă comentariile...';
    if (emptyState) emptyState.style.display = 'none';
  };

  const setErrorState = (message) => {
    if (postContainer) {
      postContainer.classList.remove('is-loading');
      postContainer.innerHTML = `
        <div class="thread-error-state">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <strong>Postarea nu a putut fi încărcată</strong>
          <span>${escapeHtml(message || 'Reîncearcă sau revino la lista de discuții.')}</span>
          <a href="comments.html" class="discussion-back-link" style="margin-top:0.25rem;"><i class="fa-solid fa-arrow-left"></i> Înapoi la discuții</a>
        </div>
      `;
    }

    if (commentsList) commentsList.innerHTML = '';
    if (commentsTitle) commentsTitle.textContent = '0 comentarii';
    if (emptyState) emptyState.style.display = 'none';
    if (form) {
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) submitButton.disabled = true;
    }
  };

  const splitTags = (content = '') => {
    const match = String(content || '').match(/#taguri:\s*([\s\S]*)$/i);
    if (!match) return [];
    return match[1]
      .split(/,|\n|;/)
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 6);
  };

  setLoadingState();

  if (!postId) {
    if (emptyState) emptyState.style.display = 'block';
    if (commentsTitle) commentsTitle.textContent = '0 comentarii';
    if (form) {
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) submitButton.disabled = true;
    }
    setErrorState('Lipsește identificatorul postării în adresă.');
    return;
  }

  const postResult = await getPostById(postId);
  if (!postResult.success || !postResult.data) {
    setErrorState('Nu există o postare validă pentru această conversație.');
    return;
  }

  const loaded = await getComments(postId);
  const rows = loaded.success ? loaded.data : [];
  const parsed = parsePostDisplay(postResult.data.title || '', postResult.data.content || '');
  const poll = parsePollDisplay(parsed.content || '');
  const contentWithoutPoll = String(parsed.content || '')
    .replace(/\[SONDAJ\][\s\S]*?(?:\[\/SONDAJ\]|$)/i, '')
    .trim();
  const tags = splitTags(postResult.data.content || '');
  const authorName = String(postResult.data.author_name || postResult.data.nume || postResult.data.user_name || postResult.data.created_by_name || 'Autor anonim').trim();
  const authorInitials = authorName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('').slice(0, 2) || 'UA';
  const statusLabel = rows.length > 0 ? 'Conversație activă' : 'Așteaptă răspunsuri';
  const postCommentsCount = rows.length;
  const postVotes = Number(postResult.data.votes || postResult.data.vote_count || 0);

  if (commentsTitle) commentsTitle.textContent = `${rows.length} comentarii`;
  if (postContainer) {
    postContainer.classList.remove('is-loading');
    const displayTitle = parsed.title || postResult.data.title || 'Postare';
    const sanitizedContent = contentWithoutPoll || '';
    postContainer.innerHTML = `
      <div class="discussion-thread-head">
        <div class="thread-title-row">
          <div class="discussion-hero-meta" style="margin-top:0;">
            <span class="discussion-status-pill"><i class="fa-solid fa-signal"></i> ${escapeHtml(statusLabel)}</span>
            <span class="discussion-pill"><i class="fa-solid fa-tag"></i> ${escapeHtml(parsed.categoryLabel || 'General')}</span>
          </div>
          <h2 class="thread-title">${escapeHtml(displayTitle)}</h2>
          <div class="thread-meta-row">
            <span><i class="fa-solid fa-user"></i> ${escapeHtml(authorName)}</span>
            <span><i class="fa-regular fa-clock"></i> ${escapeHtml(formatTimeAgo(postResult.data.created_at))}</span>
          </div>
        </div>
      </div>
      ${tags.length ? `<div class="thread-tags">${tags.map((tag) => `<span class="thread-tag">#${escapeHtml(tag.replace(/^#/, ''))}</span>`).join('')}</div>` : ''}
      ${sanitizedContent ? `<div class="thread-content">${escapeHtml(sanitizedContent).replace(/\n/g, '<br>')}</div>` : '<div class="thread-content" style="color: var(--text-secondary); font-style: italic;">Postare fără conținut suplimentar.</div>'}
      ${poll ? buildPollMarkup(postResult.data, poll) : ''}
      <div class="thread-stats">
        <span class="thread-stat"><i class="fa-solid fa-arrow-up"></i> ${postVotes} voturi</span>
        <span class="thread-stat"><i class="fa-solid fa-message"></i> ${postCommentsCount} comentarii</span>
        <span class="thread-stat"><i class="fa-solid fa-circle-info"></i> ID ${escapeHtml(String(postResult.data.id || postId))}</span>
      </div>
    `;

    if (poll) {
      const pollCard = postContainer.querySelector('.post-poll-card');
      if (pollCard) {
        const submitBtn = pollCard.querySelector('[data-poll-submit]');
        const pollInputs = Array.from(pollCard.querySelectorAll('.post-poll-option input'));

        if (submitBtn) {
          submitBtn.addEventListener('click', async () => {
            const selectedIndexes = pollInputs
              .filter((input) => input.checked)
              .map((input) => Number(input.value))
              .filter((value) => Number.isInteger(value));

            if (selectedIndexes.length === 0) {
              showToast('Alege cel puțin o opțiune înainte de vot.', 'warning');
              return;
            }

            if (poll.mode !== 'multiple' && selectedIndexes.length > 1) {
              showToast('Acest sondaj permite un singur răspuns.', 'warning');
              return;
            }

            let persistedInDatabase = false;
            const originalLabel = submitBtn.textContent || 'Trimite votul';
            submitBtn.disabled = true;
            submitBtn.classList.add('is-loading');
            submitBtn.textContent = 'Se trimite...';

            try {
              const client = await initSupabaseClient();
              const user = await getAuthenticatedUser(false);

              if (user?.id) {
                const { data: pollRow, error: pollError } = await client
                  .from('polls')
                  .select('id, allow_multiple_answers')
                  .eq('post_id', postResult.data.id)
                  .maybeSingle();

                if (pollError) throw pollError;

                if (pollRow?.id) {
                  const { data: optionRows, error: optionError } = await client
                    .from('poll_options')
                    .select('id, position')
                    .eq('poll_id', pollRow.id)
                    .order('position', { ascending: true });

                  if (optionError) throw optionError;

                  const existingVote = await client
                    .from('poll_votes')
                    .select('id')
                    .eq('poll_id', pollRow.id)
                    .eq('voter_id', user.id)
                    .maybeSingle();

                  if (existingVote.data?.id) {
                    showToast('Ai votat deja acest sondaj.', 'warning');
                    return;
                  }

                  const selectedOptionIds = selectedIndexes
                    .map((index) => optionRows?.[index]?.id)
                    .filter(Boolean);

                  if (!selectedOptionIds.length) {
                    showToast('Nu s-au găsit opțiunile sondajului.', 'error');
                    return;
                  }

                  if (!pollRow.allow_multiple_answers && selectedOptionIds.length > 1) {
                    showToast('Acest sondaj permite un singur răspuns.', 'warning');
                    return;
                  }

                  const { error: voteError } = await client.from('poll_votes').insert([{ 
                    poll_id: pollRow.id,
                    voter_id: user.id,
                    selected_option_ids: selectedOptionIds
                  }]);

                  if (voteError) throw voteError;
                  persistedInDatabase = true;
                }
              }
            } catch (error) {
              console.warn('Poll vote persistence failed; local state was used:', error?.message || error);
            } finally {
              if (submitBtn.isConnected) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('is-loading');
                submitBtn.textContent = originalLabel;
              }
            }

            const nextState = loadPollState(postResult.data.id, poll.options.length);
            selectedIndexes.forEach((index) => {
              nextState.counts[index] = Number(nextState.counts[index] || 0) + 1;
            });
            nextState.selected = selectedIndexes;
            nextState.voted = true;
            savePollState(postResult.data.id, nextState);

            showToast(
              persistedInDatabase
                ? 'Votul a fost salvat în Supabase.'
                : 'Votul a fost salvat local. Rulează migrația de sondaje pentru sincronizare completă.',
              persistedInDatabase ? 'success' : 'info'
            );

            const refreshedLoaded = await getComments(postId);
            const refreshedRows = refreshedLoaded.success ? refreshedLoaded.data : rows;
            commentsTitle.textContent = `${refreshedRows.length} comentarii`;
          });
        }

        hydratePollCard(pollCard, postResult.data);
      }
    }
  }

  commentsList.innerHTML = '';
  if (!rows.length) {
    if (emptyState) emptyState.style.display = 'grid';
  } else {
    if (emptyState) emptyState.style.display = 'none';
    rows.forEach((row) => commentsList.appendChild(renderCommentCard(row)));
  }

  await setupRealtimeComments(postId, commentsList, commentsTitle, emptyState);

  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('commentName').value || 'Anonim';
    const email = document.getElementById('commentEmail').value || '';
    const comment = document.getElementById('commentText').value;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalSubmitText = submitButton?.textContent || 'Postează comentariu';

    if (!comment.trim()) {
      showToast('Scrie un comentariu înainte de trimitere.', 'warning');
      return;
    }

    if (comment.trim().length < 3) {
      showToast('Comentariul trebuie să aibă minim 3 caractere.', 'warning');
      return;
    }

    if (comment.trim().length > 2000) {
      showToast('Comentariul nu poate depăși 2000 de caractere.', 'warning');
      return;
    }

    if (email && !/^[\w\.-]+@[a-zA-Z\d\.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      showToast('Adresa de email pentru notificări nu este validă.', 'warning');
      return;
    }

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.add('is-loading');
        submitButton.textContent = 'Se trimite...';
      }

      await saveComment(postId, name, email, comment.trim());
      form.reset();
      const refreshed = await getComments(postId);
      const refreshedRows = refreshed.success ? refreshed.data : [];
      commentsList.innerHTML = '';
      if (commentsTitle) commentsTitle.textContent = `${refreshedRows.length} comentarii`;
      if (!refreshedRows.length) {
        if (emptyState) emptyState.style.display = 'grid';
      } else {
        if (emptyState) emptyState.style.display = 'none';
        refreshedRows.forEach((row) => commentsList.appendChild(renderCommentCard(row)));
      }
      showToast('Comentariul a fost salvat.', 'success');
    } catch (error) {
      showToast(error.message || 'Eroare la salvarea comentariului.', 'error');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.classList.remove('is-loading');
        submitButton.textContent = originalSubmitText;
      }
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
      if (statsItems[0]) statsItems[0].innerHTML = `<i class="fa-solid fa-chart-line" aria-hidden="true"></i> Dificultate: ${difficulty}/10`;
      if (statsItems[1]) statsItems[1].innerHTML = `<i class="fa-solid fa-check-circle" aria-hidden="true"></i> Utilitate: ${utility}/10`;
      if (statsItems[2]) statsItems[2].innerHTML = `<i class="fa-solid fa-lightbulb" aria-hidden="true"></i> Sfat: ${advice}`;
      if (reviewTextEl) reviewTextEl.textContent = reviewText;
      if (helpfulEl) helpfulEl.innerHTML = `<i class="fa-solid fa-thumbs-up" aria-hidden="true"></i> ${helpful} găsit util`;
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

