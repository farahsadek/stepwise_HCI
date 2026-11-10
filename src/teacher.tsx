import { Fragment, useEffect, useMemo, useState } from "react";
import { LineChart, conceptColors, conceptShape } from "./charts";
import { requestReadAloud } from "./accessibility";
import { logActivity } from "./activity";
import { HelpTip, useEscape } from "./heuristics";
import { analyzePage, type PageQuality } from "./student-media";
import { Button, Icon, Status } from "./ui";
import {
  addThreadMessage,
  flaggedReadings,
  newId,
  ocrSuggestions,
  otherClasses,
  questionTitlesDe,
  questions,
  q5MarkOf,
  q7MarkOf,
  quiz4Percent,
  roster,
  updateClassState,
  useClassState,
  type AssessmentQuestion,
  type ClassId,
  type ClassSummary,
  type FlaggedReading,
  type GapOutcome,
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
  useEscape(true, onClose);
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
        <button className="modal-close" onClick={onClose} aria-label={t("Close", "Schließen")} title={t("Close", "Schließen")}>
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
          <Button icon="speaker" variant="ghost" className="modal-read" onClick={requestReadAloud}>
            {t("Read aloud", "Vorlesen")}
          </Button>
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
// C8 + C10 – OCR confidence alerts and correction shortcuts
// ---------------------------------------------------------------------------
export type ReadingState = { verified: boolean; saved: string };

/** Class-wide list of uncertain readings, least certain first. */
export function OcrQueue({
  language,
  currentId,
  stateOf,
  onOpen,
}: {
  language: Lang;
  currentId: string;
  stateOf: (item: FlaggedReading) => ReadingState;
  onOpen: (item: FlaggedReading) => void;
}) {
  const t = makeT(language);
  const left = flaggedReadings.filter((item) => !stateOf(item).verified).length;
  return (
    <section className="panel ocr-queue" aria-label={t("Readings to check", "Zu prüfende Lesungen")}>
      <div className="ocr-queue-head">
        <p className="kicker">
          {t("TEXT CHECKS · LEAST CERTAIN FIRST", "TEXTPRÜFUNG · UNSICHERSTE ZUERST")}{" "}
          <HelpTip language={language} topic={t("OCR confidence", "OCR-Sicherheit")}>
            {t(
              "How sure the AI is that it read the handwriting correctly. Readings below 80% are listed here, least certain first, so you can check them before grading.",
              "Wie sicher die KI ist, dass sie die Handschrift richtig gelesen hat. Lesungen unter 80 % stehen hier, die unsichersten zuerst, damit Sie sie vor der Bewertung prüfen.",
            )}
          </HelpTip>
        </p>
        <h2>
          {left === 0
            ? t("All uncertain readings are checked", "Alle unsicheren Lesungen sind geprüft")
            : t(
                `${left} of ${flaggedReadings.length} uncertain readings still to check`,
                `${left} von ${flaggedReadings.length} unsicheren Lesungen noch zu prüfen`,
              )}
        </h2>
      </div>
      <ol className="ocr-queue-list">
        {flaggedReadings.map((item) => {
          const st = stateOf(item);
          return (
            <li key={item.id}>
              <button
                type="button"
                className={`${item.id === currentId ? "active" : ""} ${st.verified ? "done" : ""}`}
                aria-current={item.id === currentId ? "step" : undefined}
                onClick={() => onOpen(item)}
              >
                <span className={`ocr-confidence ${item.confidence < 70 ? "low" : "mid"}`}>{item.confidence}%</span>
                <span className="ocr-queue-who">
                  <strong>
                    {item.student} · {t("Q", "A")}
                    {item.q}
                  </strong>
                  <small>
                    {t("AI read", "KI las")} “{item.read}”
                  </small>
                </span>
                <Status type={st.verified ? "good" : "warn"}>
                  {st.verified ? t(`Checked: ${st.saved}`, `Geprüft: ${st.saved}`) : t("To check", "Zu prüfen")}
                </Status>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** One student's readings (uncertain ones highlighted, least certain first) and the correction tool. */
export function OcrCheck({
  language,
  examLanguage,
  student,
  current,
  value,
  setValue,
  stateOf,
  onSelect,
  onVerify,
}: {
  language: Lang;
  examLanguage: Lang;
  student: string;
  current: FlaggedReading;
  value: string;
  setValue: (value: string) => void;
  stateOf: (item: FlaggedReading) => ReadingState;
  onSelect: (item: FlaggedReading) => void;
  onVerify: (goNext: boolean) => void;
}) {
  const t = makeT(language);
  const qp = examLanguage === "DE" ? "A" : "Q";
  const mine = flaggedReadings.filter((item) => item.student === student);
  const index = mine.findIndex((item) => item.id === current.id);
  const suggestions = ocrSuggestions(current);
  const best = suggestions[0];
  const st = stateOf(current);
  // Characters that differ between the AI reading and the best suggestion are highlighted.
  const changed =
    best && best.value.length === current.read.length
      ? [...current.read].map((c, i) => c !== best.value[i])
      : [...current.read].map(() => false);
  const rows = [
    { id: "q1", q: 1, task: "24 × 6", read: "144", confidence: 96 },
    {
      id: "q3",
      q: 3,
      task: examLanguage === "DE" ? "Färbe 3/4" : "Shade 3/4",
      read: examLanguage === "DE" ? "2/4 gefärbt" : "2/4 shaded",
      confidence: 89,
    },
    ...mine.map((item) => ({
      id: item.id,
      q: item.q,
      task: item.task[examLanguage],
      read: stateOf(item).verified ? stateOf(item).saved : item.read,
      confidence: item.confidence,
    })),
  ].sort((a, b) => a.confidence - b.confidence);
  const move = (step: number) => {
    const next = mine[index + step];
    if (next) onSelect(next);
  };

  // Shortcuts: Alt+↓/↑ move between flagged readings, Alt+1–3 pick a suggestion.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!event.altKey) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        move(event.key === "ArrowDown" ? 1 : -1);
      } else if (/^[1-3]$/.test(event.key) && suggestions[Number(event.key) - 1]) {
        event.preventDefault();
        setValue(suggestions[Number(event.key) - 1].value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <>
      <div className="extracted-list">
        {rows.map((row) => {
          const flagged = flaggedReadings.find((item) => item.id === row.id);
          const level = row.confidence < 70 ? "warn" : row.confidence < 90 ? "neutral" : "good";
          const verified = flagged ? stateOf(flagged).verified : false;
          const content = (
            <>
              <span>
                {qp}
                {row.q} · {row.task}
              </span>
              <strong>{row.read}</strong>
              <Status type={verified ? "good" : level}>
                {verified
                  ? t("Checked by you", "Von Ihnen geprüft")
                  : flagged
                    ? t(`${row.confidence}% · Check answer`, `${row.confidence} % · Antwort prüfen`)
                    : t(`${row.confidence}% confidence`, `${row.confidence} % Sicherheit`)}
              </Status>
            </>
          );
          return flagged ? (
            <button
              type="button"
              key={row.id}
              className={`low-confidence ${row.id === current.id ? "is-current" : ""}`}
              onClick={() => onSelect(flagged)}
              aria-current={row.id === current.id ? "true" : undefined}
            >
              {content}
            </button>
          ) : (
            <div key={row.id}>{content}</div>
          );
        })}
      </div>
      <div className="ocr-fix">
        <p className="ocr-flag-count">
          {t(
            `Flagged reading ${index + 1} of ${mine.length} for ${student}`,
            `Markierte Lesung ${index + 1} von ${mine.length} für ${student}`,
          )}
        </p>
        <p className="ocr-read-as">
          {t("AI read", "KI las")}{" "}
          <span className="ocr-chars">
            {[...current.read].map((c, i) => (
              <mark key={i} className={changed[i] ? "unsure" : ""}>
                {c}
              </mark>
            ))}
          </span>{" "}
          <small>
            {current.kind === "unclear"
              ? t("The answer could not be read. Compare with the scan.", "Die Antwort war nicht lesbar. Mit dem Scan vergleichen.")
              : best && changed.some(Boolean)
                ? t(
                    `The highlighted character is often confused in handwriting (${best.reason.EN}).`,
                    `Das markierte Zeichen wird in Handschrift oft verwechselt (${best.reason.DE}).`,
                  )
                : t("Compare with the scan.", "Mit dem Scan vergleichen.")}
          </small>
        </p>
        <label>
          {t(
            `Correct ${qp}${current.q} · ${current.task[examLanguage]}`,
            `${qp}${current.q} · ${current.task[examLanguage]} korrigieren`,
          )}
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onVerify(true);
            }}
          />
        </label>
        <div className="template-chips" aria-label={t("Suggestions", "Vorschläge")}>
          {suggestions.map((option, i) => (
            <button
              type="button"
              key={option.value}
              className={value === option.value ? "selected" : ""}
              onClick={() => setValue(option.value)}
            >
              {option.value}
              <small>
                {option.matchesModel
                  ? t("Suggested correction · matches model answer", "Vorgeschlagene Korrektur · wie Musterlösung")
                  : option.reason[language]}
                {" · "}Alt+{i + 1}
              </small>
            </button>
          ))}
          {current.read !== "?" && (
            <button
              type="button"
              className={value === current.read ? "selected" : ""}
              onClick={() => setValue(current.read)}
            >
              {current.read}
              <small>{t("As read by AI", "Wie von der KI gelesen")}</small>
            </button>
          )}
        </div>
        <p className="ocr-tip">
          <Icon name="idea" size={16} />
          {t(
            "A suggestion that matches the model answer is not proof. Check the scan before you verify.",
            "Ein Vorschlag wie die Musterlösung ist kein Beweis. Prüfen Sie den Scan, bevor Sie bestätigen.",
          )}
        </p>
        <p className="ocr-shortcuts">
          <span>
            <kbd>Enter</kbd> {t("verify and next", "prüfen und weiter")}
          </span>
          <span>
            <kbd>Alt</kbd>+<kbd>↓</kbd>/<kbd>↑</kbd> {t("next / previous flagged", "nächste / vorige Markierung")}
          </span>
          <span>
            <kbd>Alt</kbd>+<kbd>1</kbd>–<kbd>3</kbd> {t("pick a suggestion", "Vorschlag wählen")}
          </span>
        </p>
      </div>
      {st.verified && (
        <div className="confirmed-box">
          <Icon name="check" />
          <div>
            <strong>{t("OCR verified", "OCR geprüft")}</strong>
            <p>
              {t(`The flagged answer is saved as ${st.saved}.`, `Die markierte Antwort wurde als ${st.saved} gespeichert.`)}
            </p>
          </div>
        </div>
      )}
      <div className="decision-actions">
        {index > 0 && (
          <Button icon="arrow" variant="ghost" className="ocr-prev" onClick={() => move(-1)}>
            {t("Previous flagged", "Vorige Markierung")}
          </Button>
        )}
        <Button icon="check" disabled={!value.trim()} onClick={() => onVerify(false)}>
          {t("Verify OCR", "OCR prüfen")}
        </Button>
        <Button icon="arrow" variant="secondary" disabled={!value.trim()} onClick={() => onVerify(true)}>
          {t("Next flagged", "Nächste Markierung")}
        </Button>
      </div>
      {index === mine.length - 1 && (
        <p className="ocr-last-note">
          {t(
            "This is the last flagged reading on this paper. Next is the marks step.",
            "Das ist die letzte markierte Lesung dieser Arbeit. Danach kommt die Bewertung.",
          )}
        </p>
      )}
    </>
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
          <LineChart
            language={common.language}
            fontSize={13}
            title={t(`${student.name}’s quiz results, Quiz 1 to Quiz 4`, `Quizergebnisse von ${student.name}, Quiz 1 bis Quiz 4`)}
            xLabels={["Quiz 1", "Quiz 2", "Quiz 3", "Quiz 4"]}
            pendingNote={t("not confirmed", "nicht bestätigt")}
            series={[
              {
                name: student.name,
                values: [...student.quizzes.slice(0, 3), q4],
                color: conceptColors[0],
                shape: conceptShape(0),
              },
            ]}
          />
          <p className="record-note">
            {history[history.length - 1] > history[0]
              ? t(
                  `Up ${history[history.length - 1] - history[0]} points since Quiz 1.`,
                  `${history[history.length - 1] - history[0]} Punkte mehr seit Quiz 1.`,
                )
              : t("No rise since Quiz 1.", "Kein Anstieg seit Quiz 1.")}{" "}
            {q4 === null && t("Quiz 4 not confirmed yet.", "Quiz 4 noch nicht bestätigt.")}
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
              ? t(`Done · pop quiz ${quizScore}/3`, `Erledigt · Kurz-Quiz ${quizScore}/3`)
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
          {s.gapOutcome[student.name] && (
            <Status type={s.gapOutcome[student.name] === "resolved" ? "good" : "neutral"}>
              {s.gapOutcome[student.name] === "resolved"
                ? t("Gap resolved after the pop quiz", "Lücke nach dem Kurz-Quiz behoben")
                : s.gapOutcome[student.name] === "again"
                  ? t("Another practice round assigned", "Weitere Übungsrunde zugewiesen")
                  : t("In the small-group session", "In der Kleingruppe")}
            </Status>
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
  const [form, setForm] = useState<null | {
    title: string;
    subject: string;
    language: Lang;
    marks: number;
    date: string;
    questions: AssessmentQuestion[];
  }>(null);
  const [formError, setFormError] = useState("");
  const [openQuestions, setOpenQuestions] = useState<number | null>(null);
  const blankQuestion = (): AssessmentQuestion => ({ text: "", model: "", marks: 2, rule: "" });
  const quiz4Questions = (): AssessmentQuestion[] =>
    s.scheme.map((item, i) => ({
      text: language === "DE" ? questionTitlesDe[i] : questions[i].title,
      model: item.model,
      marks: item.marks,
      rule: item.rule[language],
    }));
  const questionsOf = (item: (typeof s.assessments)[number]) =>
    item.questions ?? (item.id === 4 ? quiz4Questions() : undefined);
  const [modelFile, setModelFile] = useState<string | null>(null);
  const [useRules, setUseRules] = useState<number[] | null>(null);
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
            setForm({ title: "", subject: "math", language: "EN", marks: 25, date: "", questions: [blankQuestion()] });
            setFormError("");
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
          </div>
          <BulkUpload {...common} />
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
                    {s.uploadedScans.includes(student.name) && student.name !== "Judy" && (
                      <small className="uses-rules">{t("Extra page uploaded by you", "Zusätzliche Seite von Ihnen hochgeladen")}</small>
                    )}
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
          {s.savedRules.map((rule) => {
            const usedIn = s.assessments.filter((a) => a.rules?.includes(rule.id));
            return (
              <p className="saved-rule" key={rule.id}>
                <Icon name="check" size={16} /> <b>{rule.scope[language]}:</b> {rule.text[language]}
                {usedIn.length > 0 && (
                  <small>
                    {" "}
                    · {t("Reused in", "Wiederverwendet in")} {usedIn.map((a) => a.title[language]).join(", ")}
                  </small>
                )}
              </p>
            );
          })}
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
                const complete = form.questions.filter((q) => q.text.trim() && q.model.trim() && q.marks > 0);
                if (complete.length === 0) {
                  setFormError(
                    t(
                      "Add at least one question with a model answer and marks.",
                      "Fügen Sie mindestens eine Aufgabe mit Musterlösung und Punkten hinzu.",
                    ),
                  );
                  return;
                }
                if (complete.length < form.questions.length) {
                  setFormError(
                    t(
                      "Some questions are missing a question, model answer or marks. Complete or remove them.",
                      "Bei einigen Aufgaben fehlen Aufgabe, Musterlösung oder Punkte. Ergänzen oder entfernen Sie sie.",
                    ),
                  );
                  return;
                }
                setFormError("");
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
                      marks: complete.reduce((sum, q) => sum + q.marks, 0),
                      status: "draft",
                      questions: complete,
                      rules: useRules ?? st.savedRules.map((r) => r.id),
                    },
                  ],
                }));
                common.notify(t("Assessment saved as a draft.", "Prüfung als Entwurf gespeichert."));
                setForm(null);
                setModelFile(null);
                setUseRules(null);
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
              <div className="form-field">
                <span>{t("Total marks", "Gesamtpunkte")}</span>
                <output className="marks-total">
                  {form.questions.reduce((sum, q) => sum + (q.marks || 0), 0)}{" "}
                  <small>
                    {t(
                      `from ${form.questions.length} ${form.questions.length === 1 ? "question" : "questions"}`,
                      `aus ${form.questions.length} ${form.questions.length === 1 ? "Aufgabe" : "Aufgaben"}`,
                    )}
                  </small>
                </output>
              </div>
              <label>
                {t("Date", "Datum")}
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </label>
              <div className="form-field">
                <span>{t("Model answers (photo or PDF)", "Musterlösungen (Foto oder PDF)")}</span>
                <label className="button secondary file-choice model-file">
                  <Icon name="book" />
                  <span>{modelFile ?? t("Choose a file", "Datei wählen")}</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setModelFile(e.target.files?.[0]?.name ?? null)}
                  />
                </label>
              </div>
              <fieldset className="question-editor">
                <legend>{t("Questions and model answers", "Aufgaben und Musterlösungen")}</legend>
                <div className="question-head" aria-hidden="true">
                  <span>#</span>
                  <span>{t("Question", "Aufgabe")}</span>
                  <span>{t("Model answer", "Musterlösung")}</span>
                  <span>{t("Marks", "Punkte")}</span>
                  <span>{t("Partial-mark rule (optional)", "Teilpunkt-Regel (optional)")}</span>
                  <span />
                </div>
                {form.questions.map((q, i) => {
                  const update = (patch: Partial<AssessmentQuestion>) =>
                    setForm({ ...form, questions: form.questions.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
                  return (
                    <div className="question-row" key={i}>
                      <span className="question-n">
                        {t("Q", "A")}
                        {i + 1}
                      </span>
                      <input
                        aria-label={t(`Question ${i + 1}`, `Aufgabe ${i + 1}`)}
                        placeholder={t("e.g. 3 m = ? cm", "z. B. 3 m = ? cm")}
                        value={q.text}
                        onChange={(e) => update({ text: e.target.value })}
                      />
                      <input
                        aria-label={t(`Model answer for question ${i + 1}`, `Musterlösung für Aufgabe ${i + 1}`)}
                        placeholder={t("e.g. 300 cm", "z. B. 300 cm")}
                        value={q.model}
                        onChange={(e) => update({ model: e.target.value })}
                      />
                      <input
                        type="number"
                        min={1}
                        max={20}
                        aria-label={t(`Marks for question ${i + 1}`, `Punkte für Aufgabe ${i + 1}`)}
                        value={q.marks}
                        onChange={(e) => update({ marks: Math.max(0, Number(e.target.value) || 0) })}
                      />
                      <input
                        aria-label={t(`Partial-mark rule for question ${i + 1}`, `Teilpunkt-Regel für Aufgabe ${i + 1}`)}
                        placeholder={t("e.g. 1 for method, 1 for answer", "z. B. 1 für Rechenweg, 1 für Ergebnis")}
                        value={q.rule}
                        onChange={(e) => update({ rule: e.target.value })}
                      />
                      <button
                        type="button"
                        className="icon-button"
                        disabled={form.questions.length === 1}
                        aria-label={t(`Remove question ${i + 1}`, `Aufgabe ${i + 1} entfernen`)}
                        onClick={() => setForm({ ...form, questions: form.questions.filter((_, j) => j !== i) })}
                      >
                        <Icon name="close" size={16} />
                      </button>
                    </div>
                  );
                })}
                <div className="question-actions">
                  <Button icon="edit" variant="secondary" onClick={() => setForm({ ...form, questions: [...form.questions, blankQuestion()] })}>
                    {t("Add question", "Aufgabe hinzufügen")}
                  </Button>
                  <Button icon="book" variant="ghost" onClick={() => setForm({ ...form, questions: quiz4Questions() })}>
                    {t("Start from Quiz 4's questions", "Mit den Aufgaben aus Quiz 4 beginnen")}
                  </Button>
                </div>
              </fieldset>
              {formError && (
                <p className="form-error" role="alert">
                  <Icon name="warning" size={16} /> {formError}
                </p>
              )}
              <fieldset className="rule-picker">
                <legend>{t("Reuse saved grading rules", "Gespeicherte Bewertungsregeln wiederverwenden")}</legend>
                {s.savedRules.map((rule) => {
                  const chosen = useRules ?? s.savedRules.map((r) => r.id);
                  return (
                    <label key={rule.id} className="share-toggle">
                      <input
                        type="checkbox"
                        checked={chosen.includes(rule.id)}
                        onChange={(e) =>
                          setUseRules(e.target.checked ? [...chosen, rule.id] : chosen.filter((id) => id !== rule.id))
                        }
                      />
                      <span>
                        <strong>{rule.text[language]}</strong>
                        <small>
                          {t("Saved from", "Gespeichert aus")}: {rule.scope[language]}
                        </small>
                      </span>
                    </label>
                  );
                })}
              </fieldset>
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
              <Fragment key={item.id}>
              <div className="roster-row assessment-row" role="row">
                <strong>{item.title[language]}</strong>
                <span>
                  {item.subject[language]} · {item.date[language]}
                </span>
                <span>
                  {questionsOf(item) ? (
                    <button
                      type="button"
                      className="link-button questions-toggle"
                      aria-expanded={openQuestions === item.id}
                      onClick={() => setOpenQuestions(openQuestions === item.id ? null : item.id)}
                    >
                      {t(`${questionsOf(item)!.length} questions`, `${questionsOf(item)!.length} Aufgaben`)}
                    </button>
                  ) : null}{" "}
                  {item.marks} {t("marks", "Punkte")} · {item.language === "DE" ? "Deutsch" : t("English", "Englisch")}
                  {item.rules && item.rules.length > 0 && (
                    <small className="uses-rules">
                      {t(
                        `Uses ${item.rules.length} saved ${item.rules.length === 1 ? "rule" : "rules"}`,
                        `Nutzt ${item.rules.length} gespeicherte ${item.rules.length === 1 ? "Regel" : "Regeln"}`,
                      )}
                    </small>
                  )}
                </span>
                <Status type={item.status === "published" ? "good" : item.status === "review" ? "warn" : "neutral"}>
                  {item.status === "published"
                    ? t("Published", "Veröffentlicht")
                    : item.status === "review"
                      ? t("In review", "In Prüfung")
                      : t("Draft", "Entwurf")}
                </Status>
              </div>
                {openQuestions === item.id && questionsOf(item) && (
                  <ol className="assessment-questions">
                    {questionsOf(item)!.map((q, i) => (
                      <li key={i}>
                        <strong>{q.text}</strong>
                        <span>
                          {t("Model answer", "Musterlösung")}: {q.model}
                        </span>
                        <span>
                          {q.marks} {t("marks", "Punkte")}
                          {q.rule ? ` · ${q.rule}` : ""}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </Fragment>
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
export function QuestionReview({
  initialQuestion = 5,
  onOpenReview,
  ...common
}: Common & { initialQuestion?: 5 | 7; onOpenReview: (name: string) => void }) {
  const t = makeT(common.language);
  const s = useClassState();
  const [question, setQuestion] = useState<5 | 7>(initialQuestion);
  const [saveRule, setSaveRule] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [lastBulk, setLastBulk] = useState<{ ruleId: number | null; names: string[] } | null>(null);
  const qp = t("Q", "A");
  const markOf = (student: RosterStudent) => (question === 5 ? q5MarkOf(student, s) : q7MarkOf(student, s));
  const groups =
    question === 5
      ? [
          { id: "working", answer: t("4 each, with 20 ÷ 5 = 4", "je 4, mit 20 ÷ 5 = 4"), out: 4 },
          { id: "noWorking", answer: t("4 each, no working", "je 4, ohne Rechenweg"), out: 4 },
          { id: "wrong", answer: t("5 each", "je 5"), out: 4 },
        ].map((g) => ({ ...g, students: roster.filter((r) => r.q5.group === g.id) }))
      : [
          {
            id: "right",
            answer: "2/3 > 3/5",
            out: 3,
            students: roster.filter((r) => r.focus !== "compare" && r.q5.group !== "missing"),
          },
          { id: "wrong", answer: "2/3 < 3/5", out: 3, students: roster.filter((r) => r.focus === "compare") },
        ];
  // Answers the suggested rule would still change (teacher edits are left alone).
  const affected = roster.filter(
    (r) => r.q5.group === "noWorking" && s.markEdits[`${r.name}:5`] === undefined && r.q5.mark < 2,
  );
  const setMark = (student: RosterStudent, mark: number, out: number) => {
    const before = markOf(student);
    setEditing(null);
    if (mark === before) return;
    updateClassState((st) => ({ markEdits: { ...st.markEdits, [`${student.name}:${question}`]: mark } }));
    logActivity("override", student.name, {
      EN: `Quiz 4 · Q${question}: mark changed ${before}/${out} → ${mark}/${out} (review by question)`,
      DE: `Quiz 4 · A${question}: Bewertung geändert ${before}/${out} → ${mark}/${out} (Prüfung nach Aufgabe)`,
    });
    common.notify(
      t(
        `${student.name}’s ${qp}${question} mark changed to ${mark}/${out}.`,
        `${student.name}: ${qp}${question} auf ${mark}/${out} geändert.`,
      ),
    );
  };
  return (
    <section>
      <div className="teacher-heading">
        <div>
          <p className="kicker">{t("GRADING CONSISTENCY · QUIZ 4", "EINHEITLICHE BEWERTUNG · QUIZ 4")}</p>
          <h1>{t("Review by question", "Nach Aufgabe prüfen")}</h1>
          <p>
            {t(
              "Compare how the same answer was marked for every student. Click a mark to change it.",
              "Vergleichen Sie, wie dieselbe Antwort bei allen Kindern bewertet wurde. Klicken Sie auf eine Bewertung, um sie zu ändern.",
            )}
          </p>
        </div>
        <label className="class-picker">
          {t("Question", "Aufgabe")}
          <select
            value={question}
            onChange={(e) => {
              setQuestion(Number(e.target.value) as 5 | 7);
              setEditing(null);
            }}
          >
            <option value={5}>{t("Q5 · Share 20 apples (4 marks)", "A5 · Teile 20 Äpfel (4 Punkte)")}</option>
            <option value={7}>{t("Q7 · Compare 2/3 and 3/5 (3 marks)", "A7 · Vergleiche 2/3 und 3/5 (3 Punkte)")}</option>
          </select>
        </label>
      </div>
      <div className="group-list">
        {groups.map((group) => {
          const marks = group.students.map(markOf);
          const distinct = [...new Set(marks)];
          const inconsistent = distinct.length > 1;
          // The most common mark in the group is the reference; others are highlighted.
          const usual = distinct.sort((a, b) => marks.filter((m) => m === b).length - marks.filter((m) => m === a).length)[0];
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
                {group.students.map((student) => {
                  const mark = markOf(student);
                  const edited = s.markEdits[`${student.name}:${question}`] !== undefined;
                  const odd = inconsistent && mark !== usual;
                  if (editing === student.name)
                    return (
                      <label className="mark-edit" key={student.name}>
                        {student.name}
                        <select
                          autoFocus
                          aria-label={t(`New mark for ${student.name}`, `Neue Bewertung für ${student.name}`)}
                          value={mark}
                          onChange={(e) => setMark(student, Number(e.target.value), group.out)}
                          onBlur={() => setEditing(null)}
                          onKeyDown={(e) => e.key === "Escape" && setEditing(null)}
                        >
                          {Array.from({ length: group.out + 1 }, (_, i) => (
                            <option key={i} value={group.out - i}>
                              {group.out - i}/{group.out}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  return (
                    <button
                      type="button"
                      key={student.name}
                      className={`mark-chip ${odd ? "odd" : ""} ${edited ? "edited" : ""}`}
                      title={
                        student.name === "Khadija"
                          ? t("Khadija’s marks are set in her review", "Khadijas Bewertung wird in ihrer Prüfung festgelegt")
                          : t("Change this mark", "Bewertung ändern")
                      }
                      onClick={() => (student.name === "Khadija" ? onOpenReview("Khadija") : setEditing(student.name))}
                    >
                      {student.name}{" "}
                      <b>
                        {mark}/{group.out}
                      </b>
                      {student.name === "Khadija" ? (
                        <Icon name="lock" size={13} />
                      ) : edited ? (
                        <small>{t("edited", "geändert")}</small>
                      ) : null}
                    </button>
                  );
                })}
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
                <p>
                  {t(
                    "All “4 each, no working” answers now have 2 of 4 marks, unless you changed a mark yourself.",
                    "Alle Antworten „je 4, ohne Rechenweg“ haben jetzt 2 von 4 Punkten, außer Sie haben eine Bewertung selbst geändert.",
                  )}
                </p>
                <Button
                  icon="close"
                  variant="ghost"
                  onClick={() => {
                    const undo = lastBulk;
                    updateClassState((st) => ({
                      q5RuleApplied: false,
                      savedRules: undo?.ruleId ? st.savedRules.filter((r) => r.id !== undo.ruleId) : st.savedRules,
                    }));
                    (undo?.names ?? []).forEach((name) =>
                      logActivity("override", name, {
                        EN: "Quiz 4 · Q5: bulk correction undone",
                        DE: "Quiz 4 · A5: Sammelkorrektur rückgängig gemacht",
                      }),
                    );
                    setLastBulk(null);
                    common.notify(t("Bulk correction undone.", "Sammelkorrektur rückgängig gemacht."));
                  }}
                >
                  {t("Undo correction", "Korrektur rückgängig machen")}
                </Button>
              </div>
            </div>
          ) : affected.length === 0 ? (
            <p>{t("No answers need this correction any more.", "Keine Antwort braucht diese Korrektur mehr.")}</p>
          ) : (
            <>
              <p>
                {affected.length === 1
                  ? t(
                      "The AI found 1 similar answer marked lower. Preview – this mark will change:",
                      "Die KI hat 1 ähnliche, niedriger bewertete Antwort gefunden. Vorschau – diese Bewertung ändert sich:",
                    )
                  : t(
                      `The AI found ${affected.length} similar answers marked lower. Preview – these marks will change:`,
                      `Die KI hat ${affected.length} ähnliche, niedriger bewertete Antworten gefunden. Vorschau – diese Bewertungen ändern sich:`,
                    )}
              </p>
              <div className="group-students">
                {affected.map((r) => {
                  const now = quiz4Percent(r, s) ?? 0;
                  return (
                    <span key={r.name}>
                      {r.name} <b>{q5MarkOf(r, s)}/4 → 2/4</b> ({now}% → {now + (2 - q5MarkOf(r, s)) * 4}%)
                    </span>
                  );
                })}
              </div>
              <label className="share-toggle">
                <input type="checkbox" checked={saveRule} onChange={(e) => setSaveRule(e.target.checked)} />
                <span>
                  <strong>{t("Save this rule for future assessments", "Regel für künftige Prüfungen speichern")}</strong>
                  <small>
                    {t(
                      "You can choose it when you create a new assessment.",
                      "Sie können sie beim Anlegen einer neuen Prüfung auswählen.",
                    )}
                  </small>
                </span>
              </label>
              <Button
                icon="check"
                onClick={() => {
                  const ruleId = saveRule ? newId() : null;
                  updateClassState((st) => ({
                    q5RuleApplied: true,
                    savedRules: ruleId
                      ? [
                          ...st.savedRules,
                          {
                            id: ruleId,
                            scope: { EN: "Word problems", DE: "Sachaufgaben" },
                            text: {
                              EN: "Correct answer without working = half marks",
                              DE: "Richtiges Ergebnis ohne Rechenweg = halbe Punktzahl",
                            },
                          },
                        ]
                      : st.savedRules,
                  }));
                  setLastBulk({ ruleId, names: affected.map((r) => r.name) });
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
                {affected.length === 1
                  ? t("Approve for 1 answer", "Für 1 Antwort freigeben")
                  : t(`Approve for ${affected.length} answers`, `Für ${affected.length} Antworten freigeben`)}
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
      <p className="breakdown-total">
        {(() => {
          const total = marks.reduce((sum, m) => sum + m, 0);
          const pct = Math.round((total / 25) * 100);
          return q2Confirmed
            ? t(`Total ${total}/25 (${pct}%) · confirmed by you`, `Summe ${total}/25 (${pct} %) · von Ihnen bestätigt`)
            : t(`AI draft total ${total}/25 (${pct}%) · not confirmed yet`, `KI-Entwurf gesamt ${total}/25 (${pct} %) · noch nicht bestätigt`);
        })()}
      </p>
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

// ---------------------------------------------------------------------------
// C1 + C26 – Classes: picker, class performance overview, class comparison
// ---------------------------------------------------------------------------
const classIds: ClassId[] = ["4A", "4B", "4C"];

/** Grade 4B summary, calculated from the live roster and review state. */
export function summary4B(khadija: KhadijaLive, s: ReturnType<typeof useClassState>): ClassSummary {
  const marked = roster.filter((r) => r.q5.group !== "missing");
  const q4 = marked
    .map((r) => (r.name === "Khadija" ? khadija.percent : quiz4Percent(r, s)))
    .filter((v): v is number => v !== null);
  const average = q4.length ? Math.round(q4.reduce((a, b) => a + b, 0) / q4.length) : null;
  const pct = (n: number) => Math.round((n / marked.length) * 100);
  const concepts = skills
    .map((k) => ({ name: k.name, students: studentsFor(k.id).length, mistake: k.mistake }))
    .sort((a, b) => b.students - a.students)
    .slice(0, 3);
  const support = marked
    .filter((r) => r.focus)
    .map((r) => ({
      name: r.name,
      focus: skills.find((k) => k.id === r.focus)?.name ?? { EN: "", DE: "" },
      score: r.name === "Khadija" ? khadija.percent : quiz4Percent(r, s),
    }))
    .sort((a, b) => (a.score ?? 999) - (b.score ?? 999))
    .slice(0, 5);
  return {
    students: roster.length,
    averages: [59, 64, 67, average],
    marked: 18 + (khadija.awardedMark !== null ? 1 : 0) + s.otherReviewed.length,
    concepts,
    missed: [
      { q: 7, task: { EN: "Compare 2/3 and 3/5", DE: "Vergleiche 2/3 und 3/5" }, wrong: pct(marked.filter((r) => q7MarkOf(r, s) < 3).length) },
      { q: 5, task: { EN: "Share 20 apples", DE: "Teile 20 Äpfel" }, wrong: pct(marked.filter((r) => q5MarkOf(r, s) < 4).length) },
      { q: 3, task: { EN: "Shade 3/4", DE: "Färbe 3/4" }, wrong: pct(studentsFor("parts").length) },
    ].sort((a, b) => b.wrong - a.wrong),
    support,
  };
}

export function ClassPicker({ language }: { language: Lang; notify?: (m: string) => void }) {
  const t = makeT(language);
  const s = useClassState();
  return (
    <div className="class-picker">
      <label>
        {t("Class", "Klasse")}
        <select
          value={s.teacherClass}
          onChange={(e) => updateClassState({ teacherClass: e.target.value as ClassId })}
        >
          {classIds.map((c) => (
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

const latest = (c: ClassSummary) => {
  const i = c.averages.map((v, n) => (v === null ? -1 : n)).filter((n) => n >= 0).pop() ?? 0;
  return { quiz: i + 1, value: c.averages[i] ?? 0, change: (c.averages[i] ?? 0) - (c.averages[0] ?? 0) };
};

/** Dashboard for a class other than 4B: nothing from the Quiz 4 story, just its state and a way in. */
export function OtherClassOverview({
  cls,
  language,
  onPerformance,
}: {
  cls: "4A" | "4C";
  language: Lang;
  onPerformance: () => void;
}) {
  const t = makeT(language);
  const c = otherClasses[cls];
  const l = latest(c);
  const top = c.concepts[0];
  return (
    <>
      <section className="metric-grid">
        <article>
          <span className="metric-icon gold">
            <Icon name="review" />
          </span>
          <div>
            <p>{t("Review queue", "Prüfwarteschlange")}</p>
            <strong>
              0 <small>{c.marked === 0 ? t("Quiz 4 papers not uploaded yet", "Quiz-4-Arbeiten noch nicht hochgeladen") : t("exams waiting for review", "Arbeiten warten auf Prüfung")}</small>
            </strong>
          </div>
        </article>
        <article>
          <span className="metric-icon teal">
            <Icon name="check" />
          </span>
          <div>
            <p>{t("Quiz 4 marked", "Quiz 4 bewertet")}</p>
            <strong>
              {c.marked} <small>{t(`of ${c.students}`, `von ${c.students}`)}</small>
            </strong>
          </div>
        </article>
        <article>
          <span className="metric-icon navy">
            <Icon name="trend" />
          </span>
          <div>
            <p>{t(`Class average · Quiz ${l.quiz}`, `Klassendurchschnitt · Quiz ${l.quiz}`)}</p>
            <strong>
              {l.value}% <small>{l.change >= 0 ? "+" : ""}{l.change} {t("since Quiz 1", "seit Quiz 1")}</small>
            </strong>
          </div>
        </article>
      </section>
      <article className="panel other-class-panel">
        <div className="ai-title">
          <span>
            <Icon name={c.marked === 0 ? "clock" : "check"} />
          </span>
          <div>
            <p className="kicker">{t(`GRADE ${cls} · ${c.students} STUDENTS`, `KLASSE ${cls} · ${c.students} KINDER`)}</p>
            <h2>
              {c.marked === 0
                ? t("Quiz 4 papers have not been uploaded yet", "Die Quiz-4-Arbeiten wurden noch nicht hochgeladen")
                : t("Nothing needs your decision in this class", "In dieser Klasse ist nichts zu entscheiden")}
            </h2>
          </div>
        </div>
        <p>
          <b>{t("Most often misunderstood:", "Am häufigsten missverstanden:")}</b> {top.name[language]} ·{" "}
          {t(`${top.students} of ${c.students} students`, `${top.students} von ${c.students} Kindern`)} ({top.mistake[language]})
        </p>
        <Button icon="trend" onClick={onPerformance}>
          {t(`See Grade ${cls} performance`, `Leistung Klasse ${cls} ansehen`)}
        </Button>
      </article>
    </>
  );
}

/** Class performance: one class (trend, misunderstood concepts, most-missed questions) or all classes compared. */
export function ClassPerformance({
  khadija,
  language,
  onOpenStudent,
}: {
  khadija: KhadijaLive;
  language: Lang;
  onOpenStudent: (name: string) => void;
}) {
  const t = makeT(language);
  const s = useClassState();
  const [compare, setCompare] = useState(false);
  const data: Record<ClassId, ClassSummary> = { "4A": otherClasses["4A"], "4B": summary4B(khadija, s), "4C": otherClasses["4C"] };
  const cls = s.teacherClass;
  const c = data[cls];
  const l = latest(c);
  const quizzes = ["Quiz 1", "Quiz 2", "Quiz 3", "Quiz 4"];
  const tabs = (
    <div className="class-tabs" role="group" aria-label={t("Choose a class", "Klasse wählen")}>
      {classIds.map((id) => (
        <button
          key={id}
          type="button"
          aria-pressed={!compare && cls === id}
          className={!compare && cls === id ? "active" : ""}
          onClick={() => {
            updateClassState({ teacherClass: id });
            setCompare(false);
          }}
        >
          {t("Grade", "Klasse")} {id}
        </button>
      ))}
      <button type="button" aria-pressed={compare} className={compare ? "active" : ""} onClick={() => setCompare(true)}>
        <Icon name="trend" size={16} /> {t("Compare classes", "Klassen vergleichen")}
      </button>
    </div>
  );

  if (compare)
    return (
      <>
        <div className="teacher-heading">
          <div>
            <p className="kicker">{t("MATHEMATICS · 3 CLASSES", "MATHEMATIK · 3 KLASSEN")}</p>
            <h1>{t("Class performance", "Klassenleistung")}</h1>
            <p>{t("Average score per quiz, all your Grade 4 classes.", "Durchschnitt pro Quiz, alle Ihre Klassen der Stufe 4.")}</p>
          </div>
        </div>
        {tabs}
        <article className="panel class-trend">
          <p className="kicker">{t("ASSESSMENT TRENDS", "ENTWICKLUNG DER PRÜFUNGEN")}</p>
          <h2>{t("Class averages, Quiz 1 to Quiz 4", "Klassendurchschnitte, Quiz 1 bis Quiz 4")}</h2>
          <LineChart
            language={language}
            fontSize={13}
            title={t("Class average per quiz for Grades 4A, 4B and 4C", "Klassendurchschnitt pro Quiz für 4A, 4B und 4C")}
            xLabels={quizzes}
            series={classIds.map((id, i) => ({
              name: `${t("Grade", "Klasse")} ${id}`,
              values: data[id].averages,
              color: conceptColors[i],
              shape: conceptShape(i),
            }))}
          />
        </article>
        <article className="panel compare-table-panel">
          <div className="compare-table" role="table">
            <div className="compare-row roster-head" role="row">
              <span>{t("Class", "Klasse")}</span>
              <span>{t("Latest average", "Letzter Durchschnitt")}</span>
              <span>{t("Since Quiz 1", "Seit Quiz 1")}</span>
              <span>{t("Most often misunderstood", "Am häufigsten missverstanden")}</span>
              <span />
            </div>
            {classIds.map((id) => {
              const x = data[id];
              const lx = latest(x);
              return (
                <div className="compare-row" role="row" key={id}>
                  <strong>
                    {t("Grade", "Klasse")} {id} <small>· {t(`${x.students} students`, `${x.students} Kinder`)}</small>
                  </strong>
                  <span>
                    {lx.value}% <small>(Quiz {lx.quiz})</small>
                  </span>
                  <span>
                    {lx.change >= 0 ? "+" : ""}
                    {lx.change} {t("points", "Punkte")}
                  </span>
                  <span>
                    {x.concepts[0].name[language]} · {Math.round((x.concepts[0].students / x.students) * 100)}%
                  </span>
                  <Button
                    icon="arrow"
                    variant="secondary"
                    onClick={() => {
                      updateClassState({ teacherClass: id });
                      setCompare(false);
                    }}
                  >
                    {t("Open", "Öffnen")}
                  </Button>
                </div>
              );
            })}
          </div>
        </article>
      </>
    );

  return (
    <>
      <div className="teacher-heading">
        <div>
          <p className="kicker">
            {t(`GRADE ${cls} · ${c.students} STUDENTS · MATHEMATICS`, `KLASSE ${cls} · ${c.students} KINDER · MATHEMATIK`)}
          </p>
          <h1>{t("Class performance", "Klassenleistung")}</h1>
          <p>
            {c.marked === 0
              ? t("Quiz 4 is not marked yet; figures use Quiz 3.", "Quiz 4 ist noch nicht bewertet; die Zahlen nutzen Quiz 3.")
              : t(`Quiz 4 marked for ${c.marked} of ${c.students} students.`, `Quiz 4 für ${c.marked} von ${c.students} Kindern bewertet.`)}
          </p>
        </div>
      </div>
      {tabs}
      <section className="class-kpis">
        <article className="panel">
          <p className="kicker">{t(`CLASS AVERAGE · QUIZ ${l.quiz}`, `KLASSENDURCHSCHNITT · QUIZ ${l.quiz}`)}</p>
          <strong>{l.value}%</strong>
          <Status type={l.change > 0 ? "good" : "neutral"}>
            {l.change >= 0 ? "+" : ""}
            {l.change} {t("points since Quiz 1", "Punkte seit Quiz 1")}
          </Status>
        </article>
        <article className="panel">
          <p className="kicker">{t("MOST OFTEN MISUNDERSTOOD", "AM HÄUFIGSTEN MISSVERSTANDEN")}</p>
          <strong>{c.concepts[0].name[language]}</strong>
          <Status type="warn">{t(`${c.concepts[0].students} of ${c.students} students`, `${c.concepts[0].students} von ${c.students} Kindern`)}</Status>
        </article>
        <article className="panel">
          <p className="kicker">{t("MOST OFTEN WRONG", "AM HÄUFIGSTEN FALSCH")}</p>
          <strong>
            {t("Q", "A")}
            {c.missed[0].q} · {c.missed[0].task[language]}
          </strong>
          <Status type="warn">{t(`${c.missed[0].wrong}% wrong`, `${c.missed[0].wrong} % falsch`)}</Status>
        </article>
      </section>
      <section className="insight-grid">
        <article className="panel class-trend">
          <p className="kicker">{t("ASSESSMENT TRENDS", "ENTWICKLUNG DER PRÜFUNGEN")}</p>
          <h2>{t("Class average per quiz", "Klassendurchschnitt pro Quiz")}</h2>
          <LineChart
            language={language}
            fontSize={13}
            title={t(`Grade ${cls} average, Quiz 1 to Quiz 4`, `Durchschnitt Klasse ${cls}, Quiz 1 bis Quiz 4`)}
            xLabels={quizzes}
            pendingNote={t("not marked", "nicht bewertet")}
            series={[{ name: `${t("Grade", "Klasse")} ${cls}`, values: c.averages, color: conceptColors[0], shape: conceptShape(0) }]}
          />
        </article>
        <article className="panel">
          <p className="kicker">{t("FREQUENTLY MISUNDERSTOOD CONCEPTS", "HÄUFIG MISSVERSTANDENE THEMEN")}</p>
          <h2>{t("Where support is needed", "Wo Unterstützung nötig ist")}</h2>
          <ol className="concept-rank">
            {c.concepts.map((k) => {
              const share = Math.round((k.students / c.students) * 100);
              return (
                <li key={k.name.EN}>
                  <div>
                    <strong>{k.name[language]}</strong>
                    <span>
                      {t(`${k.students} of ${c.students} students`, `${k.students} von ${c.students} Kindern`)} · {share}%
                    </span>
                  </div>
                  <i className="concept-bar" aria-hidden="true">
                    <b style={{ width: `${share}%` }} />
                  </i>
                  <small>
                    {t("Common mistake:", "Häufiger Fehler:")} {k.mistake[language]}
                  </small>
                </li>
              );
            })}
          </ol>
        </article>
      </section>
      <section className="insight-grid">
        <article className="panel">
          <p className="kicker">{t(`QUESTIONS MOST OFTEN WRONG · QUIZ ${c.marked === 0 ? 3 : 4}`, `AM HÄUFIGSTEN FALSCH · QUIZ ${c.marked === 0 ? 3 : 4}`)}</p>
          <h2>{t("Questions to re-teach", "Aufgaben zum Wiederholen")}</h2>
          {c.missed.map((m) => (
            <div className="missed-row" key={m.q + m.task.EN}>
              <span>
                <b>
                  {t("Q", "A")}
                  {m.q}
                </b>{" "}
                {m.task[language]}
              </span>
              <i className="concept-bar" aria-hidden="true">
                <b style={{ width: `${m.wrong}%` }} />
              </i>
              <strong>{t(`${m.wrong}% wrong`, `${m.wrong} % falsch`)}</strong>
            </div>
          ))}
        </article>
        <article className="panel">
          <p className="kicker">{t("STUDENT SNAPSHOT", "SCHÜLERÜBERBLICK")}</p>
          <h2>{t("Students who need support", "Kinder mit Unterstützungsbedarf")}</h2>
          {c.support.map((x) => (
            <div className="support-row" key={x.name}>
              <span>
                <strong>{x.name}</strong>
                <small>{x.focus[language]}</small>
              </span>
              <b>{x.score === null ? t("Quiz 4 not marked", "Quiz 4 nicht bewertet") : `${x.score}%`}</b>
              {cls === "4B" ? (
                <Button icon="person" variant="ghost" onClick={() => onOpenStudent(x.name)}>
                  {t("Open record", "Akte öffnen")}
                </Button>
              ) : (
                <span />
              )}
            </div>
          ))}
        </article>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// C31 – Verification pop quizzes: completion, result, improvement and next step
// ---------------------------------------------------------------------------
const practiceBefore: Record<string, { skill: string; before: number; label: Text }> = {
  Khadija: { skill: "compare", before: 0, label: { EN: "Quiz 4 · Q7 0/3", DE: "Quiz 4 · A7 0/3" } },
  Salma: { skill: "compare", before: 0, label: { EN: "Quiz 4 · Q7 0/3", DE: "Quiz 4 · A7 0/3" } },
  Hana: { skill: "compare", before: 0, label: { EN: "Quiz 4 · Q7 0/3", DE: "Quiz 4 · A7 0/3" } },
  Rana: { skill: "compare", before: 0, label: { EN: "Quiz 4 · Q7 0/3", DE: "Quiz 4 · A7 0/3" } },
  Mariam: { skill: "working", before: 50, label: { EN: "Quiz 4 · Q5 2/4", DE: "Quiz 4 · A5 2/4" } },
  Laila: { skill: "multi", before: 33, label: { EN: "Quiz 3 · Q2 1/3", DE: "Quiz 3 · A2 1/3" } },
  Nour: { skill: "division", before: 33, label: { EN: "Quiz 3 · Q6 1/3", DE: "Quiz 3 · A6 1/3" } },
};

function BeforeAfter({ before, after }: { before: number; after: number | null }) {
  // Small dumbbell: grey dot = before practice, filled dot = pop quiz. Numbers are shown next to it.
  const x = (v: number) => 6 + (v / 100) * 108;
  return (
    <svg className="before-after" width="120" height="18" viewBox="0 0 120 18" aria-hidden="true">
      <line x1="6" x2="114" y1="9" y2="9" className="ba-track" />
      {after !== null && <line x1={x(before)} x2={x(after)} y1="9" y2="9" className="ba-change" />}
      <circle cx={x(before)} cy="9" r="4.5" className="ba-before" />
      {after !== null && <circle cx={x(after)} cy="9" r="5" className="ba-after" />}
    </svg>
  );
}

export function QuizMonitor({ khadija, ...common }: Common & Live) {
  const t = makeT(common.language);
  const s = useClassState();
  const rows = roster
    .filter((r) => practiceBefore[r.name])
    .map((r) => {
      const info = practiceBefore[r.name];
      const state =
        r.name !== "Khadija"
          ? r.practice
          : khadija.practiced
            ? "done"
            : khadija.published && khadija.redFlagDecision === "confirmed"
              ? "pending"
              : "none";
      const score = r.name === "Khadija" ? khadija.practiceScore : (r.quizScore ?? null);
      const after = state === "done" && score !== null ? Math.round((score / 3) * 100) : null;
      return { name: r.name, state, score, after, ...info };
    });
  const done = rows.filter((r) => r.after !== null);
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
  const improved = done.filter((r) => (r.after ?? 0) > r.before).length;
  const setOutcome = (name: string, outcome: GapOutcome | null, skill: Text) => {
    updateClassState((st) => {
      const next = { ...st.gapOutcome };
      if (outcome) next[name] = outcome;
      else delete next[name];
      return { gapOutcome: next };
    });
    if (!outcome) return;
    const text = {
      resolved: { EN: `${skill.EN}: gap marked as resolved after the pop quiz`, DE: `${skill.DE}: Lücke nach dem Kurz-Quiz als behoben markiert` },
      again: { EN: `${skill.EN}: another practice round assigned`, DE: `${skill.DE}: weitere Übungsrunde zugewiesen` },
      group: { EN: `${skill.EN}: added to the small-group session`, DE: `${skill.DE}: zur Kleingruppe hinzugefügt` },
    }[outcome];
    logActivity("practice", name, text, "teacher");
    if (outcome === "again" && name === "Khadija")
      common.addNotification(
        "student",
        { EN: "One more short round", DE: "Noch eine kurze Runde" },
        {
          EN: "Ms. Ashraf asked you to do 3 new fraction questions. You are getting closer!",
          DE: "Frau Ashraf möchte, dass du 3 neue Bruchaufgaben machst. Du bist auf einem guten Weg!",
        },
        { EN: "Start practice", DE: "Übung starten" },
        "practice",
      );
    common.notify(
      outcome === "resolved"
        ? t(`${name}: gap marked as resolved.`, `${name}: Lücke als behoben markiert.`)
        : outcome === "again"
          ? t(`${name}: another round assigned${name === "Khadija" ? " and Khadija notified" : ""}.`, `${name}: weitere Runde zugewiesen${name === "Khadija" ? " und Khadija benachrichtigt" : ""}.`)
          : t(`${name} added to the small-group session.`, `${name} zur Kleingruppe hinzugefügt.`),
    );
  };
  return (
    <section className="panel students-panel quiz-monitor">
      <div className="panel-head">
        <div>
          <p className="kicker">{t("VERIFICATION POP QUIZZES · GRADE 4B", "KURZ-QUIZZE ZUR KONTROLLE · KLASSE 4B")}</p>
          <h2>{t("Did the practice help?", "Hat die Übung geholfen?")}</h2>
        </div>
      </div>
      <div className="monitor-summary">
        <div>
          <strong>
            {done.length}/{rows.length}
          </strong>
          <span>{t("completed the pop quiz", "haben das Kurz-Quiz gemacht")}</span>
        </div>
        <div>
          <strong>
            {avg(done.map((r) => r.before))}% → {avg(done.map((r) => r.after ?? 0))}%
          </strong>
          <span>{t("average before practice → pop quiz", "Durchschnitt vor der Übung → Kurz-Quiz")}</span>
        </div>
        <div>
          <strong>
            {improved}/{done.length}
          </strong>
          <span>{t("improved after practice", "haben sich verbessert")}</span>
        </div>
      </div>
      <p className="panel-note">
        {t(
          "Before = the same skill in the last quiz. Grey dot: before practice; dark dot: pop quiz. Pop quizzes do not change quiz scores.",
          "Vorher = dieselbe Kompetenz im letzten Quiz. Grauer Punkt: vor der Übung; dunkler Punkt: Kurz-Quiz. Kurz-Quizze ändern keine Quizergebnisse.",
        )}
      </p>
      <div className="monitor-table" role="table">
        <div className="monitor-row roster-head" role="row">
          <span>{t("Student · practice", "Kind · Übung")}</span>
          <span>{t("Before → pop quiz", "Vorher → Kurz-Quiz")}</span>
          <span>{t("Effect", "Wirkung")}</span>
          <span>{t("Next step", "Nächster Schritt")}</span>
        </div>
        {rows.map((row) => {
          const skill = skills.find((k) => k.id === row.skill)?.name ?? { EN: "", DE: "" };
          const outcome = s.gapOutcome[row.name];
          const change = row.after === null ? null : row.after - row.before;
          return (
            <div className="monitor-row" role="row" key={row.name}>
              <span className="student-cell">
                <b>{initials(row.name)}</b>
                <i>
                  <strong>{row.name}</strong>
                  <small>{skill[common.language]}</small>
                </i>
              </span>
              <span className="ba-cell">
                <BeforeAfter before={row.before} after={row.after} />
                <small>
                  {row.label[common.language]} ({row.before}%) →{" "}
                  {row.after === null ? "—" : `${row.score}/3 (${row.after}%)`}
                </small>
              </span>
              <span>
                {row.state !== "done" ? (
                  <Status type={row.state === "pending" ? "warn" : "neutral"}>
                    {row.state === "pending" ? t("Not done yet", "Noch nicht erledigt") : t("Not assigned yet", "Noch nicht zugewiesen")}
                  </Status>
                ) : (
                  <Status type={(change ?? 0) >= 50 ? "good" : (change ?? 0) > 0 ? "neutral" : "warn"}>
                    {(change ?? 0) > 0
                      ? t(`Improved +${change} points`, `Verbessert +${change} Punkte`)
                      : t("No improvement yet", "Noch keine Verbesserung")}
                  </Status>
                )}
              </span>
              <span className="monitor-action">
                {row.state === "pending" ? (
                  <Button icon="bell" variant="ghost" onClick={() => sendPracticeReminder(row.name, common)}>
                    {s.remindersSent.includes(row.name) ? t("Remind again", "Erneut erinnern") : t("Send reminder", "Erinnern")}
                  </Button>
                ) : row.state !== "done" ? null : outcome ? (
                  <>
                    <Status type={outcome === "resolved" ? "good" : "neutral"}>
                      {outcome === "resolved"
                        ? t("Gap resolved", "Lücke behoben")
                        : outcome === "again"
                          ? t("Another round assigned", "Weitere Runde zugewiesen")
                          : t("In small-group session", "In der Kleingruppe")}
                    </Status>
                    <button type="button" className="link-button" onClick={() => setOutcome(row.name, null, skill)}>
                      {t("Change", "Ändern")}
                    </button>
                  </>
                ) : row.score === 3 ? (
                  <Button icon="check" variant="secondary" onClick={() => setOutcome(row.name, "resolved", skill)}>
                    {t("Mark gap resolved", "Lücke als behoben markieren")}
                  </Button>
                ) : row.score === 2 ? (
                  <Button icon="play" variant="secondary" onClick={() => setOutcome(row.name, "again", skill)}>
                    {t("Assign another round", "Weitere Runde zuweisen")}
                  </Button>
                ) : (
                  <Button icon="person" variant="secondary" onClick={() => setOutcome(row.name, "group", skill)}>
                    {t("Add to small group", "Zur Kleingruppe hinzufügen")}
                  </Button>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// C6 – Bulk exam upload: several papers at once, matched to students by name
// ---------------------------------------------------------------------------
type UploadFile = { id: number; name: string; url: string | null; student: string; quality: PageQuality };

const matchStudent = (fileName: string) => {
  const lower = fileName.toLowerCase();
  return roster.find((r) => lower.includes(r.name.toLowerCase()))?.name ?? "";
};

/** A sample scan drawn on a canvas, so the upload can be tried without real files. */
function sampleScan(label: string, blurry: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 800;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 600, 800);
  if (blurry) ctx.filter = "blur(5px)";
  ctx.fillStyle = "#2b2b2b";
  ctx.font = "bold 34px sans-serif";
  ctx.fillText("Quiz 4: Fractions", 40, 80);
  ctx.font = "28px sans-serif";
  ctx.fillText(label ? `Name: ${label}` : "Name: ______", 40, 140);
  ctx.strokeStyle = "#2b2b2b";
  ctx.lineWidth = 3;
  ["1. 24 x 6 = 144", "2. 132 x 4 = 528", "3. Shade 3/4", "4. 1/2 + 1/4 = 3/4", "5. 20 / 5 = 4 each"].forEach((line, i) => {
    ctx.fillText(line, 40, 230 + i * 100);
    ctx.beginPath();
    ctx.moveTo(40, 250 + i * 100);
    ctx.lineTo(560, 250 + i * 100);
    ctx.stroke();
  });
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function BulkUpload(common: Common) {
  const t = makeT(common.language);
  const s = useClassState();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragging, setDragging] = useState(false);

  const addFiles = (list: { name: string; url: string | null; isImage: boolean }[]) => {
    const added = list.map((f) => ({ id: newId(), name: f.name, url: f.url, student: matchStudent(f.name), quality: (f.isImage ? "checking" : "pdf") as PageQuality }));
    setFiles((current) => [...current, ...added]);
    added.forEach((f) => {
      if (f.url && f.quality === "checking")
        analyzePage(f.url).then((quality) => setFiles((current) => current.map((x) => (x.id === f.id ? { ...x, quality } : x))));
    });
  };
  const fromInput = (list: FileList | null) => {
    if (!list) return;
    addFiles(
      [...list].map((file) => ({
        name: file.name,
        url: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        isImage: file.type.startsWith("image/"),
      })),
    );
  };
  const unmatched = files.filter((f) => !f.student).length;
  const qualityText = (q: PageQuality) =>
    q === "good"
      ? t("Clear", "Gut lesbar")
      : q === "checking"
        ? t("Checking…", "Wird geprüft…")
        : q === "pdf"
          ? "PDF"
          : q === "blurry"
            ? t("Blurry – text check needed", "Unscharf – Textprüfung nötig")
            : q === "dark"
              ? t("Too dark", "Zu dunkel")
              : t("Low resolution", "Geringe Auflösung");
  const importAll = () => {
    const names = [...new Set(files.map((f) => f.student))];
    updateClassState((st) => ({
      bulkUploaded: st.bulkUploaded || names.includes("Judy"),
      uploadedScans: [...new Set([...st.uploadedScans, ...names])],
    }));
    names.forEach((name) => {
      const count = files.filter((f) => f.student === name).length;
      logActivity("submitted", name, {
        EN: `Quiz 4 paper uploaded by the teacher (${count} ${count === 1 ? "page" : "pages"})`,
        DE: `Quiz-4-Arbeit von der Lehrerin hochgeladen (${count} ${count === 1 ? "Seite" : "Seiten"})`,
      });
    });
    common.notify(
      t(
        `${files.length} ${files.length === 1 ? "file" : "files"} uploaded for ${names.join(", ")}.`,
        `${files.length} ${files.length === 1 ? "Datei" : "Dateien"} hochgeladen für ${names.join(", ")}.`,
      ),
    );
    setFiles([]);
  };

  return (
    <div className="bulk-upload">
      <div
        className={`drop-zone ${dragging ? "dragging" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          fromInput(e.dataTransfer.files);
        }}
      >
        <Icon name="book" size={26} />
        <div>
          <strong>{t("Upload several papers at once", "Mehrere Arbeiten auf einmal hochladen")}</strong>
          <small>
            {t(
              "Drop scans here, or choose files. Each file is matched to a student by the name in the file name; you can change any match before adding.",
              "Scans hier ablegen oder Dateien wählen. Jede Datei wird über den Namen im Dateinamen einem Kind zugeordnet; Sie können jede Zuordnung vor dem Hinzufügen ändern.",
            )}
          </small>
        </div>
        <div className="drop-actions">
          <label className="button secondary file-choice">
            <Icon name="book" />
            {t("Choose files", "Dateien wählen")}
            <input
              type="file"
              multiple
              accept="image/*,application/pdf"
              onChange={(e) => {
                fromInput(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          <Button
            icon="spark"
            variant="ghost"
            onClick={() =>
              addFiles([
                { name: "Judy_Quiz4.jpg", url: sampleScan("Judy", false), isImage: true },
                { name: "scan_0042.jpg", url: sampleScan("", true), isImage: true },
                { name: "Hana quiz 4 page 2.jpg", url: sampleScan("Hana", false), isImage: true },
              ])
            }
          >
            {t("Try 3 sample scans", "3 Beispiel-Scans testen")}
          </Button>
        </div>
      </div>
      {files.length > 0 && (
        <div className="upload-match">
          <h3>
            {t(`Match ${files.length} files to students`, `${files.length} Dateien Kindern zuordnen`)}
            {unmatched > 0 && <Status type="warn">{t(`${unmatched} not matched`, `${unmatched} nicht zugeordnet`)}</Status>}
          </h3>
          {files.map((f) => {
            const sameStudent = files.filter((x) => x.student === f.student && f.student).length;
            const missing = f.student && roster.find((r) => r.name === f.student)?.q5.group === "missing" && !s.bulkUploaded;
            return (
              <div className="upload-row" key={f.id}>
                {f.url ? <img src={f.url} alt="" /> : <span className="upload-thumb">PDF</span>}
                <span className="upload-name">
                  <strong>{f.name}</strong>
                  <Status type={f.quality === "good" || f.quality === "pdf" ? "good" : f.quality === "checking" ? "neutral" : "warn"}>
                    {qualityText(f.quality)}
                  </Status>
                </span>
                <label>
                  <span className="sr-only">{t(`Student for ${f.name}`, `Kind für ${f.name}`)}</span>
                  <select
                    value={f.student}
                    onChange={(e) => setFiles((current) => current.map((x) => (x.id === f.id ? { ...x, student: e.target.value } : x)))}
                  >
                    <option value="">{t("Choose a student…", "Kind wählen…")}</option>
                    {roster.map((r) => (
                      <option key={r.name} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </label>
                <span className="upload-status">
                  {!f.student ? (
                    <Status type="warn">{t("No name found – choose a student", "Kein Name gefunden – Kind wählen")}</Status>
                  ) : missing ? (
                    <Status type="good">{t("Missing paper – will be added", "Fehlende Arbeit – wird hinzugefügt")}</Status>
                  ) : sameStudent > 1 ? (
                    <Status type="neutral">{t(`${sameStudent} pages for ${f.student}`, `${sameStudent} Seiten für ${f.student}`)}</Status>
                  ) : (
                    <Status type="neutral">{t("Already submitted – adds a page", "Schon abgegeben – fügt eine Seite hinzu")}</Status>
                  )}
                </span>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={t(`Remove ${f.name}`, `${f.name} entfernen`)}
                  onClick={() => setFiles((current) => current.filter((x) => x.id !== f.id))}
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
            );
          })}
          <div className="upload-actions">
            <Button icon="close" variant="ghost" onClick={() => setFiles([])}>
              {t("Cancel", "Abbrechen")}
            </Button>
            <Button icon="check" disabled={unmatched > 0} onClick={importAll}>
              {t(`Add ${files.length} ${files.length === 1 ? "file" : "files"}`, `${files.length} ${files.length === 1 ? "Datei" : "Dateien"} hinzufügen`)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

