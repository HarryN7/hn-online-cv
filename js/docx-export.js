// Browser-side .docx generator. Loaded by index.html alongside data.js + app.js
// but the actual docx library (~200KB) is fetched lazily on first click. Reads
// the same data.js content the page renders from, so the .docx is always in
// sync.
//
// Layout goals:
//   - Centred header: circular photo, name in brand blue, title in dark ink
//   - Decorative blue ornament instead of a heavy top band
//   - Credentials strip
//   - Prominent ACCENTURE block so role cards read as nested under it
//   - Mini-Gantt timeline as a coloured table (mirrors the website)
//   - Each role rendered as a 2-column table: thin coloured left strip
//     + content cell — giving the role a single continuous coloured bar
//     and a clean right-aligned date column.
//   - Aim: 2 pages, modern look.
//
// IMPORTANT — cell shading: use ShadingType.CLEAR (not SOLID). With SOLID,
// Word fills with the foreground colour (which is "auto" = black) and ignores
// the `fill` attribute, producing black boxes. CLEAR = no pattern, fill shows.

(function () {
  'use strict';

  // ---------- config ----------
  const DOCX_LIB = 'https://unpkg.com/docx@9.5.1/dist/index.umd.cjs';
  const PHOTO_URL = 'images/avatar-2024-circle.png';
  const HIGHLIGHTS_PER_ROLE = 3;

  // Brand colours (hex, no '#')
  const C_PRIMARY = '0076A7';
  const C_BRIGHT  = '0094A7';
  const C_DARK    = '003550';
  const C_INK     = '0B2233';
  const C_MUTED   = '5A7689';
  const C_ACCENT  = 'F2C80F';
  const C_TINT    = 'EEF6F9';
  const C_RULE    = 'D6E0E6';

  // Right tab stop position — close to the right edge of the printable area.
  // With A4 portrait + 0.6" L/R margins, printable width ~7.07" = ~10180 twips.
  // We subtract a small gutter so the date doesn't kiss the cell wall.
  const RIGHT_TAB = 9800;
  const RIGHT_TAB_INDENT = 9560; // tab stop inside an indented role cell

  // ---------- lazy-load library ----------
  let _libPromise;
  function loadDocx() {
    if (window.docx) return Promise.resolve(window.docx);
    if (_libPromise) return _libPromise;
    _libPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = DOCX_LIB;
      s.onload = () => (window.docx ? resolve(window.docx) : reject(new Error('docx loaded but global missing')));
      s.onerror = () => reject(new Error('Failed to load ' + DOCX_LIB));
      document.head.appendChild(s);
    });
    return _libPromise;
  }

  // ---------- photo loading ----------
  async function loadPhoto() {
    try {
      const r = await fetch(PHOTO_URL);
      if (!r.ok) throw new Error('photo not 200');
      return await r.arrayBuffer();
    } catch (e) {
      console.warn('Photo unavailable, exporting without it:', e);
      return null;
    }
  }

  // ---------- date helpers ----------
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function parseYM(s) {
    if (s === 'present') return new Date();
    const [y, m] = s.split('-').map(Number);
    return new Date(y, (m || 1) - 1, 1);
  }
  function fmtYM(s) {
    if (s === 'present') return 'Present';
    const d = parseYM(s);
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  function shortRoleLabel(r) {
    return r.role.includes(' · ') ? r.program : r.role;
  }

  const getEmail = () => `${profile.emailUser}@${profile.emailDomain}`;
  const getPhone = () => profile.phoneParts.join(' ');

  // ===============================================================
  // Document builder
  // ===============================================================
  function buildDocument(d, photoBytes) {
    const {
      Document, Paragraph, TextRun, ImageRun, BorderStyle, AlignmentType,
      Table, TableRow, TableCell, WidthType, ShadingType,
      Tab, TabStopType, TabStopPosition, convertInchesToTwip,
    } = d;

    const text = (t, opts = {}) => new TextRun({ text: t, font: 'Calibri', ...opts });
    const hex  = (c) => (c || C_PRIMARY).replace(/^#/, '');
    const NB = { style: BorderStyle.NONE, size: 0, color: 'auto' };
    const noBorders = { top: NB, bottom: NB, left: NB, right: NB,
                        insideHorizontal: NB, insideVertical: NB };
    const noCellBorders = { top: NB, bottom: NB, left: NB, right: NB };

    function centred(children, opts = {}) {
      return new Paragraph({ alignment: AlignmentType.CENTER, ...opts, children });
    }

    function sectionHeading(label) {
      return new Paragraph({
        spacing: { before: 240, after: 100 },
        border: { bottom: { color: C_PRIMARY, style: BorderStyle.SINGLE, size: 10, space: 4 } },
        children: [text(label.toUpperCase(), { bold: true, color: C_PRIMARY, size: 22, characterSpacing: 40 })],
      });
    }

    function ornament() {
      return centred(
        [text('◆  •  ◆', { color: C_BRIGHT, size: 16, characterSpacing: 80 })],
        { spacing: { before: 60, after: 100 } }
      );
    }

    // ---------- HEADER ----------
    const children = [];

    if (photoBytes) {
      children.push(centred(
        [new ImageRun({ data: photoBytes, transformation: { width: 90, height: 90 } })],
        { spacing: { before: 80, after: 80 } }
      ));
    }

    // Name: brand blue
    children.push(centred(
      [text(profile.name, { bold: true, size: 44, color: C_PRIMARY })],
      { spacing: { after: 30 } }
    ));

    // Title: dark
    children.push(centred(
      [text(profile.title.toUpperCase(), { bold: true, color: C_INK, size: 18, characterSpacing: 80 })],
      { spacing: { after: 100 } }
    ));

    // Contact line
    children.push(centred(
      [
        text(profile.location, { size: 18, color: C_MUTED }),
        text('   ·   ', { size: 18, color: C_MUTED }),
        text(getEmail(), { size: 18, color: C_MUTED }),
        text('   ·   ', { size: 18, color: C_MUTED }),
        text(getPhone(), { size: 18, color: C_MUTED }),
      ],
      { spacing: { after: 60 } }
    ));

    children.push(ornament());

    // Credentials — three items separated by middle dots, centred.
    const credRuns = [];
    heroStats.forEach((s, i) => {
      credRuns.push(text('✓ ', { color: C_ACCENT, bold: true, size: 18 }));
      credRuns.push(text(s, { size: 18, color: C_INK }));
      if (i < heroStats.length - 1) credRuns.push(text('       ', { size: 18 }));
    });
    children.push(centred(credRuns, { spacing: { after: 200 } }));

    // ---------- ABOUT (no heading) ----------
    children.push(new Paragraph({
      spacing: { after: 100 },
      alignment: AlignmentType.JUSTIFIED,
      children: [text(profile.about, { size: 20 })],
    }));

    // ---------- EXPERIENCE ----------
    children.push(sectionHeading('Experience'));

    // Accenture block — prominent typographic header (no shading table).
    // Big blue 'ACCENTURE' on left, dates right-aligned, italic subtitle below,
    // and a brand-coloured bottom border to anchor the block visually.
    children.push(new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB }],
      spacing: { before: 60, after: 20 },
      children: [
        text('ACCENTURE', { bold: true, size: 28, color: C_PRIMARY, characterSpacing: 60 }),
        new TextRun({ children: [new Tab()] }),
        text('Feb 2012 – Present', { bold: true, size: 20, color: C_INK }),
      ],
    }));
    children.push(new Paragraph({
      spacing: { after: 140 },
      border: { bottom: { color: C_PRIMARY, style: BorderStyle.SINGLE, size: 6, space: 4 } },
      children: [text('IT Consulting across multiple government clients', { italics: true, size: 18, color: C_MUTED })],
    }));

    // Timeline table (Gantt-style)
    children.push(buildTimelineTable(d));
    children.push(new Paragraph({ spacing: { after: 180 }, children: [] }));

    // Role blocks (each its own 2-col table for a continuous coloured bar)
    accentureRoles.forEach((r, i) => {
      children.push(buildRoleTable(d, r));
      if (i < accentureRoles.length - 1) {
        children.push(new Paragraph({ spacing: { after: 140 }, children: [] }));
      }
    });

    // ---------- SKILLS ----------
    children.push(sectionHeading('Skills'));
    children.push(...buildSkills(d));

    // ---------- CERTIFICATIONS ----------
    children.push(sectionHeading('Certifications'));
    certifications.forEach((c) => {
      children.push(new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB }],
        spacing: { after: 40 },
        children: [
          text('▪  ', { color: C_PRIMARY, bold: true, size: 18 }),
          text(c.name, { size: 18 }),
          new TextRun({ children: [new Tab()] }),
          text(c.date, { size: 16, color: C_MUTED }),
        ],
      }));
    });

    // ---------- EDUCATION ----------
    children.push(sectionHeading('Education'));
    education.forEach((e) => {
      children.push(new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB }],
        spacing: { before: 80, after: 20 },
        children: [
          text(e.institution, { bold: true, size: 20, color: C_INK }),
          new TextRun({ children: [new Tab()] }),
          text(e.year, { size: 18, color: C_MUTED }),
        ],
      }));
      children.push(new Paragraph({
        spacing: { after: 10 },
        children: [text(e.qualification, { size: 18 })],
      }));
      if (e.detail) {
        children.push(new Paragraph({
          spacing: { after: 60 },
          children: [text(e.detail, { size: 16, color: C_MUTED, italics: true })],
        }));
      }
    });

    // ---------- EXTRACURRICULAR ----------
    children.push(sectionHeading('Extracurricular'));
    children.push(new Paragraph({
      spacing: { after: 40 },
      children: [
        text('Languages: ', { bold: true, size: 18, color: C_MUTED }),
        text(languages.map((l) => `${l.name} (${l.level})`).join(' · '), { size: 18 }),
      ],
    }));
    children.push(new Paragraph({
      spacing: { after: 40 },
      children: [
        text('Interests: ', { bold: true, size: 18, color: C_MUTED }),
        text(interests.join(' · '), { size: 18 }),
      ],
    }));
    children.push(new Paragraph({
      spacing: { after: 40 },
      children: [
        text('Volunteer: ', { bold: true, size: 18, color: C_MUTED }),
        text(volunteerWork.map((v) => v.title).join(' · '), { size: 18 }),
      ],
    }));

    // ---------- assemble ----------
    return new Document({
      creator: profile.name,
      title: profile.name + ' — CV',
      description: 'Generated from harryn7.github.io/hn-online-cv',
      styles: {
        default: { document: { run: { font: 'Calibri', size: 20 } } },
      },
      sections: [{
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.6),
              right: convertInchesToTwip(0.6),
            },
          },
        },
        children,
      }],
    });
  }

  // ---------- Timeline table ----------
  function buildTimelineTable(d) {
    const { Paragraph, TextRun, AlignmentType, BorderStyle,
            Table, TableRow, TableCell, WidthType, ShadingType } = d;
    const text = (t, opts = {}) => new TextRun({ text: t, font: 'Calibri', ...opts });
    const hex  = (c) => (c || '0076A7').replace(/^#/, '');
    const NB = { style: BorderStyle.NONE, size: 0, color: 'auto' };
    const noBorders = { top: NB, bottom: NB, left: NB, right: NB,
                        insideHorizontal: NB, insideVertical: NB };
    const noCellBorders = { top: NB, bottom: NB, left: NB, right: NB };

    const chrono = [...accentureRoles].reverse();
    const startMs = parseYM(chrono[0].start).getTime();
    const endMs = parseYM('present').getTime();
    const total = endMs - startMs;

    const cells = chrono.map((r) => {
      const segStart = parseYM(r.start).getTime();
      const segEnd = (r.end === 'present' ? endMs : parseYM(r.end).getTime());
      return { role: r, pct: ((segEnd - segStart) / total) * 100 };
    });

    function colouredCell(c) {
      return new TableCell({
        width: { size: c.pct, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, color: 'auto', fill: hex(c.role.color) },
        margins: { top: 100, bottom: 100, left: 80, right: 80 },
        borders: noCellBorders,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 20 },
            children: [text(c.role.client, { bold: true, color: 'FFFFFF', size: 14 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [text(shortRoleLabel(c.role), { color: 'FFFFFF', size: 12 })],
          }),
        ],
      });
    }

    function yearCell(c) {
      const yr1 = parseYM(c.role.start).getFullYear();
      const yr2 = c.role.end === 'present' ? 'Now' : parseYM(c.role.end).getFullYear();
      return new TableCell({
        width: { size: c.pct, type: WidthType.PERCENTAGE },
        margins: { top: 60, bottom: 40, left: 80, right: 80 },
        borders: noCellBorders,
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [text(`${yr1}–${yr2}`, { size: 12, color: '5A7689' })],
        })],
      });
    }

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: noBorders,
      rows: [
        new TableRow({ children: cells.map(colouredCell) }),
        new TableRow({ children: cells.map(yearCell) }),
      ],
    });
  }

  // ---------- Role block as a 2-column table (continuous coloured left bar) ----------
  function buildRoleTable(d, r) {
    const { Paragraph, TextRun, BorderStyle,
            Table, TableRow, TableCell, WidthType, ShadingType,
            Tab, TabStopType } = d;
    const text = (t, opts = {}) => new TextRun({ text: t, font: 'Calibri', ...opts });
    const hex  = (c) => (c || '0076A7').replace(/^#/, '');
    const NB = { style: BorderStyle.NONE, size: 0, color: 'auto' };
    const noBorders = { top: NB, bottom: NB, left: NB, right: NB,
                        insideHorizontal: NB, insideVertical: NB };
    const noCellBorders = { top: NB, bottom: NB, left: NB, right: NB };

    // Tab stop for right-aligning the date within the content cell.
    // Cell takes ~97% of page width minus the 240 left margin, so:
    const TAB_IN_CELL = 9560;

    // Paragraphs inside the right cell.
    const contentParas = [];

    // Title row: bold role on left, date range right-aligned via tab.
    contentParas.push(new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: TAB_IN_CELL }],
      spacing: { before: 0, after: 30 },
      children: [
        text(r.role, { bold: true, size: 22, color: C_INK }),
        new TextRun({ children: [new Tab()] }),
        text(`${fmtYM(r.start)} – ${fmtYM(r.end)}`, { size: 18, color: C_MUTED }),
      ],
    }));

    // Sub line: italic program · coloured "Client".
    contentParas.push(new Paragraph({
      spacing: { after: 60 },
      children: [
        text(r.program, { italics: true, size: 18, color: C_MUTED }),
        text('  ·  ', { size: 18, color: C_MUTED }),
        text(r.client + ' Client', { bold: true, size: 18, color: hex(r.color) }),
      ],
    }));

    // Summary
    if (r.summary) {
      contentParas.push(new Paragraph({
        spacing: { after: 80 },
        children: [text(r.summary, { size: 18 })],
      }));
    }

    // Bullets
    (r.highlights || []).slice(0, HIGHLIGHTS_PER_ROLE).forEach((h) => {
      contentParas.push(new Paragraph({
        indent: { left: 240, hanging: 240 },
        spacing: { after: 40 },
        children: [
          text('•  ', { color: hex(r.color), bold: true, size: 18 }),
          text(h, { size: 18 }),
        ],
      }));
    });

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: noBorders,
      rows: [new TableRow({
        children: [
          // Coloured left bar — thin and tall (spans whole cell height).
          new TableCell({
            width: { size: 2, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: hex(r.color) },
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            borders: noCellBorders,
            children: [new Paragraph({ children: [] })],
          }),
          // Content cell.
          new TableCell({
            width: { size: 98, type: WidthType.PERCENTAGE },
            margins: { top: 120, bottom: 120, left: 240, right: 80 },
            borders: noCellBorders,
            children: contentParas,
          }),
        ],
      })],
    });
  }

  // ---------- Skills block ----------
  function buildSkills(d) {
    const { Paragraph, TextRun } = d;
    const text = (t, opts = {}) => new TextRun({ text: t, font: 'Calibri', ...opts });
    const out = [];

    Object.values(skills).forEach((g, idx) => {
      out.push(new Paragraph({
        spacing: { before: idx === 0 ? 60 : 140, after: 60 },
        children: [text(g.title.toUpperCase(), {
          bold: true, color: '0094A7', size: 18, characterSpacing: 40,
        })],
      }));

      if (Array.isArray(g.groups)) {
        g.groups.forEach((sub) => {
          out.push(new Paragraph({
            spacing: { after: 40 },
            children: [
              text(sub.level + ':  ', { bold: true, size: 18, color: '5A7689' }),
              text(sub.items.join('  ·  '), { size: 18 }),
            ],
          }));
        });
      } else {
        out.push(new Paragraph({
          spacing: { after: 40 },
          children: [text(g.items.join('  ·  '), { size: 18 })],
        }));
      }
    });

    return out;
  }

  // ===============================================================
  // Public entry
  // ===============================================================
  async function exportCV() {
    const [d, photoBytes] = await Promise.all([loadDocx(), loadPhoto()]);
    const doc = buildDocument(d, photoBytes);
    const blob = await d.Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = profile.name.replace(/\s+/g, '-') + '-CV.docx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  window.exportCVToDocx = exportCV;
})();
