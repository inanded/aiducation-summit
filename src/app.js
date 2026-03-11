(() => {
  'use strict';

  const EVENT_DATE = '2026-03-14';

  // ============================================================
  // Particle Network Canvas (Hero)
  // ============================================================
  const canvas = document.getElementById('hero-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let w, h, dpr;
    const COUNT = 60;
    const MAX_DIST = 120;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.parentElement.offsetWidth;
      h = canvas.parentElement.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function init() {
      resize();
      particles = [];
      for (let i = 0; i < COUNT; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - .5) * .35,
          vy: (Math.random() - .5) * .35,
          r: Math.random() * 1.8 + .6
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      // Move & draw particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100,181,246,.5)';
        ctx.fill();
      }

      // Draw connections
      ctx.strokeStyle = 'rgba(100,181,246,.12)';
      ctx.lineWidth = .6;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            ctx.globalAlpha = 1 - dist / MAX_DIST;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      requestAnimationFrame(draw);
    }

    init();
    draw();
    window.addEventListener('resize', resize);
  }

  // ============================================================
  // Scroll Reveal
  // ============================================================
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: .08, rootMargin: '0px 0px -40px 0px' });

  function observeReveals() {
    document.querySelectorAll('[data-reveal]:not(.revealed)').forEach(el => {
      revealObserver.observe(el);
    });
  }

  observeReveals();

  // ============================================================
  // Elements
  // ============================================================
  const tabs = document.querySelectorAll('.tab-bar button');
  const views = document.querySelectorAll('.view');
  const speakerPage = document.getElementById('speaker-page');
  const tabBar = document.querySelector('.tab-bar');

  // ============================================================
  // State
  // ============================================================
  let activeTrack = 'all';
  let showFavsOnly = false;
  const favs = new Set(JSON.parse(localStorage.getItem('aiducation-favs') || '[]'));

  function saveFavs() {
    localStorage.setItem('aiducation-favs', JSON.stringify([...favs]));
  }

  // ============================================================
  // Tab Navigation
  // ============================================================
  function activateTab(id, pushState = true) {
    speakerPage.classList.remove('active');
    tabBar.style.display = '';

    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === id));
    views.forEach(v => v.classList.toggle('active', v.id === id));

    if (pushState) history.pushState({ tab: id }, '', '#' + id);
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Re-observe reveals for new view
    requestAnimationFrame(observeReveals);
  }

  tabs.forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
  });

  // ============================================================
  // Speaker Detail Pages
  // ============================================================
  const speakerData = {};

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

    views.forEach(v => v.classList.remove('active'));
    tabBar.style.display = 'none';

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
      <button class="sp-back" aria-label="Back to speakers">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
        Speakers
      </button>
      <div class="sp-hero">
        <img src="${sp.photo}" alt="${sp.name}">
        <h2>${sp.name}</h2>
        <div class="sp-affiliation">${sp.affiliation}</div>
      </div>
      <div class="sp-bio">${sp.bio}</div>
      ${sp.sessions.length ? `<div class="sp-sessions-title">Sessions</div>${sessionsHtml}` : ''}
    `;

    speakerPage.querySelector('.sp-back').addEventListener('click', () => window.history.back());

    speakerPage.classList.add('active');
    if (pushState) history.pushState({ speaker: slug }, '', '#speaker/' + slug);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  document.addEventListener('click', e => {
    const link = e.target.closest('[data-speaker]');
    if (link) {
      e.preventDefault();
      showSpeaker(link.dataset.speaker);
    }
  });

  // ============================================================
  // Custom Accordion (replaces <details>)
  // ============================================================
  document.querySelectorAll('.session-card .card-header').forEach(header => {
    header.addEventListener('click', () => {
      const card = header.parentElement;
      const body = card.querySelector('.session-body');
      const isOpen = card.classList.contains('expanded');

      // Close all siblings
      const parent = card.parentElement;
      parent.querySelectorAll('.session-card.expanded').forEach(open => {
        if (open !== card) {
          open.classList.remove('expanded');
          open.querySelector('.session-body').style.maxHeight = '0';
        }
      });

      if (isOpen) {
        card.classList.remove('expanded');
        body.style.maxHeight = '0';
      } else {
        card.classList.add('expanded');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });

  // Keynote cards
  document.querySelectorAll('.keynote-card').forEach(card => {
    card.addEventListener('click', () => {
      const isOpen = card.classList.contains('expanded');
      document.querySelectorAll('.keynote-card.expanded').forEach(c => c.classList.remove('expanded'));
      if (!isOpen) card.classList.add('expanded');
    });
  });

  // ============================================================
  // Search
  // ============================================================
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase().trim();

      document.querySelectorAll('.session-card, .keynote-card').forEach(card => {
        if (!q) {
          card.classList.remove('search-hidden');
          return;
        }
        const text = card.textContent.toLowerCase();
        card.classList.toggle('search-hidden', !text.includes(q));
      });
    });
  }

  // ============================================================
  // Track Filters
  // ============================================================
  document.querySelectorAll('.track-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      const track = btn.dataset.track;
      activeTrack = (track === activeTrack) ? 'all' : track;

      document.querySelectorAll('.track-filter').forEach(b => {
        b.classList.toggle('active', b.dataset.track === activeTrack);
      });

      document.querySelectorAll('.session-card').forEach(card => {
        card.classList.toggle('track-hidden', activeTrack !== 'all' && card.dataset.track !== activeTrack);
      });
    });
  });

  // ============================================================
  // Favourites
  // ============================================================
  function updateFavButtons() {
    document.querySelectorAll('.fav-btn').forEach(btn => {
      const id = btn.dataset.favId;
      btn.classList.toggle('faved', favs.has(id));
      const svg = btn.querySelector('svg');
      if (favs.has(id)) {
        svg.innerHTML = '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor" stroke="currentColor" stroke-width="1.5"/>';
      } else {
        svg.innerHTML = '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="none" stroke="currentColor" stroke-width="1.5"/>';
      }
    });
  }

  document.addEventListener('click', e => {
    const btn = e.target.closest('.fav-btn');
    if (!btn) return;
    e.stopPropagation();
    const id = btn.dataset.favId;
    if (favs.has(id)) favs.delete(id); else favs.add(id);
    saveFavs();
    updateFavButtons();
    applyFavFilter();
  });

  // Fav filter toggle
  const favFilterBtn = document.getElementById('fav-filter-btn');
  if (favFilterBtn) {
    favFilterBtn.addEventListener('click', () => {
      showFavsOnly = !showFavsOnly;
      favFilterBtn.classList.toggle('active', showFavsOnly);
      applyFavFilter();
    });
  }

  function applyFavFilter() {
    if (!showFavsOnly) {
      document.querySelectorAll('.session-card, .keynote-card').forEach(c => c.classList.remove('fav-hidden'));
      return;
    }
    document.querySelectorAll('.session-card').forEach(card => {
      const btn = card.querySelector('.fav-btn');
      card.classList.toggle('fav-hidden', btn && !favs.has(btn.dataset.favId));
    });
    document.querySelectorAll('.keynote-card').forEach(card => {
      const btn = card.querySelector('.fav-btn');
      card.classList.toggle('fav-hidden', btn && !favs.has(btn.dataset.favId));
    });
  }

  // Init fav buttons on load
  updateFavButtons();

  // ============================================================
  // "Now" Indicator
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
  // Venue Map
  // ============================================================
  const roomSessions = {
    'Assembly Hall': [
      { time: '09:30', title: 'Innovation with Integrity (Keynote)', speaker: 'Professor Rose Luckin', track: 'keynote', trackLabel: 'Keynote' },
      { time: '15:45', title: 'AI as a Catalyst for Education Reform (Keynote)', speaker: 'Al Kingsley MBE', track: 'keynote', trackLabel: 'Keynote' }
    ],
    'Social Sciences 2': [
      { time: '10:30', title: 'AI for Operational Efficiency', speaker: 'Chris Loveday', track: 'strategy', trackLabel: 'Strategy' },
      { time: '11:45', title: '90-Day AI Action Plan', speaker: 'Luke Harris', track: 'strategy', trackLabel: 'Strategy' },
      { time: '14:00', title: 'AI for Operational Efficiency', speaker: 'Chris Loveday', track: 'strategy', trackLabel: 'Strategy' },
      { time: '14:45', title: '90-Day AI Action Plan', speaker: 'Luke Harris', track: 'strategy', trackLabel: 'Strategy' }
    ],
    'Social Sciences 3': [
      { time: '10:30', title: 'Thoughtful Use of AI', speaker: 'Amelia King', track: 'pedagogy', trackLabel: 'Pedagogy' },
      { time: '11:45', title: 'Creativity in the Age of AI', speaker: 'Trudi Barrow', track: 'creativity', trackLabel: 'Creativity' },
      { time: '14:00', title: 'Thoughtful Use of AI', speaker: 'Amelia King', track: 'pedagogy', trackLabel: 'Pedagogy' },
      { time: '14:45', title: 'Creativity in the Age of AI', speaker: 'Trudi Barrow', track: 'creativity', trackLabel: 'Creativity' }
    ],
    'Humanities 4': [
      { time: '10:30', title: 'Critical Thinking with AI', speaker: 'Ben Whitaker', track: 'strategy', trackLabel: 'Strategy' },
      { time: '11:45', title: 'Smarter Tools, Wider Doors', speaker: 'Ben Whitaker', track: 'safeguarding', trackLabel: 'Safeguarding' },
      { time: '14:00', title: 'Critical Thinking with AI', speaker: 'Ben Whitaker', track: 'strategy', trackLabel: 'Strategy' },
      { time: '14:45', title: 'Inclusion by Design', speaker: 'David Curran', track: 'safeguarding', trackLabel: 'Safeguarding' }
    ],
    'Math 4': [
      { time: '10:30', title: 'Policy to Classroom', speaker: 'Daire Maria Ni Uanachain', track: 'pedagogy', trackLabel: 'Pedagogy' },
      { time: '11:45', title: 'Policy to Classroom', speaker: 'Daire Maria Ni Uanachain', track: 'pedagogy', trackLabel: 'Pedagogy' },
      { time: '14:00', title: 'From Strategy to Classroom', speaker: 'Professor Rose Luckin', track: 'strategy', trackLabel: 'Strategy' },
      { time: '14:45', title: 'Policy to Classroom', speaker: 'Daire Maria Ni Uanachain', track: 'pedagogy', trackLabel: 'Pedagogy' }
    ],
    'Math 5': [
      { time: '10:30', title: 'AI \u2013 Safe into Safeguarding?', speaker: 'James Garnett & Emma Darcy', track: 'safeguarding', trackLabel: 'Safeguarding' },
      { time: '11:45', title: 'Education Data Spine', speaker: 'Matt Woodruff', track: 'strategy', trackLabel: 'Strategy' },
      { time: '14:00', title: 'AI \u2013 Safe into Safeguarding?', speaker: 'James Garnett & Emma Darcy', track: 'safeguarding', trackLabel: 'Safeguarding' },
      { time: '14:45', title: 'AI Governance & Ethics', speaker: 'Matt Woodruff', track: 'strategy', trackLabel: 'Strategy' }
    ],
    'Math 6': [
      { time: '11:45', title: 'AI for Education Optimisation', speaker: 'Thomas Akintan & Kevin Loi-Heng', track: 'strategy', trackLabel: 'Strategy' },
      { time: '14:00', title: 'The Archimedes Ecosystem', speaker: 'Ioannis Anapliotis', track: 'pedagogy', trackLabel: 'Pedagogy' },
      { time: '14:45', title: 'AI for Education Optimisation', speaker: 'Thomas Akintan & Kevin Loi-Heng', track: 'strategy', trackLabel: 'Strategy' }
    ],
    'IT Lab 01': [
      { time: '10:30', title: 'Responsible Chatbot Design', speaker: 'David Curran', track: 'safeguarding', trackLabel: 'Safeguarding' },
      { time: '11:45', title: 'Inclusion by Design', speaker: 'David Curran', track: 'safeguarding', trackLabel: 'Safeguarding' },
      { time: '14:00', title: 'Responsible Chatbot Design', speaker: 'David Curran', track: 'safeguarding', trackLabel: 'Safeguarding' }
    ],
    'IT Lab 02': [
      { time: '10:30', title: 'AI in a Primary Setting', speaker: 'Sacha van Straten', track: 'pedagogy', trackLabel: 'Pedagogy' },
      { time: '11:45', title: 'Canva Code', speaker: 'Aaron Patching', track: 'creativity', trackLabel: 'Creativity' },
      { time: '14:00', title: 'Canva Code', speaker: 'Aaron Patching', track: 'creativity', trackLabel: 'Creativity' },
      { time: '14:45', title: 'AI in a Primary Setting', speaker: 'Sacha van Straten', track: 'pedagogy', trackLabel: 'Pedagogy' }
    ]
  };

  const roomPanel = document.getElementById('room-panel');
  if (roomPanel) {
    const panelTitle = roomPanel.querySelector('.room-panel-title');
    const panelSessions = roomPanel.querySelector('.room-panel-sessions');
    const backdrop = roomPanel.querySelector('.room-panel-backdrop');

    function openRoomPanel(roomName) {
      const sessions = roomSessions[roomName];
      document.querySelectorAll('.map-room').forEach(r => r.classList.remove('room-selected'));
      document.querySelector(`.map-room[data-room="${roomName}"]`)?.classList.add('room-selected');

      panelTitle.textContent = roomName;
      if (!sessions || !sessions.length) {
        panelSessions.innerHTML = '<div class="rp-empty">No workshops in this room.</div>';
      } else {
        panelSessions.innerHTML = sessions.map(s => `
          <div class="rp-session">
            <div class="rp-time">${s.time}</div>
            <div class="rp-info">
              <div class="rp-title">${s.title}</div>
              <div class="rp-speaker">${s.speaker}</div>
            </div>
            <span class="track-badge ${s.track} rp-track-badge">${s.trackLabel}</span>
          </div>
        `).join('');
      }

      roomPanel.classList.add('open');
      roomPanel.setAttribute('aria-hidden', 'false');
    }

    function closeRoomPanel() {
      roomPanel.classList.remove('open');
      roomPanel.setAttribute('aria-hidden', 'true');
      document.querySelectorAll('.map-room').forEach(r => r.classList.remove('room-selected'));
    }

    document.querySelectorAll('.map-room').forEach(room => {
      const rect = room.querySelector('.room-rect');
      if (rect && (rect.classList.contains('room-active') || rect.classList.contains('room-keynote'))) {
        room.addEventListener('click', () => openRoomPanel(room.dataset.room));
      }
    });

    backdrop.addEventListener('click', closeRoomPanel);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && roomPanel.classList.contains('open')) closeRoomPanel();
    });
  }

  // ============================================================
  // Routing
  // ============================================================
  function handleRoute() {
    const hash = location.hash.slice(1);
    if (hash.startsWith('speaker/')) {
      showSpeaker(hash.replace('speaker/', ''), false);
    } else if (['schedule', 'map', 'speakers', 'info'].includes(hash)) {
      activateTab(hash, false);
    } else {
      activateTab('schedule', false);
    }
  }

  window.addEventListener('popstate', handleRoute);
  handleRoute();
})();
