import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  ActivityHistoryPage,
  RecentActivity,
  RoleActivity,
  logActivity,
  markActivityUndone,
} from "./activity";
import { ConfirmDialog, ErrorNote, GradingLoader, HelpTip, useEscape } from "./heuristics";
import { AccessibilityToolbar, ReadAloudButton, requestReadAloud } from "./accessibility";
import { Button, Icon, Status, type IconName } from "./ui";
import {
  flaggedReadings,
  khadijaConcepts,
  newId,
  questions,
  updateClassState,
  useClassState,
  type FlaggedReading,
} from "./store";
import {
  AssessmentsPage,
  ClassPerformance,
  ClassPicker,
  Gradebook,
  MessagesPage,
  NoteComposer,
  OtherClassOverview,
  OcrCheck,
  OcrQueue,
  QuestionReview,
  QuizMonitor,
  ResourcesPanel,
  RosterPage,
  SkillTree,
  StudentRecord,
  TeacherProfile,
  TodayPanel,
  GradeBreakdown,
  sendPracticeReminder,
  type KhadijaLive,
} from "./teacher";
import {
  ChildSwitcher,
  LearningAlert,
  ParentConcepts,
  ParentMessages,
  ParentProfile,
  ParentResources,
  ParentResults,
  ParentTabs,
  PracticeStatus,
  ProgressReport,
  SiblingView,
  type Child,
  type ParentQuiz,
  type ParentTab,
} from "./parent";
import { CameraCapture, ExplainerVideo, analyzePage, type PageQuality } from "./student-media";
import { LineChart, conceptColors, conceptShape } from "./charts";

type Role = "student" | "teacher" | "parent";
type StudentView =
  | "home"
  | "feedback"
  | "practice"
  | "upload"
  | "notifications"
  | "progress"
  | "profile"
  | "messages";
type PracticePhase = "lesson" | "quiz" | "result";
type HelpRequest = { mode: "ask" | "report"; question: number };
type TeacherView =
  | "overview"
  | "review"
  | "insights"
  | "activity"
  | "students"
  | "student"
  | "assessments"
  | "byquestion"
  | "gradebook"
  | "skilltree"
  | "messages"
  | "profile";
type ReviewStage = "ocr" | "grade" | "redflag" | "publish";
type ReviewStudent = "Khadija" | "Mariam" | "Salma";
type ToastState = { message: string; actionLabel?: string; onAction?: () => void };
type Language = "EN" | "DE";
import type { NotificationTarget } from "./store";
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
  "Reject AI mark": "KI-Bewertung ablehnen",
  "AI mark rejected": "KI-Bewertung abgelehnt",
  "Enter your own mark.": "Geben Sie Ihre eigene Bewertung ein.",
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
  "Read aloud": "Vorlesen",
  "Teacher checking": "Lehrerin prüft",
  "Type your username first, then tap the 4 numbers of your PIN.":
    "Schreib zuerst deinen Benutzernamen und tippe dann die 4 Zahlen deiner PIN.",
  "Your PIN has 4 numbers. Tap the missing numbers, then press Log in.":
    "Deine PIN hat 4 Zahlen. Tippe die fehlenden Zahlen und drücke dann Anmelden.",
  "That username or PIN is not right. Tap Clear, enter your PIN again, or ask your teacher for help.":
    "Benutzername oder PIN stimmen nicht. Tippe auf Löschen, gib deine PIN neu ein oder frag deine Lehrerin.",
  "Enter your email address, then your password.": "Geben Sie Ihre E-Mail-Adresse und dann Ihr Passwort ein.",
  "Enter your password, then press Log in.": "Geben Sie Ihr Passwort ein und drücken Sie dann Anmelden.",
  "The email or password is not right. Check for typing mistakes, or press Use demo account.":
    "E-Mail oder Passwort stimmen nicht. Prüfen Sie auf Tippfehler oder drücken Sie Demo-Konto verwenden.",
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
  "Strong multiplication. Practice comparing fractions with drawings.":
    "Sichere Multiplikation. Übe den Bruchvergleich mit Zeichnungen.",
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
  "What to practice next": "Das sollte sie als Nächstes üben",
  "Use simple drawings to compare halves, thirds and quarters.":
    "Nutzen Sie einfache Zeichnungen, um Hälften, Drittel und Viertel zu vergleichen.",
  "PUBLISHED QUIZZES": "VERÖFFENTLICHTE QUIZZE",
  "Progress so far": "Bisheriger Fortschritt",
  MESSAGES: "NACHRICHTEN",
  "Messages from Ms. Ashraf": "Nachrichten von Frau Ashraf",
  "Ms. Ashraf · 4 October": "Frau Ashraf · 4. Oktober",
  "Khadija is getting stronger at multiplication. Short fraction activities at home will help.":
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
  "Award 0 of 3 marks": "0 von 3 Punkten vergeben",
  "Correct the flagged answer": "Markierte Antwort korrigieren",
  Suggestions: "Vorschläge",
  "As read by AI": "Wie von der KI gelesen",
  "Suggested correction": "Vorgeschlagene Korrektur",
  "Often confused in handwriting: 2 and 7, 1 and 7, 4 and 9. Press Enter to verify and go to the next flagged item.":
    "Häufig verwechselt in Handschrift: 2 und 7, 1 und 7, 4 und 9. Mit Enter prüfen und zur nächsten Markierung wechseln.",
  Low: "Niedrig",
  "Carrying error": "Übertragsfehler",
  Improving: "Verbessert sich",
  "Same carrying mistake in two quizzes.": "Gleicher Übertragsfehler in zwei Quizzen.",
  "Improving after practice; pop quiz passed.": "Besser nach der Übung; Kurz-Quiz bestanden.",
  "Open record": "Akte öffnen",
  "Send note": "Notiz senden",
  "Send reminder": "Erinnerung senden",
  Students: "Kinder",
  Assessments: "Prüfungen",
  "Review by question": "Nach Aufgabe prüfen",
  Gradebook: "Notenbuch",
  "Skill tree": "Kompetenzbaum",
  Messages: "Nachrichten",
  "Profile and settings": "Profil und Einstellungen",
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
  const answerMismatch = core.match(/^The answer (.+) does not match the expected result 528\.$/);
  if (answerMismatch)
    return `${leading}Die Antwort ${answerMismatch[1]} entspricht nicht dem erwarteten Ergebnis 528.${trailing}`;
  const practiceDone = core.match(/^Practice done; pop quiz (\d)\/3$/);
  if (practiceDone) return `${leading}Übung erledigt; Kurz-Quiz ${practiceDone[1]}/3${trailing}`;
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

/** A new page (login, role, view or tab) starts at the top instead of the previous scroll position. */
function useScrollTopOn(key: string) {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [key]);
}

/**
 * Stepwise mark: two steps with a sprout growing from the top one ("Every little step helps us
 * grow"). Colours come from the shared palette; outline weight is set per role in CSS
 * (thick and playful for students, finer for teacher and parent).
 */
export function LogoMark({ className = "logo-mark" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <g className="logo-mark-lines" fill="none" stroke="currentColor" strokeLinejoin="round" strokeLinecap="round">
        <rect x="5" y="31" width="17" height="13" rx="2.5" fill="#b8d8e8" />
        <rect x="21" y="22" width="22" height="22" rx="2.5" fill="#f5dfa8" />
        <path d="M32 22 V11" />
        <path className="logo-leaf" d="M32 15 C26.5 15 23.5 11.5 23.5 7 C29 7 32 10.5 32 15 Z" fill="#a8c9b5" />
        <path className="logo-leaf logo-leaf-right" d="M32 12 C36.5 12 40.5 9 40.5 4 C35.5 4 32 7.5 32 12 Z" fill="#a8c9b5" />
      </g>
    </svg>
  );
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="logo">
      <LogoMark />
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

function TopBar({
  role,
  language,
  setLanguage,
  onExit,
  unreadCount,
  onNotifications,
  onProfile,
  readAloud,
}: {
  role: Role;
  language: "EN" | "DE";
  setLanguage: (l: "EN" | "DE") => void;
  onExit: () => void;
  unreadCount: number;
  onNotifications: () => void;
  onProfile?: () => void;
  /** Teacher/parent: the page area the "Read aloud" button reads, and a key that changes per screen. */
  readAloud?: { target: string; screenKey: string };
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  useEscape(menuOpen, () => setMenuOpen(false));
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
        {readAloud && (
          <ReadAloudButton language={language} targetSelector={readAloud.target} screenKey={readAloud.screenKey} />
        )}
        <button
          className="notification-bell"
          onClick={onNotifications}
          aria-label={
            language === "DE"
              ? `Benachrichtigungen, ${unreadCount} ungelesen`
              : `Notifications, ${unreadCount} unread`
          }
          title={language === "DE" ? "Benachrichtigungen" : "Notifications"}
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
      setError("Enter your email address, then your password.");
      return;
    }
    if (!password) {
      setError("Enter your password, then press Log in.");
      return;
    }
    const expectedEmail = tab === "teacher" ? "somaya@stepwise.demo" : "parent@stepwise.demo";
    if (email.trim().toLowerCase() !== expectedEmail || password !== "demo1234") {
      setError("The email or password is not right. Check for typing mistakes, or press Use demo account.");
      return;
    }
    setError("");
    onLogin(tab);
  };
  const submitStudent = (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim()) {
      setError("Type your username first, then tap the 4 numbers of your PIN.");
      return;
    }
    if (pin.length < 4) {
      setError("Your PIN has 4 numbers. Tap the missing numbers, then press Log in.");
      return;
    }
    if (username.trim().toLowerCase() !== "khadija" || pin !== "1234") {
      setError("That username or PIN is not right. Tap Clear, enter your PIN again, or ask your teacher for help.");
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
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => scrollActiveIntoView(navRef.current), [view]);
  return (
    <nav className="student-nav" ref={navRef}>
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

/** Bottom tab bars scroll sideways on small phones: keep the current tab visible. */
function scrollActiveIntoView(nav: HTMLElement | null) {
  const active = nav?.querySelector<HTMLElement>("button.active");
  if (!nav || !active || nav.scrollWidth <= nav.clientWidth) return;
  nav.scrollTo({ left: active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2, behavior: "smooth" });
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

/** Pie for a fraction "a/b": a of b equal slices filled, with slice lines. */
function pieStyle(fraction: string, color: string) {
  const [top, bottom] = fraction.split("/").map(Number);
  return {
    background: `repeating-conic-gradient(#35433d 0deg 1.5deg, transparent 1.5deg ${360 / bottom}deg), conic-gradient(${color} 0 ${(top / bottom) * 100}%, #eeeaf5 0)`,
  };
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
  useScrollTopOn(view);
  const [practiceStep, setPracticeStep] = useState(0);
  const [practiceAnswer, setPracticeAnswer] = useState<number | null>(null);
  const [uploadStep, setUploadStep] = useState(0);
  const [pages, setPages] = useState<UploadPage[]>([]);
  const [camera, setCamera] = useState<{ replaceId: number | null } | null>(null);
  const nextPageId = useRef(1);
  // Demo script: the first sample photo is blurry, every later one is clear.
  const samplePhotos = useRef(0);
  const [practicePhase, setPracticePhase] = useState<PracticePhase>("lesson");
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizRound, setQuizRound] = useState(0);
  const [helpRequest, setHelpRequest] = useState<HelpRequest | null>(null);
  useEscape(helpRequest !== null, () => setHelpRequest(null));
  // Nielsen #5: the exam language is chosen on purpose before sending (no silent default).
  const [languageChosen, setLanguageChosen] = useState(false);
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
  const classState = useClassState();
  const myThreads = classState.threads.filter(
    (thread) => thread.student === "Khadija" && thread.kind !== "parent",
  );
  const addThread = (kind: "question" | "report", q: number, text: string) =>
    updateClassState((current) => ({
      threads: [
        {
          id: newId(),
          student: "Khadija",
          kind,
          question: q,
          title:
            kind === "question"
              ? { EN: `Question about Q${q}`, DE: `Frage zu Aufgabe ${q}` }
              : { EN: `Possible error in Q${q}`, DE: `Möglicher Fehler in Aufgabe ${q}` },
          messages: [{ from: "student", text, at: Date.now() }],
          status: "open",
        },
        ...current.threads,
      ],
    }));
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
        { EN: "Open message", DE: "Nachricht öffnen" },
        "messages",
      );
      addThread("question", q, note);
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
        { EN: "Open message", DE: "Nachricht öffnen" },
        "messages",
      );
      addThread("report", q, `${de ? reason.DE : reason.EN}${note ? ` – ${note}` : ""}`);
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
        advice: t(
          "This page is blurry. Hold the tablet still, then tap Retake.",
          "Diese Seite ist unscharf. Halte das Tablet ruhig und tippe dann auf Neu.",
        ),
      },
      dark: {
        type: "warn" as const,
        label: t("Too dark", "Zu dunkel"),
        advice: t(
          "This page is too dark. Turn on more light, then tap Retake.",
          "Diese Seite ist zu dunkel. Mach mehr Licht an und tippe dann auf Neu.",
        ),
      },
      small: {
        type: "warn" as const,
        label: t("Too small", "Zu klein"),
        advice: t(
          "This page is too small to read. Move closer, then tap Retake.",
          "Diese Seite ist zu klein zum Lesen. Geh näher heran und tippe dann auf Neu.",
        ),
      },
    })[quality];
  const startPractice = () => {
    setPracticePhase("lesson");
    setPracticeStep(0);
    setPracticeAnswer(null);
    setQuizAnswers([]);
    setView("practice");
  };
  // Two sets so that "try new questions" is not a repeat of the same answers.
  type QuizOption = { label: string; fractions: string[] };
  type QuizQuestion = {
    title: string;
    options: QuizOption[];
    correct: number;
    why: string;
    wrongNote: string;
  };
  const quizSets: QuizQuestion[][] = [
    [
      {
        title: t("Which fraction is bigger?", "Welcher Bruch ist größer?"),
        options: [
          { label: "2/3", fractions: ["2/3"] },
          { label: "3/5", fractions: ["3/5"] },
        ],
        correct: 0,
        why: t(
          "Make the bottom numbers the same: 2/3 = 10/15 and 3/5 = 9/15. 10 is more than 9, so 2/3 is bigger.",
          "Mache die unteren Zahlen gleich: 2/3 = 10/15 und 3/5 = 9/15. 10 ist mehr als 9, also ist 2/3 größer.",
        ),
        wrongNote: t(
          "3/5 has the bigger bottom number, but that only means its pieces are smaller.",
          "3/5 hat die größere untere Zahl, aber das heißt nur, dass die Stücke kleiner sind.",
        ),
      },
      {
        title: t("Which fraction is smaller?", "Welcher Bruch ist kleiner?"),
        options: [
          { label: "1/4", fractions: ["1/4"] },
          { label: "1/2", fractions: ["1/2"] },
        ],
        correct: 0,
        why: t(
          "Cut into 4 pieces, each piece is smaller than a half. So 1/4 is smaller than 1/2.",
          "In 4 Stücke geteilt ist jedes Stück kleiner als eine Hälfte. Also ist 1/4 kleiner als 1/2.",
        ),
        wrongNote: t(
          "1/2 has the smaller bottom number, but its pieces are bigger.",
          "1/2 hat die kleinere untere Zahl, aber seine Stücke sind größer.",
        ),
      },
      {
        title: t("Which fractions are equal?", "Welche Brüche sind gleich groß?"),
        options: [
          { label: t("2/4 and 1/2", "2/4 und 1/2"), fractions: ["2/4", "1/2"] },
          { label: t("2/4 and 2/3", "2/4 und 2/3"), fractions: ["2/4", "2/3"] },
        ],
        correct: 0,
        why: t(
          "Two quarters cover the same as one half: 2/4 = 1/2.",
          "Zwei Viertel sind genauso viel wie eine Hälfte: 2/4 = 1/2.",
        ),
        wrongNote: t(
          "2/4 is exactly half, but 2/3 is more than half.",
          "2/4 ist genau die Hälfte, aber 2/3 ist mehr als die Hälfte.",
        ),
      },
    ],
    [
      {
        title: t("Which fraction is bigger?", "Welcher Bruch ist größer?"),
        options: [
          { label: "2/3", fractions: ["2/3"] },
          { label: "3/4", fractions: ["3/4"] },
        ],
        correct: 1,
        why: t(
          "Make the bottom numbers the same: 3/4 = 9/12 and 2/3 = 8/12. 9 is more than 8, so 3/4 is bigger.",
          "Mache die unteren Zahlen gleich: 3/4 = 9/12 und 2/3 = 8/12. 9 ist mehr als 8, also ist 3/4 größer.",
        ),
        wrongNote: t(
          "They look close! Making the bottom numbers the same shows the difference.",
          "Sie sehen ähnlich aus! Gleiche untere Zahlen zeigen den Unterschied.",
        ),
      },
      {
        title: t("Which fraction is smaller?", "Welcher Bruch ist kleiner?"),
        options: [
          { label: "2/5", fractions: ["2/5"] },
          { label: "2/3", fractions: ["2/3"] },
        ],
        correct: 0,
        why: t(
          "Both have 2 pieces, but fifths are smaller than thirds. So 2/5 is smaller.",
          "Beide haben 2 Stücke, aber Fünftel sind kleiner als Drittel. Also ist 2/5 kleiner.",
        ),
        wrongNote: t(
          "When the top numbers are the same, the bigger bottom number means smaller pieces.",
          "Wenn die oberen Zahlen gleich sind, bedeutet die größere untere Zahl kleinere Stücke.",
        ),
      },
      {
        title: t("Which fractions are equal?", "Welche Brüche sind gleich groß?"),
        options: [
          { label: t("3/6 and 1/3", "3/6 und 1/3"), fractions: ["3/6", "1/3"] },
          { label: t("3/6 and 1/2", "3/6 und 1/2"), fractions: ["3/6", "1/2"] },
        ],
        correct: 1,
        why: t(
          "3/6 is half of the whole, the same as 1/2.",
          "3/6 ist die Hälfte vom Ganzen, genauso viel wie 1/2.",
        ),
        wrongNote: t(
          "3/6 is half, but 1/3 is less than half.",
          "3/6 ist die Hälfte, aber 1/3 ist weniger als die Hälfte.",
        ),
      },
    ],
  ];
  const practiceQuestions = quizSets[quizRound % quizSets.length];
  const currentPractice = practiceQuestions[practiceStep];
  const quizScore = quizAnswers.filter((answer, i) => answer === practiceQuestions[i]?.correct).length;
  const startQuiz = (round: number) => {
    setQuizRound(round);
    setPracticePhase("quiz");
    setPracticeStep(0);
    setPracticeAnswer(null);
    setQuizAnswers([]);
    setView("practice");
  };
  useEffect(() => {
    if (navigationRequest?.role !== "student") return;
    if (navigationRequest.target === "feedback") setView("feedback");
    if (navigationRequest.target === "practice") startPractice();
    if (navigationRequest.target === "messages") setView("messages");
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
              <div className="lesson-actions home-update-actions">
                <Button icon="bell" variant="ghost" onClick={onNotifications}>
                  {t("See all updates", "Alle Neuigkeiten ansehen")}
                </Button>
                <Button icon="message" variant="ghost" onClick={() => setView("messages")}>
                  {t("My messages", "Meine Nachrichten")}
                  {myThreads.length ? ` (${myThreads.length})` : ""}
                </Button>
              </div>
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
                            ? t("Keep practicing", "Weiter üben")
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
              {classState.resources.video && <ExplainerVideo language={language} />}
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
                  onClick={() => startQuiz(quizRound)}
                >
                  {t("Start the quiz", "Quiz starten")}
                </Button>
                {classState.resources.printable !== "none" && (
                  <Button
                    icon="book"
                    variant="secondary"
                    onClick={() =>
                      notify(
                        classState.resources.printable === "game"
                          ? t(
                              "Fraction strips game ready to print (demo only).",
                              "Bruchstreifen-Spiel zum Drucken bereit (nur Demo).",
                            )
                          : t(
                              "Worksheet ready to print (demo only).",
                              "Arbeitsblatt zum Drucken bereit (nur Demo).",
                            ),
                      )
                    }
                  >
                    {classState.resources.printable === "game"
                      ? t("Print fraction strips game", "Bruchstreifen-Spiel drucken")
                      : t("Print worksheet", "Arbeitsblatt drucken")}
                  </Button>
                )}
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
                <p className="kicker">
                  {quizRound > 0
                    ? t("POP QUIZ · NEW QUESTIONS", "KURZ-QUIZ · NEUE FRAGEN")
                    : t("POP QUIZ", "KURZ-QUIZ")}
                </p>
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
                  <div className="practice-option-wrap" key={option.label}>
                    <button
                      className={practiceAnswer === index ? "selected" : ""}
                      aria-pressed={practiceAnswer === index}
                      onClick={() => setPracticeAnswer(index)}
                    >
                      <span className="pie-row">
                        {option.fractions.map((fraction, i) => (
                          <span
                            key={`${fraction}-${i}`}
                            className={`pie ${option.fractions.length > 1 ? "pie-small" : ""}`}
                            style={pieStyle(fraction, index === 0 ? "#6d4aff" : "#ffb68a")}
                            aria-hidden="true"
                          />
                        ))}
                      </span>
                      <strong>{option.label}</strong>
                      <small>
                        <Icon name={practiceAnswer === index ? "check" : "person"} size={16} />{" "}
                        {practiceAnswer === index ? t("Your choice", "Deine Wahl") : t("Choose", "Wähle")}
                      </small>
                    </button>
                    {index === 0 && <div className="or">{t("or", "oder")}</div>}
                  </div>
                ))}
              </div>
              <p className="quiz-hint">
                {practiceAnswer === null
                  ? t("Pick one answer. You will see the results at the end.", "Wähle eine Antwort. Die Ergebnisse siehst du am Ende.")
                  : t("Answer saved. You can still change it.", "Antwort gespeichert. Du kannst sie noch ändern.")}
              </p>
              {practiceStep > 0 && (
                <Button
                  icon="arrow"
                  variant="ghost"
                  className="back-button"
                  onClick={() => {
                    setPracticeStep(practiceStep - 1);
                    setPracticeAnswer(quizAnswers[practiceStep - 1] ?? null);
                  }}
                >
                  {t("Previous question", "Vorige Aufgabe")}
                </Button>
              )}
              <Button
                icon={practiceStep === 2 ? "check" : "arrow"}
                disabled={practiceAnswer === null}
                onClick={() => {
                  if (practiceAnswer === null) return;
                  const answers = [...quizAnswers.slice(0, practiceStep), practiceAnswer, ...quizAnswers.slice(practiceStep + 1)];
                  setQuizAnswers(answers);
                  if (practiceStep < 2) {
                    setPracticeStep(practiceStep + 1);
                    setPracticeAnswer(quizAnswers[practiceStep + 1] ?? null);
                    return;
                  }
                  const right = answers.filter((answer, i) => answer === practiceQuestions[i].correct).length;
                  setPracticed(true);
                  setPracticeScore(right);
                  logActivity("practice", "Khadija", {
                    EN: `Fraction pop quiz${quizRound > 0 ? " (new questions)" : ""}: ${right}/3 right`,
                    DE: `Bruch-Kurz-Quiz${quizRound > 0 ? " (neue Fragen)" : ""}: ${right}/3 richtig`,
                  });
                  addNotification(
                    "teacher",
                    {
                      EN: "Khadija completed practice",
                      DE: "Khadija hat die Übung abgeschlossen",
                    },
                    {
                      EN: `Khadija finished the fraction pop quiz: ${right} of 3 right.${right < 3 ? " Stepwise recommended more practice." : ""}`,
                      DE: `Khadija hat das Bruch-Kurz-Quiz beendet: ${right} von 3 richtig.${right < 3 ? " Stepwise hat weitere Übung empfohlen." : ""}`,
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
                    `You got ${quizScore} of 3 right!`,
                    `Du hattest ${quizScore} von 3 richtig!`,
                  )}
                </h1>
              </div>
            </div>
            <div className="question-list practice-results">
              {practiceQuestions.map((question, index) => {
                const chosen = quizAnswers[index];
                const right = chosen === question.correct;
                return (
                  <article className="question-row" key={question.title + index}>
                    <div className={`q-number ${right ? "good" : "warn"}`}>
                      <Icon name={right ? "check" : "idea"} />
                    </div>
                    <div>
                      <p>
                        {t("Question", "Aufgabe")} {index + 1}
                      </p>
                      <h3>{question.title}</h3>
                      <span>
                        {t("Your answer", "Deine Antwort")}: {question.options[chosen]?.label ?? "—"}
                      </span>
                      {!right && (
                        <>
                          <span className="quiz-right-answer">
                            {t("Right answer", "Richtige Antwort")}:{" "}
                            <b>{question.options[question.correct].label}</b>
                          </span>
                          <p className="q-why">
                            <Icon name="idea" size={18} />
                            <span>
                              <b>{t("Why?", "Warum?")}</b> {question.wrongNote} {question.why}
                            </span>
                          </p>
                        </>
                      )}
                    </div>
                    <div className="q-result">
                      <Status type={right ? "good" : "warn"}>
                        {right ? t("Correct", "Richtig") : t("Not yet", "Noch nicht")}
                      </Status>
                    </div>
                  </article>
                );
              })}
            </div>
            <article className={`card quiz-recommendation ${quizScore === 3 ? "done" : ""}`}>
              <span className="focus-icon">
                <Icon name={quizScore === 3 ? "star" : "idea"} size={27} />
              </span>
              <div>
                <p className="kicker">
                  {quizScore === 3
                    ? t("NO EXTRA PRACTICE NEEDED", "KEINE EXTRA-ÜBUNG NÖTIG")
                    : t("RECOMMENDED PRACTICE", "EMPFOHLENE ÜBUNG")}
                </p>
                <h2>
                  {quizScore === 3
                    ? t("You can compare fractions!", "Du kannst Brüche vergleichen!")
                    : quizScore === 2
                      ? t("One more short round will help", "Eine kurze Runde mehr hilft dir")
                      : t("Watch the lesson again first", "Schau dir zuerst die Lektion noch einmal an")}
                </h2>
                {quizScore === 3 ? (
                  <p>
                    {t(
                      "Great work! Ms. Ashraf can see your result.",
                      "Super gemacht! Frau Ashraf kann dein Ergebnis sehen.",
                    )}
                  </p>
                ) : (
                  <ol>
                    {quizScore <= 1 && (
                      <li>
                        {t(
                          "Watch the 20-second video and read the 3 steps.",
                          "Schau das 20-Sekunden-Video und lies die 3 Schritte.",
                        )}
                      </li>
                    )}
                    <li>
                      {t(
                        "Read the “Why?” boxes above.",
                        "Lies die „Warum?“-Kästen oben.",
                      )}
                    </li>
                    <li>
                      {t(
                        "Then try 3 new questions.",
                        "Dann probiere 3 neue Fragen.",
                      )}
                    </li>
                    {quizScore <= 1 && (
                      <li>
                        {t(
                          "Ms. Ashraf can see your result and will help you in class.",
                          "Frau Ashraf sieht dein Ergebnis und hilft dir im Unterricht.",
                        )}
                      </li>
                    )}
                  </ol>
                )}
              </div>
              <div className="lesson-actions">
                {quizScore === 3 ? (
                  <Button icon="trend" onClick={() => setView("progress")}>
                    {t("See my progress", "Meinen Fortschritt ansehen")}
                  </Button>
                ) : quizScore === 2 ? (
                  <>
                    <Button icon="play" onClick={() => startQuiz(quizRound + 1)}>
                      {t("Try 3 new questions", "3 neue Fragen probieren")}
                    </Button>
                    <Button
                      icon="book"
                      variant="secondary"
                      onClick={() => {
                        setQuizRound(quizRound + 1);
                        setPracticePhase("lesson");
                      }}
                    >
                      {t("Watch the lesson again", "Lektion noch einmal ansehen")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      icon="book"
                      onClick={() => {
                        setQuizRound(quizRound + 1);
                        setPracticePhase("lesson");
                      }}
                    >
                      {t("Watch the lesson again", "Lektion noch einmal ansehen")}
                    </Button>
                    <Button icon="message" variant="secondary" onClick={() => openHelp("ask", 7)}>
                      {t("Ask Ms. Ashraf", "Frau Ashraf fragen")}
                    </Button>
                  </>
                )}
                {quizScore < 3 && (
                  <Button icon="trend" variant="ghost" onClick={() => setView("progress")}>
                    {t("Maybe later – see my progress", "Später – meinen Fortschritt ansehen")}
                  </Button>
                )}
              </div>
            </article>
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
                  <div className="lesson-actions">
                    <Button icon="close" variant="ghost" onClick={() => setView("home")}>
                      {t("Cancel", "Abbrechen")}
                    </Button>
                    <Button icon="check" onClick={() => setUploadStep(1)}>
                      {t("Choose this exam", "Diese Arbeit wählen")}
                    </Button>
                  </div>
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
                              <ErrorNote>{qualityStatus(page.quality).advice}</ErrorNote>
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
                  <div className="lesson-actions">
                    <Button icon="arrow" variant="ghost" className="back-button" onClick={() => setUploadStep(0)}>
                      {t("Back", "Zurück")}
                    </Button>
                    <Button icon="arrow" disabled={!pagesReady} onClick={() => setUploadStep(2)}>
                      {t("Check my pages", "Meine Seiten prüfen")}
                    </Button>
                  </div>
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
                      value={languageChosen ? examLanguage : ""}
                      onChange={(event) => {
                        setExamLanguage(event.target.value as Language);
                        setLanguageChosen(true);
                      }}
                    >
                      <option value="" disabled>
                        {t("Choose a language…", "Sprache wählen…")}
                      </option>
                      <option value="EN">{t("English", "Englisch")}</option>
                      <option value="DE">Deutsch</option>
                    </select>
                  </label>
                  {!languageChosen && (
                    <ErrorNote>
                      {t(
                        "Choose the language your exam is written in. Then you can send it.",
                        "Wähle die Sprache, in der deine Arbeit geschrieben ist. Dann kannst du sie senden.",
                      )}
                    </ErrorNote>
                  )}
                  <div className="lesson-actions">
                    <Button icon="edit" variant="secondary" onClick={() => setUploadStep(1)}>
                      {t("Change pages", "Seiten ändern")}
                    </Button>
                    <Button
                      icon="arrow"
                      disabled={!languageChosen || !pagesReady}
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
              <h2>{t("Maths quiz history", "Mathe-Quizverlauf")}</h2>
              <StairChart
                values={score === null ? [52, 58, 64] : [52, 58, 64, percent ?? 68]}
                label={t("Progress staircase", "Fortschrittstreppe")}
              />
              <div className="chart-labels student-chart-labels">
                <span>Quiz 1</span>
                <span>Quiz 2</span>
                <span>Quiz 3</span>
                {score !== null && <span>Quiz 4</span>}
              </div>
              {score === null ? (
                <>
                  <p className="progress-pending">
                    <Icon name="clock" size={18} />{" "}
                    {t(
                      "Quiz 4 is still being checked. It will join your chart when Ms. Ashraf shares it.",
                      "Quiz 4 wird noch geprüft. Es kommt in dein Diagramm, sobald Frau Ashraf es freigibt.",
                    )}
                  </p>
                  <AssessmentTracker stage={trackerStage} de={de} />
                </>
              ) : (
                <p className="progress-pending">
                  <Icon name="trend" size={18} />{" "}
                  {t(
                    `Up ${(percent ?? 68) - 52} points since Quiz 1. Well done!`,
                    `${(percent ?? 68) - 52} Punkte mehr seit Quiz 1. Gut gemacht!`,
                  )}
                </p>
              )}
            </article>
            <article className="card topic-growth-card">
              <p className="kicker">{t("BY TOPIC", "NACH THEMA")}</p>
              <h2>{t("How each skill is growing", "So wachsen deine Fähigkeiten")}</h2>
              <LineChart
                language={language}
                title={t(
                  "Your score in each topic, Quiz 2 to Quiz 4",
                  "Deine Ergebnisse pro Thema, Quiz 2 bis Quiz 4",
                )}
                xLabels={["Quiz 2", "Quiz 3", "Quiz 4"]}
                pendingNote={t("being checked", "wird geprüft")}
                series={khadijaConcepts.map((concept, index) => ({
                  name: concept.name[language],
                  values: score === null ? [...concept.values.slice(0, 2), null] : concept.values,
                  color: conceptColors[index],
                  shape: conceptShape(index),
                }))}
              />
              <div className="topic-status-row">
                {khadijaConcepts.map((concept) => (
                  <span key={concept.name.EN}>
                    <strong>{concept.name[language]}</strong>
                    <Status type={concept.level}>
                      {concept.level === "good"
                        ? t("Strong", "Stark")
                        : concept.level === "neutral"
                          ? t("Getting better", "Wird besser")
                          : t("Needs more practice", "Braucht mehr Übung")}
                    </Status>
                  </span>
                ))}
              </div>
            </article>
            <section className="student-insights">
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
                {practiced && practiceScore !== null && practiceScore < 3 && (
                  <div className="learning-spot">
                    <strong>
                      {t(
                        "Recommended: 3 new fraction questions",
                        "Empfohlen: 3 neue Bruchaufgaben",
                      )}
                    </strong>
                    <Status type="warn">{t("Waiting for you", "Wartet auf dich")}</Status>
                  </div>
                )}
                {(!practiced || (practiceScore ?? 3) < 3) && (
                  <Button icon="play" variant="secondary" onClick={startPractice}>
                    {practiced
                      ? t("Practice again", "Nochmal üben")
                      : t("Start practice", "Übung starten")}
                  </Button>
                )}
              </article>
            </section>
            <RoleActivity role="student" language={language} />
          </section>
        )}

        {view === "messages" && (
          <section>
            <div className="page-heading">
              <div>
                <button className="back-link" onClick={() => setView("home")}>
                  <Icon name="arrow" /> {t("Back home", "Zurück zum Start")}
                </button>
                <p className="kicker">{t("MESSAGES", "NACHRICHTEN")}</p>
                <h1>{t("Messages with Ms. Ashraf", "Nachrichten mit Frau Ashraf")}</h1>
              </div>
            </div>
            {myThreads.length === 0 ? (
              <article className="card student-thread">
                <p>
                  {t(
                    "No messages yet. On your feedback page you can ask Ms. Ashraf about any question.",
                    "Noch keine Nachrichten. Auf deiner Feedback-Seite kannst du Frau Ashraf zu jeder Aufgabe fragen.",
                  )}
                </p>
              </article>
            ) : (
              myThreads.map((thread) => (
                <article className="card student-thread" key={thread.id}>
                  <div className="section-title">
                    <h2>{thread.title[language]}</h2>
                    <Status type={thread.status === "open" ? "warn" : "good"}>
                      {thread.kind === "note"
                        ? t("Note from your teacher", "Notiz von deiner Lehrerin")
                        : thread.status === "open"
                          ? t("Waiting for Ms. Ashraf", "Wartet auf Frau Ashraf")
                          : thread.status === "resolved"
                            ? t("Checked by Ms. Ashraf", "Von Frau Ashraf geprüft")
                            : t("Ms. Ashraf answered", "Frau Ashraf hat geantwortet")}
                    </Status>
                  </div>
                  {thread.messages.map((message, index) => (
                    <p className={`bubble ${message.from}`} key={index} data-free-text>
                      <small>
                        {message.from === "teacher" ? t("Ms. Ashraf", "Frau Ashraf") : t("You", "Du")}
                      </small>
                      {message.text}
                    </p>
                  ))}
                </article>
              ))
            )}
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
              title={t("Close", "Schließen")}
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
  messageCount,
  language,
}: {
  view: TeacherView;
  setView: (v: TeacherView) => void;
  reviewCount: number;
  messageCount: number;
  language: Language;
}) {
  const items: { id: TeacherView; icon: IconName; label: string; count?: number }[] = [
    { id: "overview", icon: "grid", label: "Overview" },
    { id: "review", icon: "review", label: "Review queue", count: reviewCount },
    { id: "students", icon: "person", label: "Students" },
    { id: "assessments", icon: "book", label: "Assessments" },
    { id: "byquestion", icon: "check", label: "Review by question" },
    { id: "gradebook", icon: "grid", label: "Gradebook" },
    { id: "skilltree", icon: "spark", label: "Skill tree" },
    { id: "insights", icon: "trend", label: "Class insights" },
    { id: "messages", icon: "message", label: "Messages", count: messageCount },
    { id: "activity", icon: "clock", label: "Activity history" },
  ];
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => scrollActiveIntoView(navRef.current), [view]);
  return (
    <Localize language={language}>
      <aside className="teacher-side">
        <Logo />{" "}
        <nav ref={navRef}>
          {items.map((item) => (
            <button
              key={item.id}
              className={view === item.id || (item.id === "students" && view === "student") ? "active" : ""}
              onClick={() => setView(item.id)}
              title={translateText(item.label, language)}
            >
              <Icon name={item.icon} />
              {item.label}
              {item.count ? <b>{item.count}</b> : null}
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
  practiced,
  practiceScore,
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
  practiced: boolean;
  practiceScore: number | null;
}) {
  const [view, setView] = useState<TeacherView>("overview");
  useScrollTopOn(view);
  const [stage, setStage] = useState<ReviewStage>("ocr");
  const [selectedStudent, setSelectedStudent] = useState<ReviewStudent>("Khadija");
  const [modal, setModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideError, setOverrideError] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  // Papers the AI has finished grading (key: student + verified answer); first visit shows progress.
  const [gradedKeys, setGradedKeys] = useState<string[]>([]);
  const [drawer, setDrawer] = useState(false);
  useEscape(modal, () => setModal(false));
  useEscape(drawer, () => setDrawer(false));
  const [overrideAnswer, setOverrideAnswer] = useState(studentAnswer);
  const [overrideMark, setOverrideMark] = useState(3);
  const classState = useClassState();
  const otherReviewed = classState.otherReviewed as ReviewStudent[];
  const setOtherReviewed = (next: ReviewStudent[]) => updateClassState({ otherReviewed: next });
  const verifiedStudents = classState.verifiedStudents as ReviewStudent[];
  const setVerifiedStudents = (next: ReviewStudent[]) =>
    updateClassState({ verifiedStudents: next });
  const [recordName, setRecordName] = useState("Khadija");
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [ocrDraft, setOcrDraft] = useState<Record<string, string>>({});
  // Current flagged OCR reading (least certain first within each paper).
  const [flagId, setFlagId] = useState("khadija-q2");
  const [byQuestion, setByQuestion] = useState<5 | 7>(5);
  const tx = (en: string, de: string) => (language === "DE" ? de : en);
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
  const practicePending = supportPlanActive && !practiced;
  // AI proposal for Q2 follows the text the teacher verified (528 is the expected answer).
  const aiQ2 = studentAnswer.trim() === "528" ? 3 : 0;
  const khadijaLive: KhadijaLive = {
    ocrVerified,
    awardedMark,
    published,
    redFlagDecision,
    practiced,
    practiceScore,
    percent,
  };
  const common = {
    language,
    notify: (message: string) => notify(message),
    addNotification,
  };
  const openRecord = (name: string) => {
    setRecordName(name);
    setView("student");
  };
  type AttentionItem = {
    student: string;
    initials: string;
    urgency: string;
    flag: string;
    confidence: string;
    why: string;
    priority: number;
    reviewable: boolean;
  };
  const attention = (
    [
    {
      reviewable: true,
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
        ? practiced
          ? `Practice done; pop quiz ${practiceScore}/3`
          : "Fraction-comparison error confirmed; practice assigned"
        : "Low OCR confidence changes 3 marks.",
      priority: supportPlanActive ? 10 : 0,
    },
    {
      reviewable: true,
      student: "Salma" as ReviewStudent,
      initials: "SN",
      urgency: "High",
      flag: otherReviewed.includes("Salma")
        ? "Confirmed"
        : classState.rejected.includes("Salma")
          ? "AI mark rejected"
          : "Unclear answer",
      confidence: "52%",
      why: classState.rejected.includes("Salma")
        ? "Enter your own mark."
        : "Answer and working are both unclear.",
      priority: otherReviewed.includes("Salma") ? 30 : 1,
    },
    {
      reviewable: true,
      student: "Mariam" as ReviewStudent,
      initials: "MS",
      urgency: "Medium",
      flag: otherReviewed.includes("Mariam")
        ? "Confirmed"
        : classState.rejected.includes("Mariam")
          ? "AI mark rejected"
          : "Partial reasoning",
      confidence: "74%",
      why: classState.rejected.includes("Mariam")
        ? "Enter your own mark."
        : "AI proposes partial credit for reasoning.",
      priority: otherReviewed.includes("Mariam") ? 31 : 2,
    },
    {
      reviewable: false,
      student: "Laila",
      initials: "LA",
      urgency: "Medium",
      flag: "Carrying error",
      confidence: "88%",
      why: "Same carrying mistake in two quizzes.",
      priority: 5,
    },
    {
      reviewable: false,
      student: "Nour",
      initials: "NO",
      urgency: "Low",
      flag: "Improving",
      confidence: "93%",
      why: "Improving after practice; pop quiz passed.",
      priority: 40,
    },
    ] as AttentionItem[]
  )
    .sort((a, b) => a.priority - b.priority)
    .map((item, index) => ({ ...item, rank: index + 1 }));
  const openReview = (student: ReviewStudent, nextStage: ReviewStage = "ocr") => {
    const firstFlag = flaggedReadings.find((item) => item.student === student);
    if (firstFlag) setFlagId(firstFlag.id);
    setSelectedStudent(student);
    setStage(nextStage);
    setView("review");
  };
  // Mariam (Q5, 4 marks) and Salma (Q7, 3 marks): AI proposal follows the verified text.
  const otherQ = selectedStudent === "Mariam" ? { q: 5, out: 4 } : { q: 7, out: 3 };
  const otherFlag = flaggedReadings.find((item) => item.student === selectedStudent && item.q === otherQ.q);
  const otherAnswer =
    selectedStudent === "Khadija" ? "" : (classState.ocrValues[selectedStudent] ?? otherFlag?.read ?? "");
  const otherVerified = selectedStudent !== "Khadija" && verifiedStudents.includes(selectedStudent);
  const otherAi: number | null =
    selectedStudent === "Mariam"
      ? 2
      : selectedStudent === "Salma" && otherVerified
        ? otherAnswer.trim() === "2/3 > 3/5"
          ? 3
          : 0
        : null;
  const otherTeacherMark =
    selectedStudent !== "Khadija" && otherReviewed.includes(selectedStudent)
      ? classState.markEdits[`${selectedStudent}:${otherQ.q}`]
      : undefined;
  const rejectOther = () => {
    const name = selectedStudent;
    const key = `${name}:${otherQ.q}`;
    const before = { edits: classState.markEdits, reviewed: otherReviewed, rejected: classState.rejected };
    const { [key]: _removed, ...rest } = classState.markEdits;
    updateClassState({ markEdits: rest, rejected: [...new Set([...classState.rejected, name])] });
    setOtherReviewed(otherReviewed.filter((item) => item !== name));
    const entry = logActivity("mark", name, {
      EN: `Quiz 4 · Q${otherQ.q}: AI mark rejected, waiting for the teacher's mark`,
      DE: `Quiz 4 · A${otherQ.q}: KI-Bewertung abgelehnt, wartet auf die Bewertung der Lehrerin`,
    });
    notify({
      message: tx(
        `AI mark rejected. ${name} stays in your queue until you enter a mark.`,
        `KI-Bewertung abgelehnt. ${name} bleibt in der Warteschlange, bis Sie eine Bewertung eingeben.`,
      ),
      actionLabel: "Undo",
      onAction: () => {
        updateClassState({ markEdits: before.edits, rejected: before.rejected });
        setOtherReviewed(before.reviewed);
        markActivityUndone(entry);
      },
    });
    setView("overview");
  };
  const confirmMark = (mark = 3, answer = "528", reason = "") => {
    const why = reason.trim() ? { EN: ` · reason: ${reason.trim()}`, DE: ` · Grund: ${reason.trim()}` } : { EN: "", DE: "" };
    if (selectedStudent === "Khadija") {
      const before = { studentAnswer, awardedMark, dismissed, published };
      setStudentAnswer(answer);
      setAwardedMark(mark);
      setDismissed(false);
      setPublished(false);
      const proposal = answer.trim() === "528" ? 3 : 0;
      const entry =
        mark === proposal && answer === studentAnswer
          ? logActivity("mark", "Khadija", {
              EN: `Quiz 4 · Q2: AI mark ${mark}/3 confirmed`,
              DE: `Quiz 4 · A2: KI-Bewertung ${mark}/3 bestätigt`,
            })
          : logActivity("override", "Khadija", {
              EN: `Quiz 4 · Q2: AI proposed ${aiQ2}/3, teacher awarded ${mark}/3 (answer ${answer})${why.EN}`,
              DE: `Quiz 4 · A2: KI schlug ${aiQ2}/3 vor, Lehrerin vergab ${mark}/3 (Antwort ${answer})${why.DE}`,
            });
      notify({
        message: `Khadija’s answer saved as ${answer}; ${mark}/3 awarded.`,
        actionLabel: "Undo",
        onAction: () => {
          setStudentAnswer(before.studentAnswer);
          setAwardedMark(before.awardedMark);
          setDismissed(before.dismissed);
          setPublished(before.published);
          setSelectedStudent("Khadija");
          setStage("grade");
          setView("review");
          markActivityUndone(entry);
        },
      });
      setStage("redflag");
    } else {
      const name = selectedStudent;
      const key = `${name}:${otherQ.q}`;
      const before = {
        markEdits: classState.markEdits,
        ocrValues: classState.ocrValues,
        rejected: classState.rejected,
        reviewed: otherReviewed,
      };
      updateClassState((st) => ({
        markEdits: { ...st.markEdits, [key]: mark },
        ocrValues: { ...st.ocrValues, [name]: answer },
        rejected: st.rejected.filter((item) => item !== name),
      }));
      const confirmed = otherAi !== null && mark === otherAi && answer === otherAnswer;
      const entry = confirmed
        ? logActivity("mark", name, {
            EN: `Quiz 4 · Q${otherQ.q}: AI mark ${mark}/${otherQ.out} confirmed`,
            DE: `Quiz 4 · A${otherQ.q}: KI-Bewertung ${mark}/${otherQ.out} bestätigt`,
          })
        : logActivity("override", name, {
            EN: `Quiz 4 · Q${otherQ.q}: AI proposed ${otherAi === null ? "no mark" : `${otherAi}/${otherQ.out}`}, teacher awarded ${mark}/${otherQ.out} (answer ${answer})${why.EN}`,
            DE: `Quiz 4 · A${otherQ.q}: KI schlug ${otherAi === null ? "keine Bewertung" : `${otherAi}/${otherQ.out}`} vor, Lehrerin vergab ${mark}/${otherQ.out} (Antwort ${answer})${why.DE}`,
          });
      notify({
        message: confirmed
          ? `${name}’s mark was confirmed.`
          : tx(`${name}’s mark saved as ${mark}/${otherQ.out}.`, `Bewertung für ${name} als ${mark}/${otherQ.out} gespeichert.`),
        actionLabel: "Undo",
        onAction: () => {
          updateClassState({ markEdits: before.markEdits, ocrValues: before.ocrValues, rejected: before.rejected });
          setOtherReviewed(before.reviewed);
          markActivityUndone(entry);
        },
      });
      setOtherReviewed([...new Set([...otherReviewed, name])]);
      setView("overview");
    }
    setModal(false);
  };
  // Red-flag decision (confirm / dismiss / postpone) with Undo that restores decision, step and log.
  const decideRedFlag = (decision: "confirmed" | "dismissed" | "postponed") => {
    const before = { decision: redFlagDecision, stage };
    setRedFlagDecision(decision);
    const entry = logActivity("redflag", "Khadija", {
      EN:
        decision === "confirmed"
          ? "Fraction-comparison flag confirmed; practice assigned"
          : decision === "dismissed"
            ? "Fraction-comparison flag dismissed"
            : "Fraction-comparison flag postponed",
      DE:
        decision === "confirmed"
          ? "Warnung „Brüche vergleichen“ bestätigt; Übung zugewiesen"
          : decision === "dismissed"
            ? "Warnung „Brüche vergleichen“ verworfen"
            : "Warnung „Brüche vergleichen“ zurückgestellt",
    });
    notify({
      message:
        decision === "confirmed"
          ? "Learning-gap flag confirmed."
          : decision === "dismissed"
            ? "Learning-gap flag dismissed."
            : "Learning-gap decision postponed.",
      actionLabel: "Undo",
      onAction: () => {
        setRedFlagDecision(before.decision);
        setStage(before.stage);
        markActivityUndone(entry);
      },
    });
    if (decision === "confirmed") setStage("publish");
  };
  // Override: AI mark for the answer typed in the dialog; a different mark needs a reason.
  const overrideAi: number | null =
    selectedStudent === "Khadija"
      ? overrideAnswer.trim() === "528"
        ? 3
        : 0
      : selectedStudent === "Mariam"
        ? 2
        : otherAi === null
          ? null
          : overrideAnswer.trim() === "2/3 > 3/5"
            ? 3
            : 0;
  const overrideNeedsReason = overrideAi !== null && overrideMark !== overrideAi;
  // First visit to a paper's marks (for this verified answer) shows the AI grading progress.
  const gradeKey = `${selectedStudent}|${selectedStudent === "Khadija" ? studentAnswer : otherAnswer}`;
  const doPublish = () => {
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
                        if (shareParent && redFlagDecision === "confirmed") {
                          addNotification(
                            "parent",
                            {
                              EN: "Learning alert: comparing fractions",
                              DE: "Lernhinweis: Brüche vergleichen",
                            },
                            {
                              EN: "Ms. Ashraf confirmed that Khadija needs extra practice with comparing fractions.",
                              DE: "Frau Ashraf hat bestätigt, dass Khadija beim Vergleichen von Brüchen mehr Übung braucht.",
                            },
                            { EN: "See what helps", DE: "Hilfe ansehen" },
                            "summary",
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
  };
  const dismissItem = () => {
    const previousMark = awardedMark;
    const wasPublished = published;
    setDismissed(true);
    setAwardedMark(null);
    setPublished(false);
    const entry = logActivity("mark", "Khadija", {
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
        markActivityUndone(entry);
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

  const ocrReadAs = selectedStudent === "Khadija" ? "578" : selectedEvidence.extracted;
  const savedOcr =
    selectedStudent === "Khadija"
      ? studentAnswer
      : (classState.ocrValues[selectedStudent] ?? selectedEvidence.corrected);
  // Each flagged reading: Khadija Q2 drives the Quiz 4 story; Mariam and Salma keep their single
  // reading under their name; other readings (Khadija Q6) are stored under their own id.
  const readingState = (item: FlaggedReading) => {
    if (item.id === "khadija-q2") return { verified: ocrVerified, saved: studentAnswer };
    const key = item.student === "Khadija" ? item.id : item.student;
    return {
      verified: verifiedStudents.includes(key as ReviewStudent),
      saved: classState.ocrValues[key] ?? item.read,
    };
  };
  const currentFlag =
    flaggedReadings.find((item) => item.id === flagId && item.student === selectedStudent) ??
    flaggedReadings.find((item) => item.student === selectedStudent) ??
    flaggedReadings[1];
  const currentFlagState = readingState(currentFlag);
  const ocrValue =
    ocrDraft[currentFlag.id] ?? (currentFlagState.verified ? currentFlagState.saved : currentFlag.read);
  const openFlag = (item: FlaggedReading) => {
    setSelectedStudent(item.student as ReviewStudent);
    setFlagId(item.id);
    setStage("ocr");
  };
  const verifyOcr = (goNext: boolean) => {
    const value = ocrValue.trim();
    if (!value) return;
    const item = currentFlag;
    const before = readingState(item);
    if (item.id === "khadija-q2") {
      setOcrVerified(true);
      if (value !== studentAnswer) setAwardedMark(null);
      setStudentAnswer(value);
    } else {
      const key = item.student === "Khadija" ? item.id : item.student;
      setVerifiedStudents([...new Set([...verifiedStudents, key as ReviewStudent])]);
      updateClassState((current) => ({ ocrValues: { ...current.ocrValues, [key]: value } }));
    }
    const label = `${selectedExamLanguage === "DE" ? "A" : "Q"}${item.q} · ${item.task[selectedExamLanguage]}`;
    if (value !== before.saved || !before.verified)
      logActivity("ocr", item.student, {
        EN:
          value === item.read
            ? `Quiz 4 · ${label}: OCR reading ${item.read} confirmed`
            : `Quiz 4 · ${label}: OCR ${item.read} corrected to ${value}`,
        DE:
          value === item.read
            ? `Quiz 4 · ${label}: OCR-Lesung ${item.read} bestätigt`
            : `Quiz 4 · ${label}: OCR ${item.read} korrigiert zu ${value}`,
      });
    if (!goNext) {
      notify(`OCR verified for ${item.student}.`);
      return;
    }
    // Next flagged reading on this paper that is still unchecked; when none is left, go to marks.
    const mine = flaggedReadings.filter((x) => x.student === item.student);
    const after = [...mine.slice(mine.indexOf(item) + 1), ...mine.slice(0, mine.indexOf(item))];
    const next = after.find((x) => !readingState(x).verified);
    if (next) setFlagId(next.id);
    else setStage("grade");
  };

  useEffect(() => {
    if (navigationRequest?.role !== "teacher") return;
    if (navigationRequest.target === "review") {
      setSelectedStudent("Khadija");
      setStage("ocr");
      setView("review");
    }
    if (navigationRequest.target === "insights") setView("insights");
    if (navigationRequest.target === "messages") setView("messages");
  }, [navigationRequest]);

  return (
    <Localize language={language}>
      <div className="teacher-shell">
        <TeacherSidebar
          view={view}
          setView={setView}
          reviewCount={reviewCount}
          messageCount={classState.threads.filter((item) => item.status === "open").length}
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
            onProfile={() => setView("profile")}
            readAloud={{ target: ".teacher-main", screenKey: view }}
          />
          <main className="teacher-main">
            {view === "overview" && (
              <>
                <div className="teacher-heading">
                  <div>
                    <p className="kicker">18 OCTOBER</p>
                    <h1>
                      {classState.teacherClass === "4B"
                        ? "Grade 4B assessment overview"
                        : tx(
                            `Grade ${classState.teacherClass} assessment overview`,
                            `Bewertungsübersicht Klasse ${classState.teacherClass}`,
                          )}
                    </h1>
                    <p>
                      {classState.teacherClass === "4B"
                        ? `${reviewCount} exams are waiting for review.`
                        : classState.teacherClass === "4C"
                          ? tx("Quiz 4 papers have not been uploaded yet.", "Die Quiz-4-Arbeiten wurden noch nicht hochgeladen.")
                          : tx("No exams are waiting for review.", "Keine Arbeiten warten auf Prüfung.")}
                    </p>
                  </div>
                  <div className="heading-actions">
                    <ClassPicker language={language} notify={common.notify} />
                    {classState.teacherClass === "4B" && (
                      <Button icon="review" onClick={() => openReview("Khadija")}>
                        Open review queue
                      </Button>
                    )}
                  </div>
                </div>
                {classState.teacherClass === "4B" ? (
                <>
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
                        <h2>
                          Needs your decision{" "}
                          <HelpTip language={language} topic={tx("Attention rank", "Rang in der Liste")}>
                            {tx(
                              "Papers are ranked by how much your decision can change the result: unclear handwriting and uncertain marks come first. The Why column gives the reason for each paper.",
                              "Arbeiten sind danach geordnet, wie stark Ihre Entscheidung das Ergebnis ändern kann: unklare Schrift und unsichere Bewertungen zuerst. Die Spalte Begründung nennt den Grund.",
                            )}
                          </HelpTip>
                        </h2>
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
                          <span className="attention-actions">
                            {item.reviewable && item.flag !== "Support plan" ? (
                              <Button
                                icon="eye"
                                variant="secondary"
                                onClick={() => openReview(item.student as ReviewStudent)}
                              >
                                {item.flag === "Confirmed" ? "View" : "Review"}
                              </Button>
                            ) : (
                              <Button
                                icon="person"
                                variant="secondary"
                                onClick={() => openRecord(item.student)}
                              >
                                Open record
                              </Button>
                            )}
                            {item.student === "Khadija" && practicePending ? (
                              <Button
                                icon="bell"
                                variant="ghost"
                                onClick={() => sendPracticeReminder("Khadija", common)}
                              >
                                Send reminder
                              </Button>
                            ) : (
                              <Button
                                icon="message"
                                variant="ghost"
                                onClick={() => setNoteFor(item.student)}
                              >
                                Send note
                              </Button>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </article>
                  <div className="teacher-right">
                  <TodayPanel
                    language={language}
                    items={[
                      {
                        en: "Check extracted text",
                        de: "Erkannten Text prüfen",
                        count: flaggedReadings.filter((item) => !readingState(item).verified).length,
                        onClick: () =>
                          openFlag(
                            flaggedReadings.find((item) => !readingState(item).verified) ??
                              flaggedReadings[0],
                          ),
                      },
                      {
                        en: "Review AI grades",
                        de: "KI-Bewertungen prüfen",
                        count:
                          (awardedMark === null ? 1 : 0) +
                          (["Mariam", "Salma"] as ReviewStudent[]).filter(
                            (name) => !otherReviewed.includes(name),
                          ).length,
                        onClick: () =>
                          openReview(
                            awardedMark === null
                              ? "Khadija"
                              : !otherReviewed.includes("Salma")
                                ? "Salma"
                                : "Mariam",
                            "grade",
                          ),
                      },
                      {
                        en: "Open red flags",
                        de: "Offene Hinweise",
                        count: redFlagDecision === null || redFlagDecision === "postponed" ? 1 : 0,
                        onClick: () => openReview("Khadija", "redflag"),
                      },
                      {
                        en: "Ready to send results",
                        de: "Ergebnisse bereit zum Senden",
                        count: awardedMark !== null && !published ? 1 : 0,
                        onClick: () => openReview("Khadija", "publish"),
                      },
                      {
                        en: "Unanswered messages",
                        de: "Unbeantwortete Nachrichten",
                        count: classState.threads.filter((item) => item.status === "open").length,
                        onClick: () => setView("messages"),
                      },
                      {
                        en: "Practice not done yet",
                        de: "Übung noch nicht erledigt",
                        count: 2 + (practicePending ? 1 : 0),
                        onClick: () => setView("insights"),
                      },
                    ]}
                  />
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
                  </div>
                </section>
                </>
                ) : (
                  <OtherClassOverview
                    cls={classState.teacherClass as "4A" | "4C"}
                    language={language}
                    onPerformance={() => setView("insights")}
                  />
                )}
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
                <p className="review-context" aria-label={tx("You are reviewing", "Sie prüfen gerade")}>
                  <span>
                    <Icon name="person" size={16} /> <b>{selectedStudent}</b>
                  </span>
                  <span>{tx("Quiz 4 · Fractions and word problems", "Quiz 4 · Brüche und Sachaufgaben")}</span>
                  <span>
                    <Icon name="review" size={16} />{" "}
                    <b>
                      {stage === "ocr"
                        ? `${selectedExamLanguage === "DE" ? "A" : "Q"}${currentFlag.q} · ${currentFlag.task[selectedExamLanguage]}`
                        : stage === "grade"
                          ? selectedStudent === "Khadija"
                            ? `${selectedExamLanguage === "DE" ? "A" : "Q"}2 · 132 × 4`
                            : selectedStudent === "Mariam"
                              ? tx("Q5 · Share 20 apples", "A5 · Teile 20 Äpfel")
                              : tx("Q7 · Compare 2/3 and 3/5", "A7 · Vergleiche 2/3 und 3/5")
                          : stage === "redflag"
                            ? tx("Q7 · Compare 2/3 and 3/5 (Quiz 2–4)", "A7 · Vergleiche 2/3 und 3/5 (Quiz 2–4)")
                            : tx("All 8 questions · 25 marks", "Alle 8 Aufgaben · 25 Punkte")}
                    </b>
                  </span>
                  <span>
                    {tx(
                      `Step ${workflowStages.indexOf(stage) + 1} of ${workflowStages.length}`,
                      `Schritt ${workflowStages.indexOf(stage) + 1} von ${workflowStages.length}`,
                    )}
                  </span>
                </p>
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
                  <OcrQueue
                    language={language}
                    currentId={currentFlag.id}
                    stateOf={readingState}
                    onOpen={openFlag}
                  />
                )}
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
                      <OcrCheck
                        language={language}
                        examLanguage={selectedExamLanguage}
                        student={selectedStudent}
                        current={currentFlag}
                        value={ocrValue}
                        setValue={(value) => setOcrDraft({ ...ocrDraft, [currentFlag.id]: value })}
                        stateOf={readingState}
                        onSelect={openFlag}
                        onVerify={verifyOcr}
                      />
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
                      {!gradedKeys.includes(gradeKey) ? (
                        <GradingLoader
                          language={language}
                          who={selectedStudent}
                          onDone={() => setGradedKeys((keys) => [...keys, gradeKey])}
                        />
                      ) : (
                      <>
                      <div className="ai-title">
                        <span>
                          <Icon name="spark" />
                        </span>
                        <div>
                          <p className="kicker">
                            AI MARK PROPOSAL{" "}
                            <HelpTip language={language} topic={tx("AI suggestion", "KI-Vorschlag")}>
                              {tx(
                                "The mark the AI suggests from the marking scheme. Nothing reaches the student until you confirm, override or reject it.",
                                "Die Bewertung, die die KI anhand des Bewertungsschemas vorschlägt. Nichts erreicht das Kind, bevor Sie bestätigen, ändern oder ablehnen.",
                              )}
                            </HelpTip>
                          </p>
                          <h2>
                            {selectedStudent === "Khadija"
                              ? aiQ2 === 3
                                ? "Award 3 of 3 marks"
                                : "Award 0 of 3 marks"
                              : otherAi === null
                                ? tx("Hold for teacher decision", "Für Ihre Entscheidung zurückgehalten")
                                : tx(
                                    `Award ${otherAi} of ${otherQ.out} marks`,
                                    `${otherAi} von ${otherQ.out} Punkten vergeben`,
                                  )}
                          </h2>
                        </div>
                      </div>
                      <Status type="warn">
                        Uncertainty: {selectedStudent === "Khadija" ? "Medium" : "High"}
                      </Status>
                      <p>
                        {selectedStudent === "Khadija"
                          ? aiQ2 === 3
                            ? "The corrected answer 528 matches the expected result. The calculation is correct."
                            : `The answer ${studentAnswer} does not match the expected result 528.`
                          : selectedStudent === "Mariam"
                            ? tx(
                                "The answer 4 each is right, but no working is shown: 2 of 4 marks for the answer.",
                                "Das Ergebnis je 4 stimmt, aber der Rechenweg fehlt: 2 von 4 Punkten für das Ergebnis.",
                              )
                            : otherAi === null
                              ? tx(
                                  "The answer could not be read. Check the text first, or enter a mark yourself.",
                                  "Die Antwort war nicht lesbar. Prüfen Sie zuerst den Text oder geben Sie selbst eine Bewertung ein.",
                                )
                              : otherAi === 3
                                ? tx("2/3 > 3/5 matches the model answer.", "2/3 > 3/5 entspricht der Musterlösung.")
                                : tx(
                                    `${otherAnswer} uses the wrong sign; the model answer is 2/3 > 3/5.`,
                                    `${otherAnswer} hat das falsche Zeichen; die Musterlösung ist 2/3 > 3/5.`,
                                  )}
                      </p>
                      <div className="rubric">
                        <div>
                          <span>Student answer</span>
                          <b>{selectedStudent === "Khadija" ? studentAnswer : otherAnswer}</b>
                        </div>
                        <div>
                          <span>AI mark</span>
                          <b>
                            {selectedStudent === "Khadija"
                              ? `${aiQ2} / 3`
                              : otherAi === null
                                ? "—"
                                : `${otherAi} / ${otherQ.out}`}
                          </b>
                        </div>
                        <div>
                          <span>Teacher mark</span>
                          <b>
                            {selectedStudent === "Khadija" && awardedMark !== null
                              ? `${awardedMark} / 3`
                              : selectedStudent !== "Khadija" && otherTeacherMark !== undefined
                                ? `${otherTeacherMark} / ${otherQ.out}`
                                : "Not confirmed"}
                          </b>
                        </div>
                      </div>
                      {selectedStudent === "Khadija" && (
                        <GradeBreakdown
                          language={language}
                          q2Mark={awardedMark ?? aiQ2}
                          q2Confirmed={awardedMark !== null}
                          answer={studentAnswer}
                        />
                      )}
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
                      {selectedStudent !== "Khadija" && (
                        <button
                          type="button"
                          className="link-button compare-link"
                          onClick={() => {
                            setByQuestion(otherQ.q as 5 | 7);
                            setView("byquestion");
                          }}
                        >
                          <Icon name="grid" size={16} />
                          {tx(
                            `Compare Q${otherQ.q} across the class`,
                            `A${otherQ.q} in der ganzen Klasse vergleichen`,
                          )}
                        </button>
                      )}
                      <div className="decision-actions">
                        <Button
                          icon="check"
                          disabled={selectedStudent !== "Khadija" && otherAi === null}
                          onClick={() =>
                            selectedStudent === "Khadija"
                              ? confirmMark(aiQ2, studentAnswer)
                              : confirmMark(otherAi ?? 0, otherAnswer)
                          }
                        >
                          Confirm AI mark
                        </Button>
                        <Button
                          icon="edit"
                          variant="secondary"
                          onClick={() => {
                            if (selectedStudent === "Khadija") {
                              setOverrideAnswer(studentAnswer);
                              setOverrideMark(awardedMark ?? aiQ2);
                            } else {
                              setOverrideAnswer(otherAnswer);
                              setOverrideMark(otherTeacherMark ?? otherAi ?? 0);
                            }
                            setOverrideReason("");
                            setOverrideError(false);
                            setModal(true);
                          }}
                        >
                          Override
                        </Button>
                        <Button
                          icon="close"
                          variant="ghost"
                          onClick={selectedStudent === "Khadija" ? dismissItem : rejectOther}
                        >
                          Reject AI mark
                        </Button>
                      </div>
                      <p className="decision-help">
                        {tx(
                          "Confirm keeps the AI mark. Override lets you enter your own answer and mark. Reject removes the AI mark and keeps the paper in your queue.",
                          "Bestätigen übernimmt die KI-Bewertung. Ändern lässt Sie Antwort und Punkte selbst eingeben. Ablehnen entfernt die KI-Bewertung; die Arbeit bleibt in Ihrer Warteschlange.",
                        )}
                      </p>
                      </>
                      )}
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
                        <h2>
                          Fraction-comparison error{" "}
                          <HelpTip language={language} topic={tx("Red flag", "Warnhinweis")}>
                            {tx(
                              "The AI found the same mistake in several quizzes. If you confirm it, Khadija gets a short lesson and quiz, and her parent sees a learning alert if sharing is on.",
                              "Die KI hat denselben Fehler in mehreren Quizzen gefunden. Wenn Sie bestätigen, bekommt Khadija eine kurze Lektion mit Quiz, und ihr Elternteil sieht einen Lernhinweis, wenn geteilt wird.",
                            )}
                          </HelpTip>
                        </h2>
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
                        {redFlagDecision === "confirmed"
                          ? "Flag confirmed"
                          : redFlagDecision === "dismissed"
                            ? "Flag dismissed"
                            : "Flag postponed"}
                      </Status>
                    )}
                    <div className="decision-actions">
                      <Button icon="check" onClick={() => decideRedFlag("confirmed")}>
                        Confirm
                      </Button>
                      <Button icon="close" variant="secondary" onClick={() => decideRedFlag("dismissed")}>
                        Dismiss
                      </Button>
                      <Button icon="clock" variant="ghost" onClick={() => decideRedFlag("postponed")}>
                        Postpone
                      </Button>
                    </div>
                    <ResourcesPanel language={language} />
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
                          // Sharing after publishing: the parent is told now, not at publish time.
                          if (published && e.target.checked) {
                            logActivity("share", "Khadija", {
                              EN: "Quiz 4 results shared with Khadija’s parent",
                              DE: "Ergebnisse von Quiz 4 mit Khadijas Elternteil geteilt",
                            });
                            if (redFlagDecision === "confirmed")
                              addNotification(
                                "parent",
                                {
                                  EN: "Learning alert: comparing fractions",
                                  DE: "Lernhinweis: Brüche vergleichen",
                                },
                                {
                                  EN: "Ms. Ashraf confirmed that Khadija needs extra practice with comparing fractions.",
                                  DE: "Frau Ashraf hat bestätigt, dass Khadija beim Vergleichen von Brüchen mehr Übung braucht.",
                                },
                                { EN: "See what helps", DE: "Hilfe ansehen" },
                                "summary",
                              );
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
                        }}
                      />
                      <span>
                        <strong>Share with parent</strong>
                        <small>Allow Khadija’s parent to see the published summary.</small>
                      </span>
                    </label>
                    <p className="share-help">
                      <HelpTip language={language} topic={tx("Share with parent", "Mit Eltern teilen")}>
                        {tx(
                          "When this is on, Khadija’s parent sees the published score, your note and ideas for helping at home. Khadija always sees her own results.",
                          "Wenn dies an ist, sieht Khadijas Elternteil das veröffentlichte Ergebnis, Ihre Notiz und Ideen für zu Hause. Khadija sieht ihre Ergebnisse immer.",
                        )}
                      </HelpTip>
                      <small>{tx("What does sharing mean?", "Was bedeutet Teilen?")}</small>
                    </p>
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
                    {!published && (!ocrVerified || awardedMark === null) && (
                      <ErrorNote
                        action={
                          <Button
                            icon="arrow"
                            variant="secondary"
                            onClick={() => setStage(!ocrVerified ? "ocr" : "grade")}
                          >
                            {!ocrVerified ? tx("Go to step 1: Verify OCR", "Zu Schritt 1: OCR prüfen") : tx("Go to step 2: Review mark", "Zu Schritt 2: Bewertung prüfen")}
                          </Button>
                        }
                      >
                        {!ocrVerified
                          ? tx(
                              "Publishing is blocked: step 1, Verify OCR, is not finished. Check the flagged handwriting, then come back here.",
                              "Veröffentlichen ist gesperrt: Schritt 1, OCR prüfen, ist nicht fertig. Prüfen Sie die markierte Schrift und kommen Sie dann zurück.",
                            )
                          : tx(
                              "Publishing is blocked: step 2, Review mark, is not finished. Q2 has no confirmed mark yet.",
                              "Veröffentlichen ist gesperrt: Schritt 2, Bewertung prüfen, ist nicht fertig. A2 hat noch keine bestätigte Bewertung.",
                            )}
                      </ErrorNote>
                    )}
                    <Button
                      icon="check"
                      className="publish-button"
                      disabled={published || !ocrVerified || awardedMark === null}
                      onClick={() => setConfirmPublish(true)}
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
                <ClassPerformance khadija={khadijaLive} language={language} onOpenStudent={openRecord} />
                {classState.teacherClass === "4B" && <QuizMonitor khadija={khadijaLive} {...common} />}
              </>
            )}

            {view === "students" && (
              <RosterPage
                khadija={khadijaLive}
                language={language}
                onOpen={openRecord}
                onNote={setNoteFor}
              />
            )}
            {view === "student" && (
              <StudentRecord
                name={recordName}
                khadija={khadijaLive}
                onBack={() => setView("students")}
                onReview={() => openReview("Khadija")}
                onNote={() => setNoteFor(recordName)}
                {...common}
              />
            )}
            {view === "assessments" && (
              <AssessmentsPage
                khadija={khadijaLive}
                onReview={(name) => openReview(name as ReviewStudent)}
                {...common}
              />
            )}
            {view === "byquestion" && (
              <QuestionReview
                key={byQuestion}
                initialQuestion={byQuestion}
                onOpenReview={(name) => openReview(name as ReviewStudent, "grade")}
                {...common}
              />
            )}
            {view === "gradebook" && <Gradebook khadija={khadijaLive} {...common} />}
            {view === "skilltree" && <SkillTree onOpenStudent={openRecord} {...common} />}
            {view === "messages" && (
              <MessagesPage
                onReview={() => openReview("Khadija", "grade")}
                onNote={setNoteFor}
                {...common}
              />
            )}
            {view === "profile" && (
              <TeacherProfile
                language={language}
                setLanguage={setLanguage}
                published={published}
                setShareParent={setShareParent}
                notify={common.notify}
              />
            )}
          </main>
        </div>

        {confirmPublish && (
          <ConfirmDialog
            language={language}
            icon="check"
            title={tx("Publish Khadija’s Quiz 4 results?", "Khadijas Ergebnisse für Quiz 4 veröffentlichen?")}
            confirmLabel={tx("Publish", "Veröffentlichen")}
            onCancel={() => setConfirmPublish(false)}
            onConfirm={() => {
              setConfirmPublish(false);
              doPublish();
            }}
          >
            <dl className="confirm-facts">
              <div>
                <dt>{tx("Score", "Ergebnis")}</dt>
                <dd>
                  {score}/25 ({percent}%)
                </dd>
              </div>
              <div>
                <dt>{tx("Share with parent", "Mit Eltern teilen")}</dt>
                <dd>
                  {shareParent
                    ? tx("On – the parent will be notified", "An – das Elternteil wird benachrichtigt")
                    : tx("Off – only Khadija sees the results", "Aus – nur Khadija sieht die Ergebnisse")}
                </dd>
              </div>
              <div>
                <dt>{tx("Learning support", "Lernhilfe")}</dt>
                <dd>
                  {redFlagDecision === "confirmed"
                    ? tx("Practice plan is sent to Khadija", "Übungsplan wird an Khadija gesendet")
                    : tx("No practice plan", "Kein Übungsplan")}
                </dd>
              </div>
            </dl>
            <p>{tx("Khadija is notified straight away.", "Khadija wird sofort benachrichtigt.")}</p>
          </ConfirmDialog>
        )}
        {modal && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal">
              <button className="modal-close" onClick={() => setModal(false)} aria-label="Close" title={tx("Close", "Schließen")}>
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
                  {Array.from({ length: (selectedStudent === "Khadija" ? 3 : otherQ.out) + 1 }, (_, i) => {
                    const out = selectedStudent === "Khadija" ? 3 : otherQ.out;
                    return (
                      <option key={i} value={out - i}>
                        {out - i} / {out}
                      </option>
                    );
                  })}
                </select>
              </label>
              <label>
                {overrideNeedsReason
                  ? tx("Reason for changing the AI mark (required)", "Grund für die Änderung der KI-Bewertung (Pflicht)")
                  : tx("Reason (optional)", "Grund (optional)")}
                <textarea
                  rows={2}
                  value={overrideReason}
                  onChange={(e) => {
                    setOverrideReason(e.target.value);
                    setOverrideError(false);
                  }}
                  placeholder={tx("e.g. Method correct, small copying slip", "z. B. Rechenweg richtig, kleiner Abschreibfehler")}
                />
              </label>
              {overrideError && (
                <ErrorNote>
                  {tx(
                    `The reason is empty. Your mark (${overrideMark}) differs from the AI mark (${overrideAi}), so write a short reason, then press Save override.`,
                    `Der Grund fehlt. Ihre Bewertung (${overrideMark}) weicht von der KI-Bewertung (${overrideAi}) ab. Schreiben Sie einen kurzen Grund und drücken Sie dann Änderung speichern.`,
                  )}
                </ErrorNote>
              )}
              <div className="modal-actions">
                <Button icon="speaker" variant="ghost" className="modal-read" onClick={requestReadAloud}>
                  Read aloud
                </Button>
                <Button icon="close" variant="ghost" onClick={() => setModal(false)}>
                  Cancel
                </Button>
                <Button
                  icon="check"
                  onClick={() => {
                    if (overrideNeedsReason && !overrideReason.trim()) {
                      setOverrideError(true);
                      return;
                    }
                    confirmMark(overrideMark, overrideAnswer, overrideReason);
                  }}
                >
                  Save override
                </Button>
              </div>
            </div>
          </div>
        )}
        {noteFor && (
          <NoteComposer student={noteFor} onClose={() => setNoteFor(null)} {...common} />
        )}
        {drawer && (
          <>
            <div className="drawer-scrim" onClick={() => setDrawer(false)} />
            <aside className="drawer">
              <button className="modal-close" onClick={() => setDrawer(false)} aria-label="Close" title={tx("Close", "Schließen")}>
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
              <Button icon="speaker" variant="ghost" onClick={requestReadAloud}>
                Read aloud
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
      ? ["Gesendet", "Lehrerin prüft", "Ergebnis bereit"]
      : ["Sent", "Teacher checking", "Results ready"];
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
  studentAnswer,
  redFlagDecision,
  practiced,
  practiceScore,
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
  published: boolean;
  shareParent: boolean;
  teacherFeedback: string;
  studentAnswer: string;
  redFlagDecision: "confirmed" | "dismissed" | "postponed" | null;
  practiced: boolean;
  practiceScore: number | null;
  language: "EN" | "DE";
  setLanguage: (l: "EN" | "DE") => void;
  onExit: () => void;
  notify: (m: string | ToastState) => void;
  unreadCount: number;
  onNotifications: () => void;
  addNotification: AddNotification;
  navigationRequest: NavigationRequest;
}) {
  const [tab, setTab] = useState<ParentTab>("overview");
  const [child, setChild] = useState<Child>("Khadija");
  useScrollTopOn(`${child}-${tab}`);
  const classState = useClassState();
  const visible = published && shareParent && awardedMark !== null;
  const quizStatus = published && !shareParent ? "Results not shared yet" : "Teacher checking";
  const score = awardedMark === null ? null : 14 + awardedMark;
  const percent = score === null ? null : Math.round((score / 25) * 100);
  const quiz: ParentQuiz = {
    visible,
    publishedNotShared: published && !shareParent,
    flagConfirmed: redFlagDecision === "confirmed",
    score: visible ? score : null,
    percent: visible ? percent : null,
    awardedMark,
    studentAnswer,
    teacherFeedback: translateText(teacherFeedback, language),
    practiced,
    practiceScore,
  };
  const parentThread = classState.threads.find((item) => item.kind === "parent");
  const unreadReplies = parentThread
    ? parentThread.messages
        .slice(classState.parentSeen)
        .filter((message) => message.from === "teacher").length
    : 0;
  const parentMessageCount = parentThread?.messages.length ?? 0;
  useEffect(() => {
    if (tab === "messages" && child === "Khadija")
      updateClassState({ parentSeen: parentMessageCount });
  }, [tab, child, parentMessageCount]);
  const plainNotify = (message: string) => notify(message);
  useEffect(() => {
    if (navigationRequest?.role !== "parent") return;
    setChild("Khadija");
    setTab(navigationRequest.target === "messages" ? "messages" : "overview");
  }, [navigationRequest]);

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
          onProfile={() => setTab("profile")}
          readAloud={{ target: ".parent-main", screenKey: `${child}-${tab}` }}
        />
        <main className="parent-main">
          <ChildSwitcher
            language={language}
            child={child}
            setChild={setChild}
          />
          {tab === "profile" ? (
            <ParentProfile
              language={language}
              setLanguage={setLanguage}
              notify={plainNotify}
              onBack={() => setTab("overview")}
            />
          ) : child === "Yara" ? (
            <SiblingView language={language} tab={tab} setTab={setTab} notify={plainNotify} />
          ) : (
            <>
              <section className="parent-hello">
                <div className="parent-avatar">K</div>
                <div>
                  <p className="kicker">KHADIJA’S LEARNING</p>
                  <h1>A clear view of her learning.</h1>
                  <p>Grade 4B · Ms. Somaya Ashraf</p>
                </div>
              </section>
              <ParentTabs
                language={language}
                tab={tab}
                setTab={setTab}
                unreadMessages={unreadReplies}
              />

              {tab === "overview" && (
                <>
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

                  <LearningAlert language={language} quiz={quiz} onHelp={() => setTab("resources")} />

                  <article className="parent-message card">
                    <span>
                      <Icon name="check" />
                    </span>
                    <div>
                      <h2>What’s going well</h2>
                      <p>
                        Khadija is doing well with multiplication facts and uses clear number
                        strategies.
                      </p>
                    </div>
                  </article>

                  <article className="parent-message peach card">
                    <span>
                      <Icon name="idea" />
                    </span>
                    <div>
                      <h2>What to practice next</h2>
                      <p>Use simple drawings to compare halves, thirds and quarters.</p>
                    </div>
                  </article>

                  <PracticeStatus language={language} quiz={quiz} />
                  <RoleActivity role="parent" language={language} />
                  <ProgressReport
                    language={language}
                    quiz={quiz}
                    addNotification={addNotification}
                    notify={plainNotify}
                  />

                  <Button icon="message" onClick={() => setTab("messages")}>
                    Message Ms. Ashraf
                  </Button>
                  <p className="parent-note">
                    <Icon name="lock" size={15} /> Quiz 4 results appear only after Ms. Ashraf
                    publishes and shares them.
                  </p>
                </>
              )}

              {tab === "results" && (
                <ParentResults language={language} quiz={quiz} onMessage={() => setTab("messages")} />
              )}

              {tab === "progress" && (
                <>
                  <article className="parent-progress card parent-chart parent-history">
                    <div>
                      <p className="kicker">PUBLISHED QUIZZES</p>
                      <h2>Progress so far</h2>
                    </div>
                    <StairChart
                      values={visible && percent !== null ? [52, 58, 64, percent] : [52, 58, 64]}
                      label={translateText("Progress staircase", language)}
                    />
                    <div className="chart-labels">
                      <span>Quiz 1</span>
                      <span>Quiz 2</span>
                      <span>Quiz 3</span>
                      {visible && <span>Quiz 4</span>}
                    </div>
                  </article>
                  <ParentConcepts language={language} quiz={quiz} />
                  <PracticeStatus language={language} quiz={quiz} />
                </>
              )}

              {tab === "resources" && (
                <ParentResources language={language} quiz={quiz} notify={plainNotify} />
              )}

              {tab === "messages" && (
                <ParentMessages
                  language={language}
                  addNotification={addNotification}
                  notify={plainNotify}
                />
              )}
            </>
          )}
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
    "Strong multiplication. Practice comparing fractions with drawings.",
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
  useScrollTopOn(`${role}-${notificationCenterOpen}`);
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
    const id = window.setTimeout(() => setToast(null), toast.actionLabel ? 9000 : 4200);
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
          practiced={practiced}
          practiceScore={practiceScore}
        />
      )}
      {role === "parent" && !notificationCenterOpen && (
        <ParentApp
          awardedMark={awardedMark}
          published={published}
          shareParent={shareParent}
          teacherFeedback={teacherFeedback}
          studentAnswer={studentAnswer}
          redFlagDecision={redFlagDecision}
          practiced={practiced}
          practiceScore={practiceScore}
          language={language}
          setLanguage={setLanguage}
          onExit={logout}
          notify={notify}
          unreadCount={unreadFor("parent")}
          onNotifications={() => setNotificationCenterOpen(true)}
          addNotification={addNotification}
          navigationRequest={navigationRequest}
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
            title={language === "DE" ? "Benachrichtigung schließen" : "Close notification"}
          >
            <Icon name="close" size={17} />
          </button>
        </div>
      )}
    </>
  );
}