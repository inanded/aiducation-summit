(() => {
  'use strict';

  const EVENT_DATE = '2026-03-14';
  const tabs = document.querySelectorAll('.tab-bar button');
  const sections = document.querySelectorAll('.section');

  // --- Tab navigation ---
  function activateTab(id) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === id));
    sections.forEach(s => s.classList.toggle('active', s.id === id));
  }

  tabs.forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
  });

  // --- Accordion: close other details in same group ---
  document.querySelectorAll('.session-card, .speaker-card').forEach(card => {
    card.addEventListener('toggle', function () {
      if (!this.open) return;
      const siblings = this.parentElement.querySelectorAll('details');
      siblings.forEach(s => { if (s !== this && s.open) s.open = false; });
    });
  });

  // --- "Now" indicator (only on event day) ---
  function checkNow() {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    if (today !== EVENT_DATE) return;

    const mins = now.getHours() * 60 + now.getMinutes();
    const slots = document.querySelectorAll('.time-slot-header');

    slots.forEach(slot => {
      slot.classList.remove('now-active');
      const existing = slot.querySelector('.now-badge');
      if (existing) existing.remove();
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
      badge.textContent = 'Now';
      current.appendChild(badge);
      current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  checkNow();
  setInterval(checkNow, 60000);
})();
