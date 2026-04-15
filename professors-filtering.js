/**
 * PROFESSORS PAGE DATA + FILTERS
 * Primary source: Supabase table `professors`
 * Fallback source: OFFICIAL_PROFESSORS list
 */

const OFFICIAL_PROFESSORS = [
  { academic_title: 'Prof. dr. ing.', full_name: 'Adrian Florea', institutional_email: 'adrian.florea@ulbsibiu.ro', specialization: 'Calculatoare' },
  { academic_title: 'Prof. dr. mat.', full_name: 'Adrian-Nicolae Branga', institutional_email: 'adrian.branga@ulbsibiu.ro', specialization: 'Calculatoare' },
  { academic_title: 'Asist. dr. ing.', full_name: 'Alexandru Dorobantiu', institutional_email: 'alexandru.dorobantiu@ulbsibiu.ro', specialization: 'Calculatoare' },
  { academic_title: 'Sef lucr. dr. ing.', full_name: 'Andreea Maria Teodorescu', institutional_email: 'andreea.teodorescu@ulbsibiu.ro', specialization: 'Calculatoare' },
  { academic_title: 'Sef lucr. dr. inf.', full_name: 'Antoniu-Gabriel Pitic', institutional_email: 'antoniu.pitic@ulbsibiu.ro', specialization: 'Calculatoare' },
  { academic_title: 'Conf. dr. ing.', full_name: 'Arpad Gellert', institutional_email: 'arpad.gellert@ulbsibiu.ro', specialization: 'Calculatoare' },
  { academic_title: 'Prof. dr. ing.', full_name: 'Bala Constantin Zamfirescu', institutional_email: 'constantin.zamfirescu@ulbsibiu.ro', specialization: 'Calculatoare' },
  { academic_title: 'Prof. dr. fiz.', full_name: 'Dan Chicea', institutional_email: 'dan.chicea@ulbsibiu.ro', specialization: 'Calculatoare' },
  { academic_title: 'Asist. dr. ing.', full_name: 'Daniel Cristian Craciunean', institutional_email: 'daniel.craciunean@ulbsibiu.ro', specialization: 'Calculatoare' },
  { academic_title: 'Prof. dr. ing.', full_name: 'Daniel Volovici', institutional_email: 'daniel.volovici@ulbsibiu.ro', specialization: 'Calculatoare' },
  { academic_title: 'Asist. dr. ing.', full_name: 'Dionisie Vladimir Turcu', institutional_email: 'dionisie.turcu@ulbsibiu.ro', specialization: 'Calculatoare' },
  { academic_title: 'Sef lucr. dr. ing.', full_name: 'Elena Catalina Neghina', institutional_email: 'catalina.neghina@ulbsibiu.ro', specialization: 'Calculatoare' },
  { academic_title: 'Sef lucr. dr. mat.', full_name: 'Elisabeta Alina Totoi', institutional_email: 'elisabeta.totoi@ulbsibiu.ro', specialization: 'Calculatoare' },
  { academic_title: 'Sef lucr. dr. ing.', full_name: 'Gabriela Craciunas', institutional_email: 'gabriela.craciunas@ulbsibiu.ro', specialization: 'Calculatoare' },
  { academic_title: 'Sef lucr. dr. ing.', full_name: 'Ileana Ioana Cofaru', institutional_email: 'ioana.cofaru@ulbsibiu.ro', specialization: 'Calculatoare' },
  { academic_title: 'Conf. dr. mat.', full_name: 'Ioan Tincu', institutional_email: 'ioan.tincu@ulbsibiu.ro', specialization: 'Calculatoare' },
  { academic_title: 'Prof. dr. ing.', full_name: 'Ion-Dan Mironescu', institutional_email: 'ion.mironescu@ulbsibiu.ro', specialization: 'Calculatoare' },
  { academic_title: 'Conf. dr. ing.', full_name: 'Ionel Daniel Morariu', institutional_email: 'daniel.morariu@ulbsibiu.ro', specialization: 'Calculatoare' },
  { academic_title: 'Conf. dr. ing.', full_name: 'Macarie Breazu', institutional_email: 'macarie.breazu@ulbsibiu.ro', specialization: 'Calculatoare' },
  { academic_title: 'Prof. dr. ing.', full_name: 'Maria Vintan', institutional_email: 'maria.vintan@ulbsibiu.ro', specialization: 'Calculatoare' },
  { academic_title: 'Conf. dr. ing.', full_name: 'Mihai Bogdan', institutional_email: 'mihai.bogdan@ulbsibiu.ro', specialization: 'Calculatoare' },
  { academic_title: 'Asist. dr. ing.', full_name: 'Radu Chis', institutional_email: 'radu.chis@ulbsibiu.ro', specialization: 'Calculatoare' },
  { academic_title: 'Conf. dr. mat.', full_name: 'Radu-George Cretulescu', institutional_email: 'radu.kretzulescu@ulbsibiu.ro', specialization: 'Calculatoare' },
  { academic_title: 'Prof. dr. ing.', full_name: 'Remus Ovidiu Brad', institutional_email: 'remus.brad@ulbsibiu.ro', specialization: 'Calculatoare' },
  { academic_title: 'Conf. dr. ing.', full_name: 'Rodica Baciu', institutional_email: 'rodica.baciu@ulbsibiu.ro', specialization: 'Calculatoare' },
  { academic_title: 'Sef lucr. dr. ing.', full_name: 'Teodor Petru Tulpan', institutional_email: 'teodorpetru.tulpan@ulbsibiu.ro', specialization: 'Calculatoare' },
  { academic_title: 'Conf. dr. ing.', full_name: 'Vasile Alexandru Butean', institutional_email: 'alexandru.butean@ulbsibiu.ro', specialization: 'Calculatoare' },
  { academic_title: 'Conf. dr. ing.', full_name: 'Maria Miruna Diaconu (Pop Vesea)', institutional_email: 'miruna.diaconu@ulbsibiu.ro', specialization: 'Tehnologia Informatiei' },
  { academic_title: 'Sef lucr. dr. ing.', full_name: 'Eugen-Ioan Constantinescu', institutional_email: 'eugen.constantinescu@ulbsibiu.ro', specialization: 'Tehnologia Informatiei' },
  { academic_title: 'Conf. dr. ing.', full_name: 'Mihai Neghina', institutional_email: 'mihai.neghina@ulbsibiu.ro', specialization: 'Ingineria Sistemelor Multimedia' }
];

window.OFFICIAL_PROFESSORS = OFFICIAL_PROFESSORS;

let professorsData = [];
let filteredProfessors = [];
let activeReviewProfessor = null;

function calculateProfessorRating(reviews) {
  const ratingRows = Array.isArray(reviews) ? reviews : [];
  const numarRecenzii = ratingRows.length;
  const sumaNote = ratingRows.reduce((acc, recenzie) => acc + Number(recenzie.rating || 0), 0);
  const media = numarRecenzii > 0 ? Number((sumaNote / numarRecenzii).toFixed(1)) : 0;

  return { media, numarRecenzii };
}

async function loadProfessors() {
  const { data: profesori, error } = await getProfessors();

  if (error) {
    console.error('Eroare la încărcare:', error);
    return;
  }

  console.log('Date primite de la Supabase:', profesori);

  const container = document.getElementById('professors-container') || document.getElementById('professorsGrid');
  if (!container) return;

  container.innerHTML = '';

  (profesori || []).forEach((prof) => {
    const recenzii = Array.isArray(prof.recenzii_profesori) ? prof.recenzii_profesori : [];
    const { media, numarRecenzii } = calculateProfessorRating(recenzii);

    const title = prof.academic_title || prof.titlu_academic || prof.titlu || prof.title || 'Prof.';
    const firstName = prof.prenume || '';
    const lastName = prof.nume || '';
    const fullName = `${firstName} ${lastName}`.trim() || prof.full_name || prof.nume_complet || prof.name || 'Profesor';
    const department = prof.departament || prof.department || '-';
    const subject = prof.materie || prof.taught_subject || prof.materie_predata || prof.specialization || '-';
    const subjectList = String(subject)
      .split(/[,;/|]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    const email = prof.email || prof.institutional_email || '-';

    container.innerHTML += `
      <div class="professor-card">
        <div class="prof-header">
          <div class="prof-avatar"><i class="fas fa-user-circle"></i></div>
          <div class="prof-header-info">
            <h3>${title} ${fullName}</h3>
            <p class="prof-faculty">${department}</p>
            <p class="prof-department">Materii: ${subject}</p>
            <p class="prof-department">Email: ${email}</p>
          </div>
        </div>
        <div class="prof-specialties">
          ${subjectList.map((item) => `<span class="specialty-tag">${item}</span>`).join('') || `<span class="specialty-tag">${subject}</span>`}
        </div>
        <div class="prof-stats">
          <span class="stat-item">⭐ ${media}/5 (${numarRecenzii} recenzii)</span>
          <span class="stat-item">📚 ${Number(prof.courses_count || prof.courses || 0)} cursuri</span>
        </div>
        <div class="prof-actions">
          <button class="btn-action btn-primary" onclick="copyEmail('${email}')">Copiaza email</button>
          <button class="btn-action btn-secondary" onclick="showProfessorProfile('${encodeURIComponent(String(prof.id || ''))}', '${encodeURIComponent(fullName)}', '${encodeURIComponent(subject)}')">Detalii</button>
          <button class="btn-action btn-secondary" onclick="addProfessorReview('${encodeURIComponent(String(prof.id || ''))}')">Adauga recenzie</button>
        </div>
      </div>
    `;
  });
}

function ensureProfessorReviewModal() {
  if (document.getElementById('professorReviewModal')) {
    return;
  }

  const modal = document.createElement('div');
  modal.id = 'professorReviewModal';
  modal.className = 'review-modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="review-modal-content professor-review-modal" role="dialog" aria-modal="true" aria-labelledby="professorReviewModalTitle">
      <button type="button" class="review-modal-close" id="closeProfessorReviewModal" aria-label="Inchide">&times;</button>
      <div class="review-modal-header">
        <p class="review-modal-kicker">Recenzie profesor</p>
        <h3 id="professorReviewModalTitle">Adaugă o recenzie</h3>
        <p id="professorReviewModalSubtitle">Spune cum a fost experiența ta la curs.</p>
      </div>

      <form id="professorReviewModalForm" class="review-modal-form">
        <label class="review-field">
          <span>Rating</span>
          <select id="professorReviewModalRating" required>
            <option value="">Alege un rating</option>
            <option value="1">1 - Foarte slab</option>
            <option value="2">2 - Slab</option>
            <option value="3">3 - Acceptabil</option>
            <option value="4">4 - Bun</option>
            <option value="5">5 - Excelent</option>
          </select>
        </label>

        <label class="review-field">
          <span>Comentariu</span>
          <textarea id="professorReviewModalComment" rows="5" required placeholder="Scrie ce ți-a plăcut și ce ar trebui știut înainte de curs."></textarea>
        </label>

        <div class="review-modal-actions">
          <button type="button" class="btn-action btn-secondary" id="cancelProfessorReviewModal">Renunță</button>
          <button type="submit" class="btn-action btn-primary">Salvează recenzia</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    activeReviewProfessor = null;
  };

  const form = modal.querySelector('#professorReviewModalForm');
  const closeBtn = modal.querySelector('#closeProfessorReviewModal');
  const cancelBtn = modal.querySelector('#cancelProfessorReviewModal');

  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!activeReviewProfessor?.id) {
      if (typeof showNotification === 'function') {
        showNotification('Profesor invalid.');
      }
      return;
    }

    const rating = Number(modal.querySelector('#professorReviewModalRating').value);
    const comment = modal.querySelector('#professorReviewModalComment').value.trim();

    if (!rating || rating < 1 || rating > 5 || !comment) {
      if (typeof showNotification === 'function') {
        showNotification('Completeaza corect rating-ul si comentariul.');
      }
      return;
    }

    const saved = await saveProfessorReview(activeReviewProfessor.id, rating, comment, {
      professorName: activeReviewProfessor.name,
      professorSubject: activeReviewProfessor.specialization,
      professorEmail: activeReviewProfessor.email
    });
    if (!saved.success) {
      if (typeof showNotification === 'function') {
        showNotification(saved.error || 'Nu s-a putut salva recenzia.');
      }
      return;
    }

    form.reset();
    closeModal();
    await loadProfessorsData();
    fillProfessorSelect();
    applyFilters();
    if (typeof showNotification === 'function') {
      showNotification('Recenzie salvata cu succes!');
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });
}

async function attachProfessorReviews() {
  professorsData = professorsData.map((prof) => {
    const rows = Array.isArray(prof.recenzii_profesori) ? prof.recenzii_profesori : [];
    if (rows.length === 0) return prof;

    const avg = rows.reduce((sum, item) => sum + Number(item.rating || 0), 0) / rows.length;
    return {
      ...prof,
      rating: Number(avg.toFixed(1)),
      reviews: rows.length
    };
  });
}

function normalizeSpecialization(value) {
  const v = (value || '').toLowerCase();
  if (v.includes('tehnologia')) return 'Tehnologia Informatiei';
  if (v.includes('multimedia')) return 'Ingineria Sistemelor Multimedia';
  return 'Calculatoare';
}

function toDbPayload(items) {
  return (items || []).map((p) => ({
    academic_title: p.academic_title,
    full_name: p.full_name,
    institutional_email: p.institutional_email,
    specialization: normalizeSpecialization(p.specialization),
    department: 'Departamentul de Calculatoare si Inginerie Electrica',
    rating: p.rating || 0,
    reviews_count: p.reviews_count || 0,
    courses_count: p.courses_count || 0
  }));
}

function mapDbProfessor(row) {
  const reviews = Array.isArray(row.recenzii_profesori) ? row.recenzii_profesori : [];
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
    : 0;

  return {
    id: row.id,
    title: row.academic_title || 'Cadru didactic',
    name: row.full_name || 'Profesor',
    email: row.institutional_email || '-',
    specialization: normalizeSpecialization(row.specialization),
    department: row.department || 'Departamentul de Calculatoare si Inginerie Electrica',
    rating: Number(avgRating.toFixed(1)),
    reviews: reviews.length,
    courses: Number(row.courses_count || 0),
    specialties: [normalizeSpecialization(row.specialization)],
    recenzii_profesori: reviews
  };
}

async function loadProfessorsData() {
  const dbResult = await getProfessors();
  let source = 'fallback';
  let dbError = dbResult.error || '';

  if (dbResult.success && dbResult.data.length > 0) {
    professorsData = dbResult.data.map(mapDbProfessor);
    source = 'database';
  } else if (dbResult.success && dbResult.data.length === 0) {
    professorsData = [];
    source = 'database-empty';
  } else {
    professorsData = OFFICIAL_PROFESSORS.map((p, index) => ({
      id: index + 1,
      title: p.academic_title,
      name: p.full_name,
      email: p.institutional_email,
      specialization: normalizeSpecialization(p.specialization),
      department: 'Departamentul de Calculatoare si Inginerie Electrica',
      rating: 0,
      reviews: 0,
      courses: 0,
      specialties: [normalizeSpecialization(p.specialization)]
    }));
  }

  if (source === 'database-empty') {
    professorsData = OFFICIAL_PROFESSORS.map((p, index) => ({
      id: index + 1,
      title: p.academic_title,
      name: p.full_name,
      email: p.institutional_email,
      specialization: normalizeSpecialization(p.specialization),
      department: 'Departamentul de Calculatoare si Inginerie Electrica',
      rating: 0,
      reviews: 0,
      courses: 0,
      specialties: [normalizeSpecialization(p.specialization)]
    }));
  }

  filteredProfessors = [...professorsData];
  return { source, count: professorsData.length, dbError };
}

function fillProfessorSelect() {
  const nameFilter = document.getElementById('profNameFilter');
  if (!nameFilter) return;

  const options = ['<option value="">Toti profesorii</option>'];
  professorsData
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((prof) => {
      options.push(`<option value="${prof.name.toLowerCase()}">${prof.name}</option>`);
    });

  nameFilter.innerHTML = options.join('');
}

function initializeProfessorFilters() {
  const ids = [
    'profNameFilter',
    'searchProf',
    'modulFilter',
    'departmentFilter',
    'resetFiltersBtn'
  ];

  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    const eventName = id === 'searchProf' ? 'input' : 'change';
    if (id === 'resetFiltersBtn') {
      el.addEventListener('click', resetAllFilters);
    } else {
      el.addEventListener(eventName, applyFilters);
    }
  });

  document.querySelectorAll('.faculty-item input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener('change', applyFilters);
  });
}

function applyFilters() {
  const nameFilter = (document.getElementById('profNameFilter')?.value || '').toLowerCase();
  const searchText = (document.getElementById('searchProf')?.value || '').toLowerCase();
  const selectedSpecs = Array.from(document.querySelectorAll('.faculty-item input[type="checkbox"]:checked')).map((cb) => cb.value);
  const modul = (document.getElementById('modulFilter')?.value || '').toLowerCase();
  const department = (document.getElementById('departmentFilter')?.value || '').toLowerCase();

  filteredProfessors = professorsData.filter((prof) => {
    const specSlug = prof.specialization
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/\u0103/g, 'a')
      .replace(/\u00e2/g, 'a')
      .replace(/\u0219/g, 's')
      .replace(/\u021b/g, 't')
      .replace(/\u00ee/g, 'i');

    if (nameFilter && !prof.name.toLowerCase().includes(nameFilter)) return false;

    if (searchText) {
      const found =
        prof.name.toLowerCase().includes(searchText) ||
        prof.email.toLowerCase().includes(searchText) ||
        prof.specialization.toLowerCase().includes(searchText);
      if (!found) return false;
    }

    if (selectedSpecs.length > 0 && !selectedSpecs.includes(specSlug)) return false;
    if (modul && modul !== specSlug) return false;
    if (department && department !== specSlug) return false;

    return true;
  });

  renderProfessors();
}

function resetAllFilters() {
  ['profNameFilter', 'searchProf', 'modulFilter', 'departmentFilter'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  document.querySelectorAll('.faculty-item input[type="checkbox"]').forEach((cb) => {
    cb.checked = false;
  });

  filteredProfessors = [...professorsData];
  renderProfessors();
}

function renderProfessors() {
  const grid = document.getElementById('professorsGrid');
  if (!grid) return;

  if (filteredProfessors.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 2rem 1rem;">
        <p style="color: var(--text-secondary); font-size: 1.05rem;">Nu s-au gasit profesori pentru filtrele selectate.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filteredProfessors.map((prof) => `
    <div class="professor-card">
      <div class="prof-header">
        <div class="prof-avatar"><i class="fas fa-user-circle"></i></div>
        <div class="prof-header-info">
          <h3>${prof.title} ${prof.name}</h3>
          <p class="prof-faculty">${prof.department}</p>
          <p class="prof-department">Specializare: ${prof.specialization}</p>
          <p class="prof-department">Email: ${prof.email}</p>
        </div>
      </div>
      <div class="prof-specialties">
        ${prof.specialties.map((spec) => `<span class="specialty-tag">${spec}</span>`).join('')}
      </div>
      <div class="prof-stats">
        <span class="stat-item">⭐ ${prof.rating}/5 (${prof.reviews} recenzii)</span>
        <span class="stat-item">📚 ${prof.courses} cursuri</span>
      </div>
      <div class="prof-actions">
        <button class="btn-action btn-primary" onclick="copyEmail('${prof.email}')">Copiaza email</button>
        <button class="btn-action btn-secondary" onclick="showProfessorProfile('${encodeURIComponent(String(prof.id || ''))}', '${encodeURIComponent(prof.name)}', '${encodeURIComponent(prof.specialization)}')">Detalii</button>
        <button class="btn-action btn-secondary" onclick="addProfessorReview('${encodeURIComponent(String(prof.id || ''))}')">Adauga recenzie</button>
      </div>
    </div>
  `).join('');
}

async function addProfessorReview(professorId) {
  if (typeof saveProfessorReview !== 'function') {
    if (typeof showNotification === 'function') {
      showNotification('Functia de recenzii nu este disponibila.');
    }
    return;
  }

  ensureProfessorReviewModal();

  const decodedProfessorId = decodeURIComponent(String(professorId || ''));
  const professor = professorsData.find((item) => String(item.id) === decodedProfessorId)
    || filteredProfessors.find((item) => String(item.id) === decodedProfessorId)
    || professorsData.find((item) => Number(item.id) === Number(decodedProfessorId))
    || filteredProfessors.find((item) => Number(item.id) === Number(decodedProfessorId));

  activeReviewProfessor = professor || { id: decodedProfessorId, name: 'Profesor' };

  const modal = document.getElementById('professorReviewModal');
  const title = document.getElementById('professorReviewModalTitle');
  const subtitle = document.getElementById('professorReviewModalSubtitle');
  const ratingInput = document.getElementById('professorReviewModalRating');
  const commentInput = document.getElementById('professorReviewModalComment');

  if (title) {
    title.textContent = `Recenzie pentru ${activeReviewProfessor.title || 'Prof.'} ${activeReviewProfessor.name || 'Profesor'}`;
  }
  if (subtitle) {
    subtitle.textContent = `${activeReviewProfessor.department || 'Departament'} • ${activeReviewProfessor.specialization || 'Specializare'}`;
  }

  if (ratingInput) ratingInput.value = '';
  if (commentInput) commentInput.value = '';

  modal?.classList.add('is-open');
  modal?.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  setTimeout(() => ratingInput?.focus(), 50);
}

function copyEmail(email) {
  if (!email || email === '-') return;
  navigator.clipboard?.writeText(email).catch(() => {});
  if (typeof showNotification === 'function') {
    showNotification('Email copiat: ' + email);
  }
}

function showProfessorProfile(professorId, encodedName, encodedSpecialization) {
  const params = new URLSearchParams();
  const decodedProfessorId = decodeURIComponent(String(professorId || ''));
  if (decodedProfessorId) params.set('id', decodedProfessorId);
  if (encodedName) params.set('name', decodeURIComponent(encodedName));
  if (encodedSpecialization) params.set('specializare', decodeURIComponent(encodedSpecialization));
  window.location.href = `professor-profile.html?${params.toString()}`;
}

document.addEventListener('DOMContentLoaded', async function () {
  if (!document.getElementById('professorsGrid')) return;

  ensureProfessorReviewModal();

  const loadInfo = await loadProfessorsData();
  fillProfessorSelect();
  initializeProfessorFilters();
  renderProfessors();

  const statusBox = document.getElementById('seedStatus');
  if (statusBox) {
    if (loadInfo.source === 'database') {
      statusBox.textContent = `Date active din Supabase: ${loadInfo.count} profesori.`;
      statusBox.style.display = 'block';
    } else if (loadInfo.source === 'database-empty') {
      statusBox.textContent = 'Supabase este conectat, dar tabelul profesori este gol.';
      statusBox.style.display = 'block';
    } else {
      statusBox.textContent = '';
      statusBox.style.display = 'none';
      if (loadInfo.dbError) {
        console.warn('Professors DB fallback reason:', loadInfo.dbError);
      }
    }
  }
});
