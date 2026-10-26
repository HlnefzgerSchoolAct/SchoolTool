# SchoolTool

A polished West Delaware desktop for your school day. A live class countdown, B-lunch bell schedules, everyday school links, a focus timer, and a personal scratchpad — all in a static website you can host on GitHub Pages.

## Start in a Codespace

1. Create a GitHub repository named `schooltool` with a README, then open **Code → Codespaces → Create codespace on main**.
2. Upload `SchoolTool.zip` into the Codespace’s file explorer. Open the terminal and run:

   ```bash
   unzip -o SchoolTool.zip
   npm start
   ```

   The ZIP contains the project files at its root, so they land directly in the repository. It includes `.github`, `.devcontainer`, and `.nojekyll` — keep these files. If your upload has a different name, substitute that filename.

3. In **Ports**, open the forwarded **3000** port in your browser. There are no packages to install.
4. Open **SchoolTool → Settings** and enter your actual class names. B lunch is already configured. Block 3 has independent names before and after lunch, so it works with skinny classes. Add rooms if useful.
5. Use **Source Control → Commit → Sync Changes** to save the project to GitHub. Do not commit your personal backup JSON files.

If you use the included `.devcontainer` configuration in a future Codespace, port 3000 is forwarded automatically. An existing Codespace can use `npm start` immediately; rebuilding its container is optional.

## Publish on GitHub Pages

The included workflow tests the schedule and publishes only the static site files.

1. On your repository’s GitHub page, open **Settings → Pages**.
2. Under **Build and deployment**, choose **GitHub Actions** as the source.
3. Open **Actions → Publish SchoolTool to GitHub Pages → Run workflow**, or push a new commit to `main`.
4. When the workflow succeeds, open the deployment URL shown by GitHub. A repository called `schooltool` is normally hosted at `https://YOUR-USERNAME.github.io/schooltool/`.

The workflow assumes your default branch is `main`. If you use a different branch, update `.github/workflows/pages.yml`. GitHub Free supports Pages from public repositories; private-repository availability depends on your plan.

Alternative: because the project is buildless, you can remove `.github/workflows/pages.yml` and choose **Deploy from a branch → main → /(root)**. All website paths are relative, so a repository subpath works without changing a base URL.

Official instructions: [GitHub Pages publishing sources](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) · [Custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## What’s included

- A copper-and-graphite wallpaper, floating dock, desktop shortcuts, sidebar navigation, draggable window, minimize/restore, and maximize controls.
- Live current class, countdown, next class, passing periods, and a day-progress timeline. The browser tab title also displays the countdown.
- Automatic regular, homeroom, Wednesday early-out, and weekend schedules, with a two-hour-delay or no-school override for today.
- B lunch on every school schedule.
- Editable class and room names, including separate Block 3 / skinny-class entries before and after lunch.
- PowerSchool, Classroom, NICC Brightspace, Gmail, Drive, ChatGPT, Docs, Calendar, Canva, West Delaware, NICC, and Hawks Athletics links. Add, edit, delete, filter, and pin favorites.
- `Ctrl+K` or `⌘K` app/workspace search. Arrow keys navigate search results; Enter opens one; Escape closes the dialog.
- 25-minute and 50-minute focus sessions, a 5-minute break, pause/resume/reset, and a completed-session count. Timers use a target timestamp, so switching tabs does not cause countdown drift.
- Saved notes and tasks, light/dark appearance, copper/graphite wallpaper, and JSON backup import/export.
- Responsive layouts, keyboard-accessible controls, reduced-motion support, and no external scripts or fonts.
- A subtle West Delaware wrestling card linked to the school’s Bound athletics page.

## Bell schedule and timing

All times use **America/Chicago**, including daylight saving, even if your device is in a different time zone. The clock uses your device’s current time, so keep it set automatically.

| Schedule | Automatic days | B lunch | Dismissal |
| --- | --- | --- | --- |
| Regular, no homeroom | Monday, Friday | 12:04–12:29 PM | 2:55 PM |
| Regular, homeroom | Tuesday, Thursday | 12:15–12:40 PM | 2:55 PM |
| Early-out | Wednesday | 11:00–11:25 AM | 1:15 PM |
| Two-hour delay | Manual override | 12:50–1:15 PM | 2:55 PM |

Times were transcribed from the supplied **WDHS Bell Schedules .pdf**, included unchanged as `assets/WDHS-Bell-Schedules.pdf`.

Wednesday returns to class at **11:30 AM**, and delay days return at **1:20 PM**, matching the explicit five-minute passing interval in the PDF. The regular and homeroom pages do **not** specify the interval after B lunch. SchoolTool defaults to resuming at lunch’s end on those days; adjust **Settings → B lunch return passing time** if your actual return bell differs. This does not change the lunch times.

Optional Intervention / Reteach runs **3:00–3:30 PM** on regular, homeroom, and delay days. It is off by default. Class periods are half-open intervals: exactly at the end bell, the display moves into passing time, lunch, the next class, or school-out status.

**Holidays, closures, and special events are not automatically fetched.** Set today’s override from My schedule or Settings when needed. The override expires at midnight in Iowa. Preview tabs in My schedule only preview another timetable; they do not change the live schedule.

## Where your information lives

Class names, settings, links, notes, and tasks are saved in this browser’s `localStorage`. They are not committed to GitHub or synchronized between devices. The default website source contains generic block names, no grades, no login tokens, and no personal notes. School links open external services in a new tab and use each service’s own sign-in.

Settings entered in a Codespace preview do not automatically appear on the deployed GitHub Pages origin. **Export a backup in the preview, then import it on the live website** if you personalize before deployment. Backups are plain JSON and contain your notes and tasks; keep them out of a public repository. Clearing browser site data removes your saved workspace unless you have a backup. Import shows a confirmation before replacing the current workspace.

The timer’s completion message is in-app. There is no background push notification after you close the site. With the site open, a background tab may display the message when it becomes active again.

## Files and commands

| File | Purpose |
| --- | --- |
| `index.html` | Desktop, window, dock, and app shell |
| `styles.css` | Responsive layouts and appearance |
| `app.js` | Navigation, live clock, apps, settings, timer, notes, and tasks |
| `schedule.js` | Bell schedule data and pure timing logic |
| `defaults.js` | Starter links, default preferences, and backup validation |
| `icons.js` | Original inline SVG interface icons |
| `assets/` | Wallpaper, favicon, and source bell schedule |
| `dev-server.mjs` | Dependency-free local preview server |
| `build.mjs` | Copies website files into `dist/` |
| `tests/schedule.test.mjs` | Timing boundaries, schedule, and backup-validation tests |
| `.github/workflows/pages.yml` | Automated Pages deployment |
| `.devcontainer/devcontainer.json` | Codespaces environment and port setup |

```bash
npm start       # local preview on port 3000
npm test        # timing and data-validation checks
npm run build   # static files in dist/
```

Node 20 or newer is required for the development commands. The deployed website needs only a modern browser. Do not open `index.html` directly using a `file://` URL: ES modules require an HTTP server. Use `npm start` or GitHub Pages.

To change shared defaults for all visitors, edit `defaults.js`. To change bell times, edit `schedule.js` and run `npm test`. Existing browser settings take precedence over new defaults; update them in the UI or import a backup as appropriate.

## Design and attribution

SchoolTool is an independent student project, not an official district application. The copper wallpaper, abstract hawk mark, wrestling-mat artwork, and interface icons were created for this project; the hawk is a stylized mark, not a reproduction of the school’s official logo. West Delaware’s black/orange colors and Hawks identity were checked against the [IHSAA member-school listing](https://www.iahsaa.org/member-schools/). School and service names belong to their respective owners. No live grades, messages, or athletics results are implied by the links.
