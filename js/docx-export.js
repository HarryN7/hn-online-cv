// Browser-side .docx generator. Loaded by index.html alongside data.js + app.js
// but the actual docx library (~200KB) is fetched lazily on first click. Reads
// the same data.js content the page renders from, so the .docx is always in
// sync.
//
// Layout goals:
//   - Centred header with circular photo + name + title + contact
//   - Decorative coloured top band
//   - Credentials strip
//   - Prominent ACCENTURE banner so role cards read as nested
//   - Mini-Gantt timeline as a coloured table (mirrors the website)
//   - Each role block has a coloured left bar in the role's brand colour
//   - Skills visually grouped (similar to website)
//   - Aim: 2 pages, modern look

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
  const C_TINT    = 'EEF6F9';   // very light blue tint for backgrounds
  const C_RULE    = 'D6E0E6';   // hairline rule colour

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

  // ---------- contact helpers ----------
  // The .docx is downloaded by an explicit user click and ends up in the
  // recipient's hand, so embedding the real address/number is appropriate.
  const getEmail = () => `${profile.emailUser}@${profile.emailDomain}`;
  const getPhone = () => profile.phoneParts.join(' ');

  // ===============================================================
  // Document builder
  // ===============================================================
  function buildDocument(d, photoBytes) {
    const {
      Document, Paragraph, TextRun, ImageRun, BorderStyle, AlignmentType,
      Table, TableRow, TableCell, WidthType, ShadingType, HeightRule,
      Tab, TabStopType, TabStopPosition, VerticalAlign, convertInchesToTwip,
    } = d;

    // --- small factories ---
    const text = (t, opts = {}) => new TextRun({ text: t, font: 'Calibri', ...opts });
    const hex  = (c) => (c || C_PRIMARY).replace(/^#/, '');
    const noBorder = { style: BorderStyle.NONE, size: 0, color: 'auto' };

    // Standard left border for role-block paragraphs
    function leftBar(color) {
      return {
        left:   { color: hex(color), style: BorderStyle.SINGLE, size: 24, space: 8 },
        top:    noBorder, right: noBorder, bottom: noBorder,
      };
    }

    function centred(children, opts = {}) {
      return new Paragraph({ alignment: AlignmentType.CENTER, ...opts, children });
    }

    function spacer(after = 120) {
      return new Paragraph({ spacing: { after }, children: [] });
    }

    function sectionHeading(label) {
      return new Paragraph({
        spacing: { before: 280, after: 140 },
        border: { bottom: { color: C_PRIMARY, style: BorderStyle.SINGLE, size: 10, space: 4 } },
        children: [
          text(label.toUpperCase(), { bold: true, color: C_PRIMARY, size: 22, characterSpacing: 40 }),
        ],
      });
    }

    // Decorative thin coloured rule (3 dots) — centred
    function ornament() {
      return centred(
        [text('• • •', { color: C_PRIMARY, size: 16, characterSpacing: 80 })],
        { spacing: { before: 100, after: 100 } }
      );
    }

    // ---------- HEADER ----------
    const headerBlocks = [];

    // Thin decorative coloured band at the very top of the page (full width).
    // Done as a 1-cell shaded table so it spans the full content width.
    headerBlocks.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder,
                 insideHorizontal: noBorder, insideVertical: noBorder },
      rows: [new TableRow({
        height: { value: 120, rule: HeightRule.EXACT },
        children: [new TableCell({
          shading: { type: ShadingType.SOLID, color: 'auto', fill: C_BRIGHT },
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
          borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
          children: [new Paragraph({ children: [] })],
        })],
      })],
    }));

    // Photo (centred)
    if (photoBytes) {
      headerBlocks.push(centred(
        [new ImageRun({ data: photoBytes, transformation: { width: 95, height: 95 } })],
        { spacing: { before: 240, after: 80 } }
      ));
    }

    // Name (centred, big, bold)
    headerBlocks.push(centred(
      [text(profile.name, { bold: true, size: 44, color: C_INK })],
      { spacing: { after: 40 } }
    ));

    // Title (centred, smaller, brand colour, letter-spaced)
    headerBlocks.push(centred(
      [text(profile.title.toUpperCase(), { bold: true, color: C_PRIMARY, size: 20, characterSpacing: 80 })],
      { spacing: { after: 140 } }
    ));

    // Contact line (centred). No LinkedIn in the offline copy.
    headerBlocks.push(centred(
      [
        text(profile.location, { size: 18, color: C_MUTED }),
        text('   ·   ', { size: 18, color: C_MUTED }),
        text(getEmail(), { size: 18, color: C_MUTED }),
        text('   ·   ', { size: 18, color: C_MUTED }),
        text(getPhone(), { size: 18, color: C_MUTED }),
      ],
      { spacing: { after: 0 } }
    ));

    headerBlocks.push(ornament());

    // Credentials strip (centred, single line, big dots between)
    const credRuns = [];
    heroStats.forEach((s, i) => {
      credRuns.push(text('✓ ', { color: C_ACCENT, bold: true, size: 18 }));
      credRuns.push(text(s, { size: 18, color: C_INK }));
      if (i < heroStats.length - 1) credRuns.push(text('     ', { size: 18 }));
    });
    headerBlocks.push(centred(credRuns, { spacing: { after: 200 } }));

    // ---------- ABOUT (no heading) ----------
    headerBlocks.push(new Paragraph({
      spacing: { after: 160 },
      alignment: AlignmentType.JUSTIFIED,
      children: [text(profile.about, { size: 20 })],
    }));

    // ---------- EXPERIENCE ----------
    const expBlocks = [sectionHeading('Experience')];

    // Accenture banner — visually dominant so role blocks read as nested.
    // 1-row table: left coloured strip, then a cell with name + dates.
    expBlocks.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder,
                 insideHorizontal: noBorder, insideVertical: noBorder },
      rows: [new TableRow({
        children: [
          new TableCell({
            width: { size: 4, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: 'auto', fill: C_BRIGHT },
            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
            children: [new Paragraph({ children: [] })],
          }),
          new TableCell({
            width: { size: 96, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: 'auto', fill: C_TINT },
            margins: { top: 200, bottom: 160, left: 240, right: 240 },
            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
            children: [
              new Paragraph({
                tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
                spacing: { after: 60 },
                children: [
                  text('Accenture', { bold: true, size: 32, color: C_INK }),
                  new TextRun({ children: [new Tab()] }),
                  text('Feb 2012 – Present', { bold: true, size: 20, color: C_BRIGHT }),
                ],
              }),
              new Paragraph({
                children: [text('IT Consulting across multiple government clients', {
                  italics: true, size: 18, color: C_MUTED,
                })],
              }),
            ],
          }),
        ],
      })],
    }));
    expBlocks.push(spacer(200));

    // Timeline table — mirrors the website's horizontal Gantt.
    expBlocks.push(buildTimelineTable(d));
    expBlocks.push(spacer(200));

    // Role blocks
    accentureRoles.forEach((r, i) => {
      expBlocks.push(...roleParagraphs(d, r));
      if (i < accentureRoles.length - 1) expBlocks.push(spacer(160));
    });

    // ---------- SKILLS ----------
    const skillBlocks = [sectionHeading('Skills')];
    skillBlocks.push(...buildSkills(d));

    // ---------- CERTIFICATIONS ----------
    const certBlocks = [sectionHeading('Certifications')];
    certifications.forEach((c) => {
      certBlocks.push(new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
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
    const eduBlocks = [sectionHeading('Education')];
    education.forEach((e) => {
      eduBlocks.push(new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        spacing: { before: 80, after: 20 },
        children: [
          text(e.institution, { bold: true, size: 20, color: C_INK }),
          new TextRun({ children: [new Tab()] }),
          text(e.year, { size: 18, color: C_MUTED }),
        ],
      }));
      eduBlocks.push(new Paragraph({
        spacing: { after: 10 },
        children: [text(e.qualification, { size: 18 })],
      }));
      if (e.detail) {
        eduBlocks.push(new Paragraph({
          spacing: { after: 60 },
          children: [text(e.detail, { size: 16, color: C_MUTED, italics: true })],
        }));
      }
    });

    // ---------- EXTRACURRICULAR ----------
    const extraBlocks = [sectionHeading('Extracurricular')];
    extraBlocks.push(new Paragraph({
      spacing: { after: 40 },
      children: [
        text('Languages: ', { bold: true, size: 18, color: C_MUTED }),
        text(languages.map((l) => `${l.name} (${l.level})`).join(' · '), { size: 18 }),
      ],
    }));
    extraBlocks.push(new Paragraph({
      spacing: { after: 40 },
      children: [
        text('Interests: ', { bold: true, size: 18, color: C_MUTED }),
        text(interests.join(' · '), { size: 18 }),
      ],
    }));
    extraBlocks.push(new Paragraph({
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
        default: {
          document: { run: { font: 'Calibri', size: 20 } },
        },
      },
      sections: [{
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.4),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.6),
              right: convertInchesToTwip(0.6),
            },
          },
        },
        children: [
          ...headerBlocks,
          ...expBlocks,
          ...skillBlocks,
          ...certBlocks,
          ...eduBlocks,
          ...extraBlocks,
        ],
      }],
    });
  }

  // ---------- Timeline as a coloured table ----------
  function buildTimelineTable(d) {
    const { Paragraph, TextRun, AlignmentType, BorderStyle,
            Table, TableRow, TableCell, WidthType, ShadingType, HeightRule } = d;

    const text = (t, opts = {}) => new TextRun({ text: t, font: 'Calibri', ...opts });
    const hex  = (c) => (c || '0076A7').replace(/^#/, '');
    const noBorder = { style: BorderStyle.NONE, size: 0, color: 'auto' };

    // Roles ordered chronologically (oldest first, like the website).
    const chrono = [...accentureRoles].reverse();
    const startMs = parseYM(chrono[0].start).getTime();
    const endMs = parseYM('present').getTime();
    const total = endMs - startMs;

    // Compute each cell's width % of the row.
    const cells = chrono.map((r) => {
      const segStart = parseYM(r.start).getTime();
      const segEnd = (r.end === 'present' ? endMs : parseYM(r.end).getTime());
      return { role: r, pct: ((segEnd - segStart) / total) * 100 };
    });

    function colouredCell(c) {
      return new TableCell({
        width: { size: c.pct, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.SOLID, color: 'auto', fill: hex(c.role.color) },
        margins: { top: 120, bottom: 120, left: 100, right: 100 },
        borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 30 },
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
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [text(`${yr1}–${yr2}`, { size: 12, color: '5A7689' })],
        })],
      });
    }

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder,
                 insideHorizontal: noBorder, insideVertical: noBorder },
      rows: [
        new TableRow({ children: cells.map(colouredCell) }),
        new TableRow({ children: cells.map(yearCell) }),
      ],
    });
  }

  // ---------- Role block (set of paragraphs all sharing a coloured left bar) ----------
  function roleParagraphs(d, r) {
    const { Paragraph, TextRun, BorderStyle, Tab, TabStopType, TabStopPosition } = d;
    const text = (t, opts = {}) => new TextRun({ text: t, font: 'Calibri', ...opts });
    const hex  = (c) => (c || '0076A7').replace(/^#/, '');
    const noBorder = { style: BorderStyle.NONE, size: 0, color: 'auto' };
    const leftBorder = {
      left:   { color: hex(r.color), style: BorderStyle.SINGLE, size: 24, space: 8 },
      top:    noBorder, right: noBorder, bottom: noBorder,
    };

    const out = [];

    // Title row: bold role on left, date range right-aligned.
    out.push(new Paragraph({
      border: leftBorder,
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      spacing: { before: 80, after: 40 },
      indent: { left: 160 },
      children: [
        text(r.role, { bold: true, size: 22, color: '0B2233' }),
        new TextRun({ children: [new Tab()] }),
        text(`${fmtYM(r.start)} – ${fmtYM(r.end)}`, { size: 18, color: '5A7689' }),
      ],
    }));

    // Sub row: italic program · coloured "X Client".
    out.push(new Paragraph({
      border: leftBorder,
      indent: { left: 160 },
      spacing: { after: 60 },
      children: [
        text(r.program, { italics: true, size: 18, color: '5A7689' }),
        text('  ·  ', { size: 18, color: '5A7689' }),
        text(r.client + ' Client', { bold: true, size: 18, color: hex(r.color) }),
      ],
    }));

    // Summary (if any)
    if (r.summary) {
      out.push(new Paragraph({
        border: leftBorder,
        indent: { left: 160 },
        spacing: { after: 80 },
        children: [text(r.summary, { size: 18 })],
      }));
    }

    // Top-N highlights as bullets, with the same left bar.
    (r.highlights || []).slice(0, 3).forEach((h) => {
      out.push(new Paragraph({
        border: leftBorder,
        indent: { left: 480, hanging: 240 },
        spacing: { after: 40 },
        children: [
          text('•  ', { color: hex(r.color), bold: true, size: 18 }),
          text(h, { size: 18 }),
        ],
      }));
    });

    return out;
  }

  // ---------- Skills block ----------
  function buildSkills(d) {
    const { Paragraph, TextRun } = d;
    const text = (t, opts = {}) => new TextRun({ text: t, font: 'Calibri', ...opts });
    const out = [];

    Object.values(skills).forEach((g, idx) => {
      // Group title — coloured, uppercase
      out.push(new Paragraph({
        spacing: { before: idx === 0 ? 80 : 160, after: 60 },
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
