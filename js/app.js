// Render content from data.js into the page, then wire up interactions.
// No frameworks, no build step. Plain DOM.

(function () {
  'use strict';

  // ---------- tiny DOM helpers ----------
  const $ = (sel) => document.querySelector(sel);
  const el = (tag, attrs = {}, children = []) => {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (v === null || v === undefined) return;
      if (k === 'class') node.className = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') {
        node.addEventListener(k.slice(2).toLowerCase(), v);
      } else {
        node.setAttribute(k, v);
      }
    });
    (Array.isArray(children) ? children : [children])
      .filter((c) => c !== null && c !== undefined && c !== false)
      .forEach((c) => node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return node;
  };

  // ---------- date helpers ----------
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const parseYM = (s) => {
    if (s === 'present') return new Date(); // now
    const [y, m] = s.split('-').map(Number);
    return new Date(y, (m || 1) - 1, 1);
  };
  const fmtYM = (s) => {
    if (s === 'present') return 'Present';
    const d = parseYM(s);
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  };

  // ---------- HEADER & HERO ----------
  function renderHeader() {
    $('#hdr-name').textContent = profile.name;
    $('#hdr-title').textContent = profile.title;
  }

  function renderHero() {
    $('#hero-name').textContent = profile.name;
    $('#hero-title').textContent = profile.title;

    // Contact list. Email + phone are assembled inside the click handler
    // only — the literal strings never appear in the rendered HTML until
    // a real user clicks "Show".
    const buildEmail = () => `${profile.emailUser}@${profile.emailDomain}`;
    const buildPhone = () => profile.phoneParts.join(' ');

    const contact = $('#hero-contact');
    contact.appendChild(
      el('li', {}, [
        el('span', { class: 'contact-icon', 'aria-hidden': 'true' }, '📍'),
        document.createTextNode(profile.location),
      ])
    );
    contact.appendChild(
      el('li', {}, [
        el('span', { class: 'contact-icon', 'aria-hidden': 'true' }, '✉'),
        el('span', { class: 'email-revealed', style: 'display:none' }),
        el(
          'button',
          {
            type: 'button',
            class: 'email-reveal-btn',
            onclick: (e) => {
              const btn = e.currentTarget;
              const span = btn.parentElement.querySelector('.email-revealed');
              if (span.childNodes.length === 0) {
                const addr = buildEmail();
                const a = document.createElement('a');
                a.href = 'mailto:' + addr;
                a.textContent = addr;
                span.appendChild(a);
              }
              span.style.display = 'inline';
              btn.style.display = 'none';
            },
          },
          'Show email'
        ),
      ])
    );
    contact.appendChild(
      el('li', {}, [
        el('span', { class: 'contact-icon', 'aria-hidden': 'true' }, '📞'),
        el('span', { class: 'phone-revealed', style: 'display:none' }),
        el(
          'button',
          {
            type: 'button',
            class: 'phone-reveal-btn',
            onclick: (e) => {
              const btn = e.currentTarget;
              const span = btn.parentElement.querySelector('.phone-revealed');
              if (!span.textContent) span.textContent = buildPhone();
              span.style.display = 'inline';
              btn.style.display = 'none';
            },
          },
          'Show phone'
        ),
      ])
    );
    contact.appendChild(
      el('li', {}, [
        el('span', { class: 'contact-icon', 'aria-hidden': 'true' }, '🔗'),
        el('a', { href: profile.linkedin, target: '_blank', rel: 'noopener noreferrer' }, 'LinkedIn'),
      ])
    );

    const stats = $('#hero-stats');
    heroStats.forEach((statement) => {
      stats.appendChild(
        el('li', { class: 'stat' }, [
          el('span', { class: 'stat__icon', 'aria-hidden': 'true' }, '✓'),
          el('span', { class: 'stat__text' }, statement),
        ])
      );
    });
  }

  function renderAbout() {
    $('#about-body').textContent = profile.about;
  }

  // ---------- TIMELINE (horizontal Gantt) ----------
  function renderTimeline() {
    const wrap = $('#timeline');
    wrap.innerHTML = '';
    wrap.appendChild(
      el(
        'p',
        { class: 'timeline__caption' },
        [
          'Continuous tenure at ',
          el('strong', {}, 'Accenture'),
          ' since Feb 2012. Click a segment to jump to that role.',
        ]
      )
    );

    // Reverse to chronological (oldest first) for the bar
    const chrono = [...accentureRoles].reverse();
    const startMs = parseYM(chrono[0].start).getTime();
    const endMs = parseYM('present').getTime();
    const totalMs = endMs - startMs;

    const bar = el('div', { class: 'timeline__bar', role: 'list' });
    chrono.forEach((r) => {
      const segStart = parseYM(r.start).getTime();
      const segEnd = (r.end === 'present' ? endMs : parseYM(r.end).getTime());
      const left = ((segStart - startMs) / totalMs) * 100;
      const width = ((segEnd - segStart) / totalMs) * 100;
      const seg = el(
        'button',
        {
          class: 'timeline__segment',
          type: 'button',
          role: 'listitem',
          'aria-label': `${r.client} — ${r.role} (${fmtYM(r.start)} to ${fmtYM(r.end)})`,
          style: `left:${left}%; width:${width}%; background:${r.color};`,
          'data-role-id': r.id,
        },
        [
          el('span', { class: 'timeline__segment-client' }, r.client),
          el('span', { class: 'timeline__segment-role' }, shortRoleLabel(r)),
        ]
      );
      seg.addEventListener('click', () => focusRole(r.id));
      bar.appendChild(seg);
    });
    wrap.appendChild(bar);

    // Year labels — render every 2 years
    const startY = new Date(startMs).getFullYear();
    const endY = new Date(endMs).getFullYear();
    const years = el('div', { class: 'timeline__years' });
    for (let y = startY; y <= endY; y += 2) {
      years.appendChild(el('span', {}, String(y)));
    }
    if ((endY - startY) % 2 !== 0) years.appendChild(el('span', {}, 'Now'));
    wrap.appendChild(years);
  }

  function shortRoleLabel(r) {
    // For older roles where `role` is a "·"-separated multi-role list,
    // the program name reads better in a narrow timeline segment.
    if (r.role.includes(' · ')) return r.program;
    return r.role;
  }

  // ---------- ROLES (expandable cards) ----------
  function renderRoles() {
    const list = $('#roles');
    list.innerHTML = '';
    // newest first
    accentureRoles.forEach((r, idx) => {
      list.appendChild(roleCard(r, idx === 0));
    });
  }

  function roleCard(r, openByDefault) {
    const card = el('details', {
      class: 'role-card',
      id: `role-${r.id}`,
      style: `border-left-color:${r.color};`,
    });
    if (openByDefault) card.setAttribute('open', '');

    // Header layout:
    //   Row 1: bold role title (+ chevron)            dates (right)
    //   Row 2: italic program  ·  [Client name] Client (in role colour)
    //   Row 3: one-line summary
    const header = el('summary', { class: 'role-card__header' });
    header.appendChild(
      el('div', { class: 'role-card__title-row' }, [
        el('h3', { class: 'role-card__title' }, [
          document.createTextNode(r.role),
          el('span', { class: 'role-card__chevron', 'aria-hidden': 'true' }, '▶'),
        ]),
        el('span', { class: 'role-card__dates' }, `${fmtYM(r.start)} — ${fmtYM(r.end)}`),
      ])
    );
    header.appendChild(
      el('div', { class: 'role-card__sub' }, [
        el('span', { class: 'role-card__program' }, r.program),
        el('span', { class: 'role-card__sep' }, ' · '),
        el('span', { class: 'role-card__client', style: `color:${r.color};` }, r.client + ' Client'),
      ])
    );
    header.appendChild(el('p', { class: 'role-card__summary' }, r.summary));
    card.appendChild(header);

    // Body shows just the key achievements — Team/Client meta chips and
    // the Scope and Tech sections were trimmed for readability. The
    // corresponding fields (teamSize, keyWork, tech) remain in data.js
    // in case we want to surface them again later.
    const body = el('div', { class: 'role-card__body' });
    if (r.highlights && r.highlights.length) {
      body.appendChild(el('div', { class: 'role-card__subtitle' }, 'Key achievements'));
      body.appendChild(
        el('ul', { class: 'role-card__list' }, r.highlights.map((h) => el('li', {}, h)))
      );
    }
    card.appendChild(body);
    return card;
  }

  function focusRole(id) {
    const card = document.getElementById(`role-${id}`);
    if (!card) return;
    card.setAttribute('open', '');
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    card.classList.add('is-focused');
    setTimeout(() => card.classList.remove('is-focused'), 1500);
  }

  // ---------- EARLIER ROLES ----------
  function renderEarlierRoles() {
    const ul = $('#earlier-roles-list');
    earlierRoles.forEach((r) => {
      ul.appendChild(
        el('li', {}, [
          el('span', {}, r.role),
          el('span', {}, r.period),
        ])
      );
    });
  }

  // ---------- SKILLS ----------
  function renderSkills() {
    const grid = $('#skills-grid');
    Object.values(skills).forEach((g) => {
      const box = el('div', { class: 'skill-group' }, [el('h3', {}, g.title)]);

      if (Array.isArray(g.groups)) {
        // Grouped by level — render a small sub-heading + chip row per group.
        g.groups.forEach((sub) => {
          box.appendChild(el('p', { class: 'skill-group__level' }, sub.level));
          box.appendChild(
            el('ul', { class: 'skill-group__chips' }, sub.items.map((i) => el('li', {}, i)))
          );
        });
      } else {
        // Flat list — single chip row.
        box.appendChild(
          el('ul', { class: 'skill-group__chips' }, g.items.map((i) => el('li', {}, i)))
        );
      }
      grid.appendChild(box);
    });

    const soft = $('#soft-skills');
    softSkills.forEach((s) => {
      soft.appendChild(
        el('div', { class: 'soft-skill' }, [
          el('h4', {}, s.title),
          el('p', {}, s.body),
        ])
      );
    });
  }

  // ---------- CERTIFICATIONS ----------
  function renderCerts() {
    const list = $('#certs');
    certifications.forEach((c) => {
      const name = c.url
        ? el('a', { href: c.url, target: '_blank', rel: 'noopener noreferrer' }, c.name)
        : document.createTextNode(c.name);
      list.appendChild(
        el('li', { class: 'cert' }, [
          el('span', { class: 'cert__name' }, [name]),
          el('span', { class: 'cert__date' }, c.date),
        ])
      );
    });
  }

  // ---------- EDUCATION ----------
  function renderEducation() {
    const list = $('#education-list');
    education.forEach((e) => {
      list.appendChild(
        el('li', { class: 'edu-item' }, [
          el('div', { class: 'edu-item__top' }, [
            el('span', { class: 'edu-item__inst' }, e.institution),
            el('span', { class: 'edu-item__year' }, e.year),
          ]),
          el('p', { class: 'edu-item__qual' }, e.qualification),
          e.detail ? el('p', { class: 'edu-item__detail' }, e.detail) : null,
        ])
      );
    });
  }

  // ---------- EXTRAS ----------
  function renderExtras() {
    const langs = $('#languages');
    languages.forEach((l) => {
      langs.appendChild(
        el('li', {}, [
          el('span', {}, l.name),
          el('span', {}, l.level),
        ])
      );
    });

    const vols = $('#volunteer');
    volunteerWork.forEach((v) => {
      vols.appendChild(
        el('li', {}, [
          el('strong', {}, v.title),
          document.createTextNode(v.body),
        ])
      );
    });

    const ints = $('#interests');
    interests.forEach((i) => ints.appendChild(el('li', {}, i)));
  }

  // ---------- THEME TOGGLE ----------
  function setupTheme() {
    const stored = localStorage.getItem('cv-theme');
    if (stored) document.documentElement.setAttribute('data-theme', stored);

    $('#theme-toggle').addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('cv-theme', next);
    });
  }

  // ---------- PRINT HANDLER ----------
  // No on-page Print button — users save a richer .docx via the Download
  // CV button. But Ctrl+P still works, so reveal contact details first
  // so the exported PDF includes them.
  function setupPrint() {
    window.addEventListener('beforeprint', () => {
      document.querySelectorAll('.email-reveal-btn, .phone-reveal-btn').forEach((btn) => btn.click());
    });
  }

  // ---------- DOWNLOAD .docx BUTTON ----------
  function setupDownload() {
    const btn = $('#download-cv-btn');
    if (!btn) return;
    const original = btn.textContent;
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = 'Generating…';
      try {
        await window.exportCVToDocx();
        btn.textContent = '✓ Downloaded';
      } catch (e) {
        console.error('docx export failed:', e);
        btn.textContent = 'Failed';
      } finally {
        setTimeout(() => {
          btn.disabled = false;
          btn.textContent = original;
        }, 1500);
      }
    });
  }

  // ---------- NAV ACTIVE-SECTION TRACKING ----------
  function setupNav() {
    const links = document.querySelectorAll('.site-nav a');
    const sections = Array.from(links).map((a) => document.querySelector(a.getAttribute('href')));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === `#${e.target.id}`));
          }
        });
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );
    sections.forEach((s) => s && io.observe(s));
  }

  // ---------- BOOT ----------
  document.addEventListener('DOMContentLoaded', () => {
    renderHeader();
    renderHero();
    renderAbout();
    renderTimeline();
    renderRoles();
    renderEarlierRoles();
    renderSkills();
    renderCerts();
    renderEducation();
    renderExtras();
    setupTheme();
    setupPrint();
    setupDownload();
    setupNav();
  });
})();
