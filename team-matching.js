// ============================================
// TEAM MATCHING - TINDER FOR PROJECTS
// ============================================

const studentProfiles = [
  {
    id: 1,
    name: 'Alex',
    year: '2',
    specialization: 'Informatică',
    skills: ['JavaScript', 'React', 'CSS', 'Design'],
    lookingFor: 'Backend Developer',
    bio: 'Pasionat de front-end, caut cineva care să scrie backend',
    matches: 95
  },
  {
    id: 2,
    name: 'Elena',
    year: '2',
    specialization: 'Informatică',
    skills: ['Python', 'SQL', 'Backend', 'API Design'],
    lookingFor: 'Frontend Developer',
    bio: 'Expert în baze de date și server, caut developer front-end',
    matches: 92
  },
  {
    id: 3,
    name: 'Bogdan',
    year: '3',
    specialization: 'Informatică',
    skills: ['C++', 'Algoritmi', 'Low-level', 'Git'],
    lookingFor: 'Team pentru Algorithmic Programming',
    bio: 'Specialized în algoritmi complecși, ador competitive programming',
    matches: 88
  },
  {
    id: 4,
    name: 'Miruna',
    year: '1',
    specialization: 'Ingineria Sistemelor',
    skills: ['Networking', 'System Design', 'Linux', 'DevOps'],
    lookingFor: 'Developers pentru IoT Project',
    bio: 'Newest in the team, super motivated și eager to learn',
    matches: 85
  },
  {
    id: 5,
    name: 'Călin',
    year: '2',
    specialization: 'Informatică',
    skills: ['Mobile App', 'Flutter', 'Firebase', 'UI/UX'],
    lookingFor: 'Partner pentru Mobile Development',
    bio: 'Create beautiful mobile apps, looking for backend support',
    matches: 90
  }
];

let currentProfileIndex = 0;
let matches = JSON.parse(localStorage.getItem('teamMatches')) || [];
let filteredProfiles = [...studentProfiles];

function initializeTeamMatching() {
  renderProfileCard();
  renderMatches();
  addSwipeListeners();
  initializeFilters();
  updateMatchStats();
}

/**
 * Filtrare profile după an, specializare și abilități
 */
function initializeFilters() {
  const yearFilter = document.getElementById('yearFilterTeam');
  const specFilter = document.getElementById('specFilterTeam');
  const skillFilter = document.getElementById('skillFilterTeam');
  
  if (!yearFilter) return; // Nu suntem pe pagina team-matching
  
  function applyFilters() {
    const year = yearFilter.value;
    const spec = specFilter.value;
    const skill = skillFilter.value;
    
    filteredProfiles = studentProfiles.filter(profile => {
      const matchYear = !year || profile.year === year;
      const matchSpec = !spec || profile.specialization.toLowerCase().includes(spec);
      const matchSkill = !skill || profile.skills.some(s => s.toLowerCase().includes(skill));
      
      return matchYear && matchSpec && matchSkill;
    });
    
    currentProfileIndex = 0;
    renderProfileCard();
  }
  
  yearFilter.addEventListener('change', applyFilters);
  specFilter.addEventListener('change', applyFilters);
  skillFilter.addEventListener('change', applyFilters);
}

function renderProfileCard() {
  const container = document.querySelector('.profile-card-stack');
  container.innerHTML = '';

  if (currentProfileIndex >= filteredProfiles.length) {
    container.innerHTML = '<div class="no-more-profiles"><h3>Nu mai sunt profile disponibile! 🎉</h3><p>Revino mai târziu pentru mai mulți parteneri potențiali.</p></div>';
    return;
  }

  const profile = filteredProfiles[currentProfileIndex];
  const card = document.createElement('div');
  card.className = 'profile-card';
  card.id = 'profile-' + profile.id;

  card.innerHTML = `
    <div class="profile-image">
      <div class="profile-avatar">
        <i class="fas fa-user"></i>
      </div>
      <div class="profile-badge">${profile.matches}% compatibilitate</div>
    </div>
    <div class="profile-info">
      <h3>${profile.name}, An ${profile.year}</h3>
      <p class="specialization">${profile.specialization}</p>
      <p class="bio">${profile.bio}</p>
      
      <div class="skills-section">
        <h4>Abilități:</h4>
        <div class="skills-tags">
          ${profile.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
        </div>
      </div>

      <div class="looking-for">
        <span class="looking-label">Caută:</span>
        <span class="looking-value">${profile.lookingFor}</span>
      </div>
    </div>

    <div class="card-actions">
      <button class="btn-pass" title="Pass">
        <i class="fas fa-times"></i>
        <span>Pass</span>
      </button>
      <button class="btn-like" title="Like">
        <i class="fas fa-heart"></i>
        <span>Like</span>
      </button>
      <button class="btn-super-like" title="Super Like">
        <i class="fas fa-star"></i>
        <span>Super Like</span>
      </button>
    </div>
  `;

  container.appendChild(card);

  // Add drag listeners
  let startX = 0;
  let currentX = 0;

  card.addEventListener('mousedown', (e) => {
    startX = e.clientX;
    card.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (startX === 0) return;
    currentX = e.clientX - startX;
    card.style.transform = `translateX(${currentX}px) rotate(${currentX / 10}deg)`;
    card.style.opacity = Math.max(0.5, 1 - Math.abs(currentX) / 200);
  });

  document.addEventListener('mouseup', () => {
    if (startX === 0) return;
    card.style.cursor = 'grab';

    if (Math.abs(currentX) > 50) {
      if (currentX > 0) {
        likeProfile(profile);
      } else {
        passProfile(profile);
      }
    } else {
      card.style.transform = 'translateX(0) rotate(0)';
      card.style.opacity = '1';
    }

    startX = 0;
    currentX = 0;
  });
}

function addSwipeListeners() {
  const card = document.querySelector('.profile-card');
  if (!card) return;

  const passBtn = card.querySelector('.btn-pass');
  const likeBtn = card.querySelector('.btn-like');
  const superLikeBtn = card.querySelector('.btn-super-like');

  passBtn.addEventListener('click', () => {
    const profile = studentProfiles[currentProfileIndex];
    passProfile(profile);
  });

  likeBtn.addEventListener('click', () => {
    const profile = studentProfiles[currentProfileIndex];
    likeProfile(profile);
  });

  superLikeBtn.addEventListener('click', () => {
    const profile = studentProfiles[currentProfileIndex];
    superLikeProfile(profile);
  });
}

function passProfile(profile) {
  animateCardExit('left', profile);
}

function likeProfile(profile) {
  animateCardExit('right', profile);
  addMatch(profile, 'like');
}

function superLikeProfile(profile) {
  animateCardExit('up', profile);
  addMatch(profile, 'superLike');
}

function animateCardExit(direction, profile) {
  const card = document.querySelector('#profile-' + profile.id);
  
  switch(direction) {
    case 'left':
      card.style.transform = 'translateX(-500px) rotate(-20deg)';
      break;
    case 'right':
      card.style.transform = 'translateX(500px) rotate(20deg)';
      break;
    case 'up':
      card.style.transform = 'translateY(-500px) scale(1.1)';
      break;
  }
  
  card.style.opacity = '0';

  setTimeout(() => {
    currentProfileIndex++;
    renderProfileCard();
    renderMatches();
  }, 300);
}

function addMatch(profile, type) {
  const match = {
    ...profile,
    matchType: type,
    matchedAt: new Date().toLocaleString('ro-RO')
  };

  matches.unshift(match);
  localStorage.setItem('teamMatches', JSON.stringify(matches));

  if (type === 'like') {
    showNotification(`${profile.name} adăugat la potriviri! ❤️`);
  } else if (type === 'superLike') {
    showNotification(`Super Like pentru ${profile.name}! ⭐ Aceștia vor fi notificați!`);
  }
}

function renderMatches() {
  const matchesList = document.getElementById('matchesList');
  
  if (matches.length === 0) {
    matchesList.innerHTML = '<p style="text-align: center; color: #888;">Nu ai încă potriviri. Începe să dai swipe! 👆</p>';
    return;
  }

  matchesList.innerHTML = matches.map((match, index) => `
    <div class="match-item ${match.matchType}">
      <div class="match-avatar">
        <i class="fas fa-user"></i>
      </div>
      <div class="match-info">
        <h5>${match.name}</h5>
        <p>${match.specialization}</p>
        <span class="match-type-label">${match.matchType === 'superLike' ? '⭐ Super Like' : '❤️ Like'}</span>
      </div>
      <button class="btn-contact" onclick="contactMatch(${match.id})">Contactează</button>
    </div>
  `).join('');
  
  updateMatchStats();
}

function contactMatch(profileId) {
  const match = matches.find(m => m.id === profileId);
  showNotification(`Mesaj trimis către ${match.name}! 💬`);
}

/**
 * Update contoare pentru Like și Super Like
 */
function updateMatchStats() {
  const likeCount = matches.filter(m => m.matchType === 'like').length;
  const superLikeCount = matches.filter(m => m.matchType === 'superLike').length;
  
  const likeBadge = document.querySelector('.like-count');
  const superLikeBadge = document.querySelector('.super-like-count');
  
  if (likeBadge) likeBadge.textContent = `${likeCount} Like`;
  if (superLikeBadge) superLikeBadge.textContent = `${superLikeCount} Super`;
}

/**
 * Afișez notificări toast
 */
function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #e63946, #d63447);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 8px 20px rgba(230, 57, 70, 0.3);
    z-index: 9999;
    animation: slideInRight 0.3s ease-out;
    font-weight: 500;
    max-width: 300px;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  initializeTeamMatching();
});
