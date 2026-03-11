(() => {
  'use strict';

  const EVENT_DATE = '2026-03-14';

  // --- Elements ---
  const tabs = document.querySelectorAll('.tab-bar button');
  const views = document.querySelectorAll('.view');
  const speakerPage = document.getElementById('speaker-page');
  const tabBar = document.querySelector('.tab-bar');

  // --- State ---
  let activeTrack = 'all';

  // ============================================================
  // Tab Navigation
  // ============================================================
  function activateTab(id, pushState = true) {
    // Hide speaker page if showing
    speakerPage.classList.remove('active');
    tabBar.style.display = '';

    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === id));
    views.forEach(v => v.classList.toggle('active', v.id === id));

    if (pushState) history.pushState({ tab: id }, '', '#' + id);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  tabs.forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
  });

  // ============================================================
  // Speaker Detail Pages
  // ============================================================
  const speakerData = {};

  // Build speaker data from DOM
  document.querySelectorAll('.speaker-card').forEach(card => {
    const slug = card.dataset.slug;
    speakerData[slug] = {
      name: card.querySelector('.speaker-name').textContent,
      affiliation: card.querySelector('.speaker-affiliation').textContent,
      photo: card.querySelector('.speaker-photo').src,
      bio: card.dataset.bio,
      sessions: JSON.parse(card.dataset.sessions || '[]')
    };
  });

  function showSpeaker(slug, pushState = true) {
    const sp = speakerData[slug];
    if (!sp) return;

    // Hide tabs and views
    views.forEach(v => v.classList.remove('active'));
    tabBar.style.display = 'none';

    // Build speaker page content
    const sessionsHtml = sp.sessions.map(s => `
      <div class="sp-session-item">
        <div class="sp-session-time">${s.time}</div>
        <div class="sp-session-info">
          <div class="sp-session-name">${s.title}</div>
          <div class="sp-session-room">${s.room}</div>
        </div>
        <span class="track-badge ${s.track}">${s.trackLabel}</span>
      </div>
    `).join('');

    speakerPage.innerHTML = `
      <button class="sp-back" onclick="window.history.back()" aria-label="Back to speakers">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
        Speakers
      </button>
      <div class="sp-hero">
        <img src="${sp.photo}" alt="${sp.name}" loading="lazy">
        <h2>${sp.name}</h2>
        <div class="sp-affiliation">${sp.affiliation}</div>
      </div>
      <div class="sp-bio">${sp.bio}</div>
      ${sp.sessions.length ? `<div class="sp-sessions-title">Sessions</div>${sessionsHtml}` : ''}
    `;

    speakerPage.classList.add('active');
    if (pushState) history.pushState({ speaker: slug }, '', '#speaker/' + slug);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // Delegate clicks on speaker links
  document.addEventListener('click', e => {
    const link = e.target.closest('[data-speaker]');
    if (link) {
      e.preventDefault();
      showSpeaker(link.dataset.speaker);
    }
  });

  // ============================================================
  // Track Filters
  // ============================================================
  document.querySelectorAll('.track-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      const track = btn.dataset.track;

      if (track === activeTrack) {
        activeTrack = 'all';
      } else {
        activeTrack = track;
      }

      document.querySelectorAll('.track-filter').forEach(b => {
        b.classList.toggle('active', b.dataset.track === activeTrack);
      });

      document.querySelectorAll('.session-card').forEach(card => {
        if (activeTrack === 'all') {
          card.classList.remove('track-hidden');
        } else {
          card.classList.toggle('track-hidden', card.dataset.track !== activeTrack);
        }
      });
    });
  });

  // ============================================================
  // Accordion: close others when one opens
  // ============================================================
  document.querySelectorAll('details.session-card').forEach(card => {
    card.addEventListener('toggle', function () {
      if (!this.open) return;
      const parent = this.closest('.view');
      if (parent) {
        parent.querySelectorAll('details.session-card[open]').forEach(s => {
          if (s !== this) s.open = false;
        });
      }
    });
  });

  // ============================================================
  // "Now" Indicator (event day only)
  // ============================================================
  function checkNow() {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    if (today !== EVENT_DATE) return;

    const mins = now.getHours() * 60 + now.getMinutes();
    const slots = document.querySelectorAll('.time-slot-header');

    slots.forEach(slot => {
      slot.classList.remove('now-active');
      const old = slot.querySelector('.now-badge');
      if (old) old.remove();
    });

    let current = null;
    slots.forEach(slot => {
      const start = parseInt(slot.dataset.start, 10);
      const end = parseInt(slot.dataset.end, 10);
      if (mins >= start && mins < end) current = slot;
    });

    if (current) {
      current.classList.add('now-active');
      const badge = document.createElement('span');
      badge.className = 'now-badge';
      badge.innerHTML = '<span class="now-dot"></span> Now';
      current.appendChild(badge);
      current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  checkNow();
  setInterval(checkNow, 60000);

  // ============================================================
  // Hash-based Routing
  // ============================================================
  function handleRoute() {
    const hash = location.hash.slice(1);
    if (hash.startsWith('speaker/')) {
      showSpeaker(hash.replace('speaker/', ''), false);
    } else if (['schedule', 'speakers', 'info'].includes(hash)) {
      activateTab(hash, false);
    } else {
      activateTab('schedule', false);
    }
  }

  window.addEventListener('popstate', handleRoute);
  handleRoute();
})();
