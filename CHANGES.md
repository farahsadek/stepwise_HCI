# Changes

## 2026-11-11 (2) — Nielsen heuristics (#1, #2, #3, #5, #6, #9 + #4, #10)

New file `src/heuristics.tsx`: `useEscape`, `HelpTip`, `ErrorNote`, `GradingLoader`, `ConfirmDialog`.
No implemented feature was removed or changed in behaviour; all additions are on top.

- #1 "AI is grading …" progress (spinner + progress bar + step text, role=status) the first time a
  paper's marks open, and again when the verified answer changes. Marks step shows the AI draft total
  (14/25 with 578, 17/25 with 528) and the confirmed total.
- #2 Student/parent wording: "building confidence" and "visuellen Modellen" reworded; scan of all
  student and parent screens (before/after publish, EN/DE) finds no OCR/confidence/model/flag.
- #3 Undo in the toast for confirm, override, reject/dismiss and the red-flag confirm/dismiss/
  postpone: restores marks, score, queue badge, ranking and decision; the activity entry stays,
  struck through, "undone" (`markActivityUndone`). Undo toasts stay 9 s. Escape closes every dialog,
  the drawer, the account menu and tooltips. Upload wizard: Cancel on step 1, Back on step 2;
  pop quiz: "Previous question" (answers kept).
- #5 Publish asks for confirmation (score, parent sharing, practice plan; Cancel / Publish). Override
  needs a reason when the mark differs from the AI mark (reason saved in the log). Exam language must
  be chosen before "Send to my teacher".
- #6 Every icon-only button has aria-label + tooltip (bell, close buttons). Review screens show
  student · quiz · question · step at the top.
- #9 Errors say what happened and what to do, with icon + role=alert, EN/DE: student empty fields,
  wrong PIN, empty email/password, wrong password, blurry/dark/small photo, missing exam language,
  empty override reason, publish blocked (names the missing step, button to go there).
- #4 One wording: parent "Teacher reviewing" → "Teacher checking"; parent tracker
  Sent → Teacher checking → Results ready (as the student's).
- #10 "What does this mean?" tooltips (keyboard: focus/Enter, Escape) for OCR confidence, AI
  suggestion, red flag, attention rank, share with parent.
- Fixed: German red-flag status showed "Flag postponed" in English.

Tests: new `pw/e2e-heuristics.mjs` EN/DE 43/43; `pw/jargon.mjs` 0 hits EN/DE; `pw/iconaudit.mjs`
27 icon-only buttons, 0 issues EN/DE; all other suites pass EN/DE (A+B 23/23 incl. language gate);
layout scan clean.

## 2026-11-11 — Questions, bulk upload, class performance, pop-quiz follow-up

- C3 New assessment: questions editor (question, model answer, marks, optional partial-mark rule),
  add/remove, "Start from Quiz 4's questions"; total marks are the sum; saving explains what is
  missing; saved assessments show "N questions" and open to list them (Quiz 4 shows its 8).
- C6 Bulk upload: drop zone or file picker for many scans; each file is matched to a student by the
  name in the file name, can be changed, gets an on-device quality check (blurry/dark/small), and
  cannot be added while unmatched. Missing papers are added (Judy), others get an extra page.
  "Try 3 sample scans" for testing without files. Replaces the old button that always said "Judy".
- C1/C26 Classes: the class picker works (Grade 4A, 4B, 4C). 4A/4C dashboards show their own state.
  Class insights is now "Class performance": average and change, most misunderstood concepts (share
  of students + common mistake), questions most often wrong, assessment trend chart, students who
  need support, and "Compare classes" (one line per class + table). 4B figures are live.
- C31 Pop-quiz monitoring: before practice (same skill in the last quiz) → pop quiz per student with
  a before/after marker, change in points, class summary (completed, average before → after,
  improved), and a next step: mark gap resolved (3/3), assign another round (2/3, notifies Khadija),
  or add to a small group (0–1). The outcome shows on the student record.
- Fixed: checkboxes in the new-assessment form were stretched to full width.

Tests: new `pw/e2e-class.mjs` EN/DE 28/28; C 37/37 & 38/38, review 29/29, A+B, B12/13, D, fixes,
read-aloud pass; layout scan (22 screens × 12 sizes) clean.

## 2026-11-10 (8) — Teacher review: OCR alerts, shortcuts, override, by question, bulk rules

- C8 OCR confidence alerts: class-wide "Text checks · least certain first" list (Salma Q7 52 %,
  Khadija Q2 61 %, Mariam Q5 74 %, Khadija Q6 78 %) on the review page; each paper lists its
  readings sorted by confidence with uncertain ones highlighted; "To do today" counts readings.
- C10 correction shortcuts: Khadija has a second flagged reading (Q6 read as "9O", O/0 confusion;
  her answer 90 and score are unchanged). Suggestions are computed from commonly confused characters
  (7↔2/1, O↔0, 4↔9, <↔> …), the one matching the model answer first, with a warning that this is not
  proof; the uncertain character is highlighted. Keys: Enter = verify + next flagged reading (then
  marks), Alt+↓/↑ = next/previous flagged, Alt+1–3 = pick a suggestion; "Previous flagged" button.
- C12 grade review: "Dismiss" is now "Reject AI mark" for every student (stays in the queue, with
  Undo). Fixed: Override for Mariam/Salma ignored the entered mark and showed Khadija's answer; it
  now saves the mark (out of 4 or 3), the answer, logs AI vs teacher mark, and updates percentages.
  Salma's AI proposal follows her verified text. Help text explains confirm / override / reject.
- C15 review by question: click any mark to change it for one student (Khadija's links to her
  review); "Inconsistent" updates live; edited marks are marked; "Compare Qn across the class" link
  from Mariam's and Salma's mark step.
- C16 bulk correction: preview only lists answers still affected (manual edits excluded); Undo after
  approving; saved rules can be ticked when creating an assessment ("Uses 2 saved rules") and the
  scheme tab shows "Reused in …". Teacher marks and bulk corrections flow into the gradebook.

Tests: new `pw/e2e-review.mjs` EN/DE 29/29; C 36/36 & 37/37 (two-reading OCR path, Alt+1);
A+B, B12/13, D, fixes, read-aloud pass; layout scan clean.

## 2026-11-10 (7) — New logo: sprout on the step

- New mark (option C): two steps with a sprout growing from the top one, matching the login line
  "Every little step helps us grow". One `LogoMark` SVG component in `src/App.tsx` replaces the old
  three bars everywhere (login card, top bar for all roles, teacher sidebar and tablet icon rail).
- Per role: thick outline for students, finer outline for teacher and parent; on the sage teacher
  sidebar the mark sits on a small white tile. On the login page the leaves grow in once (off with
  reduced motion). The word "Stepwise" stays real text; the mark is hidden from screen readers.
- Browser tab icon: `public/favicon.png` re-drawn from the same mark (96×96, transparent).
- Fixed (existed before): after logging in on a phone, or changing tab/page anywhere, the new page
  opened at the old scroll position (about 500px down after login). Pages now start at the top.

Tests: all suites EN/DE pass; layout scan (22 screens × 12 sizes) clean.

## 2026-11-10 (6) — Responsive layout (desktop, laptop, tablet, phone)

- Login: the form no longer scrolls inside its own box (keypad was cut off); it is centred in its
  column; on wide but short screens (laptops) the keypad sits beside the username and PIN so the
  whole form fits; the illustration stays in place while the page scrolls. Phones keep the banner.
- Student and parent pages use more of wide screens (student up to 1480px, parent up to 1320px with
  three card columns from 1500px); the student toolbar lines up with the content.
- Student tab bar shares the width (overflowed on tablets); stacked icon + label from 761–960px.
- Teacher sidebar becomes an icon rail with tooltips from 761–1180px; stat cards and tables reflow;
  the attention table hides its header when rows stack.
- Fixed: on phones the teacher bottom bar hid Class insights, Messages and Activity history, and the
  student bar hid Updates and Progress; both bars now scroll sideways and keep the current tab in view.
- Small-phone fixes (320–414px): top bar, practice status chip, review scan toolbar, chart minimum.

Tests: layout scan of 22 screens × 12 sizes (1920 → 320px): no sideways scroll, no hidden inner
scrolling, no unreachable nav items; German checked at 6 sizes. All suites pass EN/DE.

## 2026-11-10 (5) — Read aloud for teacher and parent (A4)

- Read aloud was only in the student toolbar. The reader is now a shared hook (`useReadAloud` in
  `src/accessibility.tsx`); teacher and parent get a "Read aloud" / "Vorlesen" button in the top
  bar (`ReadAloudButton`). It reads the current page block by block with the same highlight, in the
  chosen language, and stops when the screen, tab or child changes.
- Open dialogs cover the top bar, so the teacher's note dialog, override dialog and exam-context
  drawer have their own "Read aloud" button (as the student's Ask/Report dialog already had); it
  reads the dialog, not the page behind it.
- Text size and high contrast stay student-only (student design decision).
- Phones: the button becomes a 44px icon with a hidden label for screen readers; on the parent bar
  ≤ 440px the "Stepwise" word is hidden (icon stays) so the bar does not scroll sideways.

Tests: new `pw/e2e-readaloud.mjs` EN/DE 19/19; all other suites unchanged and passing.

## 2026-11-10 (4) — D9 child switcher, teacher layout fixes, "practice" spelling

- D9: switching to Yara now keeps the same header, tabs and current tab (Overview, Quiz results,
  Progress, Help at home, Messages), filled with Yara's own data (3 quizzes, topic chart, no
  alerts, empty home help, her own conversation with Ms. Hamed, kept while switching). Profile
  opens from either child. Switching children no longer jumps back to Overview.
- Teacher student record: quiz history is now a line chart with a 0–100 % axis (Quiz 4 shown as
  "not confirmed" until confirmed); the learning-gap cards and the recurring-mistake text no longer
  stick out of their card.
- New assessment form: the native file input (which overflowed) is now a "Choose a file" button
  that shows the chosen file name; fields fit at 1600/1280/1024/390 px. Assessment list columns
  line up (status chips right-aligned).
- Charts no longer widen their card on mobile (parent Progress tab scrolled sideways at 390 px).
- Spelling: "practise" → "practice" everywhere in the UI.

Tests: new `pw/e2e-fixes.mjs` EN/DE 12/12; D 39/39 & 42/42 (Yara tabs added); B12/13 25/25;
C 34/34 & 35/35; A+B 22/22; tsc pass; no console errors.

## 2026-11-10 (3) — B12 pop quiz feedback and B13 progress graphs reworked

- B12: the pop quiz no longer reveals right/wrong during the quiz (answer saved, can change before
  Next). The results screen shows each answer, the right answer and a "Why?" explanation for every
  mistake, then a recommendation by score: 3/3 no extra practice; 2/3 one more round (3 new
  questions, second question set) or the lesson again; 0–1 the lesson first, ask Ms. Ashraf, teacher
  told. "Recommended: 3 new fraction questions" appears in the practice list until a 3/3.
- Fixed: every quiz question showed the same 2/3 vs 3/5 pictures; pictures now match each option.
- B13: new `src/charts.tsx` line chart (validated colour-blind-safe palette, marker shapes, legend,
  end labels, hover/keyboard tooltip, table view). Student Progress shows the quiz-history chart
  before publishing too (Quiz 1–3) and a per-topic line chart Quiz 2–4 (Quiz 4 after publishing).
  The parent Progress tab uses the same chart.
- Teacher/parent wording no longer says "first try". Numbered steps get their numbers back.

Tests: `pw/e2e-B12-13.mjs` EN/DE 25/25; Part A+B 22/22, C 34/34 & 35/35, D 33/33 & 36/36.

## 2026-11-10 (2) — Part D (Parent view)

New file: `src/parent.tsx` (parent sections, German via their own `t(en, de)`). Quiz 4 question
data and Khadija's per-topic history moved to `src/store.ts` so student and parent read the same
numbers. Rule kept: Quiz 4 content only when published AND shared; learning alerts only when the
teacher also confirmed the red flag.

- Parent tabs: Overview, Quiz results, Progress, Help at home, Messages; profile in the user menu.
- D1 Overview adds learning alert, practice status, shared-results list, progress report.
- D2 Quiz results: approved score, teacher note, all 8 questions with plain-language explanations
  (Q2 explains a teacher override).
- D3/D4 Teacher-confirmed learning alert (repeated mistake across Quiz 2–4) + parent notification
  on publish, or when the teacher turns sharing on after publishing.
- D5 Progress chart now includes Quiz 4 when shared; per-topic progress (Quiz 2–4).
- D6 Help at home: teacher-approved video, a 10-minute activity, approved printable.
- D7 Practice and pop-quiz status (assigned / done with first-try score).
- D8 Real conversation with Ms. Ashraf (seeded 4 October message, topic chips); teacher answers in
  Messages; reply notifies the parent; unread badge.
- D9 Child switcher (Khadija, Yara in Grade 2A) and parent profile (language, notification prefs).
- D10 Plain-language report, download (.txt), "I have read this report" → teacher notification,
  activity log entry by the parent, status on the teacher's student record.
- Activity log: parent actor with German name; parents no longer see the teacher's share on/off
  switch events. Teacher replies are now logged with the teacher as actor.

Tests: tsc, build pass. `pw/e2e-D.mjs` EN 33/33, DE 36/36 (DE: override + publish unshared, then
share later); Part C 34/34 / 35/35 and Part A+B 22/22 / 22/22 still pass; no console errors;
parent screens have no horizontal scroll at 390px.

## 2026-11-10 — Part C (Teacher view)

New files: `src/ui.tsx` (Icon/Button/Status moved out of App.tsx, unchanged), `src/store.ts`
(shared class data: roster of 22, marking scheme, messages, resources, rules), `src/teacher.tsx`
(teacher pages, German via their own `t(en, de)`).

- C1 Dashboard: class/subject picker, "To do today" counts (text checks, AI grades, red flags,
  results to send, unanswered messages, practice not done), each linking to the task.
- C2/C27 Students page: 22-student roster with search and filters; C25/C19/C20 student record
  (quiz history, concept mastery, gap evidence, recurring mistake, practice status, messages).
- C3 Assessments: all assessments, new-assessment form (subject, language, marks, date, model
  answers), editable Quiz 4 marking scheme with partial-mark rules and saved rules.
- C4/C6 Quiz 4 submissions with live status per student; bulk upload of scans (matched to Judy,
  the one missing paper).
- C8/C10 OCR: the flagged answer is now an editable field (starts at the AI reading 578),
  suggestion chips, tip on confusable digits, Enter = verify + next. The AI proposal follows the
  verified text (528 → 3/3, otherwise 0/3).
- C11/C12/C14/C21 Grade step: all 8 AI marks sorted least-certain first, marking criteria for Q2,
  editable AI mistake tags.
- C15/C16 Review by question: answer groups per question, inconsistent marks highlighted,
  bulk correction preview + approve, optional saved rule (Hana and Rana Q5 1/4 → 2/4).
- C18 Gradebook (confirmed results only) with real CSV export.
- C23/C33 Skill tree (3 strands, 8 skills, mastery with icon + label), affected students,
  group practice, revision plan.
- C24 Attention list: 5 students, Open record / Send note / Send reminder actions.
- C30 Resource approval on the red-flag step (video on/off, printable replace/remove); the
  student's mini lesson follows it.
- C31 Pop-quiz monitoring on Class insights with reminders.
- C32 Messages: student questions and error reports become threads; teacher replies (suggested
  replies) or resolves; notes to students; student "My messages" page shows replies.
- C34 Teacher profile and settings (language, default parent sharing, email digest demo).
- Fixed: sidebar showed "0" next to Messages when there were no open messages.

Tests: tsc, build pass. Playwright `pw/e2e-C.mjs` EN 34/34, DE 35/35 (DE also covers the
578 → 0/3 path and the override), no console errors; Part A+B regression `pw/e2e-AB.mjs` EN/DE 22/22.

## 2026-11-09 (2) — Parts A and B completed

### Part A
- A2 German: added DE for "PIN keypad", PIN progress label, "Close", "Quiz status",
  "Progress staircase" (teacher/parent charts and parent tracker now pass translated labels).
- A4 Read aloud now also reads status chips, profile details (dt/dd), answer lines, update rows and
  video captions, without reading nested text twice; an open student dialog is read instead of the
  page, and the Ask/Report dialog has its own "Read aloud" button (`requestReadAloud`).
- A4 Feedback "marks" label raised from 12px to the 14px student minimum.
- A4 Teacher drawer close button got an accessible name.
- A5 Practice completion is logged (new activity kind `practice`).

### Part B
- B2 "Take a photo" opens a real camera (getUserMedia) with a capture button; camera stops after
  capture. Without a camera: "Use sample photo (demo)" (first sample is blurry, retakes are clear).
- B3 Multi-page upload: several images/PDFs, per-page quality check on the device (too small /
  too dark / blurry via Laplacian variance), Retake and Remove per page, cannot continue until all
  pages pass, separate "Check your pages" step. New file `src/student-media.tsx`.
- B10 Mini lesson now has an animated 20-second explainer video (4 scenes, captions, play/pause,
  progress, reduced-motion support). Works offline.
- B21 Reminder notification when the student returns after opening the practice plan but has not
  practised (sent once).

### Tests
- tsc, build: pass. Playwright e2e (scratchpad `pw/e2e-AB.mjs`), EN and DE: 22/22 each, no console
  errors, no text < 14px or student buttons < 48px; live-camera path tested with Chromium's fake
  camera; German scan of visible text and aria-label/placeholder/alt on login, all teacher screens,
  student screens and parent found only exam-paper content (English exam) and German compounds.

## 2026-11-09 — Part B (Student view)

Note: this file did not exist before this session; Part A work is not logged here.

### Bug fixed
- Student saw the Quiz 4 score as soon as the teacher confirmed a mark, before publishing.
  The student score is now gated on `published` (StudentApp `score`).

### Added (student view, EN + DE)
- B1 Dashboard: "Updates from Ms. Ashraf" card (latest 3 notifications, click opens target);
  practice reminder / done status in Today's focus.
- B2/B3/B20 Upload: photo tips, real "Choose a file" (image or PDF), page preview
  (blurred on the failed quality check, uploaded image shown if an image was picked).
- B4 Status tracker: 5 steps (Sent → Writing checked → AI marks → Marks checked → Results ready),
  driven by OCR verified / mark confirmed / published.
- B6 Per-question "Why?" explanation for every mistake; teacher's edited feedback shown in DE too.
- B7 "Your learning spots" card; B8 "A mistake that came back" card (only when the teacher
  confirmed the red flag and published).
- B9 Learning-support notification to the student on publish when the flag is confirmed
  (new notification target `practice`).
- B10–B12 Practice = teacher-approved mini lesson (+ print worksheet, demo) → 3-question pop quiz
  (first-try answers recorded) → results screen with explanations; teacher notification includes score.
- B13/B14 Progress page: per-topic trend (Quiz 2–4, Quiz 4 only after publish) and practice list.
- B17/B18 "Ask Ms. Ashraf" and "Something wrong?" dialog per question → teacher notification
  + activity log (new activity kinds `question`, `report`).
- B19 Student profile page (user menu → My profile).
- Back from the notification center now clears the old navigation request.

### Tests
- `npx tsc --noEmit`, `npm run build`: pass.
- Playwright (vite preview) full path EN (confirm, share on, 17/25 68%) and DE
  (override 2/3, share off, 16/25 64%): 28/28 checks each, no console errors, no English
  words found on German screens.
