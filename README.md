# Stepwise – AI-assisted assessment and learning-gap support (Grades 1–5)

Coded front-end prototype for **CSEN 909 Human-Computer Interaction, Milestone 3** (German University in Cairo, Winter 2026), team **HNFOB**.

**Live prototype:** https://farahsadek.github.io/stepwise_HCI/
**Repository:** https://github.com/farahsadek/stepwise_HCI

Students upload a photo of a handwritten exam. A (simulated) AI reads the handwriting, proposes marks, and spots repeated mistakes. **The teacher stays in control at every step**: she checks the extracted text, confirms or overrides each mark, confirms or dismisses red flags, and decides what the student and the parent see. Parents only see results after the teacher publishes *and* shares them.

> "Stepwise" is a placeholder name. All data is invented for the demo; there are no real student records. The AI is simulated (see [Known limitations](#known-limitations)).

---

## Try it in 5 minutes

Open the [live prototype](https://farahsadek.github.io/stepwise_HCI/), pick a role tab on the login screen, press **Use demo account**, then **Log in**. Switch roles with the name menu (top right) → **Log out**.

| Role | Login |
|---|---|
| Student | username `khadija`, PIN `1234` |
| Teacher | `somaya@stepwise.demo` / `demo1234` |
| Parent | `parent@stepwise.demo` / `demo1234` |

**Suggested path (the story we designed for):**

1. **Student** → *Upload* → choose Quiz 4 → *Take a photo* → *Use sample photo (demo)*. The first photo is flagged as blurry: retake it, check the pages, choose the exam language, send. No score is shown yet; the status tracker shows "Sent".
2. **Teacher** → *Open review queue*.
   - **Verify OCR:** the AI read Khadija's answer to Q2 as **578**. Pick the suggested **528** (or type it) and press Enter.
   - **Review mark:** the AI proposes 3/3 and explains why. Confirm it, or press *Override* (e.g. 2/3).
   - **Red flag:** Khadija compared fractions by the bottom number in three quizzes. Confirm the flag and approve the practice resources.
   - **Publish:** keep *Share with parent* on and publish.
3. **Student** → home now shows **17/25 (68%)** (16/25 if you overrode to 2/3). Open *Feedback* for the explanation of each mistake, ask Ms. Ashraf a question, then do the practice (mini lesson with video → 3-question pop quiz).
4. **Parent** → overview, the learning alert, quiz results question by question, progress, help at home, messages, and the progress report with "I have read this report".
5. **Teacher** again → *Messages* (answer the student and parent), *Students*, *Review by question* (bulk correction), *Gradebook* (CSV export), *Skill tree*, *Activity history*.

> Data lives in memory: **refreshing the page resets the story**. Switch roles with *Log out* instead of reloading. The language (EN/DE) and the student's text-size/contrast settings are remembered.

---

## Research gap and what makes Stepwise different

Existing grading tools mostly record and display marks. Our teacher interview (Milestone 2) showed that teachers need to know **why** students struggle, **who** needs help first, and **whether extra practice worked**. Stepwise's unique features:

- **Class skill tree:** class-wide mastery per concept, with the students behind each gap.
- **Attention prioritizer:** a ranked list of students who need the teacher, each with the reason.
- **Guided learning resources:** short, teacher-approved lessons for each student's weak spot.
- **Verification pop quizzes:** check whether the practice worked; results flow back to the teacher and parent.

Around these, we kept a strict human-in-the-loop design: every AI output is a suggestion that the teacher checks before anyone else sees it.

---

## Run it locally

Requirements: **Node.js 18 or newer** (the project targets Node 22) and npm.

```bash
git clone https://github.com/farahsadek/stepwise_HCI.git
cd stepwise_HCI
npm install
npm run dev          # opens on http://localhost:8443
```

Production build and preview:

```bash
npm run build        # output in dist/
npm run preview      # serves dist/ on http://localhost:8443
```

If port 8443 is busy: `npx vite --port 5173`. The camera works on `localhost` or https; otherwise use *Use sample photo (demo)*.

---

## Features (Milestone 2 feature list → prototype)

All features from our Milestone 2 list are implemented, in English and German, in all three roles.

### A. Shared platform
| # | Feature | Where |
|---|---|---|
| A1 | Role-based login and logout | Login screen (validation, demo accounts); name menu → Log out |
| A2 | English and German | EN/DE switch on login and in every role; exam language chosen per upload |
| A3 | Notification center | Bell with unread count; Unread/All tabs; created by real actions |
| A4 | Child-friendly accessibility | Student toolbar: read aloud (with highlighting), text size A/A+/A++, high contrast; large buttons (≥ 48 px), text ≥ 14 px |
| A5 | Activity history | Teacher → Activity history (filters, download); role-filtered lists for student and parent |

### B. Student view
| # | Feature | Where |
|---|---|---|
| B1 | Dashboard | Home: Quiz 4 card, progress, today's focus, updates from the teacher |
| B2, B20 | Upload with guidance | Upload: photo tips, camera capture, photo or PDF files, several pages |
| B3 | Preview and quality check | Each page is checked on the device (blurry / too dark / too small); retake or remove |
| B4 | Submission status | 5-step tracker: sent → writing checked → AI marks → marks checked → results ready |
| B5 | Teacher-confirmed results | Score appears only after the teacher publishes |
| B6 | Question-by-question feedback | Feedback: "Why?" explanation for each mistake |
| B7–B9 | Learning gaps, recurring mistake, support alerts | Feedback cards; encouraging notification when the teacher confirms the flag |
| B10–B12 | Resources, pop quiz, quiz feedback | Practice: mini lesson + 20 s video → 3 questions → results with explanations |
| B13, B14 | Progress and practice tracking | Progress: quiz history, per-topic trend, practice list |
| B16, B21 | Notifications and reminders | Bell, home updates, reminder if practice is still open |
| B17, B18 | Ask the teacher, report an error | Buttons on every question; answers appear in *My messages* |
| B19 | Profile | Name menu → My profile |

### C. Teacher view
| # | Feature | Where |
|---|---|---|
| C1 | Dashboard | Overview: class picker, metrics, "To do today", class focus areas |
| C24 | Attention prioritizer | Overview: ranked students with reasons and actions |
| C2, C27, C25, C19, C20 | Students, search/filter, student record with gap evidence | Students → Open record |
| C3, C4, C6 | Assessments, marking scheme, submissions, bulk upload | Assessments |
| C5, C7–C10 | Original scan, OCR verification and correction | Review queue → Verify OCR (editable answer, suggestions, Enter = next) |
| C11–C14 | AI grading, explanation, override, uncertainty | Review queue → Review mark (all 8 AI marks, least certain first, criteria) |
| C21 | Mistake tags | Review mark → mistake tags (AI suggestion, editable) |
| C15, C16 | Review by question, bulk correction and saved rules | Review by question |
| C17 | Approval and publication | Review queue → Publish (blocked until OCR and marks are confirmed) |
| C18 | Gradebook and export | Gradebook → CSV export |
| C22, C30 | Red flag review, resource approval | Review queue → Red flag |
| C23, C33 | Skill tree, revision planning | Skill tree |
| C26, C31 | Class overview, pop-quiz monitoring | Class insights |
| C29, C32 | Feedback editing, messages | Review mark (feedback); Messages (questions, error reports, parent messages, notes) |
| C34 | Profile and settings | Name menu → My profile |

### D. Parent view (bonus)
| # | Feature | Where |
|---|---|---|
| D1 | Dashboard | Overview tab |
| D2 | Results and feedback | Quiz results tab (plain-language explanations) |
| D3, D4 | Learning gaps and teacher-confirmed alerts | Overview learning alert (only after the teacher confirms and shares) |
| D5, D7 | Progress, practice and pop quiz | Progress tab; practice card |
| D6 | Recommended resources | Help at home tab (teacher-approved video, activity, printable) |
| D8 | Teacher communication | Messages tab |
| D9 | Profile and child selection | Child switcher (Khadija / Yara); name menu → My profile |
| D10 | Progress report and acknowledgment | Overview → report download and "I have read this report" |

---

## Design decisions

- **One visual language at three intensities.** Student: playful but not babyish (ivory background, thick outlines, offset shadows, pencil mascot, pastel colours). Teacher: calm and professional (sage, dusty blue, sand; thin outlines; no mascots). Parent: warm but mature.
- **Status is never shown by colour alone.** Every status has an icon and a text label.
- **Human in the loop.** Students and parents never see AI output the teacher has not confirmed; every teacher decision is recorded in the activity history.

---

## Project structure

```
src/
  App.tsx            login, student / teacher / parent shells, review workflow, notifications
  teacher.tsx        teacher pages (students, assessments, gradebook, skill tree, messages, …)
  parent.tsx         parent sections (results, progress, help at home, messages, report)
  student-media.tsx  camera capture, photo quality check, lesson video
  store.ts           shared demo data (class of 22, marking scheme, messages, resources)
  activity.tsx       activity history store and views
  accessibility.tsx  student read-aloud / text size / contrast toolbar
  ui.tsx             Icon, Button, Status
  index.css          all styles (Tailwind v4 is set up but most styling is plain CSS)
```

Stack: React 19, TypeScript, Vite 8. The project started in Figma Make and was then extended by hand. The `.figma/` folder is Figma Make's configuration and is not needed to run the app.

---

## Deployment (GitHub Pages)

Every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). The workflow type-checks the code, builds it with `BASE_PATH=/stepwise_HCI/` (Pages serves the site from that sub-folder), and publishes `dist/` to https://farahsadek.github.io/stepwise_HCI/.

One-time setup in the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

---

## Known limitations

- **AI is simulated.** OCR readings, marks, confidence values, mistake tags and suggestions are hard-coded for the demo story (allowed by the project description). The photo quality check really runs on the device, using a simple sharpness/brightness heuristic.
- **In-memory data.** Everything resets on page refresh; there is no back end or database.
- **One demo class.** Full data exists for Grade 4B (22 students), with Khadija's Quiz 4 as the detailed story. The sibling account (Yara) shows a short overview only.
- **Simplified parts:** review-by-question covers Q5 and Q7; bulk upload matches papers to the one missing student; new assessments are saved as drafts without a question editor; email options are for show.
- **German** covers the interface of all three roles. Text that students, parents or teachers type themselves is shown as written, and the scanned exam paper stays in the exam's own language.
- **Read aloud** uses the browser's speech voices; if none are installed, it highlights text at reading pace without sound.

---

## Team HNFOB

Basmala Mohamed · Hana Tobar · Nour Tarek · Farah Sadek · Omar Emad
Instructor: Dr. Aya Salama · TAs: Samaa Soliman, Aml Yasser

## Use of AI tools

The interface was first generated with Figma Make and then developed further with an AI coding assistant (Claude Code). As the course requires, the full history of our AI chats and prompts is submitted with the milestone deliverables. The research, interview, personas, task analyses and design decisions come from the team.
