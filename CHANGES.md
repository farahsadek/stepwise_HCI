# Changes

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
