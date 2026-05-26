# Harry Nguyen — Online CV

Personal online CV. Plain HTML / CSS / vanilla JS — no frameworks, no build step, no dependencies. Open `index.html` in a browser, or serve the folder with any static file server.

## Structure

```
hn-online-cv/
├── index.html         Semantic shell with template containers
├── css/
│   ├── main.css       Layout, components, light/dark theme
│   └── print.css      Print-only overrides (used by "Save as PDF")
├── js/
│   ├── data.js        Single source of truth — content lives here
│   └── app.js         Renders DOM from data.js + interactions
└── images/            Avatar + icons
```

## Updating content

Almost all updates only require editing `js/data.js`:

- **New role** → push an entry to `accentureRoles` (newest first). Fields: `id`, `role`, `client`, `clientFull`, `program`, `start` / `end` (`YYYY-MM` or `'present'`), `teamSize`, `color`, `summary`, `highlights[]`, `keyWork[]`, `tech[]`. The Gantt timeline and role cards both regenerate automatically.
- **New certification** → append to `certifications`.
- **About / hero stats / skills / education / languages / interests / volunteer** → all are top-level arrays/objects in the same file.

## Features

- Sticky section nav with active-section tracking
- Hero stats strip pulling from `heroStats` in `data.js`
- Horizontal Gantt-style career timeline — segments are clickable and scroll to + open the matching role card
- Expandable role cards (collapsed by default except the most recent)
- Phone number hidden behind a "Show phone" button
- Light / dark theme toggle (preference persisted in `localStorage`)
- Print stylesheet — `Print` button or browser print uses a tightened, all-expanded layout for clean PDF export
- Responsive down to ~375px
- `prefers-reduced-motion` support

## Local preview

Any static server works. The simplest:

```powershell
python -m http.server 8765 --directory hn-online-cv
```

Then open <http://localhost:8765>.
