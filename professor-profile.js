async function loadProfessorProfile() {
  const params = new URLSearchParams(window.location.search);
  const professorId = params.get('id');

  const nameEl = document.getElementById('profName');
  const specializationEl = document.getElementById('profSpecialization');
  const emailEl = document.getElementById('profEmail');
  const subjectsEl = document.getElementById('profSubjects');
  const ratingEl = document.getElementById('profRating');
  const reviewsListEl = document.getElementById('reviewsList');
  const reviewsEmptyEl = document.getElementById('reviewsEmptyState');
  const reviewForm = document.getElementById('reviewForm');
  const reviewModal = document.getElementById('reviewModal');
  const openReviewModalBtn = document.getElementById('openReviewModalBtn');
  const closeReviewModalBtn = document.getElementById('closeReviewModalBtn');
  const cancelReviewModalBtn = document.getElementById('cancelReviewModalBtn');
  const reviewModalSubtitle = document.getElementById('reviewModalSubtitle');

  let currentProfessor = null;

  const openModal = () => {
    if (!reviewModal) return;
    reviewModal.classList.add('is-open');
    reviewModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  };

  const closeModal = () => {
    if (!reviewModal) return;
    reviewModal.classList.remove('is-open');
    reviewModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  };

  try {
    const client = await initSupabaseClient();

    if (professorId) {
      const { data, error } = await client
        .from('profesori')
        .select('*')
        .eq('id', professorId)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        currentProfessor = data;
      }
    }

    if (!currentProfessor) {
      const fallbackName = params.get('name') || 'Profesor';
      const fallbackSpec = params.get('specializare') || '-';
      nameEl.textContent = fallbackName;
      specializationEl.textContent = `Specializare: ${fallbackSpec}`;
      emailEl.textContent = '-';
      subjectsEl.textContent = '-';
    } else {
      const fullName = currentProfessor.nume_complet || currentProfessor.full_name || 'Profesor';
      const specialization = currentProfessor.specializare || currentProfessor.specialization || '-';
      const email = currentProfessor.email || currentProfessor.institutional_email || '-';
      const subjects = currentProfessor.materie || currentProfessor.materie_predata || currentProfessor.taught_subject || currentProfessor.subjects || '-';

      nameEl.textContent = fullName;
      specializationEl.textContent = `Specializare: ${specialization}`;
      emailEl.textContent = email;
      subjectsEl.textContent = subjects || '-';
      if (reviewModalSubtitle) {
        reviewModalSubtitle.textContent = `Profesor: ${fullName} • ${specialization}`;
      }
    }

    async function renderReviews() {
      if (!currentProfessor?.id) {
        reviewsListEl.innerHTML = '';
        reviewsEmptyEl.style.display = 'block';
        ratingEl.textContent = '0/5 (0 recenzii)';
        return;
      }

      const reviewsResult = await getProfessorReviews(currentProfessor.id);
      const rows = reviewsResult.success ? reviewsResult.data : [];

      reviewsListEl.innerHTML = '';
      if (!rows.length) {
        reviewsEmptyEl.style.display = 'block';
        ratingEl.textContent = '0/5 (0 recenzii)';
        return;
      }

      reviewsEmptyEl.style.display = 'none';
      const avg = rows.reduce((sum, row) => sum + Number(row.rating || 0), 0) / rows.length;
      ratingEl.textContent = `${avg.toFixed(1)}/5 (${rows.length} recenzii)`;

      rows.forEach((row) => {
        const card = document.createElement('div');
        card.style.cssText = 'padding: 0.9rem; border: 1px solid var(--border-color); border-radius: 10px; background: var(--light-gray);';
        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; gap:0.8rem; margin-bottom:0.45rem;">
            <strong>⭐ ${Number(row.rating || 0).toFixed(1)}</strong>
            <span style="color: var(--text-secondary); font-size: 0.85rem;">${new Date(row.created_at).toLocaleString('ro-RO')}</span>
          </div>
          <p style="margin:0; color: var(--text);">${escapeHtml(row.comentariu || row.comment || '')}</p>
        `;
        reviewsListEl.appendChild(card);
      });
    }

    await renderReviews();

    if (openReviewModalBtn) {
      openReviewModalBtn.addEventListener('click', openModal);
    }

    if (closeReviewModalBtn) {
      closeReviewModalBtn.addEventListener('click', closeModal);
    }

    if (cancelReviewModalBtn) {
      cancelReviewModalBtn.addEventListener('click', closeModal);
    }

    if (reviewModal) {
      reviewModal.addEventListener('click', (event) => {
        if (event.target === reviewModal) {
          closeModal();
        }
      });
    }

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    });

    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!currentProfessor?.id) {
        showNotification('Profesor invalid. Revino in lista profesori.');
        return;
      }

      const rating = Number(document.getElementById('reviewRating').value);
      const comment = document.getElementById('reviewComment').value.trim();

      if (!rating || rating < 1 || rating > 5 || !comment) {
        showNotification('Completeaza corect rating-ul si comentariul.');
        return;
      }

      const saveResult = await saveProfessorReview(currentProfessor.id, rating, comment);
      if (!saveResult.success) {
        showNotification('Nu s-a putut salva recenzia.');
        return;
      }

      reviewForm.reset();
      showNotification('Recenzie adaugata cu succes.');
      await renderReviews();
      closeModal();
    });
  } catch (error) {
    console.error('Profile page error:', error);
    showNotification('Nu s-au putut incarca datele profesorului.');
  }
}

document.addEventListener('DOMContentLoaded', loadProfessorProfile);
