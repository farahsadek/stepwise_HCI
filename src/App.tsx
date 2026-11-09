import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { ActivityHistoryPage, RecentActivity, RoleActivity, logActivity } from "./activity";
import { AccessibilityToolbar, requestReadAloud } from "./accessibility";
import { CameraCapture, ExplainerVideo, analyzePage, type PageQuality } from "./student-media";

type Role = "student" | "teacher" | "parent";
type StudentView =
  | "home"
  | "feedback"
  | "practice"
  | "upload"
  | "notifications"
  | "progress"
  | "profile";
type PracticePhase = "lesson" | "quiz" | "result";
type HelpRequest = { mode: "ask" | "report"; question: number };
type TeacherView = "overview" | "review" | "insights" | "activity";
type ReviewStage = "ocr" | "grade" | "redflag" | "publish";
type ReviewStudent = "Khadija" | "Mariam" | "Salma";
type ToastState = { message: string; actionLabel?: string; onAction?: () => void };
type Language = "EN" | "DE";
type NotificationTarget = "feedback" | "practice" | "review" | "insights" | "summary";
type AppNotification = {
  id: number;
  role: Role;
  title: Record<Language, string>;
  message: Record<Language, string>;
  action: Record<Language, string>;
  target: NotificationTarget;
  createdAt: number;
  read: boolean;
};
type NavigationRequest = { role: Role; target: NotificationTarget; id: number } | null;
type AddNotification = (
  role: Role,
  title: Record<Language, string>,
  message: Record<Language, string>,
  action: Record<Language, string>,
  target: NotificationTarget,
) => void;
let nextNotificationId = 1;
type IconName =
  | "arrow"
  | "bell"
  | "book"
  | "check"
  | "chevron"
  | "clock"
  | "close"
  | "edit"
  | "eye"
  | "family"
  | "flag"
  | "grid"
  | "home"
  | "idea"
  | "language"
  | "lock"
  | "logout"
  | "menu"
  | "message"
  | "person"
  | "play"
  | "review"
  | "school"
  | "spark"
  | "speaker"
  | "star"
  | "trend"
  | "warning";

const germanCopy: Record<string, string> = {
  Notifications: "Benachrichtigungen",
  Unread: "Ungelesen",
  All: "Alle",
  "Mark all as read": "Alle als gelesen markieren",
  "No unread notifications": "Keine ungelesenen Benachrichtigungen",
  "You’re all caught up.": "Sie sind auf dem neuesten Stand.",
  "Notification history": "Benachrichtigungsverlauf",
  "Back to dashboard": "Zurück zur Übersicht",
  "Just now": "Gerade eben",
  Teacher: "Lehrerin",
  Parent: "Elternteil",
  "Log out": "Abmelden",
  Overview: "Übersicht",
  "Review queue": "Prüfwarteschlange",
  "Class insights": "Klassenanalyse",
  "Grade 4B teacher": "Lehrerin der Klasse 4B",
  "18 OCTOBER": "18. OKTOBER",
  "Grade 4B assessment overview": "Bewertungsübersicht Klasse 4B",
  "Open review queue": "Prüfwarteschlange öffnen",
  "Exams confirmed": "Bestätigte Arbeiten",
  "Class average": "Klassendurchschnitt",
  "RANKED ATTENTION": "PRIORISIERTE AUFMERKSAMKEIT",
  "Needs your decision": "Ihre Entscheidung ist erforderlich",
  "Rank / student": "Rang / Kind",
  Urgency: "Dringlichkeit",
  Why: "Begründung",
  Action: "Aktion",
  High: "Hoch",
  Medium: "Mittel",
  "Support plan": "Förderplan",
  "OCR mismatch": "OCR-Abweichung",
  Confirmed: "Bestätigt",
  Dismissed: "Verworfen",
  "Unclear answer": "Unklare Antwort",
  "Partial reasoning": "Teilweise nachvollziehbar",
  "Low OCR confidence changes 3 marks.": "Niedrige OCR-Sicherheit beeinflusst 3 Punkte.",
  "Answer and working are both unclear.": "Antwort und Rechenweg sind unklar.",
  "AI proposes partial credit for reasoning.": "Die KI schlägt Teilpunkte für den Rechenweg vor.",
  "Fraction-comparison error confirmed; practice assigned":
    "Fehler beim Bruchvergleich bestätigt; Übung zugewiesen",
  Review: "Prüfen",
  View: "Ansehen",
  "LEARNING GAPS": "LERNLÜCKEN",
  "Class focus areas": "Schwerpunkte der Klasse",
  Explore: "Ansehen",
  "Comparing fractions": "Brüche vergleichen",
  "9 of 22 students": "9 von 22 Kindern",
  "Showing working": "Rechenweg zeigen",
  "6 of 22 students": "6 von 22 Kindern",
  "AI suggestion": "KI-Vorschlag",
  "Create a 10-minute visual fraction warm-up for Monday.":
    "Erstellen Sie für Montag eine 10-minütige visuelle Bruchübung.",
  "Back to overview": "Zurück zur Übersicht",
  "OCR VERIFICATION": "OCR-PRÜFUNG",
  "OCR verification": "OCR-Prüfung",
  "QUESTION GRADE": "AUFGABENBEWERTUNG",
  "Question grade": "Aufgabenbewertung",
  "REPEATED ERROR": "WIEDERHOLTER FEHLER",
  "Repeated error": "Wiederholter Fehler",
  "PUBLISH RESULTS": "ERGEBNISSE VERÖFFENTLICHEN",
  "Review evidence and record a teacher decision.":
    "Prüfen Sie die Nachweise und dokumentieren Sie Ihre Entscheidung.",
  "exams are waiting for review.": "Arbeiten warten auf Prüfung.",
  "exams waiting for review": "Arbeiten warten auf Prüfung",
  "of 22": "von 22",
  "Mark confirmed": "Bewertung bestätigt",
  "Decision required": "Entscheidung erforderlich",
  "Verify OCR": "OCR prüfen",
  "Review mark": "Bewertung prüfen",
  "Red flag": "Hinweis",
  Publish: "Veröffentlichen",
  "Original scan": "Originalscan",
  "Exam context": "Kontext der Arbeit",
  "EXTRACTED TEXT": "ERKANNTER TEXT",
  "Verify OCR before grading": "OCR vor der Bewertung prüfen",
  confidence: "Sicherheit",
  "Check answer": "Antwort prüfen",
  "· Check answer": "· Antwort prüfen",
  "96% confidence": "96 % Sicherheit",
  "89% confidence": "89 % Sicherheit",
  "OCR verified": "OCR geprüft",
  "Next flagged": "Nächste Markierung",
  "Question evidence": "Nachweis zur Aufgabe",
  "AI MARK PROPOSAL": "KI-BEWERTUNGSVORSCHLAG",
  "Award 3 of 3 marks": "3 von 3 Punkten vergeben",
  "Award 2 of 4 marks": "2 von 4 Punkten vergeben",
  "Hold for teacher decision": "Entscheidung der Lehrkraft erforderlich",
  "Uncertainty: Medium": "Unsicherheit: Mittel",
  "Uncertainty: High": "Unsicherheit: Hoch",
  "Uncertainty:": "Unsicherheit:",
  "The corrected answer 528 matches the expected result. The calculation is correct.":
    "Die korrigierte Antwort 528 entspricht dem erwarteten Ergebnis. Die Rechnung ist richtig.",
  "The response contains partial evidence, but the reasoning is incomplete.":
    "Die Antwort enthält teilweise Nachweise, aber der Rechenweg ist unvollständig.",
  "Student answer": "Antwort des Kindes",
  "See scan": "Scan ansehen",
  "AI mark": "KI-Bewertung",
  "Teacher mark": "Bewertung der Lehrkraft",
  "Not confirmed": "Nicht bestätigt",
  "Feedback to student": "Feedback an das Kind",
  "Confirm AI mark": "KI-Bewertung bestätigen",
  Override: "Ändern",
  Dismiss: "Verwerfen",
  "REPEATED LEARNING GAP": "WIEDERHOLTE LERNLÜCKE",
  "Fraction-comparison error": "Fehler beim Bruchvergleich",
  "Khadija has made the same comparison error across three quizzes. Confirming creates a teacher-visible support flag.":
    "Khadija hat in drei Quizzen denselben Vergleichsfehler gemacht. Durch die Bestätigung wird ein Förderhinweis erstellt.",
  "Incorrect comparison": "Falscher Vergleich",
  "Flag confirmed": "Hinweis bestätigt",
  "Flag dismissed": "Hinweis verworfen",
  "Flag postponed": "Hinweis zurückgestellt",
  Flag: "Hinweis",
  Confirm: "Bestätigen",
  Postpone: "Zurückstellen",
  "FINAL CHECK": "ABSCHLUSSPRÜFUNG",
  "Publish Khadija’s results": "Khadijas Ergebnisse veröffentlichen",
  "All flagged text has been checked.": "Alle markierten Texte wurden geprüft.",
  "Complete OCR verification first.": "Schließen Sie zuerst die OCR-Prüfung ab.",
  Complete: "Erledigt",
  Required: "Erforderlich",
  "Marks confirmed": "Bewertungen bestätigt",
  "Confirm all question marks first.": "Bestätigen Sie zuerst alle Bewertungen.",
  "Share with parent": "Mit Eltern teilen",
  "Allow Khadija’s parent to see the published summary.":
    "Erlaubt Khadijas Eltern, die veröffentlichte Zusammenfassung zu sehen.",
  "Results published": "Ergebnisse veröffentlicht",
  "Student feedback is available": "Das Feedback für das Kind ist verfügbar",
  " and the parent summary is shared": " und die Zusammenfassung wurde mit den Eltern geteilt",
  Published: "Veröffentlicht",
  "Publish results": "Ergebnisse veröffentlichen",
  "GRADE 4B · 22 STUDENTS": "KLASSE 4B · 22 KINDER",
  "Class learning insights": "Lernanalyse der Klasse",
  "Quiz 4: Fractions and word problems": "Quiz 4: Brüche und Sachaufgaben",
  "Fractions and word problems": "Brüche und Sachaufgaben",
  "Assign practice set": "Übungsset zuweisen",
  "OVER FOUR QUIZZES": "ÜBER VIER QUIZZE",
  "Class progress": "Klassenfortschritt",
  "Up 12 points": "12 Punkte höher",
  "Quiz 1": "Quiz 1",
  "Quiz 2": "Quiz 2",
  "Quiz 3": "Quiz 3",
  "Quiz 4": "Quiz 4",
  "SKILL BREAKDOWN": "KOMPETENZÜBERSICHT",
  "Where support is needed": "Wo Unterstützung nötig ist",
  "59% secure": "59 % sicher",
  "Explaining working": "Rechenweg erklären",
  "73% secure": "73 % sicher",
  "Multiplication facts": "Einmaleins",
  "Word problems": "Sachaufgaben",
  "91% secure": "91 % sicher",
  "STUDENT SNAPSHOT": "ÜBERSICHT DER KINDER",
  "Students requiring support": "Kinder mit Unterstützungsbedarf",
  "Plan support": "Förderung planen",
  "On track": "Im Plan",
  "Add note": "Notiz hinzufügen",
  "TEACHER OVERRIDE": "ÄNDERUNG DURCH LEHRKRAFT",
  "Enter the answer and mark": "Antwort und Bewertung eingeben",
  "This replaces the AI proposal and updates the total score.":
    "Dies ersetzt den KI-Vorschlag und aktualisiert die Gesamtpunktzahl.",
  "Mark awarded": "Vergebene Punkte",
  Cancel: "Abbrechen",
  "Save override": "Änderung speichern",
  "EXAM CONTEXT": "KONTEXT DER ARBEIT",
  "Current score": "Aktuelle Punktzahl",
  "Not graded": "Nicht bewertet",
  Questions: "Aufgaben",
  "8 total": "8 insgesamt",
  "Prior pattern": "Bisheriges Muster",
  "Multiplication is consistently secure. Fraction comparison also appeared as a gap in Quiz 3.":
    "Multiplikation ist durchgehend sicher. Der Bruchvergleich war bereits in Quiz 3 eine Lernlücke.",
  "Review the scan and AI explanation before confirming a mark.":
    "Prüfen Sie Scan und KI-Erklärung, bevor Sie eine Bewertung bestätigen.",
  "View class insights": "Klassenanalyse ansehen",
  "The flagged answer is saved as": "Die markierte Antwort wurde gespeichert als",
  "Strong multiplication. Practise comparing fractions with visual models.":
    "Sichere Multiplikation. Übe den Bruchvergleich mit visuellen Modellen.",
  "Show each step so your reasoning is clear.":
    "Zeige jeden Schritt, damit dein Rechenweg verständlich ist.",
  "Use a fraction model before choosing the comparison sign.":
    "Nutze ein Bruchmodell, bevor du das Vergleichszeichen auswählst.",
  "KHADIJA’S LEARNING": "KHADIJAS LERNEN",
  "A clear view of her learning.": "Ein klarer Blick auf ihren Lernstand.",
  "Grade 4B · Ms. Somaya Ashraf": "Klasse 4B · Frau Somaya Ashraf",
  New: "Neu",
  "QUIZ 4 · MATHEMATICS": "QUIZ 4 · MATHEMATIK",
  "Ms. Ashraf is checking Khadija’s quiz. You’ll be notified when results are ready.":
    "Frau Ashraf prüft Khadijas Quiz. Sie werden benachrichtigt, sobald die Ergebnisse bereit sind.",
  "Results not shared yet": "Ergebnisse noch nicht geteilt",
  "Quiz 4 results are ready but have not been shared with you yet.":
    "Die Ergebnisse von Quiz 4 sind bereit, wurden aber noch nicht mit Ihnen geteilt.",
  Submitted: "Eingereicht",
  "Teacher reviewing": "Lehrerin prüft",
  "QUIZ 3 · MATHEMATICS": "QUIZ 3 · MATHEMATIK",
  "Multiplication and simple fractions": "Multiplikation und einfache Brüche",
  "3 October": "3. Oktober",
  "What’s going well": "Das klappt gut",
  "Khadija is doing well with multiplication facts and uses clear number strategies.":
    "Khadija beherrscht das Einmaleins gut und nutzt klare Rechenstrategien.",
  "What to practise next": "Das sollte sie als Nächstes üben",
  "Use simple drawings to compare halves, thirds and quarters.":
    "Nutzen Sie einfache Zeichnungen, um Hälften, Drittel und Viertel zu vergleichen.",
  "PUBLISHED QUIZZES": "VERÖFFENTLICHTE QUIZZE",
  "Progress so far": "Bisheriger Fortschritt",
  MESSAGES: "NACHRICHTEN",
  "Messages from Ms. Ashraf": "Nachrichten von Frau Ashraf",
  "Ms. Ashraf · 4 October": "Frau Ashraf · 4. Oktober",
  "Khadija is building confidence with multiplication. Short fraction activities at home will help.":
    "Khadija wird beim Multiplizieren sicherer. Kurze Bruchübungen zu Hause helfen ihr.",
  Reply: "Antworten",
  "Message Ms. Ashraf": "Frau Ashraf schreiben",
  "Quiz 4 results appear only after Ms. Ashraf publishes and shares them.":
    "Die Ergebnisse von Quiz 4 erscheinen erst, wenn Frau Ashraf sie veröffentlicht und teilt.",
  "Exam language: English": "Prüfungssprache: Englisch",
  "Exam language: Deutsch": "Prüfungssprache: Deutsch",
  "Learning-gap flag confirmed.": "Lernlücken-Hinweis bestätigt.",
  "Learning-gap flag dismissed.": "Lernlücken-Hinweis verworfen.",
  "Learning-gap decision postponed.": "Entscheidung zur Lernlücke zurückgestellt.",
  "Practice set assigned to Grade 4B.": "Übungsset der Klasse 4B zugewiesen.",
  "Results published and shared with parent.":
    "Ergebnisse veröffentlicht und mit den Eltern geteilt.",
  "Results published to the student.": "Ergebnisse für das Kind veröffentlicht.",
  "Reply draft opened for Ms. Ashraf.": "Antwortentwurf an Frau Ashraf geöffnet.",
  "Message draft opened for Ms. Ashraf.": "Nachrichtenentwurf an Frau Ashraf geöffnet.",
  "Khadija’s item was dismissed and remains in the queue.":
    "Khadijas Eintrag wurde verworfen und bleibt in der Warteschlange.",
  Undo: "Rückgängig",
  English: "Englisch",
  Deutsch: "Deutsch",
  Student: "Schülerin",
  Email: "E-Mail",
  Password: "Passwort",
  Show: "Anzeigen",
  Hide: "Verbergen",
  Username: "Benutzername",
  Clear: "Löschen",
  Back: "Zurück",
  "Log in": "Anmelden",
  "Use demo account": "Demo-Konto verwenden",
  "Secure demo login": "Sicherer Demo-Login",
  "Welcome, learner.": "Willkommen, Lernende!",
  "Teacher login": "Anmeldung für Lehrkräfte",
  "Parent login": "Anmeldung für Eltern",
  "Enter your name and four-number PIN.": "Gib deinen Namen und deine vierstellige PIN ein.",
  "Enter your Stepwise account details.": "Gib deine Stepwise-Zugangsdaten ein.",
  "4-digit PIN": "4-stellige PIN",
  "Your username": "Dein Benutzername",
  "Your password": "Dein Passwort",
  "Enter your email": "Gib deine E-Mail-Adresse ein",
  "Wrong email or password": "E-Mail oder Passwort falsch",
  "Oops, try again": "Hoppla, versuch es noch einmal",
  "Account type": "Kontotyp",
  "Every little step helps us grow.": "Jeder kleine Schritt hilft uns zu wachsen.",
  "Prototype data only — no real student records":
    "Nur Prototyp-Daten – keine echten Schülerdaten",
  "Activity history": "Aktivitätsverlauf",
  "Download log": "Protokoll herunterladen",
  "Activity log downloaded (demo only).": "Protokoll heruntergeladen (nur Demo).",
  "PIN keypad": "PIN-Tastenfeld",
  Close: "Schließen",
  "Quiz status": "Quiz-Status",
  "Progress staircase": "Fortschrittstreppe",
};

function translateText(text: string, language: Language) {
  if (language !== "DE") return text;
  const leading = text.match(/^\s*/)?.[0] ?? "";
  const trailing = text.match(/\s*$/)?.[0] ?? "";
  const core = text.slice(leading.length, text.length - trailing.length);
  if (germanCopy[core]) return `${leading}${germanCopy[core]}${trailing}`;
  const waiting = core.match(/^(\d+) exams are waiting for review\.$/);
  if (waiting) return `${leading}${waiting[1]} Arbeiten warten auf Prüfung.${trailing}`;
  const queue = core.match(/^(\d+) exams waiting for review$/);
  if (queue) return `${leading}${queue[1]} Arbeiten warten auf Prüfung${trailing}`;
  const savedAnswer = core.match(/^Khadija’s answer saved as (.+); (\d)\/3 awarded\.$/);
  if (savedAnswer)
    return `${leading}Khadijas Antwort wurde als ${savedAnswer[1]} gespeichert; ${savedAnswer[2]}/3 Punkte vergeben.${trailing}`;
  const confirmedMark = core.match(/^(.+)’s mark was confirmed\.$/);
  if (confirmedMark)
    return `${leading}Die Bewertung für ${confirmedMark[1]} wurde bestätigt.${trailing}`;
  const ocrVerified = core.match(/^OCR verified for (.+)\.$/);
  if (ocrVerified) return `${leading}OCR für ${ocrVerified[1]} geprüft.${trailing}`;
  const answerSaved = core.match(/^The flagged answer is saved as (.+)\.$/);
  if (answerSaved)
    return `${leading}Die markierte Antwort wurde als ${answerSaved[1]} gespeichert.${trailing}`;
  const pinDigits = core.match(/^(\d) of 4 PIN digits entered$/);
  if (pinDigits) return `${leading}${pinDigits[1]} von 4 PIN-Ziffern eingegeben${trailing}`;
  const noteOpened = core.match(/^Check-in note opened for (.+)\.$/);
  if (noteOpened) return `${leading}Notiz für ${noteOpened[1]} geöffnet.${trailing}`;
  return text;
}

function Localize({ language, children }: { language: Language; children: ReactNode }) {
  const walk = (node: ReactNode): ReactNode => {
    if (typeof node === "string") return translateText(node, language);
    if (Array.isArray(node)) return node.map(walk);
    if (!isValidElement(node)) return node;
    const element = node as ReactElement<{
      children?: ReactNode;
      placeholder?: string;
      "aria-label"?: string;
    }>;
    const props = element.props;
    const localizedProps = {
      ...(typeof props.placeholder === "string"
        ? { placeholder: translateText(props.placeholder, language) }
        : {}),
      ...(typeof props["aria-label"] === "string"
        ? { "aria-label": translateText(props["aria-label"], language) }
        : {}),
    };
    return cloneElement(element, localizedProps, walk(props.children));
  };
  return <>{walk(children)}</>;
}

const paths: Record<IconName, ReactNode> = {
  arrow: (
    <>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 0112 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z" />
      <path d="M9.5 21h5" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A3.5 3.5 0 017.5 2H20v16H7.5A3.5 3.5 0 004 21.5z" />
      <path d="M4 5.5v16M8 6h8M8 10h8" />
    </>
  ),
  check: <path d="M5 12.5l4.2 4.2L19 7" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  edit: (
    <>
      <path d="M4 20l4.2-1 10.6-10.6-3.2-3.2L5 15.8zM13.8 7l3.2 3.2" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  family: (
    <>
      <circle cx="8" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M2.5 20c.4-4 2.2-6 5.5-6s5.1 2 5.5 6M14 15c3.8-.7 6.2 1.1 6.5 5" />
    </>
  ),
  flag: (
    <>
      <path d="M5 21V4M5 5h11l-2 4 2 4H5" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  home: (
    <>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v11h14V10M9 21v-7h6v7" />
    </>
  ),
  idea: (
    <>
      <path d="M9 18h6M10 22h4" />
      <path d="M8.5 15.5A7 7 0 1116 15c-.9.7-1 1.6-1 3H9c0-1.2-.1-1.9-.5-2.5z" />
    </>
  ),
  language: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3.5 9h17M3.5 15h17M12 3c2.5 2.4 3.5 5.4 3.5 9s-1 6.6-3.5 9c-2.5-2.4-3.5-5.4-3.5-9S9.5 5.4 12 3z" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 018 0v3" />
    </>
  ),
  logout: (
    <>
      <path d="M10 4H4v16h6M14 8l4 4-4 4M8 12h10" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  message: <path d="M4 4h16v12H9l-5 4z" />,
  person: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c.7-5 3.3-7 8-7s7.3 2 8 7" />
    </>
  ),
  play: <path d="M9 6l9 6-9 6z" />,
  review: (
    <>
      <path d="M7 3h10v4H7zM5 5H3v17h18V5h-2" />
      <path d="M8 12l2.3 2.3L16 9" />
    </>
  ),
  school: (
    <>
      <path d="M3 10l9-6 9 6-9 5zM6 12v5c3.5 2.5 8.5 2.5 12 0v-5M21 10v7" />
    </>
  ),
  spark: (
    <>
      <path d="M12 2l1.4 5.6L19 9l-5.6 1.4L12 16l-1.4-5.6L5 9l5.6-1.4zM19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z" />
    </>
  ),
  speaker: (
    <>
      <path d="M4 10v4h4l5 4V6l-5 4zM16 9c1.5 1.7 1.5 4.3 0 6M19 6c3 3.4 3 8.6 0 12" />
    </>
  ),
  star: <path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9z" />,
  trend: (
    <>
      <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
      <path d="M4 6l5-3 6 5 6-5" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3L2.5 20h19z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
};

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="logo">
      <span className="steps">
        <i />
        <i />
        <i />
      </span>
      {!compact && <strong>Stepwise</strong>}
    </div>
  );
}

function LearningGarden({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`learning-garden ${className}`}
      viewBox="0 0 520 420"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M57 340c79-45 153-38 211-8 65 34 125 23 202-12"
        stroke="#35433D"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 10"
      />
      <path d="M92 326v-76M77 266c8 0 15 5 15 14-9 0-15-5-15-14Z" fill="#A8C9B5" />
      <path d="M108 242c-9 0-16 6-16 16 10 0 16-6 16-16Z" fill="#A8C9B5" />
      <path
        d="M71 242c0-12 9-22 21-22s21 10 21 22c0 8-5 15-12 19l-9-10-9 10c-7-4-12-11-12-19Z"
        fill="#F5DFA8"
        stroke="#35433D"
        strokeWidth="3"
      />
      <circle cx="92" cy="241" r="6" fill="#35433D" />
      <path
        d="M155 303h105l-12-70h-81l-12 70Z"
        fill="#FFFFFF"
        stroke="#35433D"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="m174 233 14-28h42l14 28" fill="#D8C9EB" />
      <path
        d="m174 233 14-28h42l14 28M207 205v98"
        stroke="#35433D"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M180 252h17M217 252h17M180 269h12M217 269h12"
        stroke="#A8C9B5"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M313 299V184h76v115"
        fill="#B8D8E8"
        stroke="#35433D"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M299 184h105l-52-42-53 42Z"
        fill="#EBC6C8"
        stroke="#35433D"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M339 299v-43h26v43M326 212h14v18h-14M367 212h14v18h-14"
        fill="#FAF8F2"
        stroke="#35433D"
        strokeWidth="3"
      />
      <path
        d="M419 317v-64M406 265c8 0 13 5 13 13-8 0-13-5-13-13ZM433 245c-8 0-14 6-14 15 9 0 14-6 14-15Z"
        fill="#A8C9B5"
      />
      <circle cx="419" cy="239" r="15" fill="#D8C9EB" stroke="#35433D" strokeWidth="3" />
      <path
        d="m53 119 5 11 12 2-9 8 2 12-10-6-11 6 3-12-9-8 12-2 5-11ZM432 95l3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1 3-7Z"
        fill="#F5DFA8"
        stroke="#35433D"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M119 102c12-25 47-26 61-3 21-12 48 3 46 27H98c-2-13 7-23 21-24Z"
        fill="#FFFFFF"
        stroke="#35433D"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M295 77c9-18 34-19 44-2 15-9 35 2 34 20h-94c-2-10 5-18 16-18Z"
        fill="#FFFFFF"
        stroke="#35433D"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="m247 118 5 6 8-2-4 7 5 6-8-1-5 7-1-9-8-2 7-5 1-7Z" fill="#D8C9EB" />
    </svg>
  );
}

function PencilPal({ className = "" }: { className?: string }) {
  return (
    <svg className={`pencil-pal ${className}`} viewBox="0 0 180 130" fill="none" aria-hidden="true">
      <path
        d="M33 105c34 11 76 11 114-1"
        stroke="#35433D"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 9"
      />
      <path
        d="m65 92 56-56 21 21-57 56-25 5 5-26Z"
        fill="#F5DFA8"
        stroke="#35433D"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="m121 36 9-9c4-4 10-4 14 0l7 7c4 4 4 10 0 14l-9 9-21-21Z"
        fill="#EBC6C8"
        stroke="#35433D"
        strokeWidth="4"
      />
      <path d="m65 92 20 21-25 5 5-26Z" fill="#FAF8F2" stroke="#35433D" strokeWidth="3" />
      <path d="m60 118 9-2-6-6-3 8Z" fill="#35433D" />
      <circle cx="102" cy="69" r="2.5" fill="#35433D" />
      <circle cx="113" cy="80" r="2.5" fill="#35433D" />
      <path d="M101 83c5 6 11 7 17 2" stroke="#35433D" strokeWidth="3" strokeLinecap="round" />
      <path
        d="m35 34 4 9 10 1-8 7 2 10-8-5-9 5 2-10-7-7 10-1 4-9Z"
        fill="#D8C9EB"
        stroke="#35433D"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Button({
  children,
  icon,
  variant = "primary",
  onClick,
  className = "",
  disabled = false,
}: {
  children: ReactNode;
  icon: IconName;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button className={`button ${variant} ${className}`} onClick={onClick} disabled={disabled}>
      <Icon name={icon} />
      {children}
    </button>
  );
}

function Status({
  type,
  children,
}: {
  type: "good" | "warn" | "bad" | "neutral";
  children: ReactNode;
}) {
  const icon =
    type === "good" ? "check" : type === "warn" ? "warning" : type === "bad" ? "idea" : "clock";
  return (
    <span className={`status ${type}`}>
      <Icon name={icon} size={16} />
      {children}
    </span>
  );
}

const questions = [
  { n: 1, title: "24 × 6", answer: "144", marks: "2 / 2", state: "good", label: "Correct" },
  { n: 2, title: "132 × 4", answer: "528", marks: "3 / 3", state: "warn", label: "Needs review" },
  {
    n: 3,
    title: "Shade 3/4",
    answer: "2/4 shaded",
    marks: "0 / 3",
    state: "bad",
    label: "Learning gap",
  },
  { n: 4, title: "1/2 + 1/4", answer: "3/4", marks: "3 / 3", state: "good", label: "Correct" },
  {
    n: 5,
    title: "Share 20 apples",
    answer: "4 each, no working",
    marks: "2 / 4",
    state: "warn",
    label: "Partial marks",
  },
  { n: 6, title: "450 ÷ 5", answer: "90", marks: "3 / 3", state: "good", label: "Correct" },
  {
    n: 7,
    title: "Compare 2/3 and 3/5",
    answer: "2/3 < 3/5",
    marks: "0 / 3",
    state: "bad",
    label: "Learning gap",
  },
  {
    n: 8,
    title: "Bus seats word problem",
    answer: "48 seats",
    marks: "4 / 4",
    state: "good",
    label: "Correct",
  },
] as const;

function TopBar({
  role,
  language,
  setLanguage,
  onExit,
  unreadCount,
  onNotifications,
  onProfile,
}: {
  role: Role;
  language: "EN" | "DE";
  setLanguage: (l: "EN" | "DE") => void;
  onExit: () => void;
  unreadCount: number;
  onNotifications: () => void;
  onProfile?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const user =
    role === "student"
      ? { name: "Khadija", role: language === "DE" ? "Schülerin" : "Student", initials: "KA" }
      : role === "teacher"
        ? {
            name: "Somaya Ashraf",
            role: language === "DE" ? "Lehrerin" : "Teacher",
            initials: "SA",
          }
        : {
            name: language === "DE" ? "Khadijas Elternteil" : "Khadija’s parent",
            role: language === "DE" ? "Elternteil" : "Parent",
            initials: "KP",
          };
  return (
    <header className={`topbar ${role}`}>
      <Logo />
      <div className="top-actions">
        <div className="lang-switch" aria-label={language === "DE" ? "Sprache" : "Language"}>
          <Icon name="language" size={18} />
          <button className={language === "EN" ? "active" : ""} onClick={() => setLanguage("EN")}>
            EN
          </button>
          <button className={language === "DE" ? "active" : ""} onClick={() => setLanguage("DE")}>
            DE
          </button>
        </div>
        <button
          className="notification-bell"
          onClick={onNotifications}
          aria-label={
            language === "DE"
              ? `Benachrichtigungen, ${unreadCount} ungelesen`
              : `Notifications, ${unreadCount} unread`
          }
        >
          <Icon name="bell" />
          {unreadCount > 0 && <span>{unreadCount > 9 ? "9+" : unreadCount}</span>}
        </button>
        <div className="user-menu">
          <button
            className="user-menu-trigger switch-role-button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <span className="user-menu-avatar">{user.initials}</span>
            <span className="user-menu-copy">
              <strong>{user.name}</strong>
              <small>{user.role}</small>
            </span>
            <Icon name="chevron" size={17} />
          </button>
          {menuOpen && (
            <div className="user-menu-popover" role="menu">
              <div>
                <span className="user-menu-avatar">{user.initials}</span>
                <span>
                  <strong>{user.name}</strong>
                  <small>{user.role}</small>
                </span>
              </div>
              {onProfile && (
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onProfile();
                  }}
                >
                  <Icon name="person" />
                  {language === "DE" ? "Mein Profil" : "My profile"}
                </button>
              )}
              <button role="menuitem" onClick={onExit}>
                <Icon name="logout" />
                {language === "DE" ? "Abmelden" : "Log out"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Login({
  onLogin,
  language,
  setLanguage,
}: {
  onLogin: (role: Role) => void;
  language: Language;
  setLanguage: (language: Language) => void;
}) {
  const [tab, setTab] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const chooseTab = (role: Role) => {
    setTab(role);
    setError("");
    setEmail("");
    setPassword("");
    setUsername("");
    setPin("");
  };
  const submitAdult = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      setError("Enter your email");
      return;
    }
    const expectedEmail = tab === "teacher" ? "somaya@stepwise.demo" : "parent@stepwise.demo";
    if (email.trim().toLowerCase() !== expectedEmail || password !== "demo1234") {
      setError("Wrong email or password");
      return;
    }
    setError("");
    onLogin(tab);
  };
  const submitStudent = (event: React.FormEvent) => {
    event.preventDefault();
    if (username.trim().toLowerCase() !== "khadija" || pin !== "1234") {
      setError("Oops, try again");
      return;
    }
    setError("");
    onLogin("student");
  };
  const useDemo = () => {
    setError("");
    if (tab === "student") {
      setUsername("khadija");
      setPin("1234");
    } else {
      setEmail(tab === "teacher" ? "somaya@stepwise.demo" : "parent@stepwise.demo");
      setPassword("demo1234");
    }
  };
  const addPinDigit = (digit: number) => {
    setError("");
    setPin((current) => (current.length < 4 ? `${current}${digit}` : current));
  };

  return (
    <Localize language={language}>
    <main className="login">
      <div className="login-art" aria-hidden="true">
        <p className="art-note">Every little step helps us grow.</p>
        <LearningGarden />
      </div>
      <section className="login-panel auth-panel">
        <div className="lang-switch login-lang" role="group" aria-label={language === "DE" ? "Sprache" : "Language"}>
          <Icon name="language" size={18} />
          <button
            type="button"
            className={language === "EN" ? "active" : ""}
            onClick={() => setLanguage("EN")}
          >
            EN
          </button>
          <button
            type="button"
            className={language === "DE" ? "active" : ""}
            onClick={() => setLanguage("DE")}
          >
            DE
          </button>
        </div>
        <Logo />
        <div className="auth-tabs" role="tablist" aria-label="Account type">
          {(["student", "teacher", "parent"] as Role[]).map((role) => (
            <button
              key={role}
              role="tab"
              aria-selected={tab === role}
              className={tab === role ? "active" : ""}
              onClick={() => chooseTab(role)}
            >
              <Icon
                name={role === "student" ? "book" : role === "teacher" ? "school" : "family"}
                size={18}
              />
              {role[0].toUpperCase() + role.slice(1)}
            </button>
          ))}
        </div>
        <div className="auth-heading">
          <div className="eyebrow">
            <Icon name="lock" size={17} /> Secure demo login
          </div>
          <h1>
            {tab === "student"
              ? "Welcome, learner."
              : tab === "teacher"
                ? "Teacher login"
                : "Parent login"}
          </h1>
          <p className="lead">
            {tab === "student"
              ? "Enter your name and four-number PIN."
              : "Enter your Stepwise account details."}
          </p>
        </div>

        {tab === "student" ? (
          <form className="auth-form student-auth" onSubmit={submitStudent}>
            <label>
              Username
              <input
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setError("");
                }}
                autoComplete="username"
                placeholder="Your username"
              />
            </label>
            <fieldset className="pin-field">
              <legend>4-digit PIN</legend>
              <div className="pin-display" aria-label={`${pin.length} of 4 PIN digits entered`}>
                {[0, 1, 2, 3].map((slot) => (
                  <span className={slot < pin.length ? "filled" : ""} key={slot}>
                    {slot < pin.length ? "•" : ""}
                  </span>
                ))}
              </div>
            </fieldset>
            <div className="pin-keypad" aria-label="PIN keypad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button type="button" key={digit} onClick={() => addPinDigit(digit)}>
                  {digit}
                </button>
              ))}
              <button
                type="button"
                className="keypad-action"
                onClick={() => {
                  setPin("");
                  setError("");
                }}
              >
                <Icon name="close" size={17} />
                Clear
              </button>
              <button type="button" onClick={() => addPinDigit(0)}>
                0
              </button>
              <button
                type="button"
                className="keypad-action"
                onClick={() => {
                  setPin((current) => current.slice(0, -1));
                  setError("");
                }}
              >
                <Icon name="arrow" size={17} />
                Back
              </button>
            </div>
            {error && (
              <div className="auth-error" role="alert">
                <Icon name="warning" size={17} />
                {error}
              </div>
            )}
            <div className="auth-actions">
              <button type="submit" className="button primary">
                <Icon name="lock" />
                Log in
              </button>
              <button type="button" className="button secondary" onClick={useDemo}>
                <Icon name="person" />
                Use demo account
              </button>
            </div>
          </form>
        ) : (
          <form className="auth-form" onSubmit={submitAdult}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                autoComplete="email"
                placeholder="name@example.com"
              />
            </label>
            <label>
              Password
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  autoComplete="current-password"
                  placeholder="Your password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  <Icon name="eye" size={18} />
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>
            {error && (
              <div className="auth-error" role="alert">
                <Icon name="warning" size={17} />
                {error}
              </div>
            )}
            <div className="auth-actions">
              <button type="submit" className="button primary">
                <Icon name="lock" />
                Log in
              </button>
              <button type="button" className="button secondary" onClick={useDemo}>
                <Icon name="person" />
                Use demo account
              </button>
            </div>
          </form>
        )}
        <p className="secure">
          <Icon name="lock" size={16} /> Prototype data only — no real student records
        </p>
      </section>
    </main>
    </Localize>
  );
}

function StudentNav({
  view,
  setView,
  de,
  onNotifications,
}: {
  view: StudentView;
  setView: (v: StudentView) => void;
  de: boolean;
  onNotifications: () => void;
}) {
  const items: { id: StudentView; icon: IconName; en: string; de: string }[] = [
    { id: "home", icon: "home", en: "My home", de: "Start" },
    { id: "feedback", icon: "message", en: "Feedback", de: "Feedback" },
    { id: "practice", icon: "play", en: "Practice", de: "Üben" },
    { id: "upload", icon: "book", en: "Upload", de: "Hochladen" },
    { id: "notifications", icon: "flag", en: "Updates", de: "Neuigkeiten" },
    { id: "progress", icon: "trend", en: "Progress", de: "Fortschritt" },
  ];
  return (
    <nav className="student-nav">
      {items.map((item) => (
        <button
          key={item.id}
          className={view === item.id ? "active" : ""}
          onClick={() => (item.id === "notifications" ? onNotifications() : setView(item.id))}
        >
          <Icon name={item.icon} />
          {de ? item.de : item.en}
        </button>
      ))}
    </nav>
  );
}

function StairChart({
  values = [58, 64, 68, 68],
  label = "Progress staircase",
}: {
  values?: number[];
  label?: string;
}) {
  return (
    <div className="stair-chart" aria-label={label}>
      {values.map((value, index) => (
        <div
          className={`stair s${index + 1}`}
          key={`${value}-${index}`}
          style={{ height: `${Math.max(34, value)}%` }}
        >
          <span>{value}%</span>
        </div>
      ))}
    </div>
  );
}

type UploadPage = {
  id: number;
  name: string;
  url: string | null;
  kind: "photo" | "sample" | "image" | "pdf";
  quality: PageQuality;
};

function PageThumb({ page, label, index }: { page: UploadPage; label: string; index: number }) {
  if (page.url) return <img src={page.url} alt={`${label} ${index + 1}`} />;
  if (page.kind === "pdf")
    return (
      <div className="mini-paper pdf-thumb" aria-hidden="true">
        <b>PDF</b>
      </div>
    );
  return (
    <div className={`mini-paper ${page.quality === "blurry" ? "blurry" : ""}`} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </div>
  );
}

function AssessmentTracker({ stage, de }: { stage: number; de: boolean }) {
  // stage = number of finished steps: 1 sent, 3 text checked + AI marks ready,
  // 4 teacher confirmed marks, 5 results published.
  const labels = de
    ? ["Gesendet", "Schrift geprüft", "KI-Vorschlag", "Punkte geprüft", "Ergebnis bereit"]
    : ["Sent", "Writing checked", "AI marks", "Marks checked", "Results ready"];
  return (
    <div
      className="assessment-tracker"
      aria-label={de ? "Bewertungsstand" : "Assessment status"}
      style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}
    >
      {labels.map((label, index) => (
        <div className={index <= stage ? "active" : ""} key={label}>
          <span>{index < stage ? <Icon name="check" size={14} /> : index + 1}</span>
          <small>{label}</small>
        </div>
      ))}
    </div>
  );
}

function StudentApp({
  awardedMark,
  studentAnswer,
  teacherFeedback,
  published,
  ocrVerified,
  redFlagDecision,
  practiced,
  setPracticed,
  practiceScore,
  setPracticeScore,
  recentNotifications,
  onOpenNotification,
  examLanguage,
  setExamLanguage,
  language,
  setLanguage,
  onExit,
  notify,
  unreadCount,
  onNotifications,
  addNotification,
  navigationRequest,
}: {
  awardedMark: number | null;
  studentAnswer: string;
  teacherFeedback: string;
  published: boolean;
  ocrVerified: boolean;
  redFlagDecision: "confirmed" | "dismissed" | "postponed" | null;
  practiced: boolean;
  setPracticed: (v: boolean) => void;
  practiceScore: number | null;
  setPracticeScore: (v: number) => void;
  recentNotifications: AppNotification[];
  onOpenNotification: (item: AppNotification) => void;
  examLanguage: Language;
  setExamLanguage: (language: Language) => void;
  language: "EN" | "DE";
  setLanguage: (l: "EN" | "DE") => void;
  onExit: () => void;
  notify: (m: string | ToastState) => void;
  unreadCount: number;
  onNotifications: () => void;
  addNotification: AddNotification;
  navigationRequest: NavigationRequest;
}) {
  const [view, setView] = useState<StudentView>("home");
  const [practiceStep, setPracticeStep] = useState(0);
  const [practiceAnswer, setPracticeAnswer] = useState<number | null>(null);
  const [uploadStep, setUploadStep] = useState(0);
  const [pages, setPages] = useState<UploadPage[]>([]);
  const [camera, setCamera] = useState<{ replaceId: number | null } | null>(null);
  const nextPageId = useRef(1);
  // Demo script: the first sample photo is blurry, every later one is clear.
  const samplePhotos = useRef(0);
  const [practicePhase, setPracticePhase] = useState<PracticePhase>("lesson");
  const [firstTry, setFirstTry] = useState<boolean[]>([]);
  const [helpRequest, setHelpRequest] = useState<HelpRequest | null>(null);
  const [helpReason, setHelpReason] = useState<"reading" | "mark">("reading");
  const [helpMessage, setHelpMessage] = useState("");
  const de = language === "DE";
  const t = (en: string, german: string) => (de ? german : en);
  // Students never see a score until the teacher publishes.
  const score = published && awardedMark !== null ? 14 + awardedMark : null;
  const percent = score === null ? null : Math.round((score / 25) * 100);
  const trackerStage = published ? 5 : awardedMark !== null ? 4 : ocrVerified ? 3 : 1;
  const flagShared = published && redFlagDecision === "confirmed";
  const questionTitles = de
    ? [
        "24 × 6",
        "132 × 4",
        "Färbe 3/4",
        "1/2 + 1/4",
        "Teile 20 Äpfel",
        "450 ÷ 5",
        "Vergleiche 2/3 und 3/5",
        "Sachaufgabe mit Bussitzen",
      ]
    : questions.map((q) => q.title);
  const mistakeHelp: Record<number, string> = {
    2: t(
      "Ms. Ashraf changed this mark after checking your working.",
      "Frau Ashraf hat diese Punkte nach dem Prüfen deines Rechenwegs geändert.",
    ),
    3: t(
      "3/4 means 3 of 4 equal parts. You shaded 2 parts, so shade one more.",
      "3/4 bedeutet 3 von 4 gleichen Teilen. Du hast 2 Teile gefärbt, färbe noch einen.",
    ),
    5: t(
      "Your answer is right! Write the sum (20 ÷ 5 = 4) to get all the marks.",
      "Deine Antwort stimmt! Schreibe die Rechnung (20 ÷ 5 = 4) auf, dann bekommst du alle Punkte.",
    ),
    7: t(
      "Make the bottom numbers the same: 2/3 = 10/15 and 3/5 = 9/15. 10 is more than 9, so 2/3 is bigger.",
      "Mache die unteren Zahlen gleich: 2/3 = 10/15 und 3/5 = 9/15. 10 ist mehr als 9, also ist 2/3 größer.",
    ),
  };
  const sendHelpRequest = () => {
    if (!helpRequest) return;
    const q = helpRequest.question;
    const note = helpMessage.trim();
    if (helpRequest.mode === "ask") {
      logActivity("question", "Khadija", {
        EN: `Quiz 4 · Q${q}: asked a question${note ? ` – “${note}”` : ""}`,
        DE: `Quiz 4 · A${q}: hat eine Frage gestellt${note ? ` – „${note}“` : ""}`,
      });
      addNotification(
        "teacher",
        { EN: "Question from Khadija", DE: "Frage von Khadija" },
        {
          EN: `Khadija asked about Quiz 4, question ${q}.${note ? ` “${note}”` : ""}`,
          DE: `Khadija hat eine Frage zu Quiz 4, Aufgabe ${q}.${note ? ` „${note}“` : ""}`,
        },
        { EN: "Open review", DE: "Prüfung öffnen" },
        "review",
      );
      notify(t("Your question was sent to Ms. Ashraf.", "Deine Frage wurde an Frau Ashraf gesendet."));
    } else {
      const reason =
        helpReason === "reading"
          ? { EN: "answer read wrongly", DE: "Antwort falsch gelesen" }
          : { EN: "mark may be wrong", DE: "Punkte vielleicht falsch" };
      logActivity("report", "Khadija", {
        EN: `Quiz 4 · Q${q}: ${reason.EN}${note ? ` – “${note}”` : ""}`,
        DE: `Quiz 4 · A${q}: ${reason.DE}${note ? ` – „${note}“` : ""}`,
      });
      addNotification(
        "teacher",
        { EN: "Khadija reported a possible error", DE: "Khadija meldet einen möglichen Fehler" },
        {
          EN: `Quiz 4, question ${q}: ${reason.EN}.${note ? ` “${note}”` : ""}`,
          DE: `Quiz 4, Aufgabe ${q}: ${reason.DE}.${note ? ` „${note}“` : ""}`,
        },
        { EN: "Open review", DE: "Prüfung öffnen" },
        "review",
      );
      notify(
        t(
          "Thank you! Ms. Ashraf will check it again.",
          "Danke! Frau Ashraf prüft es noch einmal.",
        ),
      );
    }
    setHelpRequest(null);
    setHelpMessage("");
  };
  const openHelp = (mode: HelpRequest["mode"], question: number) => {
    setHelpReason("reading");
    setHelpMessage("");
    setHelpRequest({ mode, question });
  };
  const pagesReady =
    pages.length > 0 && pages.every((page) => page.quality === "good" || page.quality === "pdf");
  const putPage = (page: UploadPage, replaceId: number | null) =>
    setPages((current) =>
      replaceId === null
        ? [...current, page]
        : current.map((item) => (item.id === replaceId ? page : item)),
    );
  const checkPage = (id: number, url: string) =>
    analyzePage(url).then((quality) =>
      setPages((current) => current.map((item) => (item.id === id ? { ...item, quality } : item))),
    );
  const addFilePage = (file: File) => {
    const id = nextPageId.current++;
    if (file.type === "application/pdf") {
      putPage({ id, name: file.name, url: null, kind: "pdf", quality: "pdf" }, null);
      return;
    }
    const url = URL.createObjectURL(file);
    putPage({ id, name: file.name, url, kind: "image", quality: "checking" }, null);
    checkPage(id, url);
  };
  const addCameraPage = (url: string) => {
    const id = nextPageId.current++;
    putPage({ id, name: "", url, kind: "photo", quality: "checking" }, camera?.replaceId ?? null);
    checkPage(id, url);
    setCamera(null);
  };
  const addSamplePage = () => {
    const quality: PageQuality = samplePhotos.current++ === 0 ? "blurry" : "good";
    putPage(
      { id: nextPageId.current++, name: "", url: null, kind: "sample", quality },
      camera?.replaceId ?? null,
    );
    setCamera(null);
  };
  const qualityStatus = (quality: PageQuality) =>
    ({
      checking: { type: "neutral" as const, label: t("Checking…", "Wird geprüft…"), advice: "" },
      good: { type: "good" as const, label: t("Clear", "Gut lesbar"), advice: "" },
      pdf: { type: "good" as const, label: t("PDF added", "PDF hinzugefügt"), advice: "" },
      blurry: {
        type: "warn" as const,
        label: t("Blurry", "Unscharf"),
        advice: t("Hold the tablet still and retake it.", "Halte das Tablet ruhig und mache es neu."),
      },
      dark: {
        type: "warn" as const,
        label: t("Too dark", "Zu dunkel"),
        advice: t("Use more light and retake it.", "Nutze mehr Licht und mache es neu."),
      },
      small: {
        type: "warn" as const,
        label: t("Too small", "Zu klein"),
        advice: t("Move closer to the page and retake it.", "Geh näher an die Seite und mache es neu."),
      },
    })[quality];
  const startPractice = () => {
    setPracticePhase("lesson");
    setPracticeStep(0);
    setPracticeAnswer(null);
    setFirstTry([]);
    setView("practice");
  };
  const practiceQuestions = [
    {
      title: t("Which fraction is bigger?", "Welcher Bruch ist größer?"),
      options: ["2/3", "3/5"],
      correct: 0,
      help: t("Two thirds covers more of the whole.", "Zwei Drittel bedecken mehr vom Ganzen."),
    },
    {
      title: t("Which fraction is smaller?", "Welcher Bruch ist kleiner?"),
      options: ["1/4", "1/2"],
      correct: 0,
      help: t("One quarter is smaller than one half.", "Ein Viertel ist kleiner als eine Hälfte."),
    },
    {
      title: t("Which fractions are equal?", "Welche Brüche sind gleich groß?"),
      options: [t("2/4 and 1/2", "2/4 und 1/2"), t("2/4 and 2/3", "2/4 und 2/3")],
      correct: 0,
      help: t(
        "Two quarters is the same as one half.",
        "Zwei Viertel sind gleich groß wie eine Hälfte.",
      ),
    },
  ];
  const currentPractice = practiceQuestions[practiceStep];
  useEffect(() => {
    if (navigationRequest?.role !== "student") return;
    if (navigationRequest.target === "feedback") setView("feedback");
    if (navigationRequest.target === "practice") startPractice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigationRequest]);

  return (
    <div className="app-shell student-shell">
      <TopBar
        role="student"
        language={language}
        setLanguage={setLanguage}
        onExit={onExit}
        unreadCount={unreadCount}
        onNotifications={onNotifications}
        onProfile={() => setView("profile")}
      />
      <StudentNav
        view={view}
        setView={(next) => (next === "practice" ? startPractice() : setView(next))}
        de={de}
        onNotifications={onNotifications}
      />
      <AccessibilityToolbar
        language={language}
        targetSelector=".student-main"
        screenKey={view === "practice" ? `practice-${practicePhase}-${practiceStep}` : view}
      />
      <main className="student-main">
        {view === "home" && (
          <>
            <section className="student-welcome">
              <div>
                <div className="eyebrow">
                  <Icon name="spark" /> {t("Your next step", "Dein nächster Schritt")}
                </div>
                <h1>{t("Hi, Khadija!", "Hallo, Khadija!")}</h1>
                <p>
                  {t("You get stronger with every step.", "Mit jedem Schritt wirst du stärker.")}
                </p>
              </div>
              <div className="avatar">K</div>
              <PencilPal className="welcome-pal" />
            </section>
            <section className="student-grid">
              <article className="card exam-card">
                <div className="card-top">
                  <span className="subject-icon">
                    <Icon name="book" />
                  </span>
                  <Status type={score === null ? "warn" : "good"}>
                    {score === null
                      ? t("Teacher checking", "Lehrerin prüft")
                      : t("Teacher checked", "Von der Lehrerin geprüft")}
                  </Status>
                </div>
                <p className="kicker">{t("MATHEMATICS · GRADE 4B", "MATHEMATIK · KLASSE 4B")}</p>
                <h2>
                  {t("Quiz 4: Fractions and word problems", "Quiz 4: Brüche und Sachaufgaben")}
                </h2>
                {score === null ? (
                  <>
                    <h3 className="waiting-title">
                      {t(
                        "Waiting for Ms. Ashraf to check your quiz",
                        "Warte darauf, dass Frau Ashraf dein Quiz prüft",
                      )}
                    </h3>
                    <AssessmentTracker stage={trackerStage} de={de} />
                  </>
                ) : (
                  <div className="score-row">
                    <strong>
                      {score}
                      <small>/ 25</small>
                    </strong>
                    <div>
                      <b>{percent}%</b>
                      <span>{t("Your score", "Dein Ergebnis")}</span>
                    </div>
                  </div>
                )}
                <Button icon="eye" onClick={() => setView("feedback")}>
                  {t("See my feedback", "Mein Feedback ansehen")}
                </Button>
              </article>
              <article className="card progress-card">
                <div className="section-title">
                  <div>
                    <p className="kicker">{t("YOUR PROGRESS", "DEIN FORTSCHRITT")}</p>
                    <h2>{t("Quiz history", "Quizverlauf")}</h2>
                  </div>
                  <Icon name="trend" size={28} />
                </div>
                {score === null ? (
                  <AssessmentTracker stage={trackerStage} de={de} />
                ) : (
                  <StairChart
                    values={[52, 58, 64, percent ?? 68]}
                    label={t("Progress staircase", "Fortschrittstreppe")}
                  />
                )}
                {practiced && <Status type="good">{t("Practice done", "Übung geschafft")}</Status>}
                <p>
                  <Icon name="trend" size={17} />{" "}
                  {t(
                    "Practice builds your skills. It does not change quiz scores.",
                    "Üben macht dich sicherer. Es ändert keine Quizpunkte.",
                  )}
                </p>
              </article>
            </section>
            <section className="focus-strip">
              <span className="focus-icon">
                <Icon name="idea" size={27} />
              </span>
              <div>
                <p className="kicker">{t("TODAY’S FOCUS", "HEUTIGER FOKUS")}</p>
                <h3>{t("Comparing fractions", "Brüche vergleichen")}</h3>
                <p>
                  {t(
                    "A short lesson, then a 3-question quiz.",
                    "Eine kurze Lektion, dann ein Quiz mit 3 Fragen.",
                  )}
                </p>
                {practiced ? (
                  <Status type="good">
                    {t("Practice done", "Übung geschafft")} · {practiceScore} {t("of", "von")} 3
                  </Status>
                ) : (
                  <Status type="warn">
                    {t("Reminder: your practice is waiting", "Erinnerung: deine Übung wartet")}
                  </Status>
                )}
              </div>
              <Button icon="play" variant="secondary" onClick={startPractice}>
                {practiced ? t("Practice again", "Nochmal üben") : t("Practice now", "Jetzt üben")}
              </Button>
            </section>
            <article className="card home-updates">
              <div className="section-title">
                <div>
                  <p className="kicker">{t("UPDATES", "NEUIGKEITEN")}</p>
                  <h2>{t("From Ms. Ashraf", "Von Frau Ashraf")}</h2>
                </div>
                <Icon name="bell" size={26} />
              </div>
              {recentNotifications.length === 0 ? (
                <p>{t("No new updates yet.", "Noch keine neuen Nachrichten.")}</p>
              ) : (
                recentNotifications.slice(0, 3).map((item) => (
                  <button
                    className={`home-update-row ${item.read ? "" : "unread"}`}
                    key={item.id}
                    onClick={() => onOpenNotification(item)}
                  >
                    <Icon name={item.read ? "check" : "bell"} size={18} />
                    <span>
                      <strong>{item.title[language]}</strong>
                      <small>{item.message[language]}</small>
                    </span>
                    <Icon name="chevron" size={18} />
                  </button>
                ))
              )}
              <Button icon="bell" variant="ghost" onClick={onNotifications}>
                {t("See all updates", "Alle Neuigkeiten ansehen")}
              </Button>
            </article>
          </>
        )}

        {view === "feedback" && (
          <>
            <div className="page-heading">
              <div>
                <button className="back-link" onClick={() => setView("home")}>
                  <Icon name="arrow" /> {t("Back home", "Zurück zum Start")}
                </button>
                <p className="kicker">{t("QUIZ 4 · 17 OCTOBER", "QUIZ 4 · 17. OKTOBER")}</p>
                <h1>{t("Your feedback", "Dein Feedback")}</h1>
              </div>
            </div>
            {score === null ? (
              <div className="feedback-hero card waiting-card">
                <Icon name="clock" size={30} />
                <div>
                  <h2>
                    {t(
                      "Waiting for Ms. Ashraf to check your quiz",
                      "Warte darauf, dass Frau Ashraf dein Quiz prüft",
                    )}
                  </h2>
                  <p>
                    {t(
                      "Your score will appear when the check is finished.",
                      "Deine Punkte erscheinen nach der Prüfung.",
                    )}
                  </p>
                </div>
                <AssessmentTracker stage={trackerStage} de={de} />
              </div>
            ) : (
              <>
                <div className="feedback-hero card">
                  <span className="big-star">
                    <Icon name="check" size={30} />
                  </span>
                  <div>
                    <h2>{t("Good work, Khadija!", "Gut gemacht, Khadija!")}</h2>
                    <p className="teacher-note-label">
                      {t("A note from Ms. Ashraf", "Eine Nachricht von Frau Ashraf")}
                    </p>
                    <p>{translateText(teacherFeedback, language)}</p>
                  </div>
                  <div className="mini-score">
                    <b>{score}/25</b>
                    <span>{t("marks", "Punkte")}</span>
                  </div>
                </div>
                <div className="question-list">
                  {questions.map((q) => {
                    const title = questionTitles[q.n - 1];
                    const help =
                      q.n === 2 ? (awardedMark !== null && awardedMark < 3 ? mistakeHelp[2] : null) : mistakeHelp[q.n];
                    const label =
                      q.n === 2
                        ? t("Teacher checked", "Von der Lehrerin geprüft")
                        : q.state === "good"
                          ? t("Correct", "Richtig")
                          : q.state === "warn"
                            ? t("Keep practising", "Weiter üben")
                            : t("Practice opportunity", "Übungsmöglichkeit");
                    const mark = q.n === 2 ? `${awardedMark} / 3` : q.marks;
                    const answer =
                      q.n === 2
                        ? studentAnswer
                        : de
                          ? [
                              "144",
                              "528",
                              "2/4 gefärbt",
                              "3/4",
                              "je 4, ohne Rechenweg",
                              "90",
                              "2/3 < 3/5",
                              "48 Sitzplätze",
                            ][q.n - 1]
                          : q.answer;
                    return (
                      <article className="question-row" key={q.n}>
                        <div className={`q-number ${q.state}`}>
                          <Icon
                            name={
                              q.state === "good" ? "check" : q.state === "warn" ? "warning" : "idea"
                            }
                          />
                        </div>
                        <div>
                          <p>
                            {t("Question", "Aufgabe")} {q.n}
                          </p>
                          <h3>{title}</h3>
                          <span>
                            {t("Your answer", "Deine Antwort")}: {answer}
                          </span>
                          {help && (
                            <p className="q-why">
                              <Icon name="idea" size={18} />
                              <span>
                                <b>{t("Why?", "Warum?")}</b> {help}
                              </span>
                            </p>
                          )}
                          <div className="q-actions">
                            {help && (
                              <button onClick={() => openHelp("ask", q.n)}>
                                <Icon name="message" size={17} />
                                {t("Ask Ms. Ashraf", "Frau Ashraf fragen")}
                              </button>
                            )}
                            <button onClick={() => openHelp("report", q.n)}>
                              <Icon name="flag" size={17} />
                              {t("Something wrong?", "Stimmt etwas nicht?")}
                            </button>
                          </div>
                        </div>
                        <div className="q-result">
                          <Status type={q.n === 2 ? "good" : q.state}>{label}</Status>
                          <strong>{mark}</strong>
                        </div>
                      </article>
                    );
                  })}
                </div>
                <section className="student-insights">
                  <article className="card">
                    <p className="kicker">{t("WHERE TO PRACTISE", "WO DU ÜBEN KANNST")}</p>
                    <h2>{t("Your learning spots", "Deine Lernbereiche")}</h2>
                    {[
                      {
                        name: t("Comparing fractions", "Brüche vergleichen"),
                        type: "warn" as const,
                        label: t("Needs more practice", "Braucht mehr Übung"),
                      },
                      {
                        name: t("Showing your working", "Rechenweg zeigen"),
                        type: "neutral" as const,
                        label: t("Getting better", "Wird besser"),
                      },
                      {
                        name: t("Multiplication", "Multiplizieren"),
                        type: "good" as const,
                        label: t("Strong", "Stark"),
                      },
                    ].map((spot) => (
                      <div className="learning-spot" key={spot.name}>
                        <strong>{spot.name}</strong>
                        <Status type={spot.type}>{spot.label}</Status>
                      </div>
                    ))}
                  </article>
                  {flagShared && (
                    <article className="card repeat-card">
                      <p className="kicker">{t("A MISTAKE THAT CAME BACK", "EIN FEHLER, DER WIEDERKAM")}</p>
                      <h2>{t("Comparing fractions", "Brüche vergleichen")}</h2>
                      <p>
                        {t(
                          "In three quizzes you looked only at the bottom number. That happens to lots of learners! Ms. Ashraf made a practice plan for you.",
                          "In drei Quizzen hast du nur auf die untere Zahl geschaut. Das passiert vielen Kindern! Frau Ashraf hat einen Übungsplan für dich gemacht.",
                        )}
                      </p>
                      <div className="repeat-evidence">
                        {[
                          ["Quiz 2", "1/2 < 1/3"],
                          ["Quiz 3", "3/5 > 3/4"],
                          ["Quiz 4", "2/3 < 3/5"],
                        ].map(([quiz, example]) => (
                          <span key={quiz}>
                            <small>{quiz}</small>
                            <b>{example}</b>
                          </span>
                        ))}
                      </div>
                      <Status type="warn">
                        {t("Checked by Ms. Ashraf", "Von Frau Ashraf geprüft")}
                      </Status>
                    </article>
                  )}
                </section>
                <div className="next-card">
                  <Icon name="idea" size={30} />
                  <div>
                    <h3>{t("Ready for your next step?", "Bereit für deinen nächsten Schritt?")}</h3>
                    <p>
                      {t(
                        "A short lesson, then a 3-question quiz.",
                        "Eine kurze Lektion, dann ein Quiz mit 3 Fragen.",
                      )}
                    </p>
                  </div>
                  <Button icon="play" onClick={startPractice}>
                    {t("Start practice", "Übung starten")}
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        {view === "practice" && practicePhase === "lesson" && (
          <section className="practice-wrap">
            <div className="practice-top">
              <div>
                <button className="back-link" onClick={() => setView("home")}>
                  <Icon name="arrow" /> {t("Back home", "Zurück zum Start")}
                </button>
                <p className="kicker">{t("MINI LESSON · 2 MINUTES", "MINI-LEKTION · 2 MINUTEN")}</p>
                <h1>{t("Comparing fractions", "Brüche vergleichen")}</h1>
              </div>
              <Status type="good">{t("Chosen by Ms. Ashraf", "Von Frau Ashraf ausgewählt")}</Status>
            </div>
            <article className="practice-card card lesson-card">
              <ExplainerVideo language={language} />
              <ol className="lesson-steps">
                <li>
                  {t(
                    "The bottom number tells how many pieces the whole is cut into.",
                    "Die untere Zahl sagt, in wie viele Stücke das Ganze geteilt ist.",
                  )}
                </li>
                <li>
                  {t(
                    "More pieces means smaller pieces. So 1/4 is smaller than 1/2.",
                    "Mehr Stücke heißt kleinere Stücke. Also ist 1/4 kleiner als 1/2.",
                  )}
                </li>
                <li>
                  {t(
                    "Always look at both numbers. Draw the fractions or make the bottom numbers the same.",
                    "Schau immer auf beide Zahlen. Male die Brüche oder mache die unteren Zahlen gleich.",
                  )}
                </li>
              </ol>
              <div className="lesson-actions">
                <Button
                  icon="play"
                  onClick={() => {
                    setPracticePhase("quiz");
                    setPracticeStep(0);
                    setPracticeAnswer(null);
                    setFirstTry([]);
                  }}
                >
                  {t("Start the quiz", "Quiz starten")}
                </Button>
                <Button
                  icon="book"
                  variant="secondary"
                  onClick={() =>
                    notify(
                      t(
                        "Worksheet ready to print (demo only).",
                        "Arbeitsblatt zum Drucken bereit (nur Demo).",
                      ),
                    )
                  }
                >
                  {t("Print worksheet", "Arbeitsblatt drucken")}
                </Button>
              </div>
            </article>
          </section>
        )}

        {view === "practice" && practicePhase === "quiz" && (
          <section className="practice-wrap">
            <div className="practice-top">
              <div>
                <button className="back-link" onClick={() => setPracticePhase("lesson")}>
                  <Icon name="arrow" /> {t("Back to the lesson", "Zurück zur Lektion")}
                </button>
                <p className="kicker">{t("POP QUIZ", "KURZ-QUIZ")}</p>
                <h1>{currentPractice.title}</h1>
              </div>
              <div className="stepper">
                <span className={practiceStep >= 0 ? "active" : ""} />
                <span className={practiceStep >= 1 ? "active" : ""} />
                <span className={practiceStep >= 2 ? "active" : ""} />
                <small>
                  {practiceStep + 1} {t("of", "von")} 3
                </small>
              </div>
            </div>
            <article className="practice-card card">
              <div className="fraction-visuals">
                {currentPractice.options.map((option, index) => (
                  <div className="practice-option-wrap" key={option}>
                    <button
                      className={practiceAnswer === index ? "selected" : ""}
                      onClick={() => {
                        setPracticeAnswer(index);
                        if (firstTry.length === practiceStep)
                          setFirstTry([...firstTry, index === currentPractice.correct]);
                      }}
                    >
                      <span className={`pie ${index === 0 ? "pie-two" : "pie-three"}`} />
                      <strong>{option}</strong>
                      <small>
                        <Icon name="person" size={16} /> {t("Choose", "Wähle")} {option}
                      </small>
                    </button>
                    {index === 0 && <div className="or">{t("or", "oder")}</div>}
                  </div>
                ))}
              </div>
              {practiceAnswer !== null && (
                <div
                  className={`answer-note ${practiceAnswer === currentPractice.correct ? "correct" : "try"}`}
                >
                  <Icon name={practiceAnswer === currentPractice.correct ? "check" : "idea"} />
                  <div>
                    <strong>
                      {practiceAnswer === currentPractice.correct
                        ? t("That’s right!", "Richtig!")
                        : t("Look once more.", "Schau noch einmal.")}
                    </strong>
                    <p>
                      {practiceAnswer === currentPractice.correct
                        ? currentPractice.help
                        : t("Compare the shaded parts.", "Vergleiche die gefärbten Teile.")}
                    </p>
                  </div>
                </div>
              )}
              <Button
                icon={practiceStep === 2 ? "check" : "arrow"}
                disabled={practiceAnswer !== currentPractice.correct}
                onClick={() => {
                  if (practiceStep < 2) {
                    setPracticeStep(practiceStep + 1);
                    setPracticeAnswer(null);
                    return;
                  }
                  const right = firstTry.filter(Boolean).length;
                  setPracticed(true);
                  setPracticeScore(right);
                  logActivity("practice", "Khadija", {
                    EN: `Fraction lesson and pop quiz: ${right}/3 right the first time`,
                    DE: `Bruch-Lektion und Kurz-Quiz: ${right}/3 beim ersten Versuch richtig`,
                  });
                  addNotification(
                    "teacher",
                    {
                      EN: "Khadija completed practice",
                      DE: "Khadija hat die Übung abgeschlossen",
                    },
                    {
                      EN: `Khadija finished the fraction lesson and pop quiz: ${right} of 3 right the first time.`,
                      DE: `Khadija hat die Bruch-Lektion und das Kurz-Quiz beendet: ${right} von 3 beim ersten Versuch richtig.`,
                    },
                    { EN: "View progress", DE: "Fortschritt ansehen" },
                    "insights",
                  );
                  setPracticePhase("result");
                }}
              >
                {practiceStep === 2
                  ? t("Finish quiz", "Quiz beenden")
                  : t("Next question", "Nächste Aufgabe")}
              </Button>
            </article>
          </section>
        )}

        {view === "practice" && practicePhase === "result" && (
          <section className="practice-wrap">
            <div className="practice-top">
              <div>
                <p className="kicker">{t("QUIZ RESULTS", "QUIZ-ERGEBNIS")}</p>
                <h1>
                  {t(
                    `You got ${practiceScore ?? 0} of 3 right the first time!`,
                    `Du hattest ${practiceScore ?? 0} von 3 beim ersten Versuch richtig!`,
                  )}
                </h1>
              </div>
            </div>
            <div className="question-list practice-results">
              {practiceQuestions.map((question, index) => (
                <article className="question-row" key={question.title}>
                  <div className={`q-number ${firstTry[index] ? "good" : "warn"}`}>
                    <Icon name={firstTry[index] ? "check" : "idea"} />
                  </div>
                  <div>
                    <h3>{question.title}</h3>
                    <span>
                      {firstTry[index]
                        ? t("Right the first time.", "Gleich beim ersten Mal richtig.")
                        : question.help}
                    </span>
                  </div>
                  <div className="q-result">
                    <Status type={firstTry[index] ? "good" : "warn"}>
                      {firstTry[index]
                        ? t("Correct", "Richtig")
                        : t("Keep practising", "Weiter üben")}
                    </Status>
                  </div>
                </article>
              ))}
            </div>
            <div className="next-card">
              <Icon name={practiceScore === 3 ? "star" : "idea"} size={30} />
              <div>
                <h3>
                  {practiceScore === 3
                    ? t("You understand comparing fractions!", "Du kannst Brüche vergleichen!")
                    : t("Almost there!", "Fast geschafft!")}
                </h3>
                <p>
                  {practiceScore === 3
                    ? t("Ms. Ashraf can see your result.", "Frau Ashraf kann dein Ergebnis sehen.")
                    : t(
                        "Read the mini lesson once more, then try again. Ms. Ashraf can see your result.",
                        "Lies die Mini-Lektion noch einmal und versuche es dann wieder. Frau Ashraf kann dein Ergebnis sehen.",
                      )}
                </p>
              </div>
              <div className="lesson-actions">
                <Button icon="trend" onClick={() => setView("progress")}>
                  {t("See my progress", "Meinen Fortschritt ansehen")}
                </Button>
                <Button icon="play" variant="secondary" onClick={startPractice}>
                  {t("Try again", "Nochmal versuchen")}
                </Button>
              </div>
            </div>
          </section>
        )}

        {view === "upload" && (
          <section className="practice-wrap upload-wizard">
            <div className="page-heading">
              <div>
                <p className="kicker">{t("UPLOAD AN EXAM", "ARBEIT HOCHLADEN")}</p>
                <h1>{t("Send your work", "Sende deine Arbeit")}</h1>
                <p>{t("Follow four simple steps.", "Folge vier einfachen Schritten.")}</p>
              </div>
            </div>
            <article className="practice-card card">
              <div className="stepper upload-steps">
                <span className={uploadStep >= 0 ? "active" : ""} />
                <span className={uploadStep >= 1 ? "active" : ""} />
                <span className={uploadStep >= 2 ? "active" : ""} />
                <span className={uploadStep >= 3 ? "active" : ""} />
                <small>
                  {uploadStep + 1} {t("of", "von")} 4
                </small>
              </div>
              {uploadStep === 0 && (
                <>
                  <Icon name="book" size={42} />
                  <h2>{t("Choose your exam", "Wähle deine Arbeit")}</h2>
                  <p>
                    {t("Quiz 4: Fractions and word problems", "Quiz 4: Brüche und Sachaufgaben")}
                  </p>
                  <Button icon="check" onClick={() => setUploadStep(1)}>
                    {t("Choose this exam", "Diese Arbeit wählen")}
                  </Button>
                </>
              )}
              {uploadStep === 1 && (
                <>
                  <h2>{t("Add your pages", "Füge deine Seiten hinzu")}</h2>
                  <p>
                    {t(
                      "Take a photo of each page, or choose a file.",
                      "Mache von jeder Seite ein Foto oder wähle eine Datei.",
                    )}
                  </p>
                  <ol
                    className="photo-tips"
                    aria-label={t("How to take a good photo", "So gelingt ein gutes Foto")}
                  >
                    <li>
                      <Icon name="book" size={22} />
                      {t("Put the paper flat on a table.", "Lege das Blatt flach auf den Tisch.")}
                    </li>
                    <li>
                      <Icon name="idea" size={22} />
                      {t("Use good light, no shadows.", "Nutze gutes Licht, keine Schatten.")}
                    </li>
                    <li>
                      <Icon name="eye" size={22} />
                      {t(
                        "Fit the whole page in the frame.",
                        "Die ganze Seite muss in den Rahmen passen.",
                      )}
                    </li>
                  </ol>
                  <div className="lesson-actions">
                    <Button icon="eye" onClick={() => setCamera({ replaceId: null })}>
                      {t("Take a photo", "Foto machen")}
                    </Button>
                    <label className="button secondary file-choice">
                      <Icon name="book" />
                      {t("Choose a file", "Datei auswählen")}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        multiple
                        onChange={(event) => {
                          Array.from(event.target.files ?? []).forEach((file) => addFilePage(file));
                          event.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                  <p className="upload-hint">
                    {t(
                      "Photo or PDF. Your teacher checks it first.",
                      "Foto oder PDF. Deine Lehrerin prüft es zuerst.",
                    )}
                  </p>
                  {pages.length > 0 && (
                    <>
                      <h3 className="pages-title">
                        {t("Your pages", "Deine Seiten")} ({pages.length})
                      </h3>
                      <div className="page-grid">
                        {pages.map((page, index) => (
                          <figure className="upload-preview" key={page.id}>
                            <PageThumb page={page} label={t("Page", "Seite")} index={index} />
                            <figcaption>
                              {t("Page", "Seite")} {index + 1}
                              {page.kind === "image" || page.kind === "pdf" ? ` · ${page.name}` : ""}
                            </figcaption>
                            <Status type={qualityStatus(page.quality).type}>
                              {qualityStatus(page.quality).label}
                            </Status>
                            {qualityStatus(page.quality).advice && (
                              <p className="page-advice">{qualityStatus(page.quality).advice}</p>
                            )}
                            <div className="page-actions">
                              <button onClick={() => setCamera({ replaceId: page.id })}>
                                <Icon name="eye" size={16} />
                                {t("Retake", "Neu")}
                              </button>
                              <button
                                onClick={() =>
                                  setPages((current) => current.filter((item) => item.id !== page.id))
                                }
                              >
                                <Icon name="close" size={16} />
                                {t("Remove", "Entfernen")}
                              </button>
                            </div>
                          </figure>
                        ))}
                      </div>
                    </>
                  )}
                  <Button icon="arrow" disabled={!pagesReady} onClick={() => setUploadStep(2)}>
                    {t("Check my pages", "Meine Seiten prüfen")}
                  </Button>
                  {pages.length > 0 && !pagesReady && (
                    <p className="upload-hint" role="status">
                      {pages.some((page) => page.quality === "checking")
                        ? t("Checking your pages…", "Deine Seiten werden geprüft…")
                        : t(
                            "Retake or remove the pages marked in yellow first.",
                            "Mache die gelb markierten Seiten neu oder entferne sie zuerst.",
                          )}
                    </p>
                  )}
                </>
              )}
              {uploadStep === 2 && (
                <>
                  <Status type="good">{t("All pages are clear", "Alle Seiten sind gut lesbar")}</Status>
                  <h2>{t("Check your pages", "Prüfe deine Seiten")}</h2>
                  <p>
                    {t(
                      "Is every page there and easy to read?",
                      "Sind alle Seiten da und gut lesbar?",
                    )}
                  </p>
                  <div className="page-grid">
                    {pages.map((page, index) => (
                      <figure className="upload-preview" key={page.id}>
                        <PageThumb page={page} label={t("Page", "Seite")} index={index} />
                        <figcaption>
                          {t("Page", "Seite")} {index + 1}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                  <label className="exam-language-field">
                    {t("Exam language", "Prüfungssprache")}
                    <select
                      value={examLanguage}
                      onChange={(event) => setExamLanguage(event.target.value as Language)}
                    >
                      <option value="EN">{t("English", "Englisch")}</option>
                      <option value="DE">Deutsch</option>
                    </select>
                  </label>
                  <div className="lesson-actions">
                    <Button icon="edit" variant="secondary" onClick={() => setUploadStep(1)}>
                      {t("Change pages", "Seiten ändern")}
                    </Button>
                    <Button
                      icon="arrow"
                      onClick={() => {
                        setUploadStep(3);
                        logActivity("submitted", "Khadija", {
                          EN: `Quiz 4 submitted (${pages.length} ${pages.length === 1 ? "page" : "pages"}, ${examLanguage === "DE" ? "German" : "English"} exam)`,
                          DE: `Quiz 4 eingereicht (${pages.length} ${pages.length === 1 ? "Seite" : "Seiten"}, ${examLanguage === "DE" ? "deutsche" : "englische"} Arbeit)`,
                        });
                        addNotification(
                          "teacher",
                          { EN: "New exam to review", DE: "Neue Arbeit zur Prüfung" },
                          {
                            EN: "Khadija submitted Quiz 4.",
                            DE: "Khadija hat Quiz 4 eingereicht.",
                          },
                          { EN: "Open review", DE: "Prüfung öffnen" },
                          "review",
                        );
                      }}
                    >
                      {t("Send to my teacher", "An meine Lehrerin senden")}
                    </Button>
                  </div>
                </>
              )}
              {uploadStep === 3 && (
                <>
                  <Icon name="check" size={42} />
                  <h2>{t("Exam submitted", "Arbeit eingereicht")}</h2>
                  <p>
                    {t(
                      "Ms. Ashraf can now check your work.",
                      "Frau Ashraf kann deine Arbeit jetzt prüfen.",
                    )}
                  </p>
                  <Button icon="home" onClick={() => setView("home")}>
                    {t("Go home", "Zum Start")}
                  </Button>
                </>
              )}
            </article>
          </section>
        )}

        {view === "notifications" && (
          <section>
            <div className="page-heading">
              <div>
                <p className="kicker">{t("UPDATES", "NEUIGKEITEN")}</p>
                <h1>{t("Your notifications", "Deine Neuigkeiten")}</h1>
              </div>
            </div>
            <div className="question-list notifications-list">
              <article className="question-row">
                <div className="q-number good">
                  <Icon name="check" />
                </div>
                <div>
                  <h3>{t("Practice is ready", "Deine Übung ist bereit")}</h3>
                  <span>{t("Try three fraction questions.", "Probiere drei Bruchaufgaben.")}</span>
                </div>
                <Button icon="play" variant="secondary" onClick={() => setView("practice")}>
                  {t("Open", "Öffnen")}
                </Button>
              </article>
              <article className="question-row">
                <div className="q-number warn">
                  <Icon name="clock" />
                </div>
                <div>
                  <h3>{t("Quiz is being checked", "Dein Quiz wird geprüft")}</h3>
                  <span>
                    {t(
                      "Ms. Ashraf will share feedback soon.",
                      "Frau Ashraf teilt bald dein Feedback.",
                    )}
                  </span>
                </div>
              </article>
            </div>
          </section>
        )}

        {view === "progress" && (
          <section>
            <div className="page-heading">
              <div>
                <p className="kicker">{t("MY LEARNING", "MEIN LERNEN")}</p>
                <h1>{t("Your progress", "Dein Fortschritt")}</h1>
                <p>
                  {t(
                    "See your quiz history and practice.",
                    "Sieh deinen Quizverlauf und deine Übungen.",
                  )}
                </p>
              </div>
            </div>
            <article className="card progress-card progress-page-card">
              {score === null ? (
                <>
                  <h2>{t("Quiz 4 is still being checked", "Quiz 4 wird noch geprüft")}</h2>
                  <AssessmentTracker stage={trackerStage} de={de} />
                </>
              ) : (
                <>
                  <h2>{t("Maths quiz history", "Mathe-Quizverlauf")}</h2>
                  <StairChart
                    values={[52, 58, 64, percent ?? 68]}
                    label={t("Progress staircase", "Fortschrittstreppe")}
                  />
                </>
              )}
              {practiced && <Status type="good">{t("Practice done", "Übung geschafft")}</Status>}
            </article>
            <section className="student-insights">
              <article className="card">
                <p className="kicker">{t("BY TOPIC", "NACH THEMA")}</p>
                <h2>{t("How each skill is growing", "So wachsen deine Fähigkeiten")}</h2>
                {[
                  {
                    name: t("Multiplication", "Multiplizieren"),
                    values: [80, 85, 90],
                    type: "good" as const,
                    label: t("Strong", "Stark"),
                  },
                  {
                    name: t("Word problems", "Sachaufgaben"),
                    values: [55, 65, 75],
                    type: "neutral" as const,
                    label: t("Getting better", "Wird besser"),
                  },
                  {
                    name: t("Comparing fractions", "Brüche vergleichen"),
                    values: [30, 35, 33],
                    type: "warn" as const,
                    label: t("Needs more practice", "Braucht mehr Übung"),
                  },
                ].map((skill) => {
                  const shown = score === null ? skill.values.slice(0, 2) : skill.values;
                  return (
                    <div className="skill-trend" key={skill.name}>
                      <div className="learning-spot">
                        <strong>{skill.name}</strong>
                        <Status type={skill.type}>{skill.label}</Status>
                      </div>
                      <div className="skill-trend-bars">
                        {shown.map((value, index) => (
                          <span key={index}>
                            <small>Quiz {index + 2}</small>
                            <i>
                              <b style={{ width: `${value}%` }} />
                            </i>
                            <small>{value}%</small>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </article>
              <article className="card">
                <p className="kicker">{t("MY PRACTICE", "MEINE ÜBUNGEN")}</p>
                <h2>{t("Practice list", "Übungsliste")}</h2>
                {[
                  {
                    name: t("Mini lesson: comparing fractions", "Mini-Lektion: Brüche vergleichen"),
                    done: practiced,
                    detail: null as string | null,
                  },
                  {
                    name: t("Pop quiz: comparing fractions", "Kurz-Quiz: Brüche vergleichen"),
                    done: practiced,
                    detail: practiced ? `${practiceScore} ${t("of", "von")} 3` : null,
                  },
                ].map((task) => (
                  <div className="learning-spot" key={task.name}>
                    <strong>{task.name}</strong>
                    <Status type={task.done ? "good" : "warn"}>
                      {task.done ? t("Done", "Erledigt") : t("Waiting for you", "Wartet auf dich")}
                      {task.detail ? ` · ${task.detail}` : ""}
                    </Status>
                  </div>
                ))}
                {!practiced && (
                  <Button icon="play" variant="secondary" onClick={startPractice}>
                    {t("Start practice", "Übung starten")}
                  </Button>
                )}
              </article>
            </section>
            <RoleActivity role="student" language={language} />
          </section>
        )}

        {view === "profile" && (
          <section>
            <div className="page-heading">
              <div>
                <button className="back-link" onClick={() => setView("home")}>
                  <Icon name="arrow" /> {t("Back home", "Zurück zum Start")}
                </button>
                <p className="kicker">{t("MY PROFILE", "MEIN PROFIL")}</p>
                <h1>{t("This is me", "Das bin ich")}</h1>
              </div>
            </div>
            <article className="card profile-card">
              <div className="avatar">K</div>
              <dl>
                {[
                  [t("Name", "Name"), "Khadija"],
                  [t("Username", "Benutzername"), "khadija"],
                  [t("Class", "Klasse"), t("Grade 4B", "Klasse 4B")],
                  [t("Teacher", "Lehrerin"), t("Ms. Somaya Ashraf", "Frau Somaya Ashraf")],
                  [
                    t("My subjects", "Meine Fächer"),
                    t("Mathematics, Science, English", "Mathematik, Sachkunde, Englisch"),
                  ],
                  [t("App language", "App-Sprache"), de ? "Deutsch" : "English"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          </section>
        )}
      </main>
      {camera && (
        <CameraCapture
          language={language}
          onCapture={addCameraPage}
          onSample={addSamplePage}
          onClose={() => setCamera(null)}
        />
      )}
      {helpRequest && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="help-title">
          <div className="modal help-modal">
            <button
              className="modal-close"
              onClick={() => setHelpRequest(null)}
              aria-label={t("Close", "Schließen")}
            >
              <Icon name="close" />
            </button>
            <span className="modal-icon">
              <Icon name={helpRequest.mode === "ask" ? "message" : "flag"} />
            </span>
            <p className="kicker">
              {t("QUESTION", "AUFGABE")} {helpRequest.question} · {questionTitles[helpRequest.question - 1]}
            </p>
            <h2 id="help-title">
              {helpRequest.mode === "ask"
                ? t("Ask Ms. Ashraf", "Frau Ashraf fragen")
                : t("Tell Ms. Ashraf what looks wrong", "Sag Frau Ashraf, was nicht stimmt")}
            </h2>
            {helpRequest.mode === "report" && (
              <fieldset className="help-reasons">
                {(
                  [
                    ["reading", t("The computer read my answer wrong", "Der Computer hat meine Antwort falsch gelesen")],
                    ["mark", t("I think my mark is wrong", "Ich glaube, meine Punkte stimmen nicht")],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className={helpReason === value ? "selected" : ""}>
                    <input
                      type="radio"
                      name="help-reason"
                      checked={helpReason === value}
                      onChange={() => setHelpReason(value)}
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
            )}
            <label>
              {helpRequest.mode === "ask"
                ? t("Your question", "Deine Frage")
                : t("Anything else? (you can skip this)", "Noch etwas? (kannst du weglassen)")}
              <textarea
                value={helpMessage}
                onChange={(event) => setHelpMessage(event.target.value)}
                rows={3}
                placeholder={
                  helpRequest.mode === "ask"
                    ? t("I don’t understand why…", "Ich verstehe nicht, warum…")
                    : t("My answer was…", "Meine Antwort war…")
                }
              />
            </label>
            <div className="modal-actions">
              <Button icon="speaker" variant="ghost" className="modal-read" onClick={requestReadAloud}>
                {t("Read aloud", "Vorlesen")}
              </Button>
              <Button icon="close" variant="ghost" onClick={() => setHelpRequest(null)}>
                {t("Cancel", "Abbrechen")}
              </Button>
              <Button
                icon="arrow"
                onClick={sendHelpRequest}
                disabled={helpRequest.mode === "ask" && helpMessage.trim() === ""}
              >
                {t("Send", "Senden")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TeacherSidebar({
  view,
  setView,
  reviewCount,
  language,
}: {
  view: TeacherView;
  setView: (v: TeacherView) => void;
  reviewCount: number;
  language: Language;
}) {
  const items: { id: TeacherView; icon: IconName; label: string; count?: number }[] = [
    { id: "overview", icon: "grid", label: "Overview" },
    { id: "review", icon: "review", label: "Review queue", count: reviewCount },
    { id: "insights", icon: "trend", label: "Class insights" },
    { id: "activity", icon: "clock", label: "Activity history" },
  ];
  return (
    <Localize language={language}>
      <aside className="teacher-side">
        <Logo />{" "}
        <nav>
          {items.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "active" : ""}
              onClick={() => setView(item.id)}
            >
              <Icon name={item.icon} />
              {item.label}
              {item.count && <b>{item.count}</b>}
            </button>
          ))}
        </nav>
        <div className="side-bottom">
          <div className="teacher-profile">
            <span>SA</span>
            <div>
              <strong>Somaya Ashraf</strong>
              <small>Grade 4B teacher</small>
            </div>
          </div>
        </div>
      </aside>
    </Localize>
  );
}

function ExamScan({
  confirmed,
  student = "Khadija",
  examLanguage,
  language,
}: {
  confirmed: boolean;
  student?: ReviewStudent;
  examLanguage: Language;
  language: Language;
}) {
  const germanExam = student === "Khadija" && examLanguage === "DE";
  const focus =
    student === "Khadija"
      ? {
          number: 2,
          prompt: germanExam ? "Berechne: 132 × 4" : "Calculate: 132 × 4",
          answer: "528",
          extracted: "578",
        }
      : student === "Mariam"
        ? { number: 5, prompt: "Share 20 apples equally", answer: "4 each", extracted: "4 ea" }
        : { number: 7, prompt: "Compare 2/3 and 3/5", answer: "2/3 < 3/5", extracted: "?" };
  return (
    <div className="paper">
      <div className="paper-head">
        <span>{student.toUpperCase()}</span>
        <span>{germanExam ? "KLASSE 4B" : "GRADE 4B"}</span>
      </div>
      <h3>{germanExam ? "Quiz 4: Brüche & Sachaufgaben" : "Quiz 4: Fractions & word problems"}</h3>
      <div className="paper-rule" />
      <p>
        1. {germanExam ? "Berechne" : "Calculate"}: 24 × 6 <b>144</b> <i className="tick">✓</i>
      </p>
      <div className="scan-focus">
        <p>
          {focus.number}. {focus.prompt}
        </p>
        <div className="working">
          <strong>{focus.answer}</strong>
        </div>
        <span className="scan-box">
          {language === "DE" ? "KI erkannt" : "AI read"}:{" "}
          {confirmed ? focus.answer : focus.extracted}
        </span>
      </div>
      <p>3. {germanExam ? "Färbe 3/4 der Form" : "Shade 3/4 of the shape"}:</p>
      <div className="hand-boxes">
        <i />
        <i />
        <i />
        <i />
      </div>
      <p className="paper-note">
        {germanExam ? "Denk an gleich große Teile!" : "Remember: equal parts!"}
      </p>
    </div>
  );
}

function TeacherApp({
  awardedMark,
  setAwardedMark,
  studentAnswer,
  setStudentAnswer,
  teacherFeedback,
  setTeacherFeedback,
  redFlagDecision,
  setRedFlagDecision,
  dismissed,
  setDismissed,
  ocrVerified,
  setOcrVerified,
  published,
  setPublished,
  shareParent,
  setShareParent,
  examLanguage,
  language,
  setLanguage,
  onExit,
  notify,
  unreadCount,
  onNotifications,
  addNotification,
  navigationRequest,
}: {
  awardedMark: number | null;
  setAwardedMark: (v: number | null) => void;
  studentAnswer: string;
  setStudentAnswer: (v: string) => void;
  teacherFeedback: string;
  setTeacherFeedback: (v: string) => void;
  redFlagDecision: "confirmed" | "dismissed" | "postponed" | null;
  setRedFlagDecision: (v: "confirmed" | "dismissed" | "postponed" | null) => void;
  dismissed: boolean;
  setDismissed: (v: boolean) => void;
  ocrVerified: boolean;
  setOcrVerified: (v: boolean) => void;
  published: boolean;
  setPublished: (v: boolean) => void;
  shareParent: boolean;
  setShareParent: (v: boolean) => void;
  examLanguage: Language;
  language: "EN" | "DE";
  setLanguage: (l: "EN" | "DE") => void;
  onExit: () => void;
  notify: (m: string | ToastState) => void;
  unreadCount: number;
  onNotifications: () => void;
  addNotification: AddNotification;
  navigationRequest: NavigationRequest;
}) {
  const [view, setView] = useState<TeacherView>("overview");
  const [stage, setStage] = useState<ReviewStage>("ocr");
  const [selectedStudent, setSelectedStudent] = useState<ReviewStudent>("Khadija");
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [overrideAnswer, setOverrideAnswer] = useState(studentAnswer);
  const [overrideMark, setOverrideMark] = useState(3);
  const [otherReviewed, setOtherReviewed] = useState<ReviewStudent[]>([]);
  const [verifiedStudents, setVerifiedStudents] = useState<ReviewStudent[]>([]);
  const [otherFeedback, setOtherFeedback] = useState<Record<"Mariam" | "Salma", string>>({
    Mariam: "Show each step so your reasoning is clear.",
    Salma: "Use a fraction model before choosing the comparison sign.",
  });
  const loggedFeedback = useRef<Record<string, string>>({
    Khadija: teacherFeedback,
    Mariam: otherFeedback.Mariam,
    Salma: otherFeedback.Salma,
  });
  const score = awardedMark === null ? null : 14 + awardedMark;
  const percent = score === null ? null : Math.round((score / 25) * 100);
  const reviewCount = 2 - otherReviewed.length + (awardedMark === null || dismissed ? 1 : 0);
  const selectedOcrVerified =
    selectedStudent === "Khadija" ? ocrVerified : verifiedStudents.includes(selectedStudent);
  const supportPlanActive = published && redFlagDecision === "confirmed";
  const attention = [
    {
      student: "Khadija" as ReviewStudent,
      initials: "KA",
      urgency: supportPlanActive ? "Support plan" : "High",
      flag: supportPlanActive
        ? "Support plan"
        : dismissed
          ? "Dismissed"
          : awardedMark !== null
            ? "Confirmed"
            : "OCR mismatch",
      confidence: "61%",
      why: supportPlanActive
        ? "Fraction-comparison error confirmed; practice assigned"
        : "Low OCR confidence changes 3 marks.",
      priority: supportPlanActive ? 10 : 0,
    },
    {
      student: "Salma" as ReviewStudent,
      initials: "SN",
      urgency: "High",
      flag: otherReviewed.includes("Salma") ? "Confirmed" : "Unclear answer",
      confidence: "52%",
      why: "Answer and working are both unclear.",
      priority: otherReviewed.includes("Salma") ? 30 : 1,
    },
    {
      student: "Mariam" as ReviewStudent,
      initials: "MS",
      urgency: "Medium",
      flag: otherReviewed.includes("Mariam") ? "Confirmed" : "Partial reasoning",
      confidence: "74%",
      why: "AI proposes partial credit for reasoning.",
      priority: otherReviewed.includes("Mariam") ? 31 : 2,
    },
  ]
    .sort((a, b) => a.priority - b.priority)
    .map((item, index) => ({ ...item, rank: index + 1 }));
  const openReview = (student: ReviewStudent, nextStage: ReviewStage = "ocr") => {
    setSelectedStudent(student);
    setStage(nextStage);
    setView("review");
  };
  const confirmMark = (mark = 3, answer = "528") => {
    if (selectedStudent === "Khadija") {
      setStudentAnswer(answer);
      setAwardedMark(mark);
      setDismissed(false);
      setPublished(false);
      if (mark === 3 && answer === "528") {
        logActivity("mark", "Khadija", {
          EN: "Quiz 4 · Q2: AI mark 3/3 confirmed",
          DE: "Quiz 4 · A2: KI-Bewertung 3/3 bestätigt",
        });
      } else {
        logActivity("override", "Khadija", {
          EN: `Quiz 4 · Q2: AI proposed 3/3, teacher awarded ${mark}/3 (answer ${answer})`,
          DE: `Quiz 4 · A2: KI schlug 3/3 vor, Lehrerin vergab ${mark}/3 (Antwort ${answer})`,
        });
      }
      notify(`Khadija’s answer saved as ${answer}; ${mark}/3 awarded.`);
      setStage("redflag");
    } else {
      logActivity("mark", selectedStudent, {
        EN: `Quiz 4 · ${selectedEvidence.question}: mark confirmed`,
        DE: `Quiz 4 · ${selectedEvidence.question}: Bewertung bestätigt`,
      });
      setOtherReviewed([...new Set([...otherReviewed, selectedStudent])]);
      notify(`${selectedStudent}’s mark was confirmed.`);
      setView("overview");
    }
    setModal(false);
  };
  const dismissItem = () => {
    const previousMark = awardedMark;
    const wasPublished = published;
    setDismissed(true);
    setAwardedMark(null);
    setPublished(false);
    logActivity("mark", "Khadija", {
      EN: "Quiz 4 · Q2: AI suggestion dismissed, item stays in the queue",
      DE: "Quiz 4 · A2: KI-Vorschlag verworfen, bleibt in der Warteschlange",
    });
    notify({
      message: "Khadija’s item was dismissed and remains in the queue.",
      actionLabel: "Undo",
      onAction: () => {
        setDismissed(false);
        setAwardedMark(previousMark);
        setPublished(wasPublished);
      },
    });
    setView("overview");
  };
  const reviewLabel =
    stage === "ocr"
      ? "OCR verification"
      : stage === "grade"
        ? "Question grade"
        : stage === "redflag"
          ? "Repeated error"
          : "Publish results";
  const workflowStages: ReviewStage[] =
    selectedStudent === "Khadija" ? ["ocr", "grade", "redflag", "publish"] : ["ocr", "grade"];
  const selectedExamLanguage = selectedStudent === "Khadija" ? examLanguage : "EN";
  const examLanguageLabel =
    selectedExamLanguage === "DE" ? "Exam language: Deutsch" : "Exam language: English";
  const selectedEvidence =
    selectedStudent === "Khadija"
      ? {
          question: selectedExamLanguage === "DE" ? "A2 · 132 × 4" : "Q2 · 132 × 4",
          extracted: selectedOcrVerified ? studentAnswer : "578",
          corrected: "528",
          confidence: "61%",
        }
      : selectedStudent === "Mariam"
        ? {
            question: "Q5 · Share 20 apples",
            extracted: "4 ea",
            corrected: "4 each",
            confidence: "74%",
          }
        : {
            question: "Q7 · Compare 2/3 and 3/5",
            extracted: "?",
            corrected: "2/3 < 3/5",
            confidence: "52%",
          };

  useEffect(() => {
    if (navigationRequest?.role !== "teacher") return;
    if (navigationRequest.target === "review") {
      setSelectedStudent("Khadija");
      setStage("ocr");
      setView("review");
    }
    if (navigationRequest.target === "insights") setView("insights");
  }, [navigationRequest]);

  return (
    <Localize language={language}>
      <div className="teacher-shell">
        <TeacherSidebar
          view={view}
          setView={setView}
          reviewCount={reviewCount}
          language={language}
        />
        <div className="teacher-content">
          <TopBar
            role="teacher"
            language={language}
            setLanguage={setLanguage}
            onExit={onExit}
            unreadCount={unreadCount}
            onNotifications={onNotifications}
          />
          <main className="teacher-main">
            {view === "overview" && (
              <>
                <div className="teacher-heading">
                  <div>
                    <p className="kicker">18 OCTOBER</p>
                    <h1>Grade 4B assessment overview</h1>
                    <p>{reviewCount} exams are waiting for review.</p>
                  </div>
                  <Button icon="review" onClick={() => openReview("Khadija")}>
                    Open review queue
                  </Button>
                </div>
                <section className="metric-grid">
                  <article>
                    <span className="metric-icon gold">
                      <Icon name="review" />
                    </span>
                    <div>
                      <p>Review queue</p>
                      <strong>
                        {reviewCount} <small>exams waiting for review</small>
                      </strong>
                    </div>
                    <Icon name="chevron" />
                  </article>
                  <article>
                    <span className="metric-icon teal">
                      <Icon name="check" />
                    </span>
                    <div>
                      <p>Exams confirmed</p>
                      <strong>
                        {18 + (awardedMark !== null ? 1 : 0) + otherReviewed.length}{" "}
                        <small>of 22</small>
                      </strong>
                    </div>
                    <Icon name="chevron" />
                  </article>
                  <article>
                    <span className="metric-icon navy">
                      <Icon name="trend" />
                    </span>
                    <div>
                      <p>Class average</p>
                      <strong>
                        71% <small>+4%</small>
                      </strong>
                    </div>
                    <Icon name="chevron" />
                  </article>
                </section>
                <section className="teacher-columns">
                  <article className="panel attention-panel">
                    <div className="panel-head">
                      <div>
                        <p className="kicker">RANKED ATTENTION</p>
                        <h2>Needs your decision</h2>
                      </div>
                    </div>
                    <div className="review-table attention-table">
                      <div className="table-head">
                        <span>Rank / student</span>
                        <span>Urgency</span>
                        <span>Why</span>
                        <span>Action</span>
                      </div>
                      {attention.map((item) => (
                        <div
                          className={`table-row ${item.rank === 1 ? "highlight" : ""}`}
                          key={item.student}
                        >
                          <span className="student-cell">
                            <em>{item.rank}</em>
                            <b>{item.initials}</b>
                            <i>
                              <strong>{item.student}</strong>
                              <small>
                                {item.flag} · {item.confidence}
                              </small>
                            </i>
                          </span>
                          <span className="attention-statuses">
                            <Status type={item.urgency === "High" ? "warn" : "neutral"}>
                              {item.urgency}
                            </Status>
                          </span>
                          <span className="why-cell">{item.why}</span>
                          <Button
                            icon="eye"
                            variant="secondary"
                            onClick={() => openReview(item.student)}
                          >
                            {item.flag === "Confirmed" ? "View" : "Review"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </article>
                  <article className="panel gap-panel">
                    <div className="panel-head">
                      <div>
                        <p className="kicker">LEARNING GAPS</p>
                        <h2>Class focus areas</h2>
                      </div>
                      <button onClick={() => setView("insights")}>
                        Explore <Icon name="arrow" />
                      </button>
                    </div>
                    <div className="gap-item">
                      <div>
                        <Icon name="warning" />
                        <span>
                          <strong>Comparing fractions</strong>
                          <small>9 of 22 students</small>
                        </span>
                      </div>
                      <b>41%</b>
                    </div>
                    <div className="bar">
                      <i style={{ width: "41%" }} />
                    </div>
                    <div className="gap-item">
                      <div>
                        <Icon name="idea" />
                        <span>
                          <strong>Showing working</strong>
                          <small>6 of 22 students</small>
                        </span>
                      </div>
                      <b>27%</b>
                    </div>
                    <div className="bar">
                      <i style={{ width: "27%" }} />
                    </div>
                    <div className="ai-note">
                      <Icon name="spark" />
                      <p>
                        <strong>AI suggestion</strong>Create a 10-minute visual fraction warm-up for
                        Monday.
                      </p>
                    </div>
                  </article>
                </section>
              </>
            )}

            {view === "review" && (
              <>
                <div className="review-heading">
                  <div>
                    <button className="back-link" onClick={() => setView("overview")}>
                      <Icon name="arrow" /> Back to overview
                    </button>
                    <p className="kicker">
                      {selectedStudent.toUpperCase()} · {reviewLabel.toUpperCase()}
                    </p>
                    <h1>
                      {reviewLabel}: {selectedStudent}
                    </h1>
                    <p>Review evidence and record a teacher decision.</p>
                  </div>
                  <div className="review-header-status">
                    <Status
                      type={
                        selectedStudent === "Khadija" && dismissed
                          ? "neutral"
                          : selectedStudent === "Khadija" && awardedMark !== null
                            ? "good"
                            : "warn"
                      }
                    >
                      {selectedStudent === "Khadija" && dismissed
                        ? "Dismissed"
                        : selectedStudent === "Khadija" && awardedMark !== null
                          ? "Mark confirmed"
                          : "Decision required"}
                    </Status>
                    <Status type="neutral">{examLanguageLabel}</Status>
                  </div>
                </div>
                <div className="workflow-tabs">
                  {workflowStages.map((item, index) => (
                    <button
                      className={stage === item ? "active" : ""}
                      onClick={() => setStage(item)}
                      key={item}
                    >
                      <span>{index + 1}</span>
                      {item === "ocr"
                        ? "Verify OCR"
                        : item === "grade"
                          ? "Review mark"
                          : item === "redflag"
                            ? "Red flag"
                            : "Publish"}
                    </button>
                  ))}
                </div>

                {stage === "ocr" && (
                  <div className="review-layout">
                    <section className="scan-panel panel">
                      <div className="scan-toolbar">
                        <span>
                          <Icon name="eye" /> Original scan
                        </span>
                        <button onClick={() => setDrawer(true)}>
                          <Icon name="message" /> Exam context
                        </button>
                      </div>
                      <ExamScan
                        confirmed={selectedOcrVerified}
                        student={selectedStudent}
                        examLanguage={selectedExamLanguage}
                        language={language}
                      />
                    </section>
                    <section className="decision-panel panel">
                      <div className="ai-title">
                        <span>
                          <Icon name="review" />
                        </span>
                        <div>
                          <p className="kicker">EXTRACTED TEXT</p>
                          <h2>Verify OCR before grading</h2>
                        </div>
                      </div>
                      <Status type="neutral">{examLanguageLabel}</Status>
                      <div className="extracted-list">
                        <div>
                          <span>{selectedExamLanguage === "DE" ? "A1" : "Q1"} · 24 × 6</span>
                          <strong>144</strong>
                          <Status type="good">96% confidence</Status>
                        </div>
                        <div className="low-confidence">
                          <span>{selectedEvidence.question}</span>
                          <strong>
                            {selectedOcrVerified
                              ? selectedEvidence.corrected
                              : selectedEvidence.extracted}
                          </strong>
                          <Status type="warn">{selectedEvidence.confidence} · Check answer</Status>
                        </div>
                        <div>
                          <span>
                            {selectedExamLanguage === "DE" ? "A3 · Färbe 3/4" : "Q3 · Shade 3/4"}
                          </span>
                          <strong>
                            {selectedExamLanguage === "DE" ? "2/4 gefärbt" : "2/4 shaded"}
                          </strong>
                          <Status type="good">89% confidence</Status>
                        </div>
                      </div>
                      {selectedOcrVerified && (
                        <div className="confirmed-box">
                          <Icon name="check" />
                          <div>
                            <strong>OCR verified</strong>
                            <p>The flagged answer is saved as {selectedEvidence.corrected}.</p>
                          </div>
                        </div>
                      )}
                      <div className="decision-actions">
                        <Button
                          icon="check"
                          onClick={() => {
                            if (selectedStudent === "Khadija") setOcrVerified(true);
                            if (selectedStudent !== "Khadija")
                              setVerifiedStudents([
                                ...new Set([...verifiedStudents, selectedStudent]),
                              ]);
                            if (selectedStudent === "Khadija") setStudentAnswer("528");
                            if (!selectedOcrVerified)
                              logActivity("ocr", selectedStudent, {
                                EN: `Quiz 4 · ${selectedEvidence.question}: OCR ${selectedEvidence.extracted} corrected to ${selectedEvidence.corrected}`,
                                DE: `Quiz 4 · ${selectedEvidence.question}: OCR ${selectedEvidence.extracted} korrigiert zu ${selectedEvidence.corrected}`,
                              });
                            notify(`OCR verified for ${selectedStudent}.`);
                          }}
                        >
                          Verify OCR
                        </Button>
                        <Button
                          icon="arrow"
                          variant="secondary"
                          onClick={() => {
                            if (selectedStudent === "Khadija") setOcrVerified(true);
                            if (selectedStudent !== "Khadija")
                              setVerifiedStudents([
                                ...new Set([...verifiedStudents, selectedStudent]),
                              ]);
                            if (selectedStudent === "Khadija") setStudentAnswer("528");
                            if (!selectedOcrVerified)
                              logActivity("ocr", selectedStudent, {
                                EN: `Quiz 4 · ${selectedEvidence.question}: OCR ${selectedEvidence.extracted} corrected to ${selectedEvidence.corrected}`,
                                DE: `Quiz 4 · ${selectedEvidence.question}: OCR ${selectedEvidence.extracted} korrigiert zu ${selectedEvidence.corrected}`,
                              });
                            setStage("grade");
                          }}
                        >
                          Next flagged
                        </Button>
                      </div>
                    </section>
                  </div>
                )}

                {stage === "grade" && (
                  <div className="review-layout">
                    <section className="scan-panel panel">
                      <div className="scan-toolbar">
                        <span>
                          <Icon name="eye" /> Question evidence
                        </span>
                        <button onClick={() => setDrawer(true)}>
                          <Icon name="message" /> Exam context
                        </button>
                      </div>
                      <ExamScan
                        confirmed={selectedOcrVerified}
                        student={selectedStudent}
                        examLanguage={selectedExamLanguage}
                        language={language}
                      />
                    </section>
                    <section className="decision-panel panel">
                      <div className="ai-title">
                        <span>
                          <Icon name="spark" />
                        </span>
                        <div>
                          <p className="kicker">AI MARK PROPOSAL</p>
                          <h2>
                            {selectedStudent === "Khadija"
                              ? "Award 3 of 3 marks"
                              : selectedStudent === "Mariam"
                                ? "Award 2 of 4 marks"
                                : "Hold for teacher decision"}
                          </h2>
                        </div>
                      </div>
                      <Status type="warn">
                        Uncertainty: {selectedStudent === "Khadija" ? "Medium" : "High"}
                      </Status>
                      <p>
                        {selectedStudent === "Khadija"
                          ? "The corrected answer 528 matches the expected result. The calculation is correct."
                          : "The response contains partial evidence, but the reasoning is incomplete."}
                      </p>
                      <div className="rubric">
                        <div>
                          <span>Student answer</span>
                          <b>{selectedStudent === "Khadija" ? studentAnswer : "See scan"}</b>
                        </div>
                        <div>
                          <span>AI mark</span>
                          <b>{selectedStudent === "Khadija" ? "3 / 3" : "2 / 4"}</b>
                        </div>
                        <div>
                          <span>Teacher mark</span>
                          <b>
                            {selectedStudent === "Khadija" && awardedMark !== null
                              ? `${awardedMark} / 3`
                              : "Not confirmed"}
                          </b>
                        </div>
                      </div>
                      <label className="feedback-field">
                        Feedback to student
                        <textarea
                          value={translateText(
                            selectedStudent === "Khadija"
                              ? teacherFeedback
                              : otherFeedback[selectedStudent],
                            language,
                          )}
                          onChange={(e) => {
                            if (selectedStudent === "Khadija") {
                              setTeacherFeedback(e.target.value);
                              setPublished(false);
                            } else {
                              setOtherFeedback({
                                ...otherFeedback,
                                [selectedStudent]: e.target.value,
                              });
                            }
                          }}
                          onBlur={() => {
                            const current =
                              selectedStudent === "Khadija"
                                ? teacherFeedback
                                : otherFeedback[selectedStudent];
                            if (current !== loggedFeedback.current[selectedStudent]) {
                              loggedFeedback.current[selectedStudent] = current;
                              logActivity("feedback", selectedStudent, {
                                EN: "Quiz 4 feedback to student edited",
                                DE: "Quiz-4-Feedback an die Schülerin bearbeitet",
                              });
                            }
                          }}
                        />
                      </label>
                      <div className="decision-actions">
                        <Button icon="check" onClick={() => confirmMark(3, "528")}>
                          Confirm AI mark
                        </Button>
                        <Button
                          icon="edit"
                          variant="secondary"
                          onClick={() => {
                            setOverrideAnswer(studentAnswer);
                            setOverrideMark(awardedMark ?? 3);
                            setModal(true);
                          }}
                        >
                          Override
                        </Button>
                        {selectedStudent === "Khadija" && (
                          <Button icon="close" variant="ghost" onClick={dismissItem}>
                            Dismiss
                          </Button>
                        )}
                      </div>
                    </section>
                  </div>
                )}

                {stage === "redflag" && (
                  <section className="panel redflag-panel">
                    <div className="ai-title">
                      <span>
                        <Icon name="flag" />
                      </span>
                      <div>
                        <p className="kicker">REPEATED LEARNING GAP</p>
                        <h2>Fraction-comparison error</h2>
                      </div>
                    </div>
                    <p>
                      Khadija has made the same comparison error across three quizzes. Confirming
                      creates a teacher-visible support flag.
                    </p>
                    <div className="evidence-timeline">
                      <article>
                        <span>Quiz 2</span>
                        <strong>1/2 &lt; 1/3</strong>
                        <small>Incorrect comparison</small>
                      </article>
                      <article>
                        <span>Quiz 3</span>
                        <strong>3/5 &gt; 3/4</strong>
                        <small>Incorrect comparison</small>
                      </article>
                      <article>
                        <span>Quiz 4</span>
                        <strong>2/3 &lt; 3/5</strong>
                        <small>Incorrect comparison</small>
                      </article>
                    </div>
                    {redFlagDecision && (
                      <Status type={redFlagDecision === "confirmed" ? "warn" : "neutral"}>
                        Flag {redFlagDecision}
                      </Status>
                    )}
                    <div className="decision-actions">
                      <Button
                        icon="check"
                        onClick={() => {
                          setRedFlagDecision("confirmed");
                          logActivity("redflag", "Khadija", {
                            EN: "Fraction-comparison flag confirmed; practice assigned",
                            DE: "Warnung „Brüche vergleichen“ bestätigt; Übung zugewiesen",
                          });
                          notify("Learning-gap flag confirmed.");
                          setStage("publish");
                        }}
                      >
                        Confirm
                      </Button>
                      <Button
                        icon="close"
                        variant="secondary"
                        onClick={() => {
                          setRedFlagDecision("dismissed");
                          logActivity("redflag", "Khadija", {
                            EN: "Fraction-comparison flag dismissed",
                            DE: "Warnung „Brüche vergleichen“ verworfen",
                          });
                          notify("Learning-gap flag dismissed.");
                        }}
                      >
                        Dismiss
                      </Button>
                      <Button
                        icon="clock"
                        variant="ghost"
                        onClick={() => {
                          setRedFlagDecision("postponed");
                          logActivity("redflag", "Khadija", {
                            EN: "Fraction-comparison flag postponed",
                            DE: "Warnung „Brüche vergleichen“ zurückgestellt",
                          });
                          notify("Learning-gap decision postponed.");
                        }}
                      >
                        Postpone
                      </Button>
                    </div>
                  </section>
                )}

                {stage === "publish" && (
                  <section className="panel publish-panel">
                    <p className="kicker">FINAL CHECK</p>
                    <h2>Publish Khadija’s results</h2>
                    <div className="publish-checklist">
                      <div>
                        <Icon name={ocrVerified ? "check" : "clock"} />
                        <span>
                          <strong>OCR verified</strong>
                          <small>
                            {ocrVerified
                              ? "All flagged text has been checked."
                              : "Complete OCR verification first."}
                          </small>
                        </span>
                        <Status type={ocrVerified ? "good" : "warn"}>
                          {ocrVerified ? "Complete" : "Required"}
                        </Status>
                      </div>
                      <div>
                        <Icon name={awardedMark !== null ? "check" : "clock"} />
                        <span>
                          <strong>Marks confirmed</strong>
                          <small>
                            {awardedMark !== null
                              ? `${score}/25 (${percent}%)`
                              : "Confirm all question marks first."}
                          </small>
                        </span>
                        <Status type={awardedMark !== null ? "good" : "warn"}>
                          {awardedMark !== null ? "Complete" : "Required"}
                        </Status>
                      </div>
                    </div>
                    <label className="share-toggle">
                      <input
                        type="checkbox"
                        checked={shareParent}
                        onChange={(e) => {
                          setShareParent(e.target.checked);
                          logActivity("share", "Khadija", {
                            EN: e.target.checked
                              ? "Sharing with parent turned on"
                              : "Sharing with parent turned off",
                            DE: e.target.checked
                              ? "Freigabe für Elternteil eingeschaltet"
                              : "Freigabe für Elternteil ausgeschaltet",
                          });
                        }}
                      />
                      <span>
                        <strong>Share with parent</strong>
                        <small>Allow Khadija’s parent to see the published summary.</small>
                      </span>
                    </label>
                    {published && (
                      <div className="confirmed-box">
                        <Icon name="check" />
                        <div>
                          <strong>Results published</strong>
                          <p>
                            Student feedback is available
                            {shareParent ? " and the parent summary is shared" : ""}.
                          </p>
                        </div>
                      </div>
                    )}
                    <Button
                      icon="check"
                      className="publish-button"
                      disabled={published || !ocrVerified || awardedMark === null}
                      onClick={() => {
                        setPublished(true);
                        logActivity("published", "Khadija", {
                          EN: `Quiz 4 results published (${score}/25, ${percent}%)`,
                          DE: `Ergebnisse von Quiz 4 veröffentlicht (${score}/25, ${percent} %)`,
                        });
                        if (shareParent) {
                          logActivity("share", "Khadija", {
                            EN: "Quiz 4 results shared with Khadija’s parent",
                            DE: "Ergebnisse von Quiz 4 mit Khadijas Elternteil geteilt",
                          });
                        }
                        addNotification(
                          "student",
                          {
                            EN: "Quiz 4 results are ready",
                            DE: "Die Ergebnisse von Quiz 4 sind bereit",
                          },
                          {
                            EN: "Ms. Ashraf published your Quiz 4 feedback.",
                            DE: "Frau Ashraf hat dein Feedback zu Quiz 4 veröffentlicht.",
                          },
                          { EN: "View results", DE: "Ergebnisse ansehen" },
                          "feedback",
                        );
                        if (redFlagDecision === "confirmed") {
                          addNotification(
                            "student",
                            {
                              EN: "A practice plan just for you",
                              DE: "Ein Übungsplan nur für dich",
                            },
                            {
                              EN: "Comparing fractions needs a little more practice. Try the short lesson and quiz – you can do it!",
                              DE: "Brüche vergleichen braucht noch etwas Übung. Probiere die kurze Lektion und das Quiz – du schaffst das!",
                            },
                            { EN: "Start practice", DE: "Übung starten" },
                            "practice",
                          );
                        }
                        if (shareParent) {
                          addNotification(
                            "parent",
                            {
                              EN: "Khadija's Quiz 4 results are published",
                              DE: "Khadijas Ergebnisse für Quiz 4 wurden veröffentlicht",
                            },
                            {
                              EN: "Ms. Ashraf shared Khadija’s latest maths result.",
                              DE: "Frau Ashraf hat Khadijas aktuelles Matheergebnis geteilt.",
                            },
                            { EN: "View summary", DE: "Zusammenfassung ansehen" },
                            "summary",
                          );
                        }
                        notify(
                          shareParent
                            ? "Results published and shared with parent."
                            : "Results published to the student.",
                        );
                      }}
                    >
                      {published ? "Published" : "Publish results"}
                    </Button>
                    <RecentActivity language={language} />
                  </section>
                )}
              </>
            )}

            {view === "activity" && (
              <ActivityHistoryPage
                language={language}
                onDownload={() => notify("Activity log downloaded (demo only).")}
              />
            )}

            {view === "insights" && (
              <>
                <div className="teacher-heading">
                  <div>
                    <p className="kicker">GRADE 4B · 22 STUDENTS</p>
                    <h1>Class learning insights</h1>
                    <p>Quiz 4: Fractions and word problems</p>
                  </div>
                  <Button icon="book" onClick={() => notify("Practice set assigned to Grade 4B.")}>
                    Assign practice set
                  </Button>
                </div>
                <section className="insight-grid">
                  <article className="panel class-progress">
                    <div className="panel-head">
                      <div>
                        <p className="kicker">OVER FOUR QUIZZES</p>
                        <h2>Class progress</h2>
                      </div>
                      <Status type="good">Up 12 points</Status>
                    </div>
                    <StairChart values={[59, 64, 67, 71]} label={translateText("Progress staircase", language)} />
                    <div className="chart-labels">
                      <span>Quiz 1</span>
                      <span>Quiz 2</span>
                      <span>Quiz 3</span>
                      <span>Quiz 4</span>
                    </div>
                  </article>
                  <article className="panel">
                    <p className="kicker">SKILL BREAKDOWN</p>
                    <h2>Where support is needed</h2>
                    <div className="skill-row">
                      <span>
                        <Icon name="warning" /> Comparing fractions
                      </span>
                      <strong>59% secure</strong>
                    </div>
                    <div className="bar bad-bar">
                      <i style={{ width: "59%" }} />
                    </div>
                    <div className="skill-row">
                      <span>
                        <Icon name="idea" /> Explaining working
                      </span>
                      <strong>73% secure</strong>
                    </div>
                    <div className="bar warn-bar">
                      <i style={{ width: "73%" }} />
                    </div>
                    <div className="skill-row">
                      <span>
                        <Icon name="check" /> Multiplication facts
                      </span>
                      <strong>91% secure</strong>
                    </div>
                    <div className="bar good-bar">
                      <i style={{ width: "91%" }} />
                    </div>
                  </article>
                </section>
                <section className="panel students-panel">
                  <div className="panel-head">
                    <div>
                      <p className="kicker">STUDENT SNAPSHOT</p>
                      <h2>Students requiring support</h2>
                    </div>
                  </div>
                  {[
                    "Khadija|Comparing fractions",
                    "Mariam|Showing working",
                    "Salma|Word problems",
                    "Laila|On track",
                    "Nour|On track",
                  ].map((item, index) => {
                    const [name, focus] = item.split("|");
                    const displayScore =
                      name === "Khadija"
                        ? score === null
                          ? "Not graded"
                          : `${percent}%`
                        : ["", "76%", "60%", "84%", "88%"][index];
                    return (
                      <div className="student-snapshot" key={name}>
                        <span className="student-cell">
                          <b>{name.slice(0, 2).toUpperCase()}</b>
                          <i>
                            <strong>{name}</strong>
                            <small>{focus}</small>
                          </i>
                        </span>
                        <strong>{displayScore}</strong>
                        <Status type={index < 3 ? "warn" : "good"}>
                          {index < 3 ? "Plan support" : "On track"}
                        </Status>
                        <Button
                          icon="message"
                          variant="ghost"
                          onClick={() => notify(`Check-in note opened for ${name}.`)}
                        >
                          Add note
                        </Button>
                      </div>
                    );
                  })}
                </section>
              </>
            )}
          </main>
        </div>

        {modal && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal">
              <button className="modal-close" onClick={() => setModal(false)} aria-label="Close">
                <Icon name="close" />
              </button>
              <span className="modal-icon">
                <Icon name="edit" />
              </span>
              <p className="kicker">TEACHER OVERRIDE</p>
              <h2>Enter the answer and mark</h2>
              <p>This replaces the AI proposal and updates the total score.</p>
              <label>
                Student answer
                <input
                  value={overrideAnswer}
                  onChange={(e) => setOverrideAnswer(e.target.value)}
                  autoFocus
                />
              </label>
              <label>
                Mark awarded
                <select
                  value={overrideMark}
                  onChange={(e) => setOverrideMark(Number(e.target.value))}
                >
                  <option value={3}>3 / 3</option>
                  <option value={2}>2 / 3</option>
                  <option value={1}>1 / 3</option>
                  <option value={0}>0 / 3</option>
                </select>
              </label>
              <div className="modal-actions">
                <Button icon="close" variant="ghost" onClick={() => setModal(false)}>
                  Cancel
                </Button>
                <Button icon="check" onClick={() => confirmMark(overrideMark, overrideAnswer)}>
                  Save override
                </Button>
              </div>
            </div>
          </div>
        )}
        {drawer && (
          <>
            <div className="drawer-scrim" onClick={() => setDrawer(false)} />
            <aside className="drawer">
              <button className="modal-close" onClick={() => setDrawer(false)} aria-label="Close">
                <Icon name="close" />
              </button>
              <p className="kicker">EXAM CONTEXT</p>
              <h2>{selectedStudent} · Quiz 4</h2>
              <div className="drawer-stat">
                <span>Current score</span>
                <strong>
                  {score === null || selectedStudent !== "Khadija" ? "Not graded" : `${score} / 25`}
                </strong>
              </div>
              <div className="drawer-stat">
                <span>Questions</span>
                <strong>8 total</strong>
              </div>
              <h3>Prior pattern</h3>
              <p>
                {selectedStudent === "Khadija"
                  ? "Multiplication is consistently secure. Fraction comparison also appeared as a gap in Quiz 3."
                  : "Review the scan and AI explanation before confirming a mark."}
              </p>
              <Button
                icon="trend"
                onClick={() => {
                  setDrawer(false);
                  setView("insights");
                }}
              >
                View class insights
              </Button>
            </aside>
          </>
        )}
      </div>
    </Localize>
  );
}

function ParentTracker({ published, language }: { published: boolean; language: Language }) {
  const labels =
    language === "DE"
      ? ["Eingereicht", "Lehrerin prüft", "Veröffentlicht"]
      : ["Submitted", "Teacher reviewing", "Published"];
  const stage = published ? 2 : 1;
  return (
    <div
      className="assessment-tracker parent-tracker"
      aria-label={translateText("Quiz status", language)}
    >
      {labels.map((label, index) => (
        <div className={index <= stage ? "active" : ""} key={label}>
          <span>{published || index < stage ? <Icon name="check" size={14} /> : index + 1}</span>
          <small>{label}</small>
        </div>
      ))}
    </div>
  );
}

function ParentApp({
  awardedMark,
  published,
  shareParent,
  teacherFeedback,
  language,
  setLanguage,
  onExit,
  notify,
  unreadCount,
  onNotifications,
}: {
  awardedMark: number | null;
  published: boolean;
  shareParent: boolean;
  teacherFeedback: string;
  language: "EN" | "DE";
  setLanguage: (l: "EN" | "DE") => void;
  onExit: () => void;
  notify: (m: string | ToastState) => void;
  unreadCount: number;
  onNotifications: () => void;
}) {
  const visible = published && shareParent && awardedMark !== null;
  const quizStatus = published && !shareParent ? "Results not shared yet" : "Teacher reviewing";
  const score = awardedMark === null ? null : 14 + awardedMark;
  const percent = score === null ? null : Math.round((score / 25) * 100);
  return (
    <Localize language={language}>
      <div className="app-shell parent-shell">
        <TopBar
          role="parent"
          language={language}
          setLanguage={setLanguage}
          onExit={onExit}
          unreadCount={unreadCount}
          onNotifications={onNotifications}
        />
        <main className="parent-main">
          <section className="parent-hello">
            <div className="parent-avatar">K</div>
            <div>
              <p className="kicker">KHADIJA’S LEARNING</p>
              <h1>A clear view of her learning.</h1>
              <p>Grade 4B · Ms. Somaya Ashraf</p>
            </div>
          </section>

          <article
            className={`parent-score card parent-quiz-status ${visible ? "is-published" : "is-pending"}`}
          >
            <div className="parent-quiz-summary">
              <div>
                <div className="parent-status-row">
                  <Status type={visible ? "good" : "neutral"}>
                    {visible ? "Published" : quizStatus}
                  </Status>
                  {visible && <Status type="good">New</Status>}
                </div>
                <p className="kicker">QUIZ 4 · MATHEMATICS</p>
                <h2>Fractions and word problems</h2>
                {visible ? (
                  <p>{teacherFeedback}</p>
                ) : (
                  <p>
                    {published && !shareParent
                      ? "Quiz 4 results are ready but have not been shared with you yet."
                      : "Ms. Ashraf is checking Khadija’s quiz. You’ll be notified when results are ready."}
                  </p>
                )}
              </div>
              {visible && (
                <strong>
                  {score}
                  <small>/25 · {percent}%</small>
                </strong>
              )}
            </div>
            <ParentTracker published={visible} language={language} />
          </article>

          <article className="parent-score card previous-score">
            <div>
              <Status type="good">Published</Status>
              <p className="kicker">QUIZ 3 · MATHEMATICS</p>
              <h2>Multiplication and simple fractions</h2>
              <p>3 October</p>
            </div>
            <strong>
              64<small>%</small>
            </strong>
          </article>

          <article className="parent-message card">
            <span>
              <Icon name="check" />
            </span>
            <div>
              <h2>What’s going well</h2>
              <p>
                Khadija is doing well with multiplication facts and uses clear number strategies.
              </p>
            </div>
          </article>

          <article className="parent-message peach card">
            <span>
              <Icon name="idea" />
            </span>
            <div>
              <h2>What to practise next</h2>
              <p>Use simple drawings to compare halves, thirds and quarters.</p>
            </div>
          </article>

          <article className="parent-progress card parent-chart parent-history">
            <div>
              <p className="kicker">PUBLISHED QUIZZES</p>
              <h2>Progress so far</h2>
            </div>
            <StairChart values={[52, 58, 64]} label={translateText("Progress staircase", language)} />
            <div className="chart-labels">
              <span>Quiz 1</span>
              <span>Quiz 2</span>
              <span>Quiz 3</span>
            </div>
          </article>

          <article className="parent-progress card parent-messages">
            <div>
              <p className="kicker">MESSAGES</p>
              <h2>Messages from Ms. Ashraf</h2>
            </div>
            <div className="home-activity">
              <Icon name="message" />
              <p>
                <strong>Ms. Ashraf · 4 October</strong>Khadija is building confidence with
                multiplication. Short fraction activities at home will help.
              </p>
            </div>
            <Button
              icon="message"
              variant="secondary"
              onClick={() => notify("Reply draft opened for Ms. Ashraf.")}
            >
              Reply
            </Button>
          </article>

          <Button icon="message" onClick={() => notify("Message draft opened for Ms. Ashraf.")}>
            Message Ms. Ashraf
          </Button>
          <RoleActivity role="parent" language={language} />
        <p className="parent-note">
            <Icon name="lock" size={15} /> Quiz 4 results appear only after Ms. Ashraf publishes and
            shares them.
          </p>
        </main>
      </div>
    </Localize>
  );
}

function NotificationCenter({
  role,
  language,
  setLanguage,
  onLogout,
  notifications,
  onMarkAll,
  onOpen,
  onBack,
}: {
  role: Role;
  language: Language;
  setLanguage: (language: Language) => void;
  onLogout: () => void;
  notifications: AppNotification[];
  onMarkAll: () => void;
  onOpen: (notification: AppNotification) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<"unread" | "all">("unread");
  const t = (en: string, de: string) => (language === "DE" ? de : en);
  const unreadCount = notifications.filter((item) => !item.read).length;
  const visible = tab === "unread" ? notifications.filter((item) => !item.read) : notifications;
  const timestamp = (createdAt: number) => {
    const minutes = Math.floor((Date.now() - createdAt) / 60000);
    if (minutes < 1) return t("Just now", "Gerade eben");
    if (minutes < 60) return t(`${minutes} min ago`, `vor ${minutes} Min.`);
    return t("Earlier today", "Heute früher");
  };
  return (
    <div className={`app-shell notification-shell ${role}`}>
      <TopBar
        role={role}
        language={language}
        setLanguage={setLanguage}
        onExit={onLogout}
        unreadCount={unreadCount}
        onNotifications={() => undefined}
      />
      <main className="notification-main">
        <button className="back-link" onClick={onBack}>
          <Icon name="arrow" /> {t("Back to dashboard", "Zurück zur Übersicht")}
        </button>
        <div className="notification-heading">
          <div>
            <p className="kicker">{t("UPDATES", "AKTUELLES")}</p>
            <h1>{t("Notifications", "Benachrichtigungen")}</h1>
          </div>
          <Button icon="check" variant="secondary" disabled={unreadCount === 0} onClick={onMarkAll}>
            {t("Mark all as read", "Alle als gelesen markieren")}
          </Button>
        </div>
        <div className="notification-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === "unread"}
            className={tab === "unread" ? "active" : ""}
            onClick={() => setTab("unread")}
          >
            {t("Unread", "Ungelesen")} <span>{unreadCount}</span>
          </button>
          <button
            role="tab"
            aria-selected={tab === "all"}
            className={tab === "all" ? "active" : ""}
            onClick={() => setTab("all")}
          >
            {t("All", "Alle")} <span>{notifications.length}</span>
          </button>
        </div>
        {visible.length === 0 ? (
          <div className="notification-empty card">
            <Icon name="bell" size={30} />
            <h2>
              {tab === "unread"
                ? t("No unread notifications", "Keine ungelesenen Benachrichtigungen")
                : t("No notifications yet", "Noch keine Benachrichtigungen")}
            </h2>
            <p>{t("You’re all caught up.", "Sie sind auf dem neuesten Stand.")}</p>
          </div>
        ) : (
          <div className="notification-list">
            {visible.map((item) => (
              <article
                className={`notification-item card ${item.read ? "" : "unread"}`}
                key={item.id}
              >
                <span className="notification-dot" aria-hidden="true" />
                <div>
                  <div className="notification-meta">
                    <h2>{item.title[language]}</h2>
                    <time>{timestamp(item.createdAt)}</time>
                  </div>
                  <p>{item.message[language]}</p>
                </div>
                <Button icon="arrow" variant="secondary" onClick={() => onOpen(item)}>
                  {item.action[language]}
                </Button>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  const [role, setRole] = useState<Role | null>(null);
  const [language, setLanguage] = useState<Language>(() => {
    const saved = window.localStorage.getItem("stepwise-language");
    return saved === "DE" ? "DE" : "EN";
  });
  const [examLanguage, setExamLanguage] = useState<Language>("EN");
  const [awardedMark, setAwardedMark] = useState<number | null>(null);
  const [studentAnswer, setStudentAnswer] = useState("528");
  const [teacherFeedback, setTeacherFeedback] = useState(
    "Strong multiplication. Practise comparing fractions with visual models.",
  );
  const [redFlagDecision, setRedFlagDecision] = useState<
    "confirmed" | "dismissed" | "postponed" | null
  >(null);
  const [dismissed, setDismissed] = useState(false);
  const [ocrVerified, setOcrVerified] = useState(false);
  const [published, setPublished] = useState(false);
  const [shareParent, setShareParent] = useState(true);
  const [practiced, setPracticed] = useState(false);
  const [practiceScore, setPracticeScore] = useState<number | null>(null);
  const [reminderSent, setReminderSent] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const [navigationRequest, setNavigationRequest] = useState<NavigationRequest>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const addNotification: AddNotification = (targetRole, title, message, action, target) => {
    setNotifications((current) => [
      {
        id: nextNotificationId++,
        role: targetRole,
        title,
        message,
        action,
        target,
        createdAt: Date.now(),
        read: false,
      },
      ...current,
    ]);
  };
  const unreadFor = (targetRole: Role) =>
    notifications.filter((item) => item.role === targetRole && !item.read).length;
  const logout = () => {
    setRole(null);
    setNotificationCenterOpen(false);
    setNavigationRequest(null);
    setToast(null);
  };
  const openNotification = (item: AppNotification) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === item.id ? { ...notification, read: true } : notification,
      ),
    );
    setNavigationRequest({ role: item.role, target: item.target, id: item.id });
    setNotificationCenterOpen(false);
  };
  const notify = (message: string | ToastState) =>
    setToast(
      typeof message === "string"
        ? { message: translateText(message, language) }
        : {
            ...message,
            message: translateText(message.message, language),
            actionLabel: message.actionLabel
              ? translateText(message.actionLabel, language)
              : undefined,
          },
    );
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    window.localStorage.setItem("stepwise-language", language);
  }, [language]);
  return (
    <>
      {!role && (
        <Login
          language={language}
          setLanguage={setLanguage}
          onLogin={(nextRole) => {
            const planSeen = notifications.some(
              (item) => item.role === "student" && item.target === "practice" && item.read,
            );
            if (nextRole === "student" && planSeen && !practiced && !reminderSent) {
              addNotification(
                "student",
                {
                  EN: "Reminder: your practice is waiting",
                  DE: "Erinnerung: deine Übung wartet",
                },
                {
                  EN: "Your fraction lesson and quiz take about 5 minutes. Give it a try today!",
                  DE: "Deine Bruch-Lektion und das Quiz dauern etwa 5 Minuten. Probier es heute!",
                },
                { EN: "Start practice", DE: "Übung starten" },
                "practice",
              );
              setReminderSent(true);
            }
            setRole(nextRole);
            setNavigationRequest(null);
          }}
        />
      )}
      {role && notificationCenterOpen && (
        <NotificationCenter
          role={role}
          language={language}
          setLanguage={setLanguage}
          onLogout={logout}
          notifications={notifications.filter((item) => item.role === role)}
          onMarkAll={() =>
            setNotifications((current) =>
              current.map((item) => (item.role === role ? { ...item, read: true } : item)),
            )
          }
          onOpen={openNotification}
          onBack={() => {
            setNavigationRequest(null);
            setNotificationCenterOpen(false);
          }}
        />
      )}
      {role === "student" && !notificationCenterOpen && (
        <StudentApp
          awardedMark={awardedMark}
          studentAnswer={studentAnswer}
          teacherFeedback={teacherFeedback}
          published={published}
          ocrVerified={ocrVerified}
          redFlagDecision={redFlagDecision}
          practiced={practiced}
          setPracticed={setPracticed}
          practiceScore={practiceScore}
          setPracticeScore={setPracticeScore}
          recentNotifications={notifications.filter((item) => item.role === "student")}
          onOpenNotification={openNotification}
          examLanguage={examLanguage}
          setExamLanguage={setExamLanguage}
          language={language}
          setLanguage={setLanguage}
          onExit={logout}
          notify={notify}
          unreadCount={unreadFor("student")}
          onNotifications={() => setNotificationCenterOpen(true)}
          addNotification={addNotification}
          navigationRequest={navigationRequest}
        />
      )}
      {role === "teacher" && !notificationCenterOpen && (
        <TeacherApp
          awardedMark={awardedMark}
          setAwardedMark={setAwardedMark}
          studentAnswer={studentAnswer}
          setStudentAnswer={setStudentAnswer}
          teacherFeedback={teacherFeedback}
          setTeacherFeedback={setTeacherFeedback}
          redFlagDecision={redFlagDecision}
          setRedFlagDecision={setRedFlagDecision}
          dismissed={dismissed}
          setDismissed={setDismissed}
          ocrVerified={ocrVerified}
          setOcrVerified={setOcrVerified}
          published={published}
          setPublished={setPublished}
          shareParent={shareParent}
          setShareParent={setShareParent}
          examLanguage={examLanguage}
          language={language}
          setLanguage={setLanguage}
          onExit={logout}
          notify={notify}
          unreadCount={unreadFor("teacher")}
          onNotifications={() => setNotificationCenterOpen(true)}
          addNotification={addNotification}
          navigationRequest={navigationRequest}
        />
      )}
      {role === "parent" && !notificationCenterOpen && (
        <ParentApp
          awardedMark={awardedMark}
          published={published}
          shareParent={shareParent}
          teacherFeedback={teacherFeedback}
          language={language}
          setLanguage={setLanguage}
          onExit={logout}
          notify={notify}
          unreadCount={unreadFor("parent")}
          onNotifications={() => setNotificationCenterOpen(true)}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" />
          <span>{toast.message}</span>
          {toast.actionLabel && (
            <button
              className="toast-action"
              onClick={() => {
                toast.onAction?.();
                setToast(null);
              }}
            >
              {toast.actionLabel}
            </button>
          )}
          <button
            onClick={() => setToast(null)}
            aria-label={language === "DE" ? "Benachrichtigung schließen" : "Close notification"}
          >
            <Icon name="close" size={17} />
          </button>
        </div>
      )}
    </>
  );
}