import { useSyncExternalStore } from "react";

/**
 * Shared in-memory class data for the prototype (teacher pages, plus what the
 * student sees of teacher replies and approved resources). Survives logout,
 * resets on page reload, like the rest of the demo state.
 */
export type Lang = "EN" | "DE";
export type Text = Record<Lang, string>;
export type NotificationTarget =
  | "feedback"
  | "practice"
  | "messages"
  | "review"
  | "insights"
  | "summary";
export type Notifier = (
  role: "student" | "teacher" | "parent",
  title: Text,
  message: Text,
  action: Text,
  target: NotificationTarget,
) => void;

/** `textDe` is only set for seeded demo messages; typed messages are shown as written. */
export type ThreadMessage = {
  from: "student" | "teacher" | "parent";
  text: string;
  textDe?: string;
  at: number;
  when?: Text;
};
export type Thread = {
  id: number;
  student: string;
  kind: "question" | "report" | "note" | "parent";
  question?: number;
  title: Text;
  messages: ThreadMessage[];
  status: "open" | "answered" | "resolved";
};
/** Khadija's Quiz 4 questions (marks before the teacher's Q2 decision). */
export const questions = [
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

export const questionTitlesDe = [
  "24 × 6",
  "132 × 4",
  "Färbe 3/4",
  "1/2 + 1/4",
  "Teile 20 Äpfel",
  "450 ÷ 5",
  "Vergleiche 2/3 und 3/5",
  "Sachaufgabe mit Bussitzen",
];

/** Khadija's per-topic results in Quiz 2, 3 and 4 (Quiz 4 shown only after publishing). */
export const khadijaConcepts: { name: Text; values: number[]; level: "good" | "neutral" | "warn" }[] = [
  { name: { EN: "Multiplication", DE: "Multiplizieren" }, values: [80, 85, 90], level: "good" },
  { name: { EN: "Word problems", DE: "Sachaufgaben" }, values: [55, 65, 75], level: "neutral" },
  { name: { EN: "Comparing fractions", DE: "Brüche vergleichen" }, values: [30, 35, 33], level: "warn" },
];

export type Resources = { video: boolean; printable: "worksheet" | "game" | "none" };

/** A printable the AI can suggest for a learning gap; the first one per skill is the AI suggestion. */
export type ResourceOption = { id: string; title: Text; detail: Text };
export const printableOptions: Record<string, ResourceOption[]> = {
  compare: [
    { id: "worksheet", title: { EN: "Comparing fractions worksheet", DE: "Arbeitsblatt Brüche vergleichen" }, detail: { EN: "8 pairs to compare, with fraction strips at the top", DE: "8 Paare zum Vergleichen, oben mit Bruchstreifen" } },
    { id: "game", title: { EN: "Fraction strips game", DE: "Bruchstreifen-Spiel" }, detail: { EN: "Cut out strips, build both fractions, compare", DE: "Streifen ausschneiden, beide Brüche legen, vergleichen" } },
    { id: "numberline", title: { EN: "Number-line cards", DE: "Zahlenstrahl-Karten" }, detail: { EN: "Put 6 fractions on a 0–1 number line", DE: "6 Brüche auf einen Zahlenstrahl von 0 bis 1 legen" } },
  ],
  working: [
    { id: "steps", title: { EN: "Show-your-working sheet", DE: "Arbeitsblatt „Rechenweg zeigen“" }, detail: { EN: "4 word problems with a box for the number sentence", DE: "4 Sachaufgaben mit einem Kasten für die Rechnung" } },
    { id: "cards", title: { EN: "Step-by-step problem cards", DE: "Schritt-für-Schritt-Karten" }, detail: { EN: "Read · underline · write the sum · answer", DE: "Lesen · unterstreichen · Rechnung schreiben · antworten" } },
    { id: "bar", title: { EN: "Bar-model practice", DE: "Übung mit Balkenmodell" }, detail: { EN: "Draw a bar model before writing the sum", DE: "Erst ein Balkenmodell zeichnen, dann rechnen" } },
  ],
  parts: [
    { id: "fold", title: { EN: "Fold-and-shade strips", DE: "Falt- und Färbestreifen" }, detail: { EN: "Fold paper into equal parts and shade", DE: "Papier in gleiche Teile falten und färben" } },
    { id: "grid", title: { EN: "Equal-parts grid sheet", DE: "Raster „Gleiche Teile“" }, detail: { EN: "Shade fractions of squares and circles", DE: "Brüche von Quadraten und Kreisen färben" } },
  ],
  default: [
    { id: "sheet", title: { EN: "Practice sheet", DE: "Übungsblatt" }, detail: { EN: "6 short questions on this skill", DE: "6 kurze Aufgaben zu dieser Kompetenz" } },
    { id: "game", title: { EN: "Partner game", DE: "Partnerspiel" }, detail: { EN: "A 10-minute game for two", DE: "Ein 10-Minuten-Spiel zu zweit" } },
  ],
};
export const optionsFor = (skill: string) => printableOptions[skill] ?? printableOptions.default;

/** Practice the teacher approves for one student's learning gap. */
export type ResourcePlan = {
  skill: string;
  video: boolean;
  /** Printable option id, or "none". */
  printable: string;
  /** Teacher's own wording for the lesson and the printable (modify). */
  lessonNote: string;
  printableNote: string;
  /** suggested = AI draft · assigned = sent to the student · changed = edited after it was sent. */
  status: "suggested" | "assigned" | "changed";
};
export const defaultPlan = (skill: string): ResourcePlan => ({
  skill,
  video: true,
  printable: optionsFor(skill)[0].id,
  lessonNote: "",
  printableNote: "",
  status: "suggested",
});

/** One verification pop quiz attempt, with the result before practice for the same skill. */
export type PopQuizAttempt = { score: number; before: number; at: Text; round: number };
export type SavedRule = {
  id: number;
  scope: Text;
  text: Text;
  /** Where the rule came from, when it was saved from a bulk correction. */
  source?: { q: number; answer: string; mark: number; out: number };
};
export type SchemeItem = { n: number; marks: number; model: string; rule: Text };
export type Assessment = {
  id: number;
  title: Text;
  subject: Text;
  date: Text;
  language: Lang;
  marks: number;
  status: "published" | "review" | "draft";
  /** Saved grading rules (ids) this assessment reuses. */
  rules?: number[];
  /** Questions entered by the teacher (new assessments). */
  questions?: AssessmentQuestion[];
};
export type AssessmentQuestion = { text: string; model: string; marks: number; rule: string };

// ---------------------------------------------------------------------------
// Classes taught by Ms. Ashraf (Mathematics). Grade 4B is live (roster below);
// 4A and 4C are summary data for the class performance overview.
// ---------------------------------------------------------------------------
export type ClassId = "4A" | "4B" | "4C";
export type ClassConcept = { name: Text; students: number; mistake: Text };
export type ClassMissed = { q: number; task: Text; wrong: number };
export type ClassSummary = {
  students: number;
  /** Class average per quiz (Quiz 1–4); null = not marked yet. */
  averages: (number | null)[];
  marked: number;
  concepts: ClassConcept[];
  missed: ClassMissed[];
  /** score null = latest quiz not marked yet. */
  support: { name: string; focus: Text; score: number | null }[];
};
export const otherClasses: Record<"4A" | "4C", ClassSummary> = {
  "4A": {
    students: 24,
    averages: [63, 66, 70, 74],
    marked: 24,
    concepts: [
      { name: { EN: "Two-step word problems", DE: "Zweischrittige Sachaufgaben" }, students: 9, mistake: { EN: "Stops after the first step", DE: "Hört nach dem ersten Schritt auf" } },
      { name: { EN: "Comparing fractions", DE: "Brüche vergleichen" }, students: 5, mistake: { EN: "Compares by the bottom number only", DE: "Vergleicht nur über die untere Zahl" } },
      { name: { EN: "Showing working", DE: "Rechenweg zeigen" }, students: 4, mistake: { EN: "Writes the answer without the number sentence", DE: "Schreibt das Ergebnis ohne Rechnung" } },
    ],
    missed: [
      { q: 8, task: { EN: "Bus seats word problem", DE: "Sachaufgabe Bussitze" }, wrong: 46 },
      { q: 7, task: { EN: "Compare 2/3 and 3/5", DE: "Vergleiche 2/3 und 3/5" }, wrong: 21 },
      { q: 5, task: { EN: "Share 20 apples", DE: "Teile 20 Äpfel" }, wrong: 17 },
    ],
    support: [
      { name: "Rahma", focus: { EN: "Two-step word problems", DE: "Zweischrittige Sachaufgaben" }, score: 58 },
      { name: "Jomana", focus: { EN: "Two-step word problems", DE: "Zweischrittige Sachaufgaben" }, score: 61 },
      { name: "Farah", focus: { EN: "Comparing fractions", DE: "Brüche vergleichen" }, score: 64 },
    ],
  },
  "4C": {
    students: 23,
    averages: [55, 57, 62, null],
    marked: 0,
    concepts: [
      { name: { EN: "Multi-digit multiplication", DE: "Mehrstellige Multiplikation" }, students: 11, mistake: { EN: "Carrying forgotten in the tens", DE: "Übertrag bei den Zehnern vergessen" } },
      { name: { EN: "Equal parts", DE: "Gleiche Teile" }, students: 7, mistake: { EN: "Shades unequal parts", DE: "Färbt ungleiche Teile" } },
      { name: { EN: "Comparing fractions", DE: "Brüche vergleichen" }, students: 6, mistake: { EN: "Compares by the bottom number only", DE: "Vergleicht nur über die untere Zahl" } },
    ],
    missed: [
      { q: 2, task: { EN: "Quiz 3 · 214 × 3", DE: "Quiz 3 · 214 × 3" }, wrong: 48 },
      { q: 5, task: { EN: "Quiz 3 · Shade 2/5", DE: "Quiz 3 · Färbe 2/5" }, wrong: 30 },
      { q: 6, task: { EN: "Quiz 3 · Compare 1/2 and 1/3", DE: "Quiz 3 · Vergleiche 1/2 und 1/3" }, wrong: 26 },
    ],
    support: [
      { name: "Youssef", focus: { EN: "Multi-digit multiplication", DE: "Mehrstellige Multiplikation" }, score: 48 },
      { name: "Hamza", focus: { EN: "Equal parts", DE: "Gleiche Teile" }, score: 52 },
      { name: "Lojain", focus: { EN: "Multi-digit multiplication", DE: "Mehrstellige Multiplikation" }, score: 54 },
    ],
  },
};

/** What the teacher decided after a student's verification pop quiz. */
export type GapOutcome = "resolved" | "again" | "group";

export type RosterStudent = {
  name: string;
  quizzes: [number, number, number, number | null];
  focus: string | null; // skill id that needs support
  practice: "none" | "pending" | "done";
  quizScore?: number;
  q5: { group: "working" | "noWorking" | "wrong" | "missing"; mark: number };
  /** Class, when not Grade 4B. */
  classId?: ClassId;
};

// Quiz 1–3 averages: 59, 64, 67 %; Quiz 4 average: 71 % (Khadija 68 %).
export const roster: RosterStudent[] = [
  { name: "Khadija", quizzes: [52, 58, 64, 68], focus: "compare", practice: "pending", q5: { group: "noWorking", mark: 2 } },
  { name: "Mariam", quizzes: [62, 66, 70, 76], focus: "working", practice: "done", quizScore: 3, q5: { group: "noWorking", mark: 2 } },
  { name: "Salma", quizzes: [48, 54, 56, 60], focus: "compare", practice: "pending", q5: { group: "working", mark: 4 } },
  { name: "Laila", quizzes: [74, 78, 80, 84], focus: null, practice: "done", quizScore: 2, q5: { group: "working", mark: 4 } },
  { name: "Nour", quizzes: [70, 76, 82, 88], focus: null, practice: "done", quizScore: 3, q5: { group: "working", mark: 4 } },
  { name: "Farida", quizzes: [58, 62, 66, 72], focus: "working", practice: "none", q5: { group: "working", mark: 4 } },
  { name: "Habiba", quizzes: [66, 70, 72, 76], focus: null, practice: "none", q5: { group: "working", mark: 4 } },
  { name: "Jana", quizzes: [60, 64, 68, 72], focus: null, practice: "none", q5: { group: "working", mark: 4 } },
  { name: "Malak", quizzes: [64, 68, 70, 76], focus: null, practice: "none", q5: { group: "working", mark: 4 } },
  { name: "Hana", quizzes: [50, 56, 60, 60], focus: "compare", practice: "done", quizScore: 1, q5: { group: "noWorking", mark: 1 } },
  { name: "Yasmin", quizzes: [72, 76, 78, 80], focus: null, practice: "none", q5: { group: "working", mark: 4 } },
  { name: "Rana", quizzes: [46, 52, 56, 56], focus: "compare", practice: "pending", q5: { group: "noWorking", mark: 1 } },
  { name: "Dalia", quizzes: [54, 58, 62, 64], focus: "compare", practice: "none", q5: { group: "wrong", mark: 0 } },
  { name: "Aya", quizzes: [56, 62, 64, 64], focus: "compare", practice: "none", q5: { group: "wrong", mark: 0 } },
  { name: "Lina", quizzes: [52, 58, 62, 64], focus: "compare", practice: "none", q5: { group: "working", mark: 4 } },
  { name: "Mona", quizzes: [58, 62, 66, 68], focus: "compare", practice: "none", q5: { group: "working", mark: 4 } },
  { name: "Sara", quizzes: [54, 60, 62, 64], focus: "compare", practice: "none", q5: { group: "working", mark: 4 } },
  { name: "Reem", quizzes: [70, 74, 76, 80], focus: null, practice: "none", q5: { group: "working", mark: 4 } },
  { name: "Nada", quizzes: [60, 64, 66, 72], focus: "working", practice: "none", q5: { group: "noWorking", mark: 2 } },
  { name: "Heba", quizzes: [62, 66, 68, 72], focus: null, practice: "none", q5: { group: "working", mark: 4 } },
  { name: "Menna", quizzes: [64, 70, 72, 76], focus: null, practice: "none", q5: { group: "working", mark: 4 } },
  { name: "Judy", quizzes: [46, 52, 58, null], focus: "working", practice: "none", q5: { group: "missing", mark: 0 } },
];

/** Grade 4A and 4C students (summary data only: no Quiz 4 papers in this prototype). */
function classRoster(
  classId: "4A" | "4C",
  names: string[],
  averages: (number | null)[],
  support: Record<string, string>,
): RosterStudent[] {
  return names.map((name, i) => {
    // Spread results around the class average, the same way every time.
    const shift = ((i * 7) % 9) - 4;
    const gap = support[name] ? -10 : 0;
    const at = (q: number) => {
      const avg = averages[q];
      return avg === null ? null : Math.max(30, Math.min(96, Math.round((avg + shift * 2 + gap) / 4) * 4));
    };
    return {
      name,
      classId,
      quizzes: [at(0) ?? 0, at(1) ?? 0, at(2) ?? 0, at(3)],
      focus: support[name] ?? null,
      practice: "none",
      q5: { group: "working", mark: 4 },
    };
  });
}
export const otherRosters: Record<"4A" | "4C", RosterStudent[]> = {
  "4A": classRoster(
    "4A",
    ["Rahma", "Jomana", "Farah", "Amira", "Basma", "Dina", "Esraa", "Ghada", "Hagar", "Iman", "Jude", "Kenzy", "Lamia", "Maya", "Nadine", "Omnia", "Rawan", "Sama", "Tala", "Wafaa", "Yara", "Zeina", "Logy", "Nesma"],
    [63, 66, 70, 74],
    { Rahma: "words", Jomana: "words", Farah: "compare" },
  ),
  "4C": classRoster(
    "4C",
    ["Youssef", "Hamza", "Lojain", "Adam", "Ali", "Bassel", "Karim", "Malek", "Marwan", "Mostafa", "Omar", "Seif", "Tarek", "Yassin", "Ziad", "Hassan", "Ibrahim", "Khaled", "Mazen", "Nabil", "Rami", "Sherif", "Taha"],
    [55, 57, 62, null],
    { Youssef: "multi", Hamza: "parts", Lojain: "multi" },
  ),
};
/** Every student the teacher teaches, Grade 4B first. */
export const allStudents: RosterStudent[] = [...roster, ...otherRosters["4A"], ...otherRosters["4C"]];
export const classOf = (student: RosterStudent): ClassId => student.classId ?? "4B";

export const initialScheme: SchemeItem[] = [
  { n: 1, marks: 2, model: "144", rule: { EN: "Answer only", DE: "Nur Ergebnis" } },
  { n: 2, marks: 3, model: "528", rule: { EN: "1 for method, 2 for answer", DE: "1 für den Rechenweg, 2 für das Ergebnis" } },
  { n: 3, marks: 3, model: "3 of 4 equal parts shaded", rule: { EN: "1 per correct part", DE: "1 pro richtigem Teil" } },
  { n: 4, marks: 3, model: "3/4", rule: { EN: "1 common denominator, 2 answer", DE: "1 gemeinsamer Nenner, 2 Ergebnis" } },
  { n: 5, marks: 4, model: "20 ÷ 5 = 4 apples each", rule: { EN: "2 for working, 2 for answer", DE: "2 für den Rechenweg, 2 für das Ergebnis" } },
  { n: 6, marks: 3, model: "90", rule: { EN: "1 for method, 2 for answer", DE: "1 für den Rechenweg, 2 für das Ergebnis" } },
  { n: 7, marks: 3, model: "2/3 > 3/5", rule: { EN: "1 equal denominators, 2 sign", DE: "1 gleiche Nenner, 2 Zeichen" } },
  { n: 8, marks: 4, model: "48 seats", rule: { EN: "2 for working, 2 for answer", DE: "2 für den Rechenweg, 2 für das Ergebnis" } },
];

type ClassState = {
  threads: Thread[];
  resources: Resources;
  otherReviewed: string[];
  verifiedStudents: string[];
  ocrValues: Record<string, string>;
  /** Bulk corrections the teacher approved (review by question). */
  bulkRules: BulkRule[];
  savedRules: SavedRule[];
  scheme: SchemeItem[];
  mistakeTags: Record<number, string>;
  /** Revision lesson plan per class: skill ids in teaching order. */
  revisionPlans: Record<ClassId, string[]>;
  /** Resources the teacher approved per student (C30). */
  resourcePlans: Record<string, ResourcePlan>;
  /** Learning-gap decision per student after marking (Khadija's lives in the review itself). */
  gapDecisions: Record<string, "confirmed" | "dismissed" | "postponed">;
  /** Every pop quiz attempt per student, so improvement is kept (C31). */
  popQuizzes: Record<string, PopQuizAttempt[]>;
  bulkUploaded: boolean;
  remindersSent: string[];
  assessments: Assessment[];
  shareDefault: boolean;
  parentAck: boolean;
  /** Number of messages in the parent conversation the parent has already seen. */
  parentSeen: number;
  /** Marks set by the teacher, key "Name:question" (override, by-question edit). Win over AI and bulk rules. */
  markEdits: Record<string, number>;
  /** Students whose AI mark the teacher rejected (stay in the queue without a mark). */
  rejected: string[];
  /** Class shown on the dashboard and class performance pages. */
  teacherClass: ClassId;
  /** Students whose Quiz 4 paper the teacher uploaded in bulk (this session). */
  uploadedScans: string[];
  /** Files the teacher uploaded in bulk, per student, so the original scan can be opened later. */
  scanFiles: Record<string, { name: string; url: string | null }[]>;
  /** Pages a student sent from the app (their own photos), per student. */
  studentScans: Record<string, { name: string; url: string | null }[]>;
  /** Follow-up after the verification pop quiz, per student. */
  gapOutcome: Record<string, GapOutcome>;
};

let state: ClassState = {
  threads: [
    {
      id: 1,
      student: "Khadija",
      kind: "parent",
      title: { EN: "Messages with Khadija’s parent", DE: "Nachrichten mit Khadijas Elternteil" },
      messages: [
        {
          from: "teacher",
          text: "Khadija is getting stronger at multiplication. Short fraction activities at home will help.",
          textDe:
            "Khadija wird beim Multiplizieren sicherer. Kurze Bruchübungen zu Hause helfen ihr.",
          at: 0,
          when: { EN: "4 October", DE: "4. Oktober" },
        },
      ],
      status: "answered",
    },
  ],
  resources: { video: true, printable: "worksheet" },
  otherReviewed: [],
  verifiedStudents: [],
  ocrValues: {},
  bulkRules: [],
  savedRules: [
    {
      id: 1,
      scope: { EN: "Quiz 2 · word problems", DE: "Quiz 2 · Sachaufgaben" },
      text: {
        EN: "Correct unit missing: take away 1 mark, not all marks",
        DE: "Fehlende Einheit: 1 Punkt abziehen, nicht alle Punkte",
      },
    },
  ],
  scheme: initialScheme,
  mistakeTags: { 3: "parts", 5: "working", 7: "denominator" },
  revisionPlans: { "4A": [], "4B": [], "4C": [] },
  resourcePlans: {},
  gapDecisions: {},
  popQuizzes: {
    Mariam: [{ score: 3, before: 50, round: 1, at: { EN: "Monday", DE: "Montag" } }],
    Laila: [
      { score: 1, before: 33, round: 1, at: { EN: "Last week", DE: "Letzte Woche" } },
      { score: 2, before: 33, round: 2, at: { EN: "Monday", DE: "Montag" } },
    ],
    Nour: [{ score: 3, before: 33, round: 1, at: { EN: "Tuesday", DE: "Dienstag" } }],
    Hana: [{ score: 1, before: 0, round: 1, at: { EN: "Tuesday", DE: "Dienstag" } }],
  },
  bulkUploaded: false,
  remindersSent: [],
  assessments: [
    { id: 1, title: { EN: "Quiz 1: Multiplication facts", DE: "Quiz 1: Einmaleins" }, subject: { EN: "Mathematics", DE: "Mathematik" }, date: { EN: "12 September", DE: "12. September" }, language: "EN", marks: 20, status: "published" },
    { id: 2, title: { EN: "Quiz 2: Multi-digit multiplication", DE: "Quiz 2: Mehrstellige Multiplikation" }, subject: { EN: "Mathematics", DE: "Mathematik" }, date: { EN: "26 September", DE: "26. September" }, language: "EN", marks: 20, status: "published" },
    { id: 3, title: { EN: "Quiz 3: Multiplication and simple fractions", DE: "Quiz 3: Multiplikation und einfache Brüche" }, subject: { EN: "Mathematics", DE: "Mathematik" }, date: { EN: "3 October", DE: "3. Oktober" }, language: "EN", marks: 25, status: "published" },
    { id: 4, title: { EN: "Quiz 4: Fractions and word problems", DE: "Quiz 4: Brüche und Sachaufgaben" }, subject: { EN: "Mathematics", DE: "Mathematik" }, date: { EN: "17 October", DE: "17. Oktober" }, language: "EN", marks: 25, status: "review" },
  ],
  shareDefault: true,
  parentAck: false,
  parentSeen: 1,
  markEdits: {},
  rejected: [],
  teacherClass: "4B",
  uploadedScans: [],
  scanFiles: {},
  studentScans: {},
  gapOutcome: {},
};
const listeners = new Set<() => void>();
let nextId = 100;

export const newId = () => nextId++;
export function getClassState() {
  return state;
}
export function updateClassState(update: Partial<ClassState> | ((s: ClassState) => Partial<ClassState>)) {
  state = { ...state, ...(typeof update === "function" ? update(state) : update) };
  listeners.forEach((listener) => listener());
}
export function useClassState() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
  );
}

// ---------------------------------------------------------------------------
// Quiz 4 answers and AI marks for every question and every student.
// Each AI mark comes with the criteria it was based on (AI grading explanation).
// ---------------------------------------------------------------------------
export type Criterion = { text: Text; marks: number; met: boolean };
export type AnswerVariant = {
  answer: string;
  /** AI-suggested mark. */
  ai: number;
  confidence: number;
  criteria: Criterion[];
  /** One-sentence reason the AI gives for the mark. */
  reason: Text;
};
export type QuestionSpec = {
  n: number;
  out: number;
  title: Text;
  model: string;
  variants: Record<string, AnswerVariant>;
};

const c = (en: string, de: string, marks: number, met: boolean): Criterion => ({ text: { EN: en, DE: de }, marks, met });
const why = (en: string, de: string): Text => ({ EN: en, DE: de });

export const quiz4Spec: QuestionSpec[] = [
  {
    n: 1,
    out: 2,
    title: { EN: "24 × 6", DE: "24 × 6" },
    model: "144",
    variants: {
      full: { answer: "144", ai: 2, confidence: 96, criteria: [c("Answer 144 matches the model answer", "Ergebnis 144 entspricht der Musterlösung", 2, true)], reason: why("Correct answer; this question gives marks for the answer only.", "Richtiges Ergebnis; hier zählt nur das Ergebnis.") },
      none: { answer: "124", ai: 0, confidence: 92, criteria: [c("Answer matches 144", "Ergebnis entspricht 144", 2, false)], reason: why("124 does not match 144, and this question has no method marks.", "124 entspricht nicht 144, und es gibt keine Punkte für den Rechenweg.") },
    },
  },
  {
    n: 2,
    out: 3,
    title: { EN: "132 × 4", DE: "132 × 4" },
    model: "528",
    variants: {
      full: { answer: "528", ai: 3, confidence: 61, criteria: [c("Method: 132 × 4 set out correctly", "Rechenweg: 132 × 4 richtig angesetzt", 1, true), c("Answer 528 matches the model answer", "Ergebnis 528 entspricht der Musterlösung", 2, true)], reason: why("Method and answer are both correct.", "Rechenweg und Ergebnis sind richtig.") },
      none: { answer: "578", ai: 0, confidence: 88, criteria: [c("Method: 132 × 4 set out correctly", "Rechenweg: 132 × 4 richtig angesetzt", 1, false), c("Answer matches 528", "Ergebnis entspricht 528", 2, false)], reason: why("Wrong answer; the method mark needs a correct answer.", "Falsches Ergebnis; der Rechenwegpunkt setzt ein richtiges Ergebnis voraus.") },
    },
  },
  {
    n: 3,
    out: 3,
    title: { EN: "Shade 3/4", DE: "Färbe 3/4" },
    model: "3 of 4 equal parts shaded",
    variants: {
      full: { answer: "3/4 shaded", ai: 3, confidence: 93, criteria: [c("Shape split into 4 equal parts", "Form in 4 gleiche Teile geteilt", 1, true), c("Exactly 3 parts shaded", "Genau 3 Teile gefärbt", 2, true)], reason: why("3 of 4 equal parts are shaded.", "3 von 4 gleichen Teilen sind gefärbt.") },
      zero: { answer: "2/4 shaded", ai: 0, confidence: 89, criteria: [c("Shape split into 4 equal parts", "Form in 4 gleiche Teile geteilt", 1, false), c("Exactly 3 parts shaded", "Genau 3 Teile gefärbt", 2, false)], reason: why("Only 2 parts are shaded, so the AI marked the whole drawing as wrong.", "Nur 2 Teile sind gefärbt; die KI hat die ganze Zeichnung als falsch bewertet.") },
      one: { answer: "2/4 shaded", ai: 1, confidence: 71, criteria: [c("Shape split into 4 equal parts", "Form in 4 gleiche Teile geteilt", 1, true), c("Exactly 3 parts shaded", "Genau 3 Teile gefärbt", 2, false)], reason: why("The equal parts are right, but only 2 parts are shaded.", "Die gleichen Teile stimmen, aber nur 2 Teile sind gefärbt.") },
    },
  },
  {
    n: 4,
    out: 3,
    title: { EN: "1/2 + 1/4", DE: "1/2 + 1/4" },
    model: "3/4",
    variants: {
      full: { answer: "3/4", ai: 3, confidence: 94, criteria: [c("Common denominator (quarters) used", "Gemeinsamer Nenner (Viertel) genutzt", 1, true), c("Answer 3/4", "Ergebnis 3/4", 2, true)], reason: why("Common denominator and answer are correct.", "Gemeinsamer Nenner und Ergebnis sind richtig.") },
      one: { answer: "2/4 + 1/4 = 2/4", ai: 1, confidence: 84, criteria: [c("Common denominator (quarters) used", "Gemeinsamer Nenner (Viertel) genutzt", 1, true), c("Answer 3/4", "Ergebnis 3/4", 2, false)], reason: why("The common denominator is right, but the sum is wrong.", "Der gemeinsame Nenner stimmt, aber die Summe ist falsch.") },
      none: { answer: "2/6", ai: 0, confidence: 90, criteria: [c("Common denominator (quarters) used", "Gemeinsamer Nenner (Viertel) genutzt", 1, false), c("Answer 3/4", "Ergebnis 3/4", 2, false)], reason: why("Tops and bottoms were added; no common denominator.", "Zähler und Nenner wurden addiert; kein gemeinsamer Nenner.") },
    },
  },
  {
    n: 5,
    out: 4,
    title: { EN: "Share 20 apples", DE: "Teile 20 Äpfel" },
    model: "20 ÷ 5 = 4 apples each",
    variants: {
      working: { answer: "20 ÷ 5 = 4 each", ai: 4, confidence: 92, criteria: [c("Working shown (20 ÷ 5)", "Rechenweg gezeigt (20 ÷ 5)", 2, true), c("Answer 4 each", "Ergebnis je 4", 2, true)], reason: why("Working and answer are both correct.", "Rechenweg und Ergebnis sind richtig.") },
      noWorking: { answer: "4 each", ai: 2, confidence: 74, criteria: [c("Working shown (20 ÷ 5)", "Rechenweg gezeigt (20 ÷ 5)", 2, false), c("Answer 4 each", "Ergebnis je 4", 2, true)], reason: why("The answer is right, but no working is shown: 2 of 4 marks for the answer.", "Das Ergebnis stimmt, aber der Rechenweg fehlt: 2 von 4 Punkten für das Ergebnis.") },
      noWorkingLow: { answer: "4 each", ai: 1, confidence: 66, criteria: [c("Working shown (20 ÷ 5)", "Rechenweg gezeigt (20 ÷ 5)", 2, false), c("Answer 4 each, with unit", "Ergebnis je 4, mit Einheit", 2, false)], reason: why("No working, and the AI also took 1 mark off because the unit (apples) is missing.", "Kein Rechenweg, und die KI hat 1 Punkt abgezogen, weil die Einheit (Äpfel) fehlt.") },
      wrong: { answer: "5 each", ai: 0, confidence: 90, criteria: [c("Working shown (20 ÷ 5)", "Rechenweg gezeigt (20 ÷ 5)", 2, false), c("Answer 4 each", "Ergebnis je 4", 2, false)], reason: why("Wrong answer and no working.", "Falsches Ergebnis und kein Rechenweg.") },
    },
  },
  {
    n: 6,
    out: 3,
    title: { EN: "450 ÷ 5", DE: "450 ÷ 5" },
    model: "90",
    variants: {
      full: { answer: "450 ÷ 5 = 90", ai: 3, confidence: 97, criteria: [c("Method shown", "Rechenweg gezeigt", 1, true), c("Answer 90", "Ergebnis 90", 2, true)], reason: why("Method and answer are correct.", "Rechenweg und Ergebnis sind richtig.") },
      answerOnly: { answer: "90", ai: 2, confidence: 86, criteria: [c("Method shown", "Rechenweg gezeigt", 1, false), c("Answer 90", "Ergebnis 90", 2, true)], reason: why("Correct answer without a method: 2 of 3 marks.", "Richtiges Ergebnis ohne Rechenweg: 2 von 3 Punkten.") },
      none: { answer: "80", ai: 0, confidence: 91, criteria: [c("Method shown", "Rechenweg gezeigt", 1, false), c("Answer 90", "Ergebnis 90", 2, false)], reason: why("Wrong answer; no method shown.", "Falsches Ergebnis; kein Rechenweg.") },
    },
  },
  {
    n: 7,
    out: 3,
    title: { EN: "Compare 2/3 and 3/5", DE: "Vergleiche 2/3 und 3/5" },
    model: "2/3 > 3/5",
    variants: {
      right: { answer: "2/3 > 3/5", ai: 3, confidence: 91, criteria: [c("Equal denominators (10/15 and 9/15)", "Gleiche Nenner (10/15 und 9/15)", 1, true), c("Correct sign >", "Richtiges Zeichen >", 2, true)], reason: why("The comparison matches the model answer.", "Der Vergleich entspricht der Musterlösung.") },
      wrong: { answer: "2/3 < 3/5", ai: 0, confidence: 91, criteria: [c("Equal denominators (10/15 and 9/15)", "Gleiche Nenner (10/15 und 9/15)", 1, false), c("Correct sign >", "Richtiges Zeichen >", 2, false)], reason: why("Wrong sign, and no equal denominators were used.", "Falsches Zeichen, und es wurden keine gleichen Nenner genutzt.") },
      wrongPartial: { answer: "2/3 < 3/5", ai: 1, confidence: 63, criteria: [c("Equal denominators (10/15 and 9/15)", "Gleiche Nenner (10/15 und 9/15)", 1, true), c("Correct sign >", "Richtiges Zeichen >", 2, false)], reason: why("The AI saw 10/15 and 9/15 in the margin and gave 1 mark, but the sign is wrong.", "Die KI hat 10/15 und 9/15 am Rand gesehen und 1 Punkt gegeben, aber das Zeichen ist falsch.") },
      unread: { answer: "?", ai: 0, confidence: 52, criteria: [c("Answer could be read", "Antwort lesbar", 3, false)], reason: why("The answer could not be read. Check the extracted text first.", "Die Antwort war nicht lesbar. Prüfen Sie zuerst den erkannten Text.") },
    },
  },
  {
    n: 8,
    out: 4,
    title: { EN: "Bus seats word problem", DE: "Sachaufgabe mit Bussitzen" },
    model: "12 × 4 = 48 seats",
    variants: {
      full: { answer: "12 × 4 = 48 seats", ai: 4, confidence: 95, criteria: [c("Working shown (12 × 4)", "Rechenweg gezeigt (12 × 4)", 2, true), c("Answer 48 seats", "Ergebnis 48 Sitze", 2, true)], reason: why("Working, answer and unit are correct.", "Rechenweg, Ergebnis und Einheit sind richtig.") },
      noUnit: { answer: "12 × 4 = 48", ai: 3, confidence: 83, criteria: [c("Working shown (12 × 4)", "Rechenweg gezeigt (12 × 4)", 2, true), c("Answer 48 seats, with unit", "Ergebnis 48 Sitze, mit Einheit", 2, false)], reason: why("Saved rule “Correct unit missing: take away 1 mark” was used.", "Gespeicherte Regel „Fehlende Einheit: 1 Punkt abziehen“ wurde angewendet.") },
      workingOnly: { answer: "12 × 4 = 46", ai: 2, confidence: 87, criteria: [c("Working shown (12 × 4)", "Rechenweg gezeigt (12 × 4)", 2, true), c("Answer 48 seats", "Ergebnis 48 Sitze", 2, false)], reason: why("Right working, but a slip in the answer.", "Richtiger Rechenweg, aber ein Fehler im Ergebnis.") },
      none: { answer: "40", ai: 0, confidence: 90, criteria: [c("Working shown (12 × 4)", "Rechenweg gezeigt (12 × 4)", 2, false), c("Answer 48 seats", "Ergebnis 48 Sitze", 2, false)], reason: why("Wrong answer; no working.", "Falsches Ergebnis; kein Rechenweg.") },
    },
  },
];
export const specOf = (n: number) => quiz4Spec[n - 1];

/** Questions not tied to a learning gap; their marks are spread so each total matches the student's Quiz 4 result. */
const ladders: Record<number, string[]> = {
  1: ["full", "none"],
  2: ["full", "none"],
  4: ["full", "one", "none"],
  6: ["full", "answerOnly", "none"],
  8: ["full", "noUnit", "workingOnly", "none"],
};
const ladderQs = [8, 6, 4, 2, 1];
/** Every way to choose a variant for the ladder questions, with how many marks it takes off. */
type Combo = { pick: Record<number, string>; off: number; changed: number; most: number };
const ladderCombos: Combo[] = (() => {
  let combos: Combo[] = [{ pick: {}, off: 0, changed: 0, most: 0 }];
  ladderQs.forEach((n) => {
    const spec = specOf(n);
    combos = combos.flatMap((combo) =>
      ladders[n].map((id) => ({
        pick: { ...combo.pick, [n]: id },
        off: combo.off + spec.out - spec.variants[id].ai,
        changed: combo.changed + (id === "full" ? 0 : 1),
        most: Math.max(combo.most, spec.out - spec.variants[id].ai),
      })),
    );
  });
  return combos;
})();

const q3Variant: Record<string, string> = { Khadija: "zero", Salma: "zero", Hana: "one", Rana: "one" };
const q5Variant = (student: RosterStudent) =>
  student.q5.group === "working"
    ? "working"
    : student.q5.group === "wrong"
      ? "wrong"
      : student.q5.mark < 2
        ? "noWorkingLow"
        : "noWorking";
const q7Variant = (student: RosterStudent, s: ClassState) => {
  if (student.name === "Salma") {
    const read = s.ocrValues.Salma;
    return read === undefined || read === "?" ? "unread" : read === "2/3 > 3/5" ? "right" : "wrong";
  }
  if (student.name === "Aya") return "wrongPartial";
  return student.focus === "compare" ? "wrong" : "right";
};

export type StudentAnswer = AnswerVariant & { n: number; out: number; variant: string };

/** All 8 Quiz 4 answers of a 4B student, with the AI mark and its explanation. */
export function quiz4Answers(student: RosterStudent, s: ClassState = state): StudentAnswer[] {
  const fixed: Record<number, string> = {
    3: q3Variant[student.name] ?? "full",
    5: q5Variant(student),
    7: q7Variant(student, s),
  };
  // Spread marks against the reading before OCR checks (Salma's Q7 was unreadable), so a corrected
  // reading changes only that question.
  const baseline: Record<number, string> = { ...fixed, 7: student.name === "Salma" ? "unread" : fixed[7] };
  const fixedMarks = [3, 5, 7].reduce((sum, n) => sum + specOf(n).variants[baseline[n]].ai, 0);
  const target = Math.round((student.quizzes[3] ?? 60) / 4);
  const off = 15 - (target - fixedMarks);
  const options = ladderCombos
    .filter((combo) => combo.off === off)
    // Prefer small partial deductions over whole questions at 0, then as few changed questions as possible.
    .sort((a, b) => a.most - b.most || a.changed - b.changed);
  const fewest = options.filter((combo) => combo.most === options[0]?.most && combo.changed === options[0]?.changed);
  const index = roster.findIndex((r) => r.name === student.name);
  const pick = fewest.length ? fewest[Math.max(0, index) % fewest.length].pick : { 1: "full", 2: "full", 4: "full", 6: "full", 8: "full" };
  const variants: Record<number, string> = { ...pick, ...fixed };
  return quiz4Spec.map((spec) => ({
    ...spec.variants[variants[spec.n]],
    n: spec.n,
    out: spec.out,
    variant: variants[spec.n],
  }));
}
export const answerOf = (student: RosterStudent, n: number, s: ClassState = state) => quiz4Answers(student, s)[n - 1];

/** A bulk correction the teacher approved: one answer to one question gets one mark. */
export type BulkRule = { id: number; q: number; answer: string; mark: number; names: string[]; text: Text; savedRuleId: number | null };

/** Current mark: teacher edit, else approved bulk correction, else AI mark. */
export function markOf(student: RosterStudent, n: number, s: ClassState = state): number {
  const edit = s.markEdits[`${student.name}:${n}`];
  if (edit !== undefined) return edit;
  const rule = s.bulkRules.find((r) => r.q === n && r.names.includes(student.name));
  if (rule) return rule.mark;
  return answerOf(student, n, s).ai;
}
/** Where the current mark comes from. */
export function markSource(student: RosterStudent, n: number, s: ClassState = state): "teacher" | "rule" | "ai" {
  if (s.markEdits[`${student.name}:${n}`] !== undefined) return "teacher";
  return s.bulkRules.some((r) => r.q === n && r.names.includes(student.name)) ? "rule" : "ai";
}
/** Sum of the current marks (optionally leaving one question out). */
export function marksTotal(student: RosterStudent, s: ClassState = state, skip?: number): number {
  return quiz4Spec.reduce((sum, spec) => (spec.n === skip ? sum : sum + markOf(student, spec.n, s)), 0);
}

/** AI mark for Q7 (compare 2/3 and 3/5, 3 marks). */
export const q7AiMark = (student: RosterStudent) => answerOf(student, 7).ai;
export const q5MarkOf = (student: RosterStudent, s: ClassState = state) => markOf(student, 5, s);
export const q7MarkOf = (student: RosterStudent, s: ClassState = state) => markOf(student, 7, s);

/** Quiz 4 percentage for a roster student, after bulk corrections and teacher edits (25 marks, 1 mark = 4 %). */
export function quiz4Percent(student: RosterStudent, s: ClassState = state): number | null {
  const base = student.quizzes[3];
  if (base === null) return null;
  if (student.classId && student.classId !== "4B") return base;
  return marksTotal(student, s) * 4;
}

// ---------------------------------------------------------------------------
// OCR: readings the AI is unsure about, least certain first (C8 + C10)
// ---------------------------------------------------------------------------
export type FlaggedReading = {
  id: string;
  student: string;
  q: number;
  task: Text;
  /** What the AI read. */
  read: string;
  confidence: number;
  kind: "digit" | "symbol" | "word" | "unclear";
  model: string;
  /** Extra candidates for words or unreadable answers. */
  options?: string[];
};
export const flaggedReadings: FlaggedReading[] = [
  { id: "salma-q7", student: "Salma", q: 7, task: { EN: "Compare 2/3 and 3/5", DE: "Vergleiche 2/3 und 3/5" }, read: "?", confidence: 52, kind: "unclear", model: "2/3 > 3/5", options: ["2/3 < 3/5", "2/3 > 3/5"] },
  { id: "khadija-q2", student: "Khadija", q: 2, task: { EN: "132 × 4", DE: "132 × 4" }, read: "578", confidence: 61, kind: "digit", model: "528" },
  { id: "mariam-q5", student: "Mariam", q: 5, task: { EN: "Share 20 apples", DE: "Teile 20 Äpfel" }, read: "4 ea", confidence: 74, kind: "word", model: "4 each", options: ["4 each"] },
  { id: "khadija-q6", student: "Khadija", q: 6, task: { EN: "450 ÷ 5", DE: "450 ÷ 5" }, read: "9O", confidence: 78, kind: "symbol", model: "90" },
];

/** Characters handwriting recognition often mixes up. */
const confusable: Record<string, string[]> = {
  "7": ["2", "1"], "2": ["7"], "1": ["7"], "4": ["9"], "9": ["4"], "5": ["6"], "6": ["5"], "3": ["8"], "8": ["3"],
  "0": ["6"], O: ["0"], o: ["0"], S: ["5"], l: ["1"], I: ["1"], "<": [">"], ">": ["<"], x: ["×"], "+": ["÷"],
};
export type Suggestion = { value: string; reason: Text; matchesModel: boolean };

/** Correction help: swap one commonly confused character at a time; answers that match the model answer first. */
export function ocrSuggestions(item: FlaggedReading): Suggestion[] {
  const numericModel = /^[\d\s.,]+$/.test(item.model);
  const seen = new Set<string>([item.read]);
  const out: Suggestion[] = [];
  for (let i = 0; i < item.read.length; i++) {
    for (const alt of confusable[item.read[i]] ?? []) {
      const value = item.read.slice(0, i) + alt + item.read.slice(i + 1);
      if (seen.has(value) || (numericModel && /[^\d\s.,]/.test(value))) continue;
      seen.add(value);
      out.push({
        value,
        matchesModel: value === item.model,
        reason: {
          EN: `“${item.read[i]}” read as “${alt}”`,
          DE: `„${item.read[i]}“ als „${alt}“ gelesen`,
        },
      });
    }
  }
  for (const value of item.options ?? []) {
    if (seen.has(value)) continue;
    seen.add(value);
    out.push({
      value,
      matchesModel: value === item.model,
      reason: { EN: "Likely from the scan", DE: "Wahrscheinlich laut Scan" },
    });
  }
  return out.sort((a, b) => Number(b.matchesModel) - Number(a.matchesModel)).slice(0, 3);
}

/** Positions in the AI reading that are commonly confused (shown highlighted). */
export const uncertainPositions = (read: string) =>
  [...read].map((c, i) => (confusable[c] ? i : -1)).filter((i) => i >= 0);

export function addThreadMessage(id: number, message: ThreadMessage, status: Thread["status"]) {
  updateClassState((s) => ({
    threads: s.threads.map((thread) =>
      thread.id === id ? { ...thread, messages: [...thread.messages, message], status } : thread,
    ),
  }));
}
