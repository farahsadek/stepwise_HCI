# Stepwise – AI-assisted assessment and learning-gap support (Grades 1–5)

Coded prototype for **CSEN 909 Human-Computer Interaction, Milestone 3** (German University in Cairo, Winter 2026), team **HNFOB**.

**Live prototype:** https://farahsadek.github.io/stepwise_HCI/
**Repository:** https://github.com/farahsadek/stepwise_HCI

Students upload a photo of a handwritten exam. A (simulated) AI reads the handwriting, proposes marks and spots repeated mistakes. **The teacher stays in control at every step**: she checks the extracted text, confirms, overrides or rejects each mark, confirms or dismisses red flags, and decides what the student and the parent see. Parents only see results after the teacher publishes *and* shares them.

> All data is invented for the demo; there are no real student records. The AI is simulated (see [Known limitations](#known-limitations)).

---

## How to run

### Option 1: open the live prototype
Open https://farahsadek.github.io/stepwise_HCI/ in Chrome, Edge or Firefox. Nothing to install.

### Option 2: run it on your computer
You need **Node.js 18 or newer** (it includes npm). Check with `node -v`.

```bash
git clone https://github.com/farahsadek/stepwise_HCI.git
cd stepwise_HCI
npm install          # first time only
npm run dev          # then open http://localhost:8443
```

Stop it with `Ctrl + C`. If port 8443 is busy, run `npm run dev -- --port 5173` and open http://localhost:5173.

To check and build the production version:

```bash
npx tsc --noEmit     # type check
npm run build        # output in dist/
npm run preview      # serves dist/ on http://localhost:8443
```

The camera only works on `localhost` or https; otherwise use **Use sample photo (demo)**.

### Demo accounts
On the login screen pick a role tab, press **Use demo account**, then **Log in**. Switch roles with the name menu (top right) → **Log out**.

| Role | Login |
|---|---|
| Student | username `khadija`, PIN `1234` |
| Teacher | `somaya@stepwise.demo` / `demo1234` |
| Parent | `parent@stepwise.demo` / `demo1234` |

> Data lives in memory: **refreshing the page resets the story**. Switch roles with *Log out* instead of reloading. The language (EN/DE) and the student's text-size/contrast settings are remembered.

---

## Try it in 5 minutes (the story we designed for)

1. **Student** → *Upload* → *Choose this exam* → *Take a photo* → *Use sample photo (demo)*. The first photo is flagged as blurry and the message says what to do: retake it. Check the pages, **choose the exam language**, then *Send to my teacher*. No score is shown yet; the tracker shows "Sent".
2. **Teacher** → *Open review queue*.
   - **Verify OCR:** the list at the top shows uncertain readings, least certain first. The AI read Khadija's Q2 as **578** (the doubtful "7" is highlighted). Press **Alt+1** to pick **528**, then **Enter**; do the same for Q6 (read as "9O" → **90**).
   - **Review mark:** "AI is grading…" shows progress, then the AI proposes 3/3 (total **17/25**). Confirm it, or *Override* (e.g. 2/3, with a reason). Every decision can be undone from the message that appears.
   - **Red flag:** Khadija compared fractions by the bottom number in three quizzes. Confirm the flag and approve the practice resources.
   - **Publish:** keep *Share with parent* on, press *Publish results* and confirm.
3. **Student** → the bell shows the results. Home shows **17/25 (68%)** (16/25 if you overrode to 2/3). *Feedback* explains each mistake; *Practice* has a mini lesson with video and a 3-question pop quiz with explanations and a recommendation.
4. **Parent** → learning alert, quiz results question by question, progress charts, help at home, messages, and the progress report with "I have read this report". Switch to the second child (Yara) to see the same tabs with her data.
5. **Teacher** again → *Class insights* (before → after the pop quiz, next step per student; compare Grades 4A, 4B and 4C), *Review by question* (fix one mark or approve a bulk correction), *Assessments* (bulk upload, new assessment with questions), *Gradebook*, *Skill tree*, *Messages*, *Activity history*.

---

## Research gap and what makes Stepwise different

Existing grading tools mostly record and display marks. Our teacher interview (Milestone 2) showed that teachers need to know **why** students struggle, **who** needs help first, and **whether extra practice worked**. Stepwise's unique features:

- **Class skill tree:** class-wide mastery per concept, with the students behind each gap.
- **Attention prioritizer:** a ranked list of students who need the teacher, each with the reason.
- **Guided learning resources:** short, teacher-approved lessons for each student's weak spot.
- **Verification pop quizzes:** check whether the practice worked (before → after per student), with a next step for the teacher; results flow back to the student and parent.

Around these, we kept a strict human-in-the-loop design: every AI output is a suggestion that the teacher checks before anyone else sees it.

---

## Features (Milestone 2 feature list → prototype)

All features are available in English and German, and every screen adapts to desktop, laptop, tablet and phone.

### A. Shared platform
| # | Feature | Where |
|---|---|---|
| A1 | Role-based login and logout | Login screen (errors say what to do next, demo accounts); name menu → Log out |
| A2 | English and German | EN/DE switch on login and in every role; exam language chosen per upload |
| A3 | Notification center | Bell with unread count; Unread/All tabs; created by real actions |
| A4 | Accessibility | Read aloud in all roles (student: with text size A/A+/A++ and high contrast); student buttons ≥ 48 px, text ≥ 14 px; keyboard use and Escape closes dialogs |
| A5 | Activity history | Teacher → Activity history (filters, download, undone decisions shown); role-filtered lists for student and parent |

### B. Student view
| # | Feature | Where |
|---|---|---|
| B1 | Dashboard | Home: Quiz 4 card, progress, today's focus, updates from the teacher |
| B2, B20 | Upload with guidance | Upload: photo tips, camera capture, photo or PDF files, several pages, Back/Cancel on every step |
| B3 | Preview and quality check | Each page is checked on the device (blurry / too dark / too small) with advice; retake or remove |
| B4 | Submission status | 5-step tracker: sent → writing checked → AI marks → marks checked → results ready |
| B5 | Teacher-confirmed results | Score appears only after the teacher publishes |
| B6 | Question-by-question feedback | Feedback: "Why?" explanation for each mistake |
| B7–B9 | Learning gaps, recurring mistake, support alerts | Feedback cards; encouraging notification when the teacher confirms the flag |
| B10–B12 | Resources, pop quiz, quiz feedback | Practice: mini lesson + 20 s video → 3 questions (answers can be changed) → results with explanations and a recommendation (another round, the lesson again, or ask the teacher) |
| B13, B14 | Progress and practice tracking | Progress: quiz history chart, per-topic line chart (table view), practice list |
| B16, B21 | Notifications and reminders | Bell, home updates, reminder if practice is still open |
| B17, B18 | Ask the teacher, report an error | Buttons on every question; answers appear in *My messages* |
| B19 | Profile | Name menu → My profile |

### C. Teacher view
| # | Feature | Where |
|---|---|---|
| C1 | Dashboard | Overview: class picker (Grades 4A, 4B, 4C), metrics, "To do today", class focus areas |
| C24 | Attention prioritizer | Overview: ranked students with reasons and actions |
| C2, C27, C25, C19, C20 | Students, search/filter, student record with gap evidence | Students → Open record |
| C3 | Assessments and marking scheme | Assessments: new assessment with questions, model answers and marks; editable marking scheme; saved grading rules can be reused |
| C4, C6 | Submissions and bulk upload | Assessments → Quiz 4 submissions: drop or choose many scans, matched to students by file name, quality check, fix any match before adding |
| C5, C7–C10 | Original scan, OCR alerts and correction | Review queue: uncertain readings least certain first, doubtful characters highlighted, suggestions for commonly confused digits and symbols, shortcuts (Enter, Alt+↑/↓, Alt+1–3) |
| C11–C14 | AI grading, explanation, override, uncertainty | Review queue → Review mark: grading progress, all 8 AI marks least certain first, total, criteria; confirm / override (reason required) / reject, each with Undo |
| C21 | Mistake tags | Review mark → mistake tags (AI suggestion, editable) |
| C15, C16 | Review by question, bulk correction and saved rules | Review by question: change one student's mark, preview and approve a bulk correction (with Undo), save the rule |
| C17 | Approval and publication | Review queue → Publish: blocked until OCR and marks are confirmed (the message links to the missing step); confirmation before publishing |
| C18 | Gradebook and export | Gradebook → CSV export |
| C22, C30 | Red flag review, resource approval | Review queue → Red flag (confirm / dismiss / postpone, each with Undo) |
| C23, C33 | Skill tree, revision planning | Skill tree |
| C26 | Class performance | Class insights: average and trend, most misunderstood concepts, questions most often wrong, students who need support, compare classes |
| C31 | Pop-quiz monitoring | Class insights: completion, before → after per student, next step (mark resolved, another round, small group) |
| C29, C32 | Feedback editing, messages | Review mark (feedback); Messages (questions, error reports, parent messages, notes) |
| C34 | Profile and settings | Name menu → My profile |

### D. Parent view (bonus)
| # | Feature | Where |
|---|---|---|
| D1 | Dashboard | Overview tab |
| D2 | Results and feedback | Quiz results tab (plain-language explanations) |
| D3, D4 | Learning gaps and teacher-confirmed alerts | Overview learning alert (only after the teacher confirms and shares) |
| D5, D7 | Progress, practice and pop quiz | Progress tab (charts); practice card |
| D6 | Recommended resources | Help at home tab (teacher-approved video, activity, printable) |
| D8 | Teacher communication | Messages tab |
| D9 | Profile and child selection | Child switcher (Khadija / Yara, same tabs for both); name menu → My profile |
| D10 | Progress report and acknowledgment | Overview → report download and "I have read this report" |

---

## Usability (Nielsen's heuristics)

| Heuristic | How Stepwise applies it |
|---|---|
| Visibility of system status | Status trackers for student and parent, "AI is grading…" progress, reading confidence, notification bell |
| Match with the real world | Students and parents never see technical AI terms; plain, child-friendly wording |
| User control and freedom | Undo for every teacher decision; Back/Cancel in wizards and dialogs; Escape closes dialogs |
| Consistency | One status component (icon + text) and the same wording for the same state in all roles |
| Error prevention | Publish is gated and confirmed; overriding needs a reason; the exam language must be chosen; photo quality check |
| Recognition rather than recall | Every icon-only button has a label/tooltip; each review screen shows the current student and question |
| Recover from errors | Every error says what happened and what to do next, with an icon |
| Help | "What does this mean?" tips for reading confidence, AI suggestion, red flag, attention rank and sharing |

---

## Design decisions

- **One visual language at three intensities.** Student: playful but not babyish (ivory background, thick outlines, offset shadows, pencil mascot, pastel colours). Teacher: calm and professional (sage, dusty blue, sand; thin outlines; no mascots). Parent: warm but mature.
- **Logo:** two steps with a sprout growing from the top one, after the line "Every little step helps us grow".
- **Status is never shown by colour alone.** Every status has an icon and a text label; charts use colour-blind-safe colours plus marker shapes and a table view.
- **Human in the loop.** Students and parents never see AI output the teacher has not confirmed; every teacher decision is recorded in the activity history.

---

## Project structure

```
src/
  App.tsx            login, student / teacher / parent screens, review workflow, notifications
  teacher.tsx        teacher pages (students, assessments, review by question, class performance, …)
  parent.tsx         parent sections (results, progress, help at home, messages, report, second child)
  student-media.tsx  camera capture, photo quality check, lesson video
  charts.tsx         line chart (legend, tooltip, table view)
  heuristics.tsx     help tips, error messages, grading progress, confirmation dialog
  accessibility.tsx  read aloud, text size and contrast
  activity.tsx       activity history (with undone decisions)
  store.ts           shared demo data (classes, students, marking scheme, messages, rules)
  ui.tsx             icons, buttons, status chips
  index.css          all styles
public/
  favicon.png        browser-tab icon (the Stepwise logo)
```

## Deployment

Every push to `main` builds the site and publishes it to https://farahsadek.github.io/stepwise_HCI/ (see `.github/workflows/deploy.yml`). One-time setup in the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

---

## Known limitations

- **AI is simulated.** OCR readings, marks, confidence values, mistake tags and suggestions are prepared for the demo story (allowed by the project description). The photo quality check really runs on the device, using a simple sharpness/brightness check; the grading progress is a short simulated wait.
- **In-memory data.** Everything resets on page refresh; there is no server or database.
- **Classes.** Full data exists for Grade 4B (22 students), with Khadija's Quiz 4 as the detailed story. Grades 4A and 4C have class-level summaries only (no student lists or review queue).
- **Simplified parts:** review by question covers Q5 and Q7; questions for a new assessment are typed in (not read from the model-answer file); email options are for show.
- **German** covers the interface of all three roles. Text that people type themselves is shown as written, and the scanned exam paper stays in the exam's own language.
- **Read aloud** uses the browser's speech voices; if none are installed, it highlights text at reading pace without sound.

---

## Team HNFOB

Basmala Mohamed · Hana Tobar · Nour Tarek · Farah Sadek · Omar Emad
Instructor: Dr. Aya Salama · TAs: Samaa Soliman, Aml Yasser
