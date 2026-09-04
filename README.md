# Ledger — Task Manager

A small, dependency-free task manager styled like an accountant's ledger book. Add, edit, complete, and delete tasks; set a priority (High, Medium, Low) and an optional due date; everything is saved to your browser's `localStorage`, so your list is still there when you come back.

Built with plain HTML, CSS, and JavaScript — no build step, no frameworks, no npm install.

## Features

- **Create, read, update, delete** tasks ("entries")
- **Priority levels** — High, Medium, Low — each with its own color mark
- **Optional notes and due dates**, with overdue items flagged
- **Filter** by priority or completion status, **sort** by date added, priority, due date, or title
- **Data persistence** via `localStorage` — no backend required
- **Responsive design** — sidebar filters collapse into a scrollable chip bar on mobile, the add/edit panel goes full-width
- Accessible basics: keyboard-operable controls, visible focus states, `aria-live` updates, `prefers-reduced-motion` respected

## Getting started

No installation or build tools are required.

### Option 1 — open it directly
1. Clone or download this repository.
2. Open `index.html` in any modern browser (Chrome, Firefox, Safari, Edge).

### Option 2 — run a local server (recommended)
Some browsers restrict certain features when a page is opened via `file://`. A local server avoids that:

```bash
git clone https://github.com/<your-username>/ledger-task-manager.git
cd ledger-task-manager

# Python 3
python3 -m http.server 8000

# or Node (if you have npx available)
npx serve .
```

Then visit `http://localhost:8000` (or whichever port your tool prints) in your browser.

## Project structure

```
.
├── index.html    # Markup and structure
├── style.css     # Ledger-themed styling, responsive layout
├── app.js        # CRUD logic, filtering/sorting, localStorage persistence
└── README.md
```

## How data is stored

Tasks are kept in `localStorage` under the key `ledger.tasks.v1` as a JSON array, so:
- Data persists across page reloads and browser restarts.
- Data is local to the browser/device — it won't sync across devices.
- Clearing your browser's site data for this page will clear your tasks.

To swap in an API-backed store later, the read/write logic is isolated in `loadTasks()` and `saveTasks()` in `app.js` — replace those two functions with `fetch` calls to your backend and the rest of the app (rendering, filtering, forms) doesn't need to change.

## Browser support

Tested in current versions of Chrome, Firefox, Safari, and Edge. Uses `crypto.randomUUID()` where available, with a fallback for older browsers.

## License

MIT — do whatever you like with this.
