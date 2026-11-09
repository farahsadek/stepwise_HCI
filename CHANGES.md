# Changes

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
