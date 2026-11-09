import { useMemo, useState } from "react";
import { logActivity } from "./activity";
import { Button, Icon, Status } from "./ui";
import {
  addThreadMessage,
  newId,
  quiz4Percent,
  roster,
  updateClassState,
  useClassState,
  type Lang,
  type Notifier,
  type RosterStudent,
  type Text,
  type Thread,
  type ThreadMessage,
} from "./store";

/** What the teacher pages need to know about Khadija's live Quiz 4 review. */
export type KhadijaLive = {
  ocrVerified: boolean;
  awardedMark: number | null;
  published: boolean;
  redFlagDecision: "confirmed" | "dismissed" | "postponed" | null;
  practiced: boolean;
  practiceScore: number | null;
  percent: number | null;
};

type Common = {
  language: Lang;
  notify: (message: string) => void;
  addNotification: Notifier;
};

const makeT = (language: Lang) => (en: string, de: string) => (language === "DE" ? de : en);
const initials = (name: string) => name.slice(0, 2).toUpperCase();
const clock = (at: number) =>
  new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
/** Message text in the current language (seeded demo messages carry a German version). */
export const messageText = (m: ThreadMessage, language: Lang) =>
  language === "DE" && m.textDe ? m.textDe : m.text;
export const messageTime = (m: ThreadMessage, language: Lang) => (m.when ? m.when[language] : clock(m.at));

// ---------------------------------------------------------------------------
// Skills (used by the skill tree, student records and the revision plan)
// ---------------------------------------------------------------------------
export type Skill = {
  id: string;
  strand: Text;
  name: Text;
  mastery: number;
  mistake: Text;
  activity: Text;
};
export const skills: Skill[] = [
  { id: "facts", strand: { EN: "Number", DE: "Zahlen" }, name: { EN: "Multiplication facts", DE: "Einmaleins" }, mastery: 91, mistake: { EN: "Occasional 7× slips", DE: "Gelegentliche Fehler bei 7×" }, activity: { EN: "Keep a 2-minute fact warm-up", DE: "2-minütiges Einmaleins-Aufwärmen beibehalten" } },
  { id: "multi", strand: { EN: "Number", DE: "Zahlen" }, name: { EN: "Multi-digit multiplication", DE: "Mehrstellige Multiplikation" }, mastery: 82, mistake: { EN: "Carrying forgotten in the tens", DE: "Übertrag bei den Zehnern vergessen" }, activity: { EN: "Short carrying check on the board", DE: "Kurze Übertrag-Kontrolle an der Tafel" } },
  { id: "division", strand: { EN: "Number", DE: "Zahlen" }, name: { EN: "Division", DE: "Division" }, mastery: 78, mistake: { EN: "Remainder left out", DE: "Rest vergessen" }, activity: { EN: "Sharing problems with counters", DE: "Verteilaufgaben mit Plättchen" } },
  { id: "parts", strand: { EN: "Fractions", DE: "Brüche" }, name: { EN: "Equal parts", DE: "Gleiche Teile" }, mastery: 74, mistake: { EN: "Shades unequal parts", DE: "Färbt ungleiche Teile" }, activity: { EN: "Fold-and-shade paper strips", DE: "Papierstreifen falten und färben" } },
  { id: "compare", strand: { EN: "Fractions", DE: "Brüche" }, name: { EN: "Comparing fractions", DE: "Brüche vergleichen" }, mastery: 59, mistake: { EN: "Compares by the bottom number only", DE: "Vergleicht nur über die untere Zahl" }, activity: { EN: "10-minute visual warm-up with fraction strips", DE: "10-minütiges visuelles Aufwärmen mit Bruchstreifen" } },
  { id: "add", strand: { EN: "Fractions", DE: "Brüche" }, name: { EN: "Adding fractions", DE: "Brüche addieren" }, mastery: 66, mistake: { EN: "Adds the bottom numbers", DE: "Addiert die unteren Zahlen" }, activity: { EN: "Pizza-model addition in pairs", DE: "Addition mit Pizzamodell in Partnerarbeit" } },
  { id: "words", strand: { EN: "Problem solving", DE: "Problemlösen" }, name: { EN: "Word problems", DE: "Sachaufgaben" }, mastery: 76, mistake: { EN: "Picks the wrong operation", DE: "Wählt die falsche Rechenart" }, activity: { EN: "Underline the question, then choose the operation", DE: "Frage unterstreichen, dann Rechenart wählen" } },
  { id: "working", strand: { EN: "Problem solving", DE: "Problemlösen" }, name: { EN: "Showing working", DE: "Rechenweg zeigen" }, mastery: 73, mistake: { EN: "Writes the answer without the number sentence", DE: "Schreibt das Ergebnis ohne Rechnung" }, activity: { EN: "Model the 'write the number sentence' step", DE: "Den Schritt „Rechnung aufschreiben“ vormachen" } },
];
const skillLevel = (mastery: number) =>
  mastery >= 80
    ? { type: "good" as const, en: "Secure", de: "Sicher" }
    : mastery >= 65
      ? { type: "neutral" as const, en: "Developing", de: "Im Aufbau" }
      : { type: "warn" as const, en: "Gap", de: "Lücke" };
// Students flagged per skill (a student can appear under several skills; `focus` is their main one).
const flagged: Record<string, string[]> = {
  facts: [],
  multi: ["Laila", "Jana"],
  division: ["Rana", "Judy"],
  parts: ["Khadija", "Hana", "Lina", "Sara"],
  compare: ["Khadija", "Salma", "Hana", "Rana", "Dalia", "Aya", "Lina", "Mona", "Sara"],
  add: ["Salma", "Rana", "Dalia", "Aya", "Judy"],
  words: ["Salma", "Dalia", "Aya"],
  working: ["Mariam", "Farida", "Nada", "Judy", "Hana", "Rana"],
};
const studentsFor = (skillId: string) => flagged[skillId] ?? [];

// ---------------------------------------------------------------------------
// Notes to students (C32) – shared by roster, records, attention list
// ---------------------------------------------------------------------------
export function sendTeacherNote(
  student: string,
  text: string,
  { addNotification, notify, language }: Common,
) {
  const t = makeT(language);
  const thread: Thread = {
    id: newId(),
    student,
    kind: "note",
    title: { EN: "Note from Ms. Ashraf", DE: "Notiz von Frau Ashraf" },
    messages: [{ from: "teacher", text, at: Date.now() }],
    status: "answered",
  };
  updateClassState((s) => ({ threads: [thread, ...s.threads] }));
  logActivity("feedback", student, { EN: `Note sent: “${text}”`, DE: `Notiz gesendet: „${text}“` });
  if (student === "Khadija") {
    addNotification(
      "student",
      { EN: "New note from Ms. Ashraf", DE: "Neue Notiz von Frau Ashraf" },
      { EN: text, DE: text },
      { EN: "Read note", DE: "Notiz lesen" },
      "messages",
    );
  }
  notify(t(`Note sent to ${student}.`, `Notiz an ${student} gesendet.`));
}

export function sendPracticeReminder(student: string, { addNotification, notify, language }: Common) {
  const t = makeT(language);
  updateClassState((s) => ({ remindersSent: [...new Set([...s.remindersSent, student])] }));
  logActivity("feedback", student, { EN: "Practice reminder sent", DE: "Übungserinnerung gesendet" });
  if (student === "Khadija") {
    addNotification(
      "student",
      { EN: "Reminder from Ms. Ashraf", DE: "Erinnerung von Frau Ashraf" },
      {
        EN: "Your fraction lesson and quiz are waiting. You can do it!",
        DE: "Deine Bruch-Lektion und das Quiz warten auf dich. Du schaffst das!",
      },
      { EN: "Start practice", DE: "Übung starten" },
      "practice",
    );
  }
  notify(t(`Reminder sent to ${student}.`, `Erinnerung an ${student} gesendet.`));
}

export function NoteComposer({
  student,
  onClose,
  ...common
}: Common & { student: string; onClose: () => void }) {
  const t = makeT(common.language);
  const templates = [
    t("Great effort this week – keep going!", "Toller Einsatz diese Woche – weiter so!"),
    t(
      "Please try the fraction lesson and quiz before Monday.",
      "Bitte mach die Bruch-Lektion und das Quiz vor Montag.",
    ),
    t("Come and see me for 5 minutes at break.", "Komm in der Pause für 5 Minuten zu mir."),
  ];
  const [text, setText] = useState("");
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="note-title">
      <div className="modal">
        <button className="modal-close" onClick={onClose} aria-label={t("Close", "Schließen")}>
          <Icon name="close" />
        </button>
        <span className="modal-icon">
          <Icon name="message" />
        </span>
        <p className="kicker">{t("NOTE TO STUDENT", "NOTIZ AN DAS KIND")}</p>
        <h2 id="note-title">{t(`Send a note to ${student}`, `Notiz an ${student} senden`)}</h2>
        <div className="template-chips">
          {templates.map((item) => (
            <button key={item} type="button" onClick={() => setText(item)}>
              {item}
            </button>
          ))}
        </div>
        <label>
          {t("Message", "Nachricht")}
          <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <div className="modal-actions">
          <Button icon="close" variant="ghost" onClick={onClose}>
            {t("Cancel", "Abbrechen")}
          </Button>
          <Button
            icon="arrow"
            disabled={!text.trim()}
            onClick={() => {
              sendTeacherNote(student, text.trim(), common);
              onClose();
            }}
          >
            {t("Send note", "Notiz senden")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// C1 – Dashboard "To do today" + class picker
// ---------------------------------------------------------------------------
export function TodayPanel({
  language,
  items,
}: {
  language: Lang;
  items: { en: string; de: string; count: number; onClick: () => void }[];
}) {
  const t = makeT(language);
  return (
    <article className="panel today-panel">
      <div className="panel-head">
        <div>
          <p className="kicker">{t("TO DO TODAY", "HEUTE ZU TUN")}</p>
          <h2>{t("Your next tasks", "Ihre nächsten Aufgaben")}</h2>
        </div>
      </div>
      {items.map((item) => (
        <button className="today-row" key={item.en} onClick={item.onClick}>
          <span>{t(item.en, item.de)}</span>
          <b className={item.count ? "" : "zero"}>{item.count}</b>
          <Icon name="chevron" size={18} />
        </button>
      ))}
    </article>
  );
}

export function ClassPicker({ language, notify }: { language: Lang; notify: (m: string) => void }) {
  const t = makeT(language);
  return (
    <div className="class-picker">
      <label>
        {t("Class", "Klasse")}
        <select
          value="4B"
          onChange={() =>
            notify(
              t(
                "Demo data exists only for Grade 4B.",
                "Demo-Daten gibt es nur für Klasse 4B.",
              ),
            )
          }
        >
          {["4A", "4B", "4C", "4D", "4E"].map((c) => (
            <option key={c} value={c}>
              {t("Grade", "Klasse")} {c}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("Subject", "Fach")}
        <select value="math" onChange={() => undefined}>
          <option value="math">{t("Mathematics", "Mathematik")}</option>
        </select>
      </label>
    </div>
  );
}

// ---------------------------------------------------------------------------
// C2 + C27 – Class roster with search and filters
// ---------------------------------------------------------------------------
type Live = { khadija: KhadijaLive };

function quiz4Label(student: RosterStudent, live: KhadijaLive, s: ReturnType<typeof useClassState>, t: ReturnType<typeof makeT>) {
  if (student.name === "Khadija")
    return live.awardedMark === null ? t("Needs review", "Prüfung offen") : `${live.percent}%`;
  if ((student.name === "Mariam" || student.name === "Salma") && !s.otherReviewed.includes(student.name))
    return t("Needs review", "Prüfung offen");
  if (student.name === "Judy")
    return s.bulkUploaded ? t("Needs review", "Prüfung offen") : t("Not submitted", "Nicht abgegeben");
  return `${quiz4Percent(student, s)}%`;
}

export function RosterPage({
  khadija,
  onOpen,
  onNote,
  language,
}: Live & { language: Lang; onOpen: (name: string) => void; onNote: (name: string) => void }) {
  const t = makeT(language);
  const s = useClassState();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "support" | "track" | "review" | "missing">("all");
  const rows = roster.filter((student) => {
    if (query && !student.name.toLowerCase().includes(query.trim().toLowerCase())) return false;
    const label = quiz4Label(student, khadija, s, t);
    if (filter === "support") return student.focus !== null;
    if (filter === "track") return student.focus === null;
    if (filter === "review") return label === t("Needs review", "Prüfung offen");
    if (filter === "missing") return label === t("Not submitted", "Nicht abgegeben");
    return true;
  });
  return (
    <section>
      <div className="teacher-heading">
        <div>
          <p className="kicker">{t("GRADE 4B · 22 STUDENTS", "KLASSE 4B · 22 KINDER")}</p>
          <h1>{t("Students", "Kinder")}</h1>
          <p>{t("Open a record to see progress, gaps and messages.", "Öffnen Sie eine Akte für Fortschritt, Lücken und Nachrichten.")}</p>
        </div>
      </div>
      <div className="panel roster-panel">
        <div className="roster-filters">
          <label>
            {t("Search", "Suchen")}
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Student name", "Name des Kindes")}
            />
          </label>
          <label>
            {t("Show", "Anzeigen")}
            <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
              <option value="all">{t("All students", "Alle Kinder")}</option>
              <option value="support">{t("Needs support", "Braucht Unterstützung")}</option>
              <option value="track">{t("On track", "Im Plan")}</option>
              <option value="review">{t("Quiz 4 needs review", "Quiz 4: Prüfung offen")}</option>
              <option value="missing">{t("Not submitted", "Nicht abgegeben")}</option>
            </select>
          </label>
          <p className="activity-count" role="status">
            {t(`${rows.length} students`, `${rows.length} Kinder`)}
          </p>
        </div>
        <div className="roster-table" role="table">
          <div className="roster-row roster-head" role="row">
            <span>{t("Student", "Kind")}</span>
            <span>{t("Quiz 1–3", "Quiz 1–3")}</span>
            <span>{t("Quiz 4", "Quiz 4")}</span>
            <span>{t("Support", "Unterstützung")}</span>
            <span>{t("Actions", "Aktionen")}</span>
          </div>
          {rows.map((student) => {
            const skill = skills.find((k) => k.id === student.focus);
            return (
              <div className="roster-row" role="row" key={student.name}>
                <span className="student-cell">
                  <b>{initials(student.name)}</b>
                  <strong>{student.name}</strong>
                </span>
                <span>{student.quizzes.slice(0, 3).join(" · ")}%</span>
                <span>{quiz4Label(student, khadija, s, t)}</span>
                <span>
                  {skill ? (
                    <Status type="warn">{skill.name[language]}</Status>
                  ) : (
                    <Status type="good">{t("On track", "Im Plan")}</Status>
                  )}
                </span>
                <span className="row-actions">
                  <Button icon="eye" variant="secondary" onClick={() => onOpen(student.name)}>
                    {t("Open record", "Akte öffnen")}
                  </Button>
                  <Button icon="message" variant="ghost" onClick={() => onNote(student.name)}>
                    {t("Send note", "Notiz senden")}
                  </Button>
                </span>
              </div>
            );
          })}
          {rows.length === 0 && <p className="empty-row">{t("No students match.", "Keine passenden Kinder.")}</p>}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// C19 + C20 + C25 (+ C31 per student) – Individual student record
// ---------------------------------------------------------------------------
const evidenceFor = (student: RosterStudent): { quiz: string; item: string; note: Text }[] => {
  if (student.name === "Khadija")
    return [
      { quiz: "Quiz 2", item: "1/2 < 1/3", note: { EN: "Incorrect comparison", DE: "Falscher Vergleich" } },
      { quiz: "Quiz 3", item: "3/5 > 3/4", note: { EN: "Incorrect comparison", DE: "Falscher Vergleich" } },
      { quiz: "Quiz 4", item: "2/3 < 3/5", note: { EN: "Incorrect comparison", DE: "Falscher Vergleich" } },
    ];
  if (student.focus === "compare")
    return [
      { quiz: "Quiz 3", item: "2/5 > 2/3", note: { EN: "Incorrect comparison", DE: "Falscher Vergleich" } },
      { quiz: "Quiz 4", item: "2/3 < 3/5", note: { EN: "Incorrect comparison", DE: "Falscher Vergleich" } },
    ];
  if (student.focus === "working")
    return [
      { quiz: "Quiz 3", item: "Q5", note: { EN: "Answer only, no working", DE: "Nur Ergebnis, kein Rechenweg" } },
      { quiz: "Quiz 4", item: "Q5", note: { EN: "Answer only, no working", DE: "Nur Ergebnis, kein Rechenweg" } },
    ];
  return [];
};

export function StudentRecord({
  name,
  khadija,
  onBack,
  onReview,
  onNote,
  ...common
}: Common & Live & {
  name: string;
  onBack: () => void;
  onReview: () => void;
  onNote: () => void;
}) {
  const t = makeT(common.language);
  const s = useClassState();
  const student = roster.find((r) => r.name === name) ?? roster[0];
  const isKhadija = student.name === "Khadija";
  const q4 = isKhadija ? khadija.percent : quiz4Percent(student, s);
  const history = [...student.quizzes.slice(0, 3), q4].filter((v): v is number => v !== null);
  const skill = skills.find((k) => k.id === student.focus);
  const evidence = evidenceFor(student);
  const practice = isKhadija
    ? khadija.practiced
      ? "done"
      : khadija.published && khadija.redFlagDecision === "confirmed"
        ? "pending"
        : "none"
    : student.practice;
  const quizScore = isKhadija ? khadija.practiceScore : student.quizScore;
  const threads = s.threads.filter((thread) => thread.student === student.name);
  return (
    <section>
      <div className="teacher-heading">
        <div>
          <button className="back-link" onClick={onBack}>
            <Icon name="arrow" /> {t("Back to students", "Zurück zu den Kindern")}
          </button>
          <p className="kicker">{t("STUDENT RECORD · GRADE 4B", "AKTE · KLASSE 4B")}</p>
          <h1>{student.name}</h1>
        </div>
        <div className="row-actions">
          {isKhadija && (
            <Button icon="review" onClick={onReview}>
              {t("Open Quiz 4 review", "Quiz-4-Prüfung öffnen")}
            </Button>
          )}
          <Button icon="message" variant="secondary" onClick={onNote}>
            {t("Send note", "Notiz senden")}
          </Button>
        </div>
      </div>
      <div className="record-grid">
        <article className="panel">
          <p className="kicker">{t("ASSESSMENT HISTORY", "BEWERTUNGSVERLAUF")}</p>
          <h2>{t("Quiz results", "Quizergebnisse")}</h2>
          <div className="mini-bars" aria-label={t("Quiz results chart", "Diagramm der Quizergebnisse")}>
            {history.map((value, index) => (
              <span key={index}>
                <i style={{ height: `${value}%` }} />
                <b>{value}%</b>
                <small>Quiz {index + 1}</small>
              </span>
            ))}
          </div>
          <p className="record-note">
            {history.length > 1 && history[history.length - 1] > history[0]
              ? t(
                  `Up ${history[history.length - 1] - history[0]} points since Quiz 1.`,
                  `${history[history.length - 1] - history[0]} Punkte mehr seit Quiz 1.`,
                )
              : t("Quiz 4 not confirmed yet.", "Quiz 4 noch nicht bestätigt.")}
          </p>
        </article>
        <article className="panel">
          <p className="kicker">{t("CONCEPT MASTERY", "KOMPETENZSTAND")}</p>
          <h2>{t("By skill", "Nach Kompetenz")}</h2>
          {skills.map((k) => {
            const own = k.id === student.focus ? Math.min(k.mastery, 40) : Math.min(95, k.mastery + 8);
            const level = skillLevel(own);
            return (
              <div className="record-skill" key={k.id}>
                <span>{k.name[common.language]}</span>
                <i className="mini-meter">
                  <b style={{ width: `${own}%` }} />
                </i>
                <Status type={level.type}>{t(level.en, level.de)}</Status>
              </div>
            );
          })}
        </article>
        <article className="panel">
          <p className="kicker">{t("LEARNING GAPS", "LERNLÜCKEN")}</p>
          <h2>{skill ? skill.name[common.language] : t("No open gaps", "Keine offenen Lücken")}</h2>
          {skill ? (
            <>
              <p>
                <b>{t("Recurring mistake:", "Wiederkehrender Fehler:")}</b> {skill.mistake[common.language]}
              </p>
              <div className="evidence-timeline">
                {evidence.map((item) => (
                  <article key={item.quiz}>
                    <span>{item.quiz}</span>
                    <strong>{item.item}</strong>
                    <small>{item.note[common.language]}</small>
                  </article>
                ))}
              </div>
              {isKhadija && khadija.redFlagDecision && (
                <Status type={khadija.redFlagDecision === "confirmed" ? "warn" : "neutral"}>
                  {khadija.redFlagDecision === "confirmed"
                    ? t("Red flag confirmed", "Hinweis bestätigt")
                    : khadija.redFlagDecision === "dismissed"
                      ? t("Red flag dismissed", "Hinweis verworfen")
                      : t("Red flag postponed", "Hinweis zurückgestellt")}
                </Status>
              )}
            </>
          ) : (
            <p>{t("Recent quizzes show no repeated mistakes.", "Die letzten Quizze zeigen keine wiederholten Fehler.")}</p>
          )}
        </article>
        <article className="panel">
          <p className="kicker">{t("PRACTICE & POP QUIZ", "ÜBUNG & KURZ-QUIZ")}</p>
          <h2>{t("Follow-up", "Nachverfolgung")}</h2>
          <Status type={practice === "done" ? "good" : practice === "pending" ? "warn" : "neutral"}>
            {practice === "done"
              ? t(`Done · ${quizScore} of 3 first try`, `Erledigt · ${quizScore} von 3 beim ersten Versuch`)
              : practice === "pending"
                ? t("Assigned, not done yet", "Zugewiesen, noch nicht erledigt")
                : t("No practice assigned", "Keine Übung zugewiesen")}
          </Status>
          {practice === "pending" && (
            <Button icon="bell" variant="secondary" onClick={() => sendPracticeReminder(student.name, common)}>
              {s.remindersSent.includes(student.name)
                ? t("Send reminder again", "Erneut erinnern")
                : t("Send reminder", "Erinnerung senden")}
            </Button>
          )}
          {isKhadija && (
            <Status type={s.parentAck ? "good" : "neutral"}>
              {s.parentAck
                ? t("Parent acknowledged the Quiz 4 report", "Eltern haben den Quiz-4-Bericht bestätigt")
                : t("Parent has not acknowledged a Quiz 4 report yet", "Eltern haben noch keinen Quiz-4-Bericht bestätigt")}
            </Status>
          )}
          <h3 className="record-sub">{t("Messages", "Nachrichten")}</h3>
          {threads.length === 0 ? (
            <p>{t("No messages yet.", "Noch keine Nachrichten.")}</p>
          ) : (
            threads.map((thread) => (
              <p className="record-thread" key={thread.id}>
                <b>{thread.title[common.language]}</b> ·{" "}
                {messageText(thread.messages[thread.messages.length - 1], common.language)}
              </p>
            ))
          )}
        </article>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// C3 + C4 + C6 – Assessments, marking scheme, submissions, bulk upload
// ---------------------------------------------------------------------------
export function AssessmentsPage({
  khadija,
  onReview,
  ...common
}: Common & Live & { onReview: (name: string) => void }) {
  const t = makeT(common.language);
  const s = useClassState();
  const language = common.language;
  const [tab, setTab] = useState<"list" | "scheme" | "submissions">("submissions");
  const [form, setForm] = useState<null | { title: string; subject: string; language: Lang; marks: number; date: string }>(null);
  const status = (student: RosterStudent) => {
    if (student.name === "Khadija") {
      if (!khadija.ocrVerified) return { type: "warn" as const, label: t("Check extracted text", "Erkannten Text prüfen"), action: true };
      if (khadija.awardedMark === null) return { type: "warn" as const, label: t("Review AI marks", "KI-Bewertung prüfen"), action: true };
      if (!khadija.published) return { type: "neutral" as const, label: t("Ready to publish", "Bereit zur Veröffentlichung"), action: true };
      return { type: "good" as const, label: t("Published", "Veröffentlicht"), action: false };
    }
    if (student.name === "Mariam" || student.name === "Salma") {
      if (s.otherReviewed.includes(student.name)) return { type: "good" as const, label: t("Marks confirmed", "Bewertung bestätigt"), action: false };
      if (s.verifiedStudents.includes(student.name)) return { type: "warn" as const, label: t("Review AI marks", "KI-Bewertung prüfen"), action: true };
      return { type: "warn" as const, label: t("Check extracted text", "Erkannten Text prüfen"), action: true };
    }
    if (student.name === "Judy")
      return s.bulkUploaded
        ? { type: "warn" as const, label: t("Uploaded by teacher · text check", "Von der Lehrerin hochgeladen · Textprüfung"), action: false }
        : { type: "bad" as const, label: t("Not submitted", "Nicht abgegeben"), action: false };
    return { type: "good" as const, label: t("Marks confirmed", "Bewertung bestätigt"), action: false };
  };
  return (
    <section>
      <div className="teacher-heading">
        <div>
          <p className="kicker">{t("ASSESSMENTS · GRADE 4B", "PRÜFUNGEN · KLASSE 4B")}</p>
          <h1>{t("Assessments", "Prüfungen")}</h1>
          <p>{t("Set up quizzes, marking schemes and follow submissions.", "Quizze und Bewertungsschemata anlegen, Abgaben verfolgen.")}</p>
        </div>
        <Button
          icon="edit"
          onClick={() => {
            setTab("list");
            setForm({ title: "", subject: "math", language: "EN", marks: 25, date: "" });
          }}
        >
          {t("New assessment", "Neue Prüfung")}
        </Button>
      </div>
      <div className="workflow-tabs" role="tablist">
        {(
          [
            ["submissions", t("Quiz 4 submissions", "Abgaben Quiz 4")],
            ["scheme", t("Quiz 4 marking scheme", "Bewertungsschema Quiz 4")],
            ["list", t("All assessments", "Alle Prüfungen")],
          ] as const
        ).map(([id, label], index) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
            <span>{index + 1}</span>
            {label}
          </button>
        ))}
      </div>

      {tab === "submissions" && (
        <div className="panel roster-panel">
          <div className="panel-head">
            <div>
              <p className="kicker">{t("QUIZ 4 · 17 OCTOBER", "QUIZ 4 · 17. OKTOBER")}</p>
              <h2>
                {t(
                  `${roster.filter((r) => r.name !== "Judy" || s.bulkUploaded).length} of 22 papers received`,
                  `${roster.filter((r) => r.name !== "Judy" || s.bulkUploaded).length} von 22 Arbeiten eingegangen`,
                )}
              </h2>
            </div>
            <label className="button secondary file-choice">
              <Icon name="book" />
              {t("Upload paper scans", "Scans hochladen")}
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={(e) => {
                  const count = e.target.files?.length ?? 0;
                  e.target.value = "";
                  if (!count) return;
                  updateClassState({ bulkUploaded: true });
                  logActivity("submitted", "Judy", {
                    EN: `Quiz 4 paper uploaded by the teacher (${count} ${count === 1 ? "file" : "files"})`,
                    DE: `Quiz-4-Arbeit von der Lehrerin hochgeladen (${count} ${count === 1 ? "Datei" : "Dateien"})`,
                  });
                  common.notify(
                    t(
                      `${count} ${count === 1 ? "file" : "files"} uploaded and matched to Judy by name.`,
                      `${count} ${count === 1 ? "Datei" : "Dateien"} hochgeladen und Judy anhand des Namens zugeordnet.`,
                    ),
                  );
                }}
              />
            </label>
          </div>
          <p className="panel-note">
            {t(
              "Upload several scanned papers at once. Names on the papers are matched to the class list; you check the match during text verification.",
              "Laden Sie mehrere Scans auf einmal hoch. Die Namen werden der Klassenliste zugeordnet; Sie prüfen die Zuordnung bei der Textprüfung.",
            )}
          </p>
          <div className="roster-table" role="table">
            {roster.map((student) => {
              const st = status(student);
              return (
                <div className="roster-row submissions-row" role="row" key={student.name}>
                  <span className="student-cell">
                    <b>{initials(student.name)}</b>
                    <strong>{student.name}</strong>
                  </span>
                  <span>
                    <Status type={st.type}>{st.label}</Status>
                  </span>
                  <span>
                    {st.action && (
                      <Button icon="review" variant="secondary" onClick={() => onReview(student.name)}>
                        {t("Review", "Prüfen")}
                      </Button>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "scheme" && (
        <div className="panel roster-panel">
          <div className="panel-head">
            <div>
              <p className="kicker">{t("MODEL ANSWERS & PARTIAL MARKS", "MUSTERLÖSUNGEN & TEILPUNKTE")}</p>
              <h2>{t("Quiz 4 marking scheme · 25 marks · English", "Bewertungsschema Quiz 4 · 25 Punkte · Englisch")}</h2>
            </div>
          </div>
          <p className="panel-note">
            {t(
              "The AI grades against these model answers and partial-mark rules. Changes apply to answers that are not yet confirmed.",
              "Die KI bewertet anhand dieser Musterlösungen und Teilpunkt-Regeln. Änderungen gelten für noch nicht bestätigte Antworten.",
            )}
          </p>
          <div className="scheme-table" role="table">
            <div className="scheme-row roster-head" role="row">
              <span>{t("Question", "Aufgabe")}</span>
              <span>{t("Marks", "Punkte")}</span>
              <span>{t("Model answer", "Musterlösung")}</span>
              <span>{t("Partial-mark rule", "Teilpunkt-Regel")}</span>
            </div>
            {s.scheme.map((item) => (
              <div className="scheme-row" role="row" key={item.n}>
                <span>{t("Q", "A")}{item.n}</span>
                <span>{item.marks}</span>
                <input
                  aria-label={t(`Model answer for question ${item.n}`, `Musterlösung für Aufgabe ${item.n}`)}
                  value={item.model}
                  onChange={(e) =>
                    updateClassState((st) => ({
                      scheme: st.scheme.map((x) => (x.n === item.n ? { ...x, model: e.target.value } : x)),
                    }))
                  }
                />
                <input
                  aria-label={t(`Partial-mark rule for question ${item.n}`, `Teilpunkt-Regel für Aufgabe ${item.n}`)}
                  value={item.rule[language]}
                  onChange={(e) =>
                    updateClassState((st) => ({
                      scheme: st.scheme.map((x) =>
                        x.n === item.n ? { ...x, rule: { EN: e.target.value, DE: e.target.value } } : x,
                      ),
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <h3 className="record-sub">{t("Saved grading rules", "Gespeicherte Bewertungsregeln")}</h3>
          {s.savedRules.map((rule) => (
            <p className="saved-rule" key={rule.id}>
              <Icon name="check" size={16} /> <b>{rule.scope[language]}:</b> {rule.text[language]}
            </p>
          ))}
        </div>
      )}

      {tab === "list" && (
        <div className="panel roster-panel">
          {form && (
            <form
              className="assessment-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!form.title.trim()) return;
                const subject =
                  form.subject === "math"
                    ? { EN: "Mathematics", DE: "Mathematik" }
                    : { EN: "Physics", DE: "Physik" };
                updateClassState((st) => ({
                  assessments: [
                    ...st.assessments,
                    {
                      id: newId(),
                      title: { EN: form.title.trim(), DE: form.title.trim() },
                      subject,
                      date: { EN: form.date || "—", DE: form.date || "—" },
                      language: form.language,
                      marks: form.marks,
                      status: "draft",
                    },
                  ],
                }));
                common.notify(t("Assessment saved as a draft.", "Prüfung als Entwurf gespeichert."));
                setForm(null);
              }}
            >
              <h2>{t("New assessment", "Neue Prüfung")}</h2>
              <label>
                {t("Title", "Titel")}
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder={t("e.g. Quiz 5: Measurement", "z. B. Quiz 5: Messen")}
                  required
                />
              </label>
              <label>
                {t("Subject", "Fach")}
                <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                  <option value="math">{t("Mathematics", "Mathematik")}</option>
                  <option value="physics">{t("Physics", "Physik")}</option>
                </select>
              </label>
              <label>
                {t("Exam language", "Prüfungssprache")}
                <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value as Lang })}>
                  <option value="EN">{t("English", "Englisch")}</option>
                  <option value="DE">Deutsch</option>
                </select>
              </label>
              <label>
                {t("Total marks", "Gesamtpunkte")}
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={form.marks}
                  onChange={(e) => setForm({ ...form, marks: Number(e.target.value) || 1 })}
                />
              </label>
              <label>
                {t("Date", "Datum")}
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </label>
              <label>
                {t("Model answers (photo or PDF)", "Musterlösungen (Foto oder PDF)")}
                <input type="file" accept="image/*,application/pdf" />
              </label>
              <div className="modal-actions">
                <Button icon="close" variant="ghost" onClick={() => setForm(null)}>
                  {t("Cancel", "Abbrechen")}
                </Button>
                <button type="submit" className="button primary">
                  <Icon name="check" />
                  {t("Save draft", "Entwurf speichern")}
                </button>
              </div>
            </form>
          )}
          <div className="roster-table" role="table">
            {s.assessments.map((item) => (
              <div className="roster-row assessment-row" role="row" key={item.id}>
                <strong>{item.title[language]}</strong>
                <span>
                  {item.subject[language]} · {item.date[language]}
                </span>
                <span>
                  {item.marks} {t("marks", "Punkte")} · {item.language === "DE" ? "Deutsch" : t("English", "Englisch")}
                </span>
                <Status type={item.status === "published" ? "good" : item.status === "review" ? "warn" : "neutral"}>
                  {item.status === "published"
                    ? t("Published", "Veröffentlicht")
                    : item.status === "review"
                      ? t("In review", "In Prüfung")
                      : t("Draft", "Entwurf")}
                </Status>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// C15 + C16 – Review one question across all students, bulk correction
// ---------------------------------------------------------------------------
export function QuestionReview(common: Common) {
  const t = makeT(common.language);
  const s = useClassState();
  const [question, setQuestion] = useState<5 | 7>(5);
  const [saveRule, setSaveRule] = useState(true);
  const markOf = (student: RosterStudent) =>
    s.q5RuleApplied && student.q5.group === "noWorking" ? Math.max(2, student.q5.mark) : student.q5.mark;
  const groups =
    question === 5
      ? [
          { id: "working", answer: t("4 each, with 20 ÷ 5 = 4", "je 4, mit 20 ÷ 5 = 4"), out: 4 },
          { id: "noWorking", answer: t("4 each, no working", "je 4, ohne Rechenweg"), out: 4 },
          { id: "wrong", answer: t("5 each", "je 5"), out: 4 },
        ].map((g) => ({
          ...g,
          students: roster.filter((r) => r.q5.group === g.id).map((r) => ({ name: r.name, mark: markOf(r) })),
        }))
      : [
          {
            id: "right",
            answer: "2/3 > 3/5",
            out: 3,
            students: roster
              .filter((r) => r.focus !== "compare" && r.name !== "Judy")
              .map((r) => ({ name: r.name, mark: 3 })),
          },
          {
            id: "wrong",
            answer: "2/3 < 3/5",
            out: 3,
            students: roster.filter((r) => r.focus === "compare").map((r) => ({ name: r.name, mark: 0 })),
          },
        ];
  const affected = roster.filter((r) => r.q5.group === "noWorking" && r.q5.mark < 2);
  return (
    <section>
      <div className="teacher-heading">
        <div>
          <p className="kicker">{t("GRADING CONSISTENCY · QUIZ 4", "EINHEITLICHE BEWERTUNG · QUIZ 4")}</p>
          <h1>{t("Review by question", "Nach Aufgabe prüfen")}</h1>
          <p>{t("Compare how the same answer was marked for every student.", "Vergleichen Sie, wie dieselbe Antwort bei allen Kindern bewertet wurde.")}</p>
        </div>
        <label className="class-picker">
          {t("Question", "Aufgabe")}
          <select value={question} onChange={(e) => setQuestion(Number(e.target.value) as 5 | 7)}>
            <option value={5}>{t("Q5 · Share 20 apples (4 marks)", "A5 · Teile 20 Äpfel (4 Punkte)")}</option>
            <option value={7}>{t("Q7 · Compare 2/3 and 3/5 (3 marks)", "A7 · Vergleiche 2/3 und 3/5 (3 Punkte)")}</option>
          </select>
        </label>
      </div>
      <div className="group-list">
        {groups.map((group) => {
          const marks = [...new Set(group.students.map((x) => x.mark))];
          const inconsistent = marks.length > 1;
          return (
            <article className={`panel answer-group ${inconsistent ? "inconsistent" : ""}`} key={group.id}>
              <div className="panel-head">
                <div>
                  <p className="kicker">
                    {t(`${group.students.length} STUDENTS`, `${group.students.length} KINDER`)}
                  </p>
                  <h2>“{group.answer}”</h2>
                </div>
                {inconsistent ? (
                  <Status type="warn">{t("Inconsistent marks", "Uneinheitliche Bewertung")}</Status>
                ) : (
                  <Status type="good">{t("Consistent", "Einheitlich")}</Status>
                )}
              </div>
              <div className="group-students">
                {group.students.map((x) => (
                  <span key={x.name} className={inconsistent && x.mark !== Math.max(...marks) ? "odd" : ""}>
                    {x.name} <b>{x.mark}/{group.out}</b>
                  </span>
                ))}
              </div>
            </article>
          );
        })}
      </div>
      {question === 5 && (
        <article className="panel rule-panel">
          <div className="ai-title">
            <span>
              <Icon name="spark" />
            </span>
            <div>
              <p className="kicker">{t("SUGGESTED BULK CORRECTION", "VORGESCHLAGENE SAMMELKORREKTUR")}</p>
              <h2>{t("Correct answer without working = 2 of 4 marks", "Richtiges Ergebnis ohne Rechenweg = 2 von 4 Punkten")}</h2>
            </div>
          </div>
          {s.q5RuleApplied ? (
            <div className="confirmed-box">
              <Icon name="check" />
              <div>
                <strong>{t("Correction applied", "Korrektur angewendet")}</strong>
                <p>{t("All “4 each, no working” answers now have 2 of 4 marks.", "Alle Antworten „je 4, ohne Rechenweg“ haben jetzt 2 von 4 Punkten.")}</p>
              </div>
            </div>
          ) : (
            <>
              <p>{t("Preview – these marks will change:", "Vorschau – diese Bewertungen ändern sich:")}</p>
              <div className="group-students">
                {affected.map((r) => (
                  <span key={r.name}>
                    {r.name} <b>{r.q5.mark}/4 → 2/4</b> ({quiz4Percent(r, s)}% → {(r.quizzes[3] ?? 0) + (2 - r.q5.mark) * 4}%)
                  </span>
                ))}
              </div>
              <label className="share-toggle">
                <input type="checkbox" checked={saveRule} onChange={(e) => setSaveRule(e.target.checked)} />
                <span>
                  <strong>{t("Save this rule for future assessments", "Regel für künftige Prüfungen speichern")}</strong>
                  <small>{t("The AI will apply it to similar word problems.", "Die KI wendet sie auf ähnliche Sachaufgaben an.")}</small>
                </span>
              </label>
              <Button
                icon="check"
                onClick={() => {
                  updateClassState((st) => ({
                    q5RuleApplied: true,
                    savedRules: saveRule
                      ? [
                          ...st.savedRules,
                          {
                            id: newId(),
                            scope: { EN: "Word problems", DE: "Sachaufgaben" },
                            text: {
                              EN: "Correct answer without working = half marks",
                              DE: "Richtiges Ergebnis ohne Rechenweg = halbe Punktzahl",
                            },
                          },
                        ]
                      : st.savedRules,
                  }));
                  affected.forEach((r) =>
                    logActivity("override", r.name, {
                      EN: `Quiz 4 · Q5: bulk correction ${r.q5.mark}/4 → 2/4 (no working rule)`,
                      DE: `Quiz 4 · A5: Sammelkorrektur ${r.q5.mark}/4 → 2/4 (Regel ohne Rechenweg)`,
                    }),
                  );
                  common.notify(
                    t(
                      `Bulk correction applied to ${affected.length} answers.`,
                      `Sammelkorrektur auf ${affected.length} Antworten angewendet.`,
                    ),
                  );
                }}
              >
                {t(`Approve for ${affected.length} answers`, `Für ${affected.length} Antworten freigeben`)}
              </Button>
            </>
          )}
        </article>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// C18 – Gradebook with CSV export
// ---------------------------------------------------------------------------
export function Gradebook({ khadija, ...common }: Common & Live) {
  const t = makeT(common.language);
  const s = useClassState();
  const rows = roster.map((student) => {
    const pending =
      (student.name === "Khadija" && khadija.awardedMark === null) ||
      ((student.name === "Mariam" || student.name === "Salma") && !s.otherReviewed.includes(student.name));
    const q4 =
      student.name === "Khadija" ? khadija.percent : pending ? null : quiz4Percent(student, s);
    const values = [...student.quizzes.slice(0, 3), q4] as (number | null)[];
    const known = values.filter((v): v is number => v !== null);
    return {
      name: student.name,
      values,
      pending,
      unpublished: student.name === "Khadija" && khadija.awardedMark !== null && !khadija.published,
      average: Math.round(known.reduce((a, b) => a + b, 0) / known.length),
    };
  });
  const columnAverage = (i: number) => {
    const vals = rows.map((r) => r.values[i]).filter((v): v is number => v !== null);
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };
  const exportCsv = () => {
    const header = ["Student", "Quiz 1", "Quiz 2", "Quiz 3", "Quiz 4", "Average"];
    const lines = rows.map((r) => [r.name, ...r.values.map((v) => (v === null ? "" : v)), r.average].join(","));
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "grade-4B-mathematics.csv";
    a.click();
    URL.revokeObjectURL(url);
    common.notify(t("Gradebook exported as CSV.", "Notenbuch als CSV exportiert."));
  };
  return (
    <section>
      <div className="teacher-heading">
        <div>
          <p className="kicker">{t("GRADE 4B · MATHEMATICS", "KLASSE 4B · MATHEMATIK")}</p>
          <h1>{t("Gradebook", "Notenbuch")}</h1>
          <p>{t("Teacher-confirmed results only. Percent of total marks.", "Nur von der Lehrkraft bestätigte Ergebnisse. Prozent der Gesamtpunkte.")}</p>
        </div>
        <Button icon="book" onClick={exportCsv}>
          {t("Export to spreadsheet (CSV)", "Als Tabelle exportieren (CSV)")}
        </Button>
      </div>
      <div className="panel roster-panel">
        <div className="gradebook-table" role="table">
          <div className="gradebook-row roster-head" role="row">
            <span>{t("Student", "Kind")}</span>
            <span>Quiz 1</span>
            <span>Quiz 2</span>
            <span>Quiz 3</span>
            <span>Quiz 4</span>
            <span>{t("Average", "Schnitt")}</span>
          </div>
          {rows.map((r) => (
            <div className="gradebook-row" role="row" key={r.name}>
              <strong>{r.name}</strong>
              {r.values.map((v, i) => (
                <span key={i}>
                  {v === null
                    ? r.pending && i === 3
                      ? t("Review", "Prüfen")
                      : "—"
                    : `${v}%`}
                  {i === 3 && r.unpublished && <small> · {t("not published", "nicht veröffentlicht")}</small>}
                </span>
              ))}
              <b>{r.average}%</b>
            </div>
          ))}
          <div className="gradebook-row gradebook-total" role="row">
            <strong>{t("Class average (confirmed exams)", "Klassendurchschnitt (bestätigte Arbeiten)")}</strong>
            {[0, 1, 2, 3].map((i) => (
              <span key={i}>{columnAverage(i)}%</span>
            ))}
            <span />
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// C23 + C33 – Skill tree and revision plan
// ---------------------------------------------------------------------------
export function SkillTree({ onOpenStudent, ...common }: Common & { onOpenStudent: (name: string) => void }) {
  const t = makeT(common.language);
  const language = common.language;
  const s = useClassState();
  const [selected, setSelected] = useState("compare");
  const skill = skills.find((k) => k.id === selected) ?? skills[0];
  const strands = useMemo(() => [...new Set(skills.map((k) => k.strand.EN))], []);
  const affected = studentsFor(skill.id);
  const suggestions = [...skills].sort((a, b) => a.mastery - b.mastery).slice(0, 4);
  const level = skillLevel(skill.mastery);
  return (
    <section>
      <div className="teacher-heading">
        <div>
          <p className="kicker">{t("GRADE 4B · MATHEMATICS", "KLASSE 4B · MATHEMATIK")}</p>
          <h1>{t("Class skill tree", "Kompetenzbaum der Klasse")}</h1>
          <p>{t("Each branch builds on the one before it. Select a skill to see who needs help.", "Jeder Zweig baut auf dem vorherigen auf. Wählen Sie eine Kompetenz, um zu sehen, wer Hilfe braucht.")}</p>
        </div>
      </div>
      <div className="skilltree-layout">
        <article className="panel skilltree">
          <div className="skill-root">
            <Icon name="school" /> {t("Grade 4 Mathematics", "Mathematik Klasse 4")}
          </div>
          <div className="skill-strands">
            {strands.map((strand) => (
              <div className="skill-strand" key={strand}>
                <p className="kicker">{skills.find((k) => k.strand.EN === strand)?.strand[language]}</p>
                {skills
                  .filter((k) => k.strand.EN === strand)
                  .map((k) => {
                    const lv = skillLevel(k.mastery);
                    return (
                      <button
                        key={k.id}
                        className={`skill-node ${lv.type} ${selected === k.id ? "selected" : ""}`}
                        onClick={() => setSelected(k.id)}
                        aria-pressed={selected === k.id}
                      >
                        <Icon name={lv.type === "good" ? "check" : lv.type === "warn" ? "warning" : "idea"} size={18} />
                        <span>
                          <strong>{k.name[language]}</strong>
                          <small>
                            {k.mastery}% · {t(lv.en, lv.de)}
                          </small>
                        </span>
                      </button>
                    );
                  })}
              </div>
            ))}
          </div>
          <p className="skill-legend">
            <Status type="good">{t("Secure ≥ 80%", "Sicher ≥ 80 %")}</Status>
            <Status type="neutral">{t("Developing 65–79%", "Im Aufbau 65–79 %")}</Status>
            <Status type="warn">{t("Gap < 65%", "Lücke < 65 %")}</Status>
          </p>
        </article>
        <aside className="panel skill-detail">
          <p className="kicker">{skill.strand[language]}</p>
          <h2>{skill.name[language]}</h2>
          <Status type={level.type}>
            {skill.mastery}% {t("of the class secure", "der Klasse sicher")} · {t(level.en, level.de)}
          </Status>
          <p>
            <b>{t("Common mistake:", "Häufiger Fehler:")}</b> {skill.mistake[language]}
          </p>
          <h3 className="record-sub">
            {t(`Students who need support (${affected.length})`, `Kinder mit Unterstützungsbedarf (${affected.length})`)}
          </h3>
          {affected.length ? (
            <div className="group-students">
              {affected.map((name) => (
                <button key={name} className="chip-button" onClick={() => onOpenStudent(name)}>
                  {name}
                </button>
              ))}
            </div>
          ) : (
            <p>{t("No students flagged for this skill.", "Für diese Kompetenz ist kein Kind markiert.")}</p>
          )}
          <div className="decision-actions">
            <Button
              icon="trend"
              variant="secondary"
              disabled={s.revisionPlan.includes(skill.id)}
              onClick={() => updateClassState((st) => ({ revisionPlan: [...st.revisionPlan, skill.id] }))}
            >
              {s.revisionPlan.includes(skill.id) ? t("In revision plan", "Im Wiederholungsplan") : t("Add to revision plan", "Zum Wiederholungsplan")}
            </Button>
            {affected.length > 0 && (
              <Button
                icon="book"
                onClick={() => {
                  logActivity("feedback", "4B", {
                    EN: `${skill.name.EN}: practice assigned to ${affected.length} students`,
                    DE: `${skill.name.DE}: Übung ${affected.length} Kindern zugewiesen`,
                  });
                  common.notify(
                    t(`Practice assigned to ${affected.length} students.`, `Übung ${affected.length} Kindern zugewiesen.`),
                  );
                }}
              >
                {t("Assign practice to group", "Übung der Gruppe zuweisen")}
              </Button>
            )}
          </div>
        </aside>
      </div>
      <article className="panel revision-panel">
        <div className="panel-head">
          <div>
            <p className="kicker">{t("REVISION PLANNING", "WIEDERHOLUNGSPLANUNG")}</p>
            <h2>{t("Suggested topics for the next revision lesson", "Vorgeschlagene Themen für die nächste Wiederholungsstunde")}</h2>
          </div>
          <Status type="neutral">{t("AI suggestion – you decide", "KI-Vorschlag – Sie entscheiden")}</Status>
        </div>
        {suggestions.map((k, index) => (
          <div className="revision-row" key={k.id}>
            <em>{index + 1}</em>
            <span>
              <strong>{k.name[language]}</strong>
              <small>
                {k.mastery}% {t("secure", "sicher")} · {studentsFor(k.id).length} {t("students flagged", "Kinder markiert")} · {k.activity[language]}
              </small>
            </span>
            {s.revisionPlan.includes(k.id) ? (
              <Button
                icon="close"
                variant="ghost"
                onClick={() => updateClassState((st) => ({ revisionPlan: st.revisionPlan.filter((x) => x !== k.id) }))}
              >
                {t("Remove", "Entfernen")}
              </Button>
            ) : (
              <Button icon="check" variant="secondary" onClick={() => updateClassState((st) => ({ revisionPlan: [...st.revisionPlan, k.id] }))}>
                {t("Add", "Hinzufügen")}
              </Button>
            )}
          </div>
        ))}
        <p className="panel-note">
          {s.revisionPlan.length
            ? t(
                `Monday revision plan: ${s.revisionPlan.map((id) => skills.find((k) => k.id === id)?.name.EN).join(", ")}.`,
                `Wiederholungsplan für Montag: ${s.revisionPlan.map((id) => skills.find((k) => k.id === id)?.name.DE).join(", ")}.`,
              )
            : t("No topics in the plan yet.", "Noch keine Themen im Plan.")}
        </p>
      </article>
    </section>
  );
}

// ---------------------------------------------------------------------------
// C31 – Practice and pop-quiz monitoring
// ---------------------------------------------------------------------------
export function QuizMonitor({ khadija, ...common }: Common & Live) {
  const t = makeT(common.language);
  const s = useClassState();
  const rows = roster
    .filter((r) => r.practice !== "none" || r.name === "Khadija")
    .map((r) => {
      if (r.name !== "Khadija") return { name: r.name, state: r.practice, score: r.quizScore };
      const state = khadija.practiced
        ? "done"
        : khadija.published && khadija.redFlagDecision === "confirmed"
          ? "pending"
          : "none";
      return { name: r.name, state, score: khadija.practiceScore ?? undefined };
    });
  return (
    <section className="panel students-panel quiz-monitor">
      <div className="panel-head">
        <div>
          <p className="kicker">{t("VERIFICATION POP QUIZZES", "KURZ-QUIZZE ZUR KONTROLLE")}</p>
          <h2>{t("Practice follow-up", "Nachverfolgung der Übungen")}</h2>
        </div>
      </div>
      {rows.map((row) => (
        <div className="student-snapshot" key={row.name}>
          <span className="student-cell">
            <b>{initials(row.name)}</b>
            <i>
              <strong>{row.name}</strong>
              <small>{t("Comparing fractions practice", "Übung Brüche vergleichen")}</small>
            </i>
          </span>
          <strong>{row.state === "done" ? `${row.score}/3` : "—"}</strong>
          <Status type={row.state === "done" ? (row.score === 3 ? "good" : "neutral") : row.state === "pending" ? "warn" : "neutral"}>
            {row.state === "done"
              ? row.score === 3
                ? t("Understood", "Verstanden")
                : t("Partly understood", "Teilweise verstanden")
              : row.state === "pending"
                ? t("Not done yet", "Noch nicht erledigt")
                : t("Not assigned yet", "Noch nicht zugewiesen")}
          </Status>
          {row.state === "pending" ? (
            <Button icon="bell" variant="ghost" onClick={() => sendPracticeReminder(row.name, common)}>
              {s.remindersSent.includes(row.name) ? t("Remind again", "Erneut erinnern") : t("Send reminder", "Erinnern")}
            </Button>
          ) : (
            <span />
          )}
        </div>
      ))}
    </section>
  );
}

// ---------------------------------------------------------------------------
// C30 – Approve, replace or assign learning resources (shown with the red flag)
// ---------------------------------------------------------------------------
export function ResourcesPanel({ language }: { language: Lang }) {
  const t = makeT(language);
  const s = useClassState();
  const r = s.resources;
  const set = (next: Partial<typeof r>) => {
    updateClassState({ resources: { ...r, ...next } });
    logActivity("feedback", "Khadija", {
      EN: "Practice resources updated",
      DE: "Übungsmaterial aktualisiert",
    });
  };
  return (
    <div className="resources-panel">
      <p className="kicker">{t("PRACTICE FOR KHADIJA", "ÜBUNG FÜR KHADIJA")}</p>
      <h3>{t("AI-suggested resources – approve before assigning", "KI-vorgeschlagenes Material – vor dem Zuweisen freigeben")}</h3>
      <label className="share-toggle">
        <input type="checkbox" checked={r.video} onChange={(e) => set({ video: e.target.checked })} />
        <span>
          <strong>{t("Explainer video (20 s, captions)", "Erklärvideo (20 s, Untertitel)")}</strong>
          <small>{t("Shown at the start of the mini lesson.", "Wird am Anfang der Mini-Lektion gezeigt.")}</small>
        </span>
      </label>
      <label className="share-toggle locked">
        <input type="checkbox" checked readOnly disabled />
        <span>
          <strong>{t("3-step mini lesson + 3-question pop quiz", "Mini-Lektion in 3 Schritten + Kurz-Quiz mit 3 Fragen")}</strong>
          <small>{t("Always included so you can check understanding.", "Immer enthalten, damit Sie das Verständnis prüfen können.")}</small>
        </span>
      </label>
      <label className="resource-select">
        {t("Printable material", "Material zum Ausdrucken")}
        <select value={r.printable} onChange={(e) => set({ printable: e.target.value as typeof r.printable })}>
          <option value="worksheet">{t("Comparing fractions worksheet (AI suggestion)", "Arbeitsblatt Brüche vergleichen (KI-Vorschlag)")}</option>
          <option value="game">{t("Replace with: fraction strips game", "Ersetzen durch: Bruchstreifen-Spiel")}</option>
          <option value="none">{t("No printable", "Kein Ausdruck")}</option>
        </select>
      </label>
    </div>
  );
}

// ---------------------------------------------------------------------------
// C32 – Messages: answer questions, resolve error reports, send notes
// ---------------------------------------------------------------------------
export function MessagesPage({ onReview, onNote, ...common }: Common & { onReview: () => void; onNote: (name: string) => void }) {
  const t = makeT(common.language);
  const s = useClassState();
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const list = s.threads.filter((x) => filter === "all" || x.status === "open");
  const selected = s.threads.find((x) => x.id === selectedId) ?? list[0] ?? null;
  const suggestions =
    selected?.kind === "parent"
      ? [
          t(
            "Thank you for your message. Khadija is doing the fraction practice; 10 minutes with drawings at home will help.",
            "Danke für Ihre Nachricht. Khadija macht die Bruchübung; 10 Minuten mit Zeichnungen zu Hause helfen.",
          ),
          t("Happy to talk – would Tuesday after school suit you?", "Gerne im Gespräch – passt Ihnen Dienstag nach der Schule?"),
        ]
      : selected?.kind === "report"
      ? [
          t("I checked it again and your mark is correct.", "Ich habe es noch einmal geprüft, deine Punkte stimmen."),
          t("Thank you! I corrected it.", "Danke! Ich habe es korrigiert."),
        ]
      : [
          t(
            "Make the bottom numbers the same first: 2/3 = 10/15 and 3/5 = 9/15. Which is bigger now?",
            "Mache zuerst die unteren Zahlen gleich: 2/3 = 10/15 und 3/5 = 9/15. Was ist jetzt größer?",
          ),
          t("Good question! Let’s look at it together in class tomorrow.", "Gute Frage! Wir schauen es uns morgen im Unterricht zusammen an."),
        ];
  const send = (resolve: boolean) => {
    if (!selected) return;
    const text = reply.trim();
    if (text) addThreadMessage(selected.id, { from: "teacher", text, at: Date.now() }, resolve ? "resolved" : "answered");
    else updateClassState((st) => ({ threads: st.threads.map((x) => (x.id === selected.id ? { ...x, status: "resolved" } : x)) }));
    if (selected.kind === "parent") {
      logActivity("parent", selected.student, { EN: "Teacher replied to the parent", DE: "Lehrerin hat den Eltern geantwortet" }, "teacher");
      common.addNotification(
        "parent",
        { EN: "Ms. Ashraf replied", DE: "Frau Ashraf hat geantwortet" },
        { EN: text, DE: text },
        { EN: "Read reply", DE: "Antwort lesen" },
        "messages",
      );
      common.notify(t("Reply sent.", "Antwort gesendet."));
      setReply("");
      return;
    }
    logActivity(selected.kind === "report" ? "report" : "question", selected.student, {
      EN: resolve ? "Teacher resolved the report" : "Teacher replied",
      DE: resolve ? "Meldung von der Lehrerin erledigt" : "Lehrerin hat geantwortet",
    }, "teacher");
    if (selected.student === "Khadija")
      common.addNotification(
        "student",
        resolve
          ? { EN: "Ms. Ashraf checked your report", DE: "Frau Ashraf hat deine Meldung geprüft" }
          : { EN: "Ms. Ashraf answered your question", DE: "Frau Ashraf hat deine Frage beantwortet" },
        { EN: text || "Your report was checked.", DE: text || "Deine Meldung wurde geprüft." },
        { EN: "Read answer", DE: "Antwort lesen" },
        "messages",
      );
    common.notify(t("Reply sent.", "Antwort gesendet."));
    setReply("");
  };
  return (
    <section>
      <div className="teacher-heading">
        <div>
          <p className="kicker">{t("STUDENT COMMUNICATION", "KOMMUNIKATION MIT KINDERN")}</p>
          <h1>{t("Messages", "Nachrichten")}</h1>
          <p>{t("Questions and error reports from students, and notes you sent.", "Fragen und Fehlermeldungen der Kinder sowie Ihre Notizen.")}</p>
        </div>
        <Button icon="message" onClick={() => onNote("Khadija")}>
          {t("New note", "Neue Notiz")}
        </Button>
      </div>
      <div className="messages-layout">
        <article className="panel thread-list">
          <div className="notification-tabs" role="tablist">
            <button role="tab" aria-selected={filter === "open"} className={filter === "open" ? "active" : ""} onClick={() => setFilter("open")}>
              {t("Open", "Offen")} <span>{s.threads.filter((x) => x.status === "open").length}</span>
            </button>
            <button role="tab" aria-selected={filter === "all"} className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
              {t("All", "Alle")} <span>{s.threads.length}</span>
            </button>
          </div>
          {list.length === 0 && <p className="empty-row">{t("No open messages.", "Keine offenen Nachrichten.")}</p>}
          {list.map((thread) => (
            <button
              key={thread.id}
              className={`thread-row ${selected?.id === thread.id ? "selected" : ""}`}
              onClick={() => setSelectedId(thread.id)}
            >
              <Icon name={thread.kind === "report" ? "flag" : thread.kind === "parent" ? "family" : "message"} size={18} />
              <span>
                <strong>
                  {thread.student} · {thread.title[common.language]}
                </strong>
                <small>{messageText(thread.messages[thread.messages.length - 1], common.language)}</small>
              </span>
              <Status type={thread.status === "open" ? "warn" : "good"}>
                {thread.status === "open" ? t("Open", "Offen") : thread.status === "answered" ? t("Answered", "Beantwortet") : t("Resolved", "Erledigt")}
              </Status>
            </button>
          ))}
        </article>
        <article className="panel thread-view">
          {!selected ? (
            <p>{t("Select a message.", "Wählen Sie eine Nachricht.")}</p>
          ) : (
            <>
              <p className="kicker">
                {selected.student}
                {selected.question ? ` · ${t("QUESTION", "AUFGABE")} ${selected.question}` : ""}
              </p>
              <h2>{selected.title[common.language]}</h2>
              <div className="chat">
                {selected.messages.map((m, i) => (
                  <p key={i} className={`bubble ${m.from}`} data-free-text>
                    <small>
                      {m.from === "teacher"
                        ? t("Ms. Ashraf", "Frau Ashraf")
                        : m.from === "parent"
                          ? t("Khadija’s parent", "Khadijas Elternteil")
                          : selected.student}{" "}
                      · {messageTime(m, common.language)}
                    </small>
                    {messageText(m, common.language)}
                  </p>
                ))}
              </div>
              {selected.kind === "report" && (
                <Button icon="review" variant="secondary" onClick={onReview}>
                  {t("Open the exam review", "Prüfung der Arbeit öffnen")}
                </Button>
              )}
              {selected.kind !== "note" && (
                <>
                  <div className="template-chips">
                    {suggestions.map((item) => (
                      <button key={item} type="button" onClick={() => setReply(item)}>
                        {item}
                      </button>
                    ))}
                  </div>
                  <label className="feedback-field">
                    {t("Your reply", "Ihre Antwort")}
                    <textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} />
                  </label>
                  <div className="decision-actions">
                    <Button icon="arrow" disabled={!reply.trim()} onClick={() => send(false)}>
                      {t("Send reply", "Antwort senden")}
                    </Button>
                    {selected.kind === "report" && (
                      <Button icon="check" variant="secondary" onClick={() => send(true)}>
                        {t("Reply and mark resolved", "Antworten und erledigen")}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </article>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// C34 – Teacher profile and settings
// ---------------------------------------------------------------------------
export function TeacherProfile({
  language,
  setLanguage,
  published,
  setShareParent,
  notify,
}: {
  language: Lang;
  setLanguage: (l: Lang) => void;
  published: boolean;
  setShareParent: (v: boolean) => void;
  notify: (m: string) => void;
}) {
  const t = makeT(language);
  const s = useClassState();
  const [digest, setDigest] = useState(true);
  return (
    <section>
      <div className="teacher-heading">
        <div>
          <p className="kicker">{t("PROFILE & SETTINGS", "PROFIL & EINSTELLUNGEN")}</p>
          <h1>Somaya Ashraf</h1>
          <p>{t("Grade 4 Mathematics teaching assistant", "Lehrassistenz Mathematik, Klasse 4")}</p>
        </div>
      </div>
      <div className="record-grid">
        <article className="panel profile-panel">
          <p className="kicker">{t("ACCOUNT", "KONTO")}</p>
          <dl>
            <div><dt>{t("Email", "E-Mail")}</dt><dd>somaya@stepwise.demo</dd></div>
            <div><dt>{t("School", "Schule")}</dt><dd>Mohamed Zahran Experimental Language School</dd></div>
            <div><dt>{t("Subject", "Fach")}</dt><dd>{t("Mathematics", "Mathematik")}</dd></div>
            <div><dt>{t("Classes", "Klassen")}</dt><dd>4A · 4B · 4C · 4D · 4E ({t("about 150 students", "etwa 150 Kinder")})</dd></div>
            <div><dt>{t("Demo class", "Demo-Klasse")}</dt><dd>{t("Grade 4B · 22 students", "Klasse 4B · 22 Kinder")}</dd></div>
          </dl>
        </article>
        <article className="panel profile-panel">
          <p className="kicker">{t("PREFERENCES", "EINSTELLUNGEN")}</p>
          <label className="resource-select">
            {t("Interface language", "Sprache der Oberfläche")}
            <select value={language} onChange={(e) => setLanguage(e.target.value as Lang)}>
              <option value="EN">English</option>
              <option value="DE">Deutsch</option>
            </select>
          </label>
          <label className="share-toggle">
            <input
              type="checkbox"
              checked={s.shareDefault}
              onChange={(e) => {
                updateClassState({ shareDefault: e.target.checked });
                if (!published) setShareParent(e.target.checked);
                notify(t("Parent visibility setting saved.", "Einstellung zur Elternsicht gespeichert."));
              }}
            />
            <span>
              <strong>{t("Share published results with parents by default", "Veröffentlichte Ergebnisse standardmäßig mit Eltern teilen")}</strong>
              <small>{t("You can still change it for each exam before publishing.", "Sie können es vor jeder Veröffentlichung noch ändern.")}</small>
            </span>
          </label>
          <label className="share-toggle">
            <input type="checkbox" checked={digest} onChange={(e) => setDigest(e.target.checked)} />
            <span>
              <strong>{t("Daily email summary of new submissions", "Tägliche E-Mail-Zusammenfassung neuer Abgaben")}</strong>
              <small>{t("Demo only – no email is sent.", "Nur Demo – es wird keine E-Mail gesendet.")}</small>
            </span>
          </label>
        </article>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// C11 + C12 + C14 + C21 – Whole-exam AI marks, criteria and mistake tags
// ---------------------------------------------------------------------------
const mistakeTypes: { id: string; label: Text }[] = [
  { id: "denominator", label: { EN: "Compares by the bottom number only", DE: "Vergleicht nur über die untere Zahl" } },
  { id: "parts", label: { EN: "Unequal or missing parts", DE: "Ungleiche oder fehlende Teile" } },
  { id: "working", label: { EN: "Answer without working", DE: "Ergebnis ohne Rechenweg" } },
  { id: "slip", label: { EN: "Calculation slip", DE: "Rechenfehler" } },
  { id: "misread", label: { EN: "Misread the question", DE: "Aufgabe falsch gelesen" } },
];
const aiTags: Record<number, string> = { 3: "parts", 5: "working", 7: "denominator" };

export function GradeBreakdown({
  language,
  q2Mark,
  q2Confirmed,
  answer,
}: {
  language: Lang;
  q2Mark: number;
  q2Confirmed: boolean;
  answer: string;
}) {
  const t = makeT(language);
  const s = useClassState();
  const marks = [2, q2Mark, 0, 3, 2, 3, 0, 4];
  const confidence = [96, 61, 89, 94, 74, 97, 91, 95];
  const rows = s.scheme
    .map((item, i) => ({ ...item, mark: marks[i], confidence: confidence[i] }))
    .sort((a, b) => a.confidence - b.confidence);
  return (
    <div className="grade-breakdown">
      <p className="kicker">{t("WHOLE EXAM · AI MARKS", "GANZE ARBEIT · KI-BEWERTUNG")}</p>
      <h3>{t("Least certain first", "Unsicherste zuerst")}</h3>
      <div className="breakdown-table" role="table">
        {rows.map((row) => {
          const level = row.confidence < 70 ? "warn" : row.confidence < 90 ? "neutral" : "good";
          return (
            <div className="breakdown-row" role="row" key={row.n}>
              <span>{t("Q", "A")}{row.n}</span>
              <b>
                {row.mark}/{row.marks}
              </b>
              <Status type={level}>
                {row.confidence}% ·{" "}
                {level === "warn"
                  ? t("Needs your decision", "Ihre Entscheidung nötig")
                  : level === "neutral"
                    ? t("Check", "Prüfen")
                    : t("High confidence", "Hohe Sicherheit")}
              </Status>
              <small>
                {row.n === 2
                  ? q2Confirmed
                    ? t("Confirmed by you", "Von Ihnen bestätigt")
                    : t("Waiting for you", "Wartet auf Sie")
                  : t("Included in the total", "In der Summe enthalten")}
              </small>
            </div>
          );
        })}
      </div>
      <p className="kicker">{t("WHY THE AI GAVE Q2 THIS MARK", "WARUM DIE KI A2 SO BEWERTET")}</p>
      <ul className="criteria-list">
        <li>
          <Icon name="check" size={16} /> {t("Method: 132 × 4 set out correctly – 1 mark", "Rechenweg: 132 × 4 richtig angesetzt – 1 Punkt")}
        </li>
        <li>
          <Icon name={answer.trim() === "528" ? "check" : "close"} size={16} />{" "}
          {answer.trim() === "528"
            ? t("Answer 528 matches the model answer – 2 marks", "Ergebnis 528 entspricht der Musterlösung – 2 Punkte")
            : t(
                `Answer ${answer} does not match the model answer 528 – 0 marks`,
                `Ergebnis ${answer} entspricht nicht der Musterlösung 528 – 0 Punkte`,
              )}
        </li>
        <li>
          <Icon name="idea" size={16} /> {t("Scheme rule: 1 for method, 2 for answer (method mark needs a correct answer)", "Regel: 1 für den Rechenweg, 2 für das Ergebnis (Rechenwegpunkt nur mit richtigem Ergebnis)")}
        </li>
      </ul>
      <p className="kicker">{t("MISTAKE TAGS", "FEHLERKATEGORIEN")}</p>
      {[3, 5, 7].map((n) => {
        const current = s.mistakeTags[n] ?? aiTags[n];
        return (
          <label className="tag-row" key={n}>
            <span>
              {t("Q", "A")}
              {n}
            </span>
            <select
              value={current}
              onChange={(e) => {
                const value = e.target.value;
                updateClassState((st) => ({ mistakeTags: { ...st.mistakeTags, [n]: value } }));
                const label = mistakeTypes.find((m) => m.id === value)?.label;
                logActivity("mark", "Khadija", {
                  EN: `Quiz 4 · Q${n}: mistake tagged “${label?.EN}”`,
                  DE: `Quiz 4 · A${n}: Fehler markiert als „${label?.DE}“`,
                });
              }}
            >
              {mistakeTypes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label[language]}
                </option>
              ))}
            </select>
            <Status type={current === aiTags[n] ? "neutral" : "good"}>
              {current === aiTags[n] ? t("AI suggestion", "KI-Vorschlag") : t("Edited by you", "Von Ihnen geändert")}
            </Status>
          </label>
        );
      })}
    </div>
  );
}
