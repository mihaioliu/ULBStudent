/**
 * PROFESSORS FILTERING - Gestionează filtrarea și căutarea profesorilor
 */

const professorsData = [
  {
    id: 1,
    name: "Ion Popescu",
    title: "Prof. Dr.",
    faculty: "inginerie",
    department: "informatica",
    module: "informatica",
    specialties: ["Algoritmi", "Programare", "Baze de Date"],
    rating: 4.8,
    reviews: 245,
    courses: 12
  },
  {
    id: 2,
    name: "Maria Ionescu",
    title: "Prof. Dr.",
    faculty: "stiinte",
    department: "matematica",
    module: "matematica",
    specialties: ["Analiză Matematică", "Ecuații Diferențiale", "Calcul Numeric"],
    rating: 4.6,
    reviews: 189,
    courses: 8
  },
  {
    id: 3,
    name: "Radu Ștefănescu",
    title: "Prof. Dr.",
    faculty: "inginerie",
    department: "sisteme",
    module: "automatica",
    specialties: ["Sisteme de Control", "Robotică", "Automatizare"],
    rating: 4.7,
    reviews: 167,
    courses: 10
  },
  {
    id: 4,
    name: "Elena Vărdescu",
    title: "Prof. Dr.",
    faculty: "litere",
    department: "filologie",
    module: "limba",
    specialties: ["Literatură Română", "Lingvistică", "Traducere"],
    rating: 4.5,
    reviews: 142,
    courses: 9
  }
];

let filteredProfessors = [...professorsData];

document.addEventListener('DOMContentLoaded', function() {
  initializeProfessorFilters();
  renderProfessors();
});

function initializeProfessorFilters() {
  const nameFilter = document.getElementById('profNameFilter');
  const searchProf = document.getElementById('searchProf');
  const facultyCheckboxes = document.querySelectorAll('.faculty-item input[type="checkbox"]');
  const modulFilter = document.getElementById('modulFilter');
  const departmentFilter = document.getElementById('departmentFilter');
  const conductorFilter = document.getElementById('conductorFilter');
  const numDocentiFilter = document.getElementById('numDocentiFilter');
  const resetBtn = document.getElementById('resetFiltersBtn');

  if (nameFilter) nameFilter.addEventListener('change', applyFilters);
  if (searchProf) searchProf.addEventListener('input', applyFilters);
  if (modulFilter) modulFilter.addEventListener('change', applyFilters);
  if (departmentFilter) departmentFilter.addEventListener('change', applyFilters);
  if (conductorFilter) conductorFilter.addEventListener('change', applyFilters);
  if (numDocentiFilter) numDocentiFilter.addEventListener('change', applyFilters);
  
  facultyCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', applyFilters);
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', resetAllFilters);
  }
}

function applyFilters() {
  const nameFilter = document.getElementById('profNameFilter').value.toLowerCase();
  const searchText = document.getElementById('searchProf').value.toLowerCase();
  const facultyCheckboxes = document.querySelectorAll('.faculty-item input[type="checkbox"]:checked');
  const modulFilter = document.getElementById('modulFilter').value.toLowerCase();
  const departmentFilter = document.getElementById('departmentFilter').value.toLowerCase();

  const selectedFaculties = Array.from(facultyCheckboxes).map(cb => cb.value);

  filteredProfessors = professorsData.filter(prof => {
    // Filter by name
    if (nameFilter && !prof.name.toLowerCase().includes(nameFilter)) {
      return false;
    }

    // Filter by search text
    if (searchText) {
      const searchInText = 
        prof.name.toLowerCase().includes(searchText) ||
        prof.specialties.some(spec => spec.toLowerCase().includes(searchText));
      
      if (!searchInText) return false;
    }

    // Filter by faculty
    if (selectedFaculties.length > 0 && !selectedFaculties.includes(prof.faculty)) {
      return false;
    }

    // Filter by modul
    if (modulFilter && prof.module !== modulFilter) {
      return false;
    }

    // Filter by department
    if (departmentFilter && prof.department !== departmentFilter) {
      return false;
    }

    return true;
  });

  renderProfessors();
}

function resetAllFilters() {
  document.getElementById('profNameFilter').value = '';
  document.getElementById('searchProf').value = '';
  document.getElementById('modulFilter').value = '';
  document.getElementById('departmentFilter').value = '';
  document.getElementById('conductorFilter').value = '';
  document.getElementById('numDocentiFilter').value = '';

  document.querySelectorAll('.faculty-item input[type="checkbox"]').forEach(cb => {
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
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem;">
        <p style="color: var(--text-secondary); font-size: 1.1rem;">
          Nu s-au găsit profesori. Încearcă alte filtre.
        </p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filteredProfessors.map(prof => `
    <div class="professor-card">
      <div class="prof-header">
        <div class="prof-avatar">
          <i class="fas fa-user-circle"></i>
        </div>
        <div class="prof-header-info">
          <h3>${prof.title} ${prof.name}</h3>
          <p class="prof-faculty">Facultatea de ${capitalizeWords(prof.faculty)}</p>
          <p class="prof-department">Departament: ${capitalizeWords(prof.department)}</p>
        </div>
      </div>
      <div class="prof-specialties">
        ${prof.specialties.map(spec => `<span class="specialty-tag">${spec}</span>`).join('')}
      </div>
      <div class="prof-stats">
        <span class="stat-item">⭐ ${prof.rating}/5 (${prof.reviews} recenzii)</span>
        <span class="stat-item">📚 ${prof.courses} cursuri</span>
      </div>
      <div class="prof-actions">
        <button class="view-profile-btn" onclick="viewProfileModal(${prof.id})">Vezi Profil</button>
        <button class="view-reviews-btn" onclick="viewReviews(${prof.id})">Recenzii</button>
      </div>
    </div>
  `).join('');
}

function capitalizeWords(str) {
  return str
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function viewProfileModal(professorId) {
  const prof = professorsData.find(p => p.id === professorId);
  if (!prof) return;

  alert(`
Profil Professor
================
Nume: ${prof.title} ${prof.name}
Specialități: ${prof.specialties.join(', ')}
Rating: ${prof.rating}/5 (${prof.reviews} recenzii)
Cursuri: ${prof.courses}
  `);
}

function viewReviews(professorId) {
  alert(`Recenziile pentru profesor ID: ${professorId}\nFuncționalitate în dezvoltare.`);
}
