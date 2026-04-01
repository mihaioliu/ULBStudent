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

let professorsData = [];
let filteredProfessors = [];

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
    rating: p.rating || 4.6,
    reviews_count: p.reviews_count || 0,
    courses_count: p.courses_count || 0
  }));
}

function mapDbProfessor(row) {
  return {
    id: row.id,
    title: row.academic_title || 'Cadru didactic',
    name: row.full_name || 'Profesor',
    email: row.institutional_email || '-',
    specialization: normalizeSpecialization(row.specialization),
    department: row.department || 'Departamentul de Calculatoare si Inginerie Electrica',
    rating: Number(row.rating || 4.6),
    reviews: Number(row.reviews_count || 0),
    courses: Number(row.courses_count || 0),
    specialties: [normalizeSpecialization(row.specialization)]
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
      rating: 4.6,
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
      rating: 4.6,
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
        <button class="btn-action btn-secondary" onclick="showProfessorProfile('${prof.name}', '${prof.specialization}')">Detalii</button>
      </div>
    </div>
  `).join('');
}

function copyEmail(email) {
  if (!email || email === '-') return;
  navigator.clipboard.writeText(email);
  alert('Email copiat: ' + email);
}

function showProfessorProfile(name, specialization) {
  alert(`Profesor: ${name}\nSpecializare: ${specialization}`);
}

async function seedOfficialProfessorsToDatabase() {
  const seedBtn = document.getElementById('seedProfessorsBtn');
  const statusBox = document.getElementById('seedStatus');

  if (seedBtn) seedBtn.disabled = true;
  if (statusBox) statusBox.textContent = 'Se importa profesorii in baza de date...';

  const result = await upsertProfessors(toDbPayload(OFFICIAL_PROFESSORS));

  if (result.success) {
    if (statusBox) statusBox.textContent = `Import reusit: ${result.data.length} randuri procesate.`;
    await loadProfessorsData();
    fillProfessorSelect();
    renderProfessors();
  } else {
    const errorText = result.error || 'eroare necunoscuta';
    if (statusBox) {
      if (errorText.toLowerCase().includes('relation') && errorText.toLowerCase().includes('professors')) {
        statusBox.textContent = 'Import esuat: tabelul professors nu exista. Ruleaza supabase_professors_seed.sql in SQL Editor.';
      } else {
        statusBox.textContent = `Import esuat: ${errorText}`;
      }
    }
  }

  if (seedBtn) seedBtn.disabled = false;
}

document.addEventListener('DOMContentLoaded', async function () {
  if (!document.getElementById('professorsGrid')) return;

  const loadInfo = await loadProfessorsData();
  fillProfessorSelect();
  initializeProfessorFilters();
  renderProfessors();

  const statusBox = document.getElementById('seedStatus');
  if (statusBox) {
    if (loadInfo.source === 'database') {
      statusBox.textContent = `Date active din Supabase: ${loadInfo.count} profesori.`;
    } else if (loadInfo.source === 'database-empty') {
      statusBox.textContent = 'Supabase este conectat, dar tabelul professors este gol. Poti folosi butonul de import.';
    } else {
      statusBox.textContent = 'Se afiseaza lista oficiala locala. Pentru DB, ruleaza supabase_professors_seed.sql.';
      if (loadInfo.dbError) {
        console.warn('Professors DB fallback reason:', loadInfo.dbError);
      }
    }
  }

  const seedBtn = document.getElementById('seedProfessorsBtn');
  if (seedBtn) {
    seedBtn.addEventListener('click', seedOfficialProfessorsToDatabase);
  }
});
