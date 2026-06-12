async function loadProfessorProfile() {
  const params = new URLSearchParams(window.location.search);
  const professorId = String(params.get('id') || '').trim();

  const nameEl = document.getElementById('profName');
  const specializationEl = document.getElementById('profSpecialization');
  const specializationBadgeEl = document.getElementById('profSpecializationBadge');
  const avatarEl = document.getElementById('profAvatar');
  const emailEl = document.getElementById('profEmail');
  const emailAltEl = document.getElementById('profEmailAlt');
  const emailFeedbackEl = document.getElementById('emailCopyFeedback');
  const subjectsEl = document.getElementById('profSubjects');
  const ratingEl = document.getElementById('profRating');
  const ratingSummaryEl = document.getElementById('profRatingSummary');
  const ratingStarsEl = document.getElementById('profRatingStars');
  const ratingBreakdownEl = document.getElementById('profRatingBreakdown');
  const reviewCountEl = document.getElementById('profReviewCount');
  const reviewCountStatEl = document.getElementById('profReviewCountStat');
  const reviewCountInlineEl = document.getElementById('profReviewCountInline');
  const teachingCountEl = document.getElementById('profTeachingCount');
  const teachingCountStatEl = document.getElementById('profTeachingCountStat');
  const reviewsListEl = document.getElementById('reviewsList');
  const reviewsEmptyEl = document.getElementById('reviewsEmptyState');
  const reviewForm = document.getElementById('reviewForm');
  const reviewModal = document.getElementById('reviewModal');
  const openReviewModalBtn = document.getElementById('openReviewModalBtn');
  const openReviewModalBtnSecondary = document.getElementById('openReviewModalBtnSecondary');
  const closeReviewModalBtn = document.getElementById('closeReviewModalBtn');
  const cancelReviewModalBtn = document.getElementById('cancelReviewModalBtn');
  const reviewModalSubtitle = document.getElementById('reviewModalSubtitle');

  let currentProfessor = null;
  const fallbackName = params.get('name') || 'Profesor ULBS';
  const fallbackSpec = params.get('specializare') || '-';

  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const splitSubjects = (value) => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item || '').trim()).filter(Boolean);
    }

    return String(value || '')
      .split(/,|\n|;|\//)
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const formatDate = (value) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'dată necunoscută';
    return new Intl.DateTimeFormat('ro-RO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(parsed);
  };

  const starMarkup = (rating) => {
    const value = Math.max(0, Math.min(5, Number(rating) || 0));
    let markup = '';
    for (let index = 1; index <= 5; index += 1) {
      markup += `<i class="fa-${index <= Math.round(value) ? 'solid' : 'regular'} fa-star"></i>`;
    }
    return markup;
  };

  const initialsForName = (fullName) => {
    const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'UL';
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('').slice(0, 2) || 'UL';
  };

  const renderSubjectChips = (subjects) => {
    const list = splitSubjects(subjects);
    if (!list.length) {
      subjectsEl.innerHTML = '<span class="prof-empty-inline">Nu sunt publicate materii încă.</span>';
      return 0;
    }

    subjectsEl.innerHTML = list.map((subject) => `<span class="prof-subject-pill"><i class="fa-solid fa-book-open"></i> ${escapeHtml(subject)}</span>`).join('');
    return list.length;
  };

  const updateRatingSummary = (average, count) => {
    const safeAverage = Number.isFinite(average) ? average : 0;
    const safeCount = Number(count) || 0;
    const summaryLabel = safeCount ? `${safeAverage.toFixed(1)} / 5` : 'Fără recenzii';

    ratingEl.innerHTML = summaryLabel;
    if (ratingSummaryEl) ratingSummaryEl.textContent = summaryLabel;
    if (reviewCountEl) reviewCountEl.textContent = `${safeCount} recenzii`;
    if (reviewCountStatEl) reviewCountStatEl.textContent = String(safeCount);
    if (reviewCountInlineEl) reviewCountInlineEl.textContent = safeCount === 1 ? '1 recenzie' : `${safeCount} recenzii`;

    if (ratingStarsEl) {
      ratingStarsEl.innerHTML = safeCount ? starMarkup(safeAverage) : '<i class="fa-regular fa-star"></i>'.repeat(5);
    }

    if (ratingBreakdownEl) {
      if (!safeCount) {
        ratingBreakdownEl.innerHTML = '<span class="prof-empty-inline">Nu există suficiente date pentru breakdown.</span>';
      } else {
        const buckets = [5, 4, 3, 2, 1].map((score) => ({
          score,
          count: 0
        }));

        buckets.forEach((bucket) => {
          bucket.count = 0;
        });

        const rows = Array.isArray(window.__currentProfessorReviews) ? window.__currentProfessorReviews : [];
        rows.forEach((row) => {
          const rounded = Math.max(1, Math.min(5, Math.round(Number(row.rating || 0))));
          const bucket = buckets.find((item) => item.score === rounded);
          if (bucket) bucket.count += 1;
        });

        ratingBreakdownEl.innerHTML = buckets.map((bucket) => {
          const width = safeCount ? Math.round((bucket.count / safeCount) * 100) : 0;
          return `
            <div class="prof-rating-line">
              <span>${bucket.score} <i class="fa-solid fa-star"></i></span>
              <div class="prof-rating-bar"><span style="width:${width}%"></span></div>
              <span style="text-align:right;">${bucket.count}</span>
            </div>
          `;
        }).join('');
      }
    }
  };

  const setAvatar = (fullName) => {
    if (!avatarEl) return;
    avatarEl.textContent = initialsForName(fullName);
  };

  const getProfessorDisplay = () => {
    if (currentProfessor) {
      const subjects = currentProfessor.materie || currentProfessor.materie_predata || currentProfessor.taught_subject || currentProfessor.subjects || currentProfessor.disciplines || '';
      return {
        id: String(currentProfessor.id || professorId || '').trim(),
        fullName: currentProfessor.nume_complet || currentProfessor.full_name || fallbackName,
        specialization: currentProfessor.specializare || currentProfessor.specialization || fallbackSpec,
        email: currentProfessor.email || currentProfessor.institutional_email || '-',
        subjects
      };
    }

    return {
      id: professorId,
      fullName: fallbackName,
      specialization: fallbackSpec,
      email: '-',
      subjects: ''
    };
  };

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
      const professorTables = ['profesori', 'professors'];
      for (const table of professorTables) {
        const direct = await client
          .from(table)
          .select('*')
          .eq('id', professorId)
          .limit(1)
          .maybeSingle();

        if (!direct.error && direct.data) {
          currentProfessor = direct.data;
          break;
        }

        const numericId = Number(professorId);
        if (Number.isFinite(numericId)) {
          const numeric = await client
            .from(table)
            .select('*')
            .eq('id', numericId)
            .limit(1)
            .maybeSingle();

          if (!numeric.error && numeric.data) {
            currentProfessor = numeric.data;
            break;
          }
        }
      }
    }

    if (!currentProfessor && typeof getProfessors === 'function') {
      const listResult = await getProfessors();
      const rows = Array.isArray(listResult.data) ? listResult.data : [];
      currentProfessor = rows.find((row) => String(row.id || '') === professorId) || null;

      if (!currentProfessor && fallbackName) {
        const normalizedFallbackName = fallbackName.trim().toLowerCase();
        currentProfessor = rows.find((row) => {
          const fullName = String(row.nume_complet || row.full_name || '').trim().toLowerCase();
          return fullName && fullName === normalizedFallbackName;
        }) || null;
      }
    }

    const professorDisplay = getProfessorDisplay();
    document.title = `${professorDisplay.fullName} | ULBStudent`;
    nameEl.textContent = professorDisplay.fullName;
    setAvatar(professorDisplay.fullName);
    specializationEl.textContent = `Specializare: ${professorDisplay.specialization}`;
    if (specializationBadgeEl) specializationBadgeEl.textContent = professorDisplay.specialization || 'Specializare';
    emailEl.textContent = professorDisplay.email;
    if (emailAltEl) emailAltEl.textContent = professorDisplay.email;
    if (professorDisplay.email && professorDisplay.email !== '-') {
      emailEl.textContent = professorDisplay.email;
      if (emailAltEl) emailAltEl.textContent = professorDisplay.email;
    }

    const teachingCount = renderSubjectChips(professorDisplay.subjects);
    if (teachingCountEl) teachingCountEl.textContent = teachingCount === 1 ? '1 materie' : `${teachingCount} materii`;
    if (teachingCountStatEl) teachingCountStatEl.textContent = String(teachingCount);

    // Copy email button (profile) — short label and transient feedback
    const copyBtn = document.getElementById('copyEmailBtn');
    if (copyBtn) {
      copyBtn.onclick = async () => {
        const email = (professorDisplay.email || '').trim();
        if (!email || email === '-') {
          if (emailFeedbackEl) emailFeedbackEl.textContent = 'Adresa de email nu este disponibilă.';
          if (typeof showNotification === 'function') showNotification('Adresa de email nu este disponibilă.');
          return;
        }
        try {
          await navigator.clipboard.writeText(email);
          copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copiat';
          if (emailFeedbackEl) emailFeedbackEl.textContent = 'Email copiat în clipboard.';
          if (typeof showNotification === 'function') showNotification('Email copiat');
          setTimeout(() => {
            copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copiază';
            if (emailFeedbackEl) emailFeedbackEl.textContent = '';
          }, 1400);
        } catch (err) {
          if (emailFeedbackEl) emailFeedbackEl.textContent = 'Nu s-a putut copia emailul.';
          if (typeof showNotification === 'function') showNotification('Nu s-a putut copia emailul.');
        }
      };
    }
    if (reviewModalSubtitle) {
      reviewModalSubtitle.textContent = `Profesor: ${professorDisplay.fullName} • ${professorDisplay.specialization}`;
    }

    if (openReviewModalBtnSecondary) {
      openReviewModalBtnSecondary.addEventListener('click', openModal);
    }

    async function renderReviews() {
      if (!professorDisplay.id) {
        reviewsListEl.innerHTML = '';
        reviewsEmptyEl.style.display = 'block';
        window.__currentProfessorReviews = [];
        updateRatingSummary(0, 0);
        return;
      }

      const reviewsResult = await getProfessorReviews(professorDisplay.id);
      const rows = reviewsResult.success ? reviewsResult.data : [];
      window.__currentProfessorReviews = rows;

      reviewsListEl.innerHTML = '';
      if (!rows.length) {
        reviewsEmptyEl.style.display = 'block';
        updateRatingSummary(0, 0);
        return;
      }

      reviewsEmptyEl.style.display = 'none';
      const avg = rows.reduce((sum, row) => sum + Number(row.rating || 0), 0) / rows.length;
      updateRatingSummary(avg, rows.length);

      rows.forEach((row) => {
        const card = document.createElement('div');
        card.className = 'prof-review-card';
        const authorName = String(row.autor || row.author || row.student_name || row.created_by_name || row.user_name || 'Student ULBS').trim();
        const difficulty = row.dificultate ?? row.difficulty;
        const utility = row.utilitate ?? row.utility;
        const clarity = row.claritate ?? row.clarity;
        const comment = String(
          row.comentariu ||
          row.comment ||
          row.review_text ||
          row.body ||
          row.text ||
          row.content ||
          row.comment_text ||
          row.comentariu_text ||
          row.comentariu_html ||
          ''
        ).trim();
        const metaItems = [];
        if (difficulty !== undefined && difficulty !== null && difficulty !== '') metaItems.push(`<span class="prof-review-meta-pill">Dificultate: ${escapeHtml(difficulty)}</span>`);
        if (utility !== undefined && utility !== null && utility !== '') metaItems.push(`<span class="prof-review-meta-pill">Utilitate: ${escapeHtml(utility)}</span>`);
        if (clarity !== undefined && clarity !== null && clarity !== '') metaItems.push(`<span class="prof-review-meta-pill">Claritate: ${escapeHtml(clarity)}</span>`);
        card.innerHTML = `
          <div class="prof-review-head">
            <div class="prof-review-author">
              <strong>${escapeHtml(authorName)}</strong>
              <span class="prof-review-date">${formatDate(row.created_at)}</span>
            </div>
            <div class="prof-rating-stars" aria-hidden="true">${starMarkup(Number(row.rating || 0))}</div>
            <div class="prof-review-actions" data-review-id="${escapeHtml(String(row.id || row.review_id || ''))}"></div>
          </div>
          ${comment ? `<p class="prof-review-text">${escapeHtml(comment)}</p>` : '<p class="prof-review-text prof-review-empty-text">Recenzie fără comentariu</p>'}
          ${metaItems.length ? `<div class="prof-review-meta">${metaItems.join('')}</div>` : ''}
        `;
        reviewsListEl.appendChild(card);

        // Attach delete handler for admins
        (async () => {
          try {
            const role = localStorage.getItem('role');
            let isAdmin = role === 'admin';
            if (!isAdmin && typeof getAuthenticatedUser === 'function' && typeof resolveAndCacheUserRole === 'function') {
              const u = await getAuthenticatedUser(false);
              const resolved = await resolveAndCacheUserRole(u);
              isAdmin = resolved === 'admin';
            }

            if (!isAdmin) return;

            const actionsEl = card.querySelector('.prof-review-actions');
            if (!actionsEl) return;
            const reviewId = String(row.id || row.review_id || '').trim();
            if (!reviewId) return;

            actionsEl.innerHTML = `<button class="btn btn-ghost btn-danger btn-small prof-review-delete">Șterge</button>`;
            const delBtn = actionsEl.querySelector('.prof-review-delete');
            delBtn.addEventListener('click', async (e) => {
              e.preventDefault();
              if (!confirm('Ești sigur că vrei să ștergi această recenzie? Această acțiune nu se poate anula.')) return;
              try {
                const client = await initSupabaseClient();
                const res = await client.from('recenzii_profesori').delete().eq('id', reviewId).select();
                if (res.error) throw res.error;
                if (typeof showNotification === 'function') showNotification('Recenzie ștearsă.', 'success');
                await renderReviews();
              } catch (err) {
                console.error('Error deleting review:', err?.message || err);
                if (typeof showNotification === 'function') showNotification(err?.message || 'Eroare la ștergerea recenziei.', 'error');
              }
            });
          } catch (e) {
            console.warn('Could not attach admin delete button for reviews', e.message || e);
          }
        })();
      });
    }

    await renderReviews();

    // --- Realtime subscriptions: update reviews and courses live ---
    try {
      const client = await initSupabaseClient();
      const reviewsTable = 'recenzii_profesori';
      const coursesTable = 'cursuri';

      // Helper to detect row belongs to current professor
      const rowBelongsToProfessor = (row) => {
        if (!row) return false;
        const idCandidates = [row.id_profesor, row.profesor_id, row.professor_id, row.prof_id, row.target_id];
        return idCandidates.some((v) => String(v || '') === String(professorDisplay.id));
      };

      // Subscribe to reviews changes
      if (client.channel) {
        const revChannel = client.channel(`rev:${professorDisplay.id}`);
        revChannel.on('postgres_changes', { event: '*', schema: 'public', table: reviewsTable }, (payload) => {
          const row = payload.record || payload.new || payload.old || payload;
          if (rowBelongsToProfessor(row)) renderReviews();
        });
        await revChannel.subscribe();
        window._profReviewsUnsub = async () => revChannel.unsubscribe();
      } else if (client.from) {
        const sub = client.from(reviewsTable).on('*', (payload) => {
          const row = payload.new || payload.old || payload.record || payload;
          if (rowBelongsToProfessor(row)) renderReviews();
        }).subscribe();
        window._profReviewsUnsub = async () => { try { if (sub.unsubscribe) await sub.unsubscribe(); else if (client.removeSubscription) await client.removeSubscription(sub); } catch(e){} };
      }

      // Subscribe to courses changes (to refresh subject list / counts)
      const rowBelongsToProfessorCourses = (row) => {
        if (!row) return false;
        const idCandidates = [row.profesor_id, row.professor_id, row.instructor_id, row.owner_id];
        return idCandidates.some((v) => String(v || '') === String(professorDisplay.id));
      };

      if (client.channel) {
        const courseChannel = client.channel(`courses:${professorDisplay.id}`);
        courseChannel.on('postgres_changes', { event: '*', schema: 'public', table: coursesTable }, (payload) => {
          const row = payload.record || payload.new || payload.old || payload;
          if (rowBelongsToProfessorCourses(row)) {
            // Re-fetch professor data to update subjects/courses if available
            (async () => {
              if (typeof getProfessors === 'function') {
                const list = await getProfessors();
                if (list.success) {
                  const found = (list.data || []).find(r => String(r.id || r.nume_complet || '') === String(professorDisplay.id));
                  if (found) {
                    currentProfessor = found;
                    const updated = getProfessorDisplay();
                    subjectsEl.textContent = updated.subjects || '-';
                  }
                }
              }
            })();
          }
        });
        await courseChannel.subscribe();
        window._profCoursesUnsub = async () => courseChannel.unsubscribe();
      } else if (client.from) {
        const subC = client.from(coursesTable).on('*', (payload) => {
          const row = payload.new || payload.old || payload.record || payload;
          if (rowBelongsToProfessorCourses(row)) {
            (async () => {
              if (typeof getProfessors === 'function') {
                const list = await getProfessors();
                if (list.success) {
                  const found = (list.data || []).find(r => String(r.id || r.nume_complet || '') === String(professorDisplay.id));
                  if (found) {
                    currentProfessor = found;
                    const updated = getProfessorDisplay();
                    subjectsEl.textContent = updated.subjects || '-';
                  }
                }
              }
            })();
          }
        }).subscribe();
        window._profCoursesUnsub = async () => { try { if (subC.unsubscribe) await subC.unsubscribe(); else if (client.removeSubscription) await client.removeSubscription(subC); } catch(e){} };
      }
    } catch (e) {
      console.warn('Realtime subscriptions not initialized:', e.message || e);
    }

    if (openReviewModalBtn) {
      openReviewModalBtn.addEventListener('click', openModal);
    }

    // Ensure 'Vezi recenziile' anchor scrolls to the reviews list with header offset
    try {
      const seeReviewsLink = document.querySelector('a[href="#reviewsList"]');
      if (seeReviewsLink) {
        seeReviewsLink.addEventListener('click', (ev) => {
          ev.preventDefault();
          const target = document.getElementById('reviewsList');
          if (!target) return;
          const headerHeight = document.querySelector('header')?.offsetHeight || 0;
          const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerHeight - 8);
          window.scrollTo({ top, behavior: 'smooth' });
          try { window.history.pushState(null, '', '#reviewsList'); } catch (e) {}
        });
      }
    } catch (e) {
      // noop
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

      if (!professorDisplay.id) {
        showNotification('Profesor invalid. Revino in lista profesori.');
        return;
      }

      const rating = Number(document.getElementById('reviewRating').value);
      const comment = document.getElementById('reviewComment').value.trim();

      if (!rating || rating < 1 || rating > 5 || !comment) {
        showNotification('Completează corect rating-ul și comentariul.');
        return;
      }

      const saveResult = await saveProfessorReview(professorDisplay.id, rating, comment, {
        professorName: professorDisplay.fullName,
        professorSubject: professorDisplay.subjects,
        professorEmail: professorDisplay.email
      });
      if (!saveResult.success) {
        showNotification(saveResult.error || 'Nu s-a putut salva recenzia.');
        return;
      }

      reviewForm.reset();
      showNotification('Recenzie adăugată cu succes.');
      await renderReviews();
      closeModal();
    });
  } catch (error) {
    console.error('Profile page error:', error);
    showNotification('Nu s-au putut încărca datele profesorului.');
  }
}

document.addEventListener('DOMContentLoaded', loadProfessorProfile);
