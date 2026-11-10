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
export type SavedRule = { id: number; scope: Text; text: Text };
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
  q5RuleApplied: boolean;
  savedRules: SavedRule[];
  scheme: SchemeItem[];
  mistakeTags: Record<number, string>;
  revisionPlan: string[];
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
  q5RuleApplied: false,
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
  revisionPlan: [],
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

/** AI mark for Q7 (compare 2/3 and 3/5, 3 marks): students working on comparing fractions wrote "<". */
export const q7AiMark = (student: RosterStudent) =>
  student.q5.group === "missing" ? 0 : student.focus === "compare" ? 0 : 3;

/** Current Q5 mark: teacher edit, else approved bulk rule, else AI mark. */
export function q5MarkOf(student: RosterStudent, s: ClassState = state): number {
  const edit = s.markEdits[`${student.name}:5`];
  if (edit !== undefined) return edit;
  return s.q5RuleApplied && student.q5.group === "noWorking" ? Math.max(2, student.q5.mark) : student.q5.mark;
}
/** Current Q7 mark: teacher edit, else AI mark. */
export function q7MarkOf(student: RosterStudent, s: ClassState = state): number {
  return s.markEdits[`${student.name}:7`] ?? q7AiMark(student);
}

/** Quiz 4 percentage for a roster student, after bulk corrections and teacher edits (1 mark = 4 %). */
export function quiz4Percent(student: RosterStudent, s: ClassState = state): number | null {
  const base = student.quizzes[3];
  if (base === null) return null;
  return base + (q5MarkOf(student, s) - student.q5.mark) * 4 + (q7MarkOf(student, s) - q7AiMark(student)) * 4;
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
