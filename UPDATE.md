# SchoolTool 2.0 — update your existing project

This is an incremental update for the original SchoolTool ZIP. It keeps the existing desktop, orange/black identity, links, B-lunch bell times, and GitHub Pages workflow. The update archive contains only changed or added files; it is not a standalone starter.

## Apply in your current Codespace

1. In your current live SchoolTool, use **Settings → Export backup**. Keep that JSON outside your public repository.
2. Commit any uncommitted source changes in your Codespace first. If you edited the original source yourself, review the diff after extraction and retain your custom changes.
3. Upload `SchoolTool-update-2.0.zip` into the existing project folder — the folder containing `index.html` and `package.json`.
4. In that folder, run:

   ```bash
   unzip -o SchoolTool-update-2.0.zip
   npm test
   npm run build
   npm start
   ```

   No packages need installing. If a preview server is already running, stop it with Ctrl+C before `npm start`. Open port 3000 from Codespaces’ Ports panel.

5. Review the changes in Source Control, then commit and sync. Your existing GitHub Pages workflow deploys the update. Keep `.github/workflows/pages.yml`, `.devcontainer`, `.nojekyll`, `schedule.js`, `styles.css`, `icons.js`, and the original assets.
6. Open the same GitHub Pages address in the same browser. Version 1 browser data migrates automatically. Your original `schooltool.v1` record is retained. The setup guide introduces the new class options; it does not reset your data.

There is no need to create a new repository or rebuild the Codespace container. If you personalized the Codespace preview, export there and import on GitHub Pages: these are separate browser origins.

## What the update adds

- **Persistent class clock:** current class, remaining time, and next class in the menu bar. Click it for a large clock and optional full screen.
- **Assignment desk:** due dates, class tags, priorities, links, editing, completion filters, and a shortcut into Focus room.
- **Your week:** weekday-specific class names, rooms, teachers, and links. Blank weekday names use the main class settings. Settings drafts survive navigation and theme changes; save each form to apply it.
- **Special dates:** schedule holidays, days off, early-outs, or delays ahead of time. Priority is today’s manual override, then a dated exception, then the usual weekday schedule.
- **Floating tools:** open notes and a focus timer from the sidebar. Move, resize, snap, minimize, and reopen them; window bounds are remembered. On phones they use a fitted sheet. Reset layout is in Settings.
- **A personal dock:** pin up to four school links, edit their destinations, and reorder them in App library. Favorites and dock pins are separate. The phone dock displays the first two pinned links; all remain in App library.
- **Wrestling planner:** add practices/meets with dates, times, locations, and a packing checklist. Your next event appears on the overview. Events are entered by you, not fetched from an official schedule.
- **Safer local data:** version 1 migration, independent-field merges across tabs, conflict notices, undo for deletion, save-failure notices, recovery export, and a snapshot before each backup import.
- **Installation and offline shell:** install on supported browsers and use the cached workspace after an online visit over HTTPS.

The source PDF and B-lunch times are unchanged. The PDF leaves regular/homeroom post-lunch passing time unspecified; the existing default remains zero added minutes. Confirm your return bell in Settings and adjust if needed. Class names remain yours to enter.

## Data, recovery, and limits

All personal data stays in the browser. Nothing is uploaded by the app or stored in the repository. Tabs on the same origin share saved changes; devices and browsers do not sync. Same-field concurrent edits choose the later saved value while preserving both values in the recovery journal. Unsaved note edits are retained when another tab updates data.

**Export backup** produces a normal version 2 workspace that the app can import. **Export recovery** is a diagnostic history containing original and previous values; it is not a normal import file. **Restore pre-import copy** previews the snapshot taken immediately before the most recent import, then asks before restoring. Delete undo lasts until the next deletion or page reload.

Notes save after a short typing pause and flush when navigating or hiding the page. Watch the save indicator: if browser storage is blocked or full, use Export backup before closing. Recovery history uses browser storage, so it is not an unlimited archive. Keep periodic backups; clearing site data removes both current data and local history.

## Offline and future releases

Use your HTTPS GitHub Pages address. After the service worker finishes its first successful online cache, reopen the site once before relying on offline access. Core pages, schedules, notes, assignments, the timer, and the bell-schedule PDF are cached. External services such as PowerSchool, Gmail, Brightspace, and Classroom require the internet and their own sign-in.

If your browser offers installation, **Install SchoolTool** appears in Settings. Installation availability varies by browser; the website remains usable without it. There are no push notifications or alarms while the app is closed. The timer computes from a timestamp and catches up when you return.

A later cached release waits for the **Update** action in its banner. Settings drafts are saved for that reload; an open editing dialog must be saved or closed first. For any future code release, change `RELEASE` in `sw.js` and include new static assets in both `sw.js` and `build.mjs`.

## Files in this patch

Updated: `index.html`, `app.js`, `defaults.js`, `build.mjs`, `dev-server.mjs`, `package.json`, `.gitignore`, and `README.md`.

Added: `model.js`, `storage.js`, `extras.js`, `windows.js`, `update.css`, `manifest.webmanifest`, `pwa.js`, `sw.js`, `assets/app-192.png`, `assets/app-512.png`, `tests/update.test.mjs`, and this guide.

## Validation

27 automated checks cover the original schedule boundaries and all four B-lunch windows, migration, backup roundtrips, weekday/dated overrides, assignment sorting, concurrent saves, recovery, quota failures, and service-worker asset/scope handling. The static build passes. Desktop, 390-pixel phone, and 768-pixel tablet layouts were reviewed in a browser, including assignment editing/undo, draft preservation, notes, floating windows, and wrestling checklists.

Service-worker logic and asset paths were checked in automated tests. Installation and real disconnected operation still need a smoke test on your HTTPS deployment; the local browser preview was served over HTTP.
