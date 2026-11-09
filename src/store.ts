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

export type ThreadMessage = { from: "student" | "teacher"; text: string; at: number };
export type Thread = {
  id: number;
  student: string;
  kind: "question" | "report" | "note";
  question?: number;
  title: Text;
  messages: ThreadMessage[];
  status: "open" | "answered" | "resolved";
};
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
};

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
};

let state: ClassState = {
  threads: [],
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

/** Quiz 4 percentage for a roster student, after any approved bulk correction. */
export function quiz4Percent(student: RosterStudent, s: ClassState = state): number | null {
  const base = student.quizzes[3];
  if (base === null) return null;
  const fixed = s.q5RuleApplied && student.q5.group === "noWorking" && student.q5.mark < 2;
  return fixed ? base + (2 - student.q5.mark) * 4 : base;
}

export function addThreadMessage(id: number, message: ThreadMessage, status: Thread["status"]) {
  updateClassState((s) => ({
    threads: s.threads.map((thread) =>
      thread.id === id ? { ...thread, messages: [...thread.messages, message], status } : thread,
    ),
  }));
}
