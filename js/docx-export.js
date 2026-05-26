// Browser-side .docx generator. Loaded by index.html alongside data.js + app.js
// but the actual docx library (~200KB) is fetched lazily — only when the user
// clicks "Download CV". Reads the same data.js content the page renders from,
// so the .docx is always in sync.
//
// Target: 2-page modern resume. Highlights per role are capped to keep
// length sensible — adjust HIGHLIGHTS_PER_ROLE below if you want more / less.

(function () {
  'use strict';

  // ---------- config ----------
  // unpkg serves with Content-Type: text/javascript so the browser will
  // execute it. jsdelivr serves the .cjs as application/node which
  // browsers refuse to run as script when X-Content-Type-Options: nosniff
  // is set.
  const DOCX_LIB = 'https://unpkg.com/docx@9.5.1/dist/index.umd.cjs';
  const HIGHLIGHTS_PER_ROLE = 3; // top-N most-impactful highlights kept per role for the .docx
  const C_PRIMARY = '0076A7';    // brand blue (same as website)
  const C_BRIGHT  = '0094A7';
  const C_DARK    = '003550';
  const C_INK     = '0B2233';
  const C_MUTED   = '4A667A';
  const C_ACCENT  = 'F2C80F';

  // ---------- lazy-load the library ----------
  let _libPromise;
  function loadDocx() {
    if (window.docx) return Promise.resolve(window.docx);
    if (_libPromise) return _libPromise;
    _libPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = DOCX_LIB;
      s.onload = () => (window.docx ? resolve(window.docx) : reject(new Error('docx lib loaded but global missing')));
      s.onerror = () => reject(new Error('Failed to load ' + DOCX_LIB));
      document.head.appendChild(s);
    });
    return _libPromise;
  }

  // ---------- date helpers ----------
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function fmtYM(s) {
    if (s === 'present') return 'Present';
    const [y, m] = s.split('-').map(Number);
    return `${MONTHS[(m || 1) - 1]} ${y}`;
  }

  // ---------- contact helpers ----------
  // The .docx is downloaded by an intentional user click. The recruiter has the
  // file in hand — it's appropriate for contact details to be present in clear.
  const getEmail = () => `${profile.emailUser}@${profile.emailDomain}`;
  const getPhone = () => profile.phoneParts.join(' ');

  // ===============================================================
  // Document builder
  // ===============================================================
  function buildDocument(d) {
    const {
      Document, Paragraph, TextRun, ExternalHyperlink, BorderStyle,
      Tab, TabStopType, TabStopPosition, convertInchesToTwip,
    } = d;

    // docx wants hex without the leading "#"
    const hex = (c) => (c || C_PRIMARY).replace(/^#/, '');

    // ---------- small reusable factories ----------
    const text = (t, opts = {}) => new TextRun({ text: t, font: 'Calibri', ...opts });
    const linebreak = () => new TextRun({ break: 1 });

    // Section heading: bold uppercase blue with a thin bottom border.
    function sectionHeading(label) {
      return new Paragraph({
        children: [text(label.toUpperCase(), { bold: true, color: C_PRIMARY, size: 22, characterSpacing: 30 })],
        spacing: { before: 240, after: 100 },
        border: { bottom: { color: C_PRIMARY, style: BorderStyle.SINGLE, size: 8, space: 2 } },
      });
    }

    // Helper: build a paragraph with a left-aligned bold title and a
    // right-aligned muted secondary string on the same line.
    function titleWithRight(leftRuns, rightText, opts = {}) {
      return new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        spacing: { before: 120, after: 20 },
        ...opts,
        children: [
          ...(Array.isArray(leftRuns) ? leftRuns : [leftRuns]),
          new TextRun({ children: [new Tab()] }),
          text(rightText, { color: C_MUTED, size: 18 }),
        ],
      });
    }

    // Bullet item (top-level)
    function bullet(t) {
      return new Paragraph({
        children: [text(t, { size: 20 })],
        bullet: { level: 0 },
        spacing: { after: 40 },
        indent: { left: 360, hanging: 200 },
      });
    }

    // ---------- HEADER ----------
    // Big name on left, contact runs on right via tab stop.
    const headerName = new Paragraph({
      spacing: { after: 0 },
      children: [
        text(profile.name, { bold: true, size: 44, color: C_INK }),
      ],
    });
    const headerTitle = new Paragraph({
      spacing: { after: 80 },
      children: [
        text(profile.title.toUpperCase(), { color: C_PRIMARY, size: 20, characterSpacing: 60, bold: true }),
      ],
    });
    const headerContact = new Paragraph({
      spacing: { after: 80 },
      border: { bottom: { color: C_PRIMARY, style: BorderStyle.SINGLE, size: 12, space: 6 } },
      children: [
        text(profile.location, { size: 18, color: C_MUTED }),
        text('  ·  ', { size: 18, color: C_MUTED }),
        text(getEmail(), { size: 18, color: C_MUTED }),
        text('  ·  ', { size: 18, color: C_MUTED }),
        text(getPhone(), { size: 18, color: C_MUTED }),
        text('  ·  ', { size: 18, color: C_MUTED }),
        new ExternalHyperlink({
          link: profile.linkedin,
          children: [text('LinkedIn', { size: 18, color: C_PRIMARY, underline: {} })],
        }),
      ],
    });

    // ---------- CREDENTIALS STRIP ----------
    const credStrip = new Paragraph({
      spacing: { before: 100, after: 140 },
      children: heroStats.flatMap((s, i) => {
        const runs = [
          text('✓ ', { color: C_ACCENT, bold: true, size: 18 }),
          text(s, { size: 18, color: C_INK }),
        ];
        if (i < heroStats.length - 1) runs.push(text('     ', { size: 18 }));
        return runs;
      }),
    });

    // ---------- ABOUT ----------
    const aboutPara = new Paragraph({
      children: [text(profile.about, { size: 20 })],
      spacing: { after: 100 },
    });

    // ---------- EXPERIENCE ----------
    // Accenture master line — establishes the continuous tenure.
    const accentureLine = new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      spacing: { before: 60, after: 80 },
      children: [
        text('Accenture', { bold: true, size: 22, color: C_INK }),
        text('  ·  IT Consulting across multiple government clients', { size: 20, color: C_MUTED, italics: true }),
        new TextRun({ children: [new Tab()] }),
        text('Feb 2012 – Present', { size: 20, color: C_MUTED }),
      ],
    });

    function roleBlock(r) {
      const out = [];
      // Title row: "Role · Client" left, date range right.
      // Client gets the role's brand colour as inline coloured bold text
      // (the website uses a coloured pill; in Word that's done with a
      // table cell which fragments the line — coloured text is cleaner).
      out.push(
        titleWithRight(
          [
            text(r.role, { bold: true, size: 20, color: C_INK }),
            text('   ·   ', { size: 18, color: C_MUTED }),
            text(r.client, { bold: true, size: 18, color: hex(r.color) }),
          ],
          `${fmtYM(r.start)} – ${fmtYM(r.end)}`,
          { spacing: { before: 140, after: 20 } }
        )
      );
      // Program sub-line in italic.
      out.push(new Paragraph({
        spacing: { after: 60 },
        children: [text(r.program, { italics: true, size: 18, color: C_MUTED })],
      }));
      // Summary
      if (r.summary) {
        out.push(new Paragraph({
          spacing: { after: 60 },
          children: [text(r.summary, { size: 20 })],
        }));
      }
      // Top-N highlights as bullets
      (r.highlights || []).slice(0, HIGHLIGHTS_PER_ROLE).forEach((h) => out.push(bullet(h)));
      return out;
    }

    // ---------- SKILLS ----------
    function skillsBlock() {
      const out = [];
      Object.values(skills).forEach((g) => {
        // Group title (e.g. "Delivery & Leadership", "Tools")
        out.push(new Paragraph({
          spacing: { before: 100, after: 40 },
          children: [text(g.title, { bold: true, size: 20, color: C_BRIGHT })],
        }));
        if (Array.isArray(g.groups)) {
          g.groups.forEach((sub) => {
            out.push(new Paragraph({
              spacing: { after: 40 },
              children: [
                text(sub.level + ': ', { bold: true, size: 18, color: C_MUTED }),
                text(sub.items.join(' · '), { size: 18 }),
              ],
            }));
          });
        } else {
          out.push(new Paragraph({
            spacing: { after: 40 },
            children: [text(g.items.join(' · '), { size: 18 })],
          }));
        }
      });
      return out;
    }

    // ---------- CERTIFICATIONS ----------
    function certsBlock() {
      return certifications.map((c) => new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        spacing: { after: 30 },
        children: [
          text('• ', { color: C_ACCENT, bold: true, size: 18 }),
          c.url
            ? new ExternalHyperlink({
                link: c.url,
                children: [text(c.name, { size: 18, color: C_PRIMARY, underline: {} })],
              })
            : text(c.name, { size: 18 }),
          new TextRun({ children: [new Tab()] }),
          text(c.date, { size: 16, color: C_MUTED }),
        ],
      }));
    }

    // ---------- EDUCATION ----------
    function eduBlock() {
      const out = [];
      education.forEach((e) => {
        out.push(titleWithRight(
          text(e.institution, { bold: true, size: 20, color: C_INK }),
          e.year,
          { spacing: { before: 80, after: 10 } }
        ));
        out.push(new Paragraph({
          spacing: { after: 10 },
          children: [text(e.qualification, { size: 18 })],
        }));
        if (e.detail) {
          out.push(new Paragraph({
            spacing: { after: 60 },
            children: [text(e.detail, { size: 16, color: C_MUTED, italics: true })],
          }));
        }
      });
      return out;
    }

    // ---------- EXTRACURRICULAR (compact one-liners) ----------
    function extrasBlock() {
      const out = [];
      out.push(new Paragraph({
        spacing: { after: 30 },
        children: [
          text('Languages: ', { bold: true, size: 18, color: C_MUTED }),
          text(languages.map((l) => `${l.name} (${l.level})`).join(' · '), { size: 18 }),
        ],
      }));
      out.push(new Paragraph({
        spacing: { after: 30 },
        children: [
          text('Interests: ', { bold: true, size: 18, color: C_MUTED }),
          text(interests.join(' · '), { size: 18 }),
        ],
      }));
      out.push(new Paragraph({
        spacing: { after: 30 },
        children: [
          text('Volunteer: ', { bold: true, size: 18, color: C_MUTED }),
          text(volunteerWork.map((v) => v.title).join(' · '), { size: 18 }),
        ],
      }));
      return out;
    }

    // ---------- assemble doc ----------
    const children = [
      headerName,
      headerTitle,
      headerContact,
      credStrip,

      sectionHeading('About'),
      aboutPara,

      sectionHeading('Experience'),
      accentureLine,
      ...accentureRoles.flatMap(roleBlock),

      sectionHeading('Skills'),
      ...skillsBlock(),

      sectionHeading('Certifications'),
      ...certsBlock(),

      sectionHeading('Education'),
      ...eduBlock(),

      sectionHeading('Extracurricular'),
      ...extrasBlock(),
    ];

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

  // ===============================================================
  // Public entry: build, package, trigger download.
  // ===============================================================
  async function exportCV() {
    const d = await loadDocx();
    const doc = buildDocument(d);
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
