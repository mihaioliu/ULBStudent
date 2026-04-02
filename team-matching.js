// ============================================
// TEAM MATCHING - PROFILE SWIPE + SUPABASE
// ============================================

const fallbackProfiles = [
  {
    id: 1,
    name: 'Alex',
    year: '2',
    specialization: 'Calculatoare',
    skills: ['JavaScript', 'React', 'CSS', 'Design'],
    lookingFor: 'Backend Developer',
    bio: 'Pasionat de front-end, caut pe cineva pentru backend.',
    matches: 95
  },
  {
    id: 2,
    name: 'Elena',
    year: '2',
    specialization: 'Tehnologia Informatiei',
    skills: ['Python', 'SQL', 'Backend', 'API Design'],
    lookingFor: 'Frontend Developer',
    bio: 'Lucrez pe backend si baze de date, caut coleg front-end.',
    matches: 92
  },
  {
    id: 3,
    name: 'Bogdan',
    year: '3',
    specialization: 'Calculatoare',
    skills: ['C++', 'Algoritmi', 'Git'],
    lookingFor: 'Team pentru proiect de algoritmica',
    bio: 'Imi plac problemele grele si proiectele tehnice.',
    matches: 88
  }
];

let allProfiles = [];
let filteredProfiles = [];
let currentProfileIndex = 0;
let matches = JSON.parse(localStorage.getItem('teamMatches')) || [];

function normalizeDbProfile(row, index) {
  const rawSkills = row.skilluri || row.skills || row.profil_skilluri || [];
  return {
    id: Number(row.id || row.profile_id || index + 1),
    name: row.nume || row.name || row.profil_nume || 'Student',
    year: String(row.an_studiu || row.year || row.profil_an || '-'),
    specialization: row.specializare || row.specialization || row.profil_specializare || 'Specializare necompletata',
    skills: Array.isArray(rawSkills)
      ? rawSkills
      : String(rawSkills)
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
    lookingFor: row.cauta || row.looking_for || 'Colegi de echipa',
    bio: row.bio || row.descriere || 'Profil fara descriere.',
    matches: Number(row.compatibilitate || row.match_score || 80)
  };
}

function mapDbMatchToUi(row) {
  if (row.profile_name || row.profil_nume) {
    return {
      id: Number(row.profile_id || row.id || Date.now()),
      name: row.profile_name || row.profil_nume,
      year: row.profile_year || row.profil_an || '-',
      specialization: row.profile_specialization || row.profil_specializare || 'Specializare necompletata',
      skills: Array.isArray(row.profile_skills || row.profil_skilluri) ? (row.profile_skills || row.profil_skilluri) : [],
      matchType: row.match_type || row.tip_match || 'like',
      matchedAt: row.created_at
    };
  }

  const parsed = String(row.match_type || '').split(':');
  return {
    id: Number(row.id || Date.now()),
    name: parsed[1] || 'Student',
    year: '-',
    specialization: 'Calculatoare',
    skills: [],
    matchType: parsed[0] || 'like',
    matchedAt: row.created_at
  };
}

async function loadProfilesFromDatabase() {
  if (typeof initSupabaseClient !== 'function') {
    allProfiles = [...fallbackProfiles];
    filteredProfiles = [...allProfiles];
    return;
  }

  try {
    const client = await initSupabaseClient();
    const { data, error } = await client
      .from('profiluri_matching')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !Array.isArray(data) || data.length === 0) {
      allProfiles = [...fallbackProfiles];
    } else {
      allProfiles = data.map(normalizeDbProfile);
    }
  } catch (err) {
    console.warn('Nu s-au putut incarca profilurile din DB:', err.message);
    allProfiles = [...fallbackProfiles];
  }

  filteredProfiles = [...allProfiles];
}

async function loadMatchesFromDatabase() {
  if (typeof getTeamMatches !== 'function') return;

  const dbMatches = await getTeamMatches();
  if (dbMatches.success && dbMatches.data.length > 0) {
    matches = dbMatches.data.map(mapDbMatchToUi);
    localStorage.setItem('teamMatches', JSON.stringify(matches));
  }
}

async function initializeTeamMatching() {
  await Promise.all([loadProfilesFromDatabase(), loadMatchesFromDatabase()]);
  renderProfileCard();
  renderMatches();
  initializeFilters();
  addSwipeListeners();
  updateMatchStats();
}

function initializeFilters() {
  const yearFilter = document.getElementById('yearFilterTeam');
  const specFilter = document.getElementById('specFilterTeam');
  const skillFilter = document.getElementById('skillFilterTeam');

  if (!yearFilter || !specFilter || !skillFilter) return;

  function applyFilters() {
    const year = yearFilter.value;
    const spec = specFilter.value.toLowerCase();
    const skill = skillFilter.value.toLowerCase();

    filteredProfiles = allProfiles.filter((profile) => {
      const matchYear = !year || profile.year === year;
      const matchSpec = !spec || profile.specialization.toLowerCase().includes(spec);
      const matchSkill = !skill || profile.skills.some((s) => s.toLowerCase().includes(skill));
      return matchYear && matchSpec && matchSkill;
    });

    currentProfileIndex = 0;
    renderProfileCard();
    addSwipeListeners();
  }

  yearFilter.addEventListener('change', applyFilters);
  specFilter.addEventListener('change', applyFilters);
  skillFilter.addEventListener('change', applyFilters);
}

function renderProfileCard() {
  const container = document.querySelector('.profile-card-stack');
  if (!container) return;

  container.innerHTML = '';

  if (currentProfileIndex >= filteredProfiles.length) {
    container.innerHTML = '<div class="no-more-profiles"><h3>Nu mai sunt profile disponibile! 🎉</h3><p>Revino mai tarziu pentru mai multi parteneri potentiali.</p></div>';
    return;
  }

  const profile = filteredProfiles[currentProfileIndex];
  const card = document.createElement('div');
  card.className = 'profile-card';
  card.id = 'profile-' + profile.id;

  card.innerHTML = `
    <div class="profile-image">
      <div class="profile-avatar"><i class="fas fa-user"></i></div>
      <div class="profile-badge">${profile.matches}% compatibilitate</div>
    </div>
    <div class="profile-info">
      <h3>${profile.name}, An ${profile.year}</h3>
      <p class="specialization">${profile.specialization}</p>
      <p class="bio">${profile.bio}</p>
      <div class="skills-section">
        <h4>Abilitati:</h4>
        <div class="skills-tags">
          ${profile.skills.map((skill) => `<span class="skill-tag">${skill}</span>`).join('')}
        </div>
      </div>
      <div class="looking-for">
        <span class="looking-label">Cauta:</span>
        <span class="looking-value">${profile.lookingFor}</span>
      </div>
    </div>
    <div class="card-actions">
      <button class="btn-pass" title="Pass"><i class="fas fa-times"></i><span>Pass</span></button>
      <button class="btn-like" title="Like"><i class="fas fa-heart"></i><span>Like</span></button>
      <button class="btn-super-like" title="Super Like"><i class="fas fa-star"></i><span>Super Like</span></button>
    </div>
  `;

  container.appendChild(card);

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
      if (currentX > 0) likeProfile(profile);
      else passProfile(profile);
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
  if (!card || currentProfileIndex >= filteredProfiles.length) return;

  const profile = filteredProfiles[currentProfileIndex];
  card.querySelector('.btn-pass')?.addEventListener('click', () => passProfile(profile));
  card.querySelector('.btn-like')?.addEventListener('click', () => likeProfile(profile));
  card.querySelector('.btn-super-like')?.addEventListener('click', () => superLikeProfile(profile));
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
  if (!card) return;

  if (direction === 'left') card.style.transform = 'translateX(-500px) rotate(-20deg)';
  if (direction === 'right') card.style.transform = 'translateX(500px) rotate(20deg)';
  if (direction === 'up') card.style.transform = 'translateY(-500px) scale(1.1)';

  card.style.opacity = '0';

  setTimeout(() => {
    currentProfileIndex += 1;
    renderProfileCard();
    renderMatches();
    addSwipeListeners();
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

  if (typeof saveTeamMatch === 'function') {
    saveTeamMatch(profile, type).then((result) => {
      if (!result.success) {
        console.warn('Match-ul nu a fost salvat in DB. A ramas local.');
      }
    });
  }

  if (type === 'like') showNotification(`${profile.name} adaugat la potriviri! ❤️`);
  if (type === 'superLike') showNotification(`Super Like pentru ${profile.name}! ⭐`);
}

function renderMatches() {
  const matchesList = document.getElementById('matchesList');
  if (!matchesList) return;

  if (matches.length === 0) {
    matchesList.innerHTML = '<p style="text-align: center; color: #888;">Nu exista inca potriviri pentru contul tau.</p>';
    updateMatchStats();
    return;
  }

  matchesList.innerHTML = matches.map((match) => `
    <div class="match-item ${match.matchType}">
      <div class="match-avatar"><i class="fas fa-user"></i></div>
      <div class="match-info">
        <h5>${match.name}</h5>
        <p>${match.specialization}</p>
        <span class="match-type-label">${match.matchType === 'superLike' ? '⭐ Super Like' : '❤️ Like'}</span>
      </div>
      <button class="btn-contact" onclick="contactMatch(${match.id})">Contacteaza</button>
    </div>
  `).join('');

  updateMatchStats();
}

function contactMatch(profileId) {
  const match = matches.find((m) => m.id === profileId);
  if (!match) return;
  showNotification(`Conversatie initiata cu ${match.name}.`);
}

function updateMatchStats() {
  const likeCount = matches.filter((m) => m.matchType === 'like').length;
  const superLikeCount = matches.filter((m) => m.matchType === 'superLike').length;

  const likeBadge = document.querySelector('.like-count');
  const superLikeBadge = document.querySelector('.super-like-count');

  if (likeBadge) likeBadge.textContent = `${likeCount} Like`;
  if (superLikeBadge) superLikeBadge.textContent = `${superLikeCount} Super`;
}

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

document.addEventListener('DOMContentLoaded', async () => {
  await initializeTeamMatching();
});
