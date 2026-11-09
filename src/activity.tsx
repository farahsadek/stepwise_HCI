import { useState, useSyncExternalStore } from "react";

export type ActivityLang = "EN" | "DE";
export type ActivityKind =
  | "submitted"
  | "ocr"
  | "mark"
  | "override"
  | "redflag"
  | "feedback"
  | "published"
  | "share"
  | "question"
  | "report"
  | "practice"
  | "parent"
  | "acknowledged";

type Text = Record<ActivityLang, string>;

export type ActivityEntry = {
  id: number;
  kind: ActivityKind;
  actor: string | Text;
  actorRole: Text;
  student: string;
  detail: Text;
  when: Text;
};

const kindLabels: Record<ActivityKind, Text> = {
  submitted: { EN: "Exam submitted", DE: "Arbeit eingereicht" },
  ocr: { EN: "OCR verified", DE: "OCR geprüft" },
  mark: { EN: "Mark confirmed", DE: "Bewertung bestätigt" },
  override: { EN: "Mark overridden", DE: "Bewertung überschrieben" },
  redflag: { EN: "Red flag decision", DE: "Entscheidung zur Warnung" },
  feedback: { EN: "Feedback edited", DE: "Feedback bearbeitet" },
  published: { EN: "Results published", DE: "Ergebnisse veröffentlicht" },
  share: { EN: "Sharing changed", DE: "Freigabe geändert" },
  question: { EN: "Student question", DE: "Frage des Kindes" },
  report: { EN: "Error reported", DE: "Fehler gemeldet" },
  practice: { EN: "Practice completed", DE: "Übung abgeschlossen" },
  parent: { EN: "Parent communication", DE: "Elternkommunikation" },
  acknowledged: { EN: "Report acknowledged", DE: "Bericht bestätigt" },
};

const teacherRole: Text = { EN: "Teacher", DE: "Lehrerin" };
const studentRole: Text = { EN: "Student", DE: "Schülerin" };
const parentRole: Text = { EN: "Parent", DE: "Elternteil" };
const PARENT: Text = { EN: "Khadija’s parent", DE: "Khadijas Elternteil" };
const TEACHER = "Somaya Ashraf";

let nextId = 100;
let entries: ActivityEntry[] = [
  {
    id: 4,
    kind: "share",
    actor: TEACHER,
    actorRole: teacherRole,
    student: "Khadija",
    detail: {
      EN: "Quiz 3 results shared with Khadija’s parent",
      DE: "Ergebnisse von Quiz 3 mit Khadijas Elternteil geteilt",
    },
    when: { EN: "3 Oct, 14:06", DE: "3. Okt., 14:06" },
  },
  {
    id: 3,
    kind: "published",
    actor: TEACHER,
    actorRole: teacherRole,
    student: "Khadija",
    detail: { EN: "Quiz 3 results published (64%)", DE: "Ergebnisse von Quiz 3 veröffentlicht (64 %)" },
    when: { EN: "3 Oct, 14:05", DE: "3. Okt., 14:05" },
  },
  {
    id: 2,
    kind: "override",
    actor: TEACHER,
    actorRole: teacherRole,
    student: "Khadija",
    detail: {
      EN: "Quiz 3 · Q4: AI proposed 2/3, teacher awarded 3/3",
      DE: "Quiz 3 · A4: KI schlug 2/3 vor, Lehrerin vergab 3/3",
    },
    when: { EN: "3 Oct, 14:02", DE: "3. Okt., 14:02" },
  },
  {
    id: 1,
    kind: "ocr",
    actor: TEACHER,
    actorRole: teacherRole,
    student: "Khadija",
    detail: { EN: "Quiz 3 handwriting checked", DE: "Handschrift von Quiz 3 geprüft" },
    when: { EN: "3 Oct, 13:55", DE: "3. Okt., 13:55" },
  },
];
const listeners = new Set<() => void>();

export function logActivity(
  kind: ActivityKind,
  student: string,
  detail: Text,
  by?: "teacher" | "student" | "parent",
) {
  const now = new Date();
  const clock = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const who =
    by ??
    (kind === "acknowledged"
      ? "parent"
      : ["submitted", "question", "report", "practice"].includes(kind)
        ? "student"
        : "teacher");
  entries = [
    {
      id: nextId++,
      kind,
      actor: who === "student" ? student : who === "parent" ? PARENT : TEACHER,
      actorRole: who === "student" ? studentRole : who === "parent" ? parentRole : teacherRole,
      student,
      detail,
      when: { EN: `Today, ${clock}`, DE: `Heute, ${clock}` },
    },
    ...entries,
  ];
  listeners.forEach((listener) => listener());
}

function useEntries() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => entries,
  );
}

function ActivityRow({ entry, language }: { entry: ActivityEntry; language: ActivityLang }) {
  return (
    <div className="activity-row">
      <time>{entry.when[language]}</time>
      <span className="activity-who">
        <strong>{typeof entry.actor === "string" ? entry.actor : entry.actor[language]}</strong>
        <small>{entry.actorRole[language]}</small>
      </span>
      <span className={`activity-kind ${entry.kind}`}>{kindLabels[entry.kind][language]}</span>
      <span className="activity-detail">{entry.detail[language]}</span>
    </div>
  );
}

export function ActivityHistoryPage({
  language,
  onDownload,
}: {
  language: ActivityLang;
  onDownload: () => void;
}) {
  const all = useEntries();
  const [kind, setKind] = useState<ActivityKind | "all">("all");
  const [student, setStudent] = useState("all");
  const t = (en: string, de: string) => (language === "DE" ? de : en);
  const students = [...new Set(all.map((entry) => entry.student))];
  const shown = all.filter(
    (entry) => (kind === "all" || entry.kind === kind) && (student === "all" || entry.student === student),
  );
  return (
    <section className="activity-page">
      <div className="teacher-heading">
        <div>
          <p className="kicker">{t("AUDIT TRAIL", "PROTOKOLL")}</p>
          <h1>{t("Activity history", "Aktivitätsverlauf")}</h1>
          <p>
            {t(
              "Every grade change, approval and publication is recorded here.",
              "Jede Notenänderung, Freigabe und Veröffentlichung wird hier festgehalten.",
            )}
          </p>
        </div>
        <button className="button secondary" onClick={onDownload}>
          {t("Download log", "Protokoll herunterladen")}
        </button>
      </div>
      <div className="panel activity-panel">
        <div className="activity-filters">
          <label>
            {t("Action type", "Aktionstyp")}
            <select value={kind} onChange={(event) => setKind(event.target.value as ActivityKind | "all")}>
              <option value="all">{t("All actions", "Alle Aktionen")}</option>
              {(Object.keys(kindLabels) as ActivityKind[]).map((key) => (
                <option key={key} value={key}>
                  {kindLabels[key][language]}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("Student", "Schülerin")}
            <select value={student} onChange={(event) => setStudent(event.target.value)}>
              <option value="all">{t("All students", "Alle Schülerinnen")}</option>
              {students.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <p className="activity-count" role="status">
            {t(`${shown.length} entries`, `${shown.length} Einträge`)}
          </p>
        </div>
        <div className="activity-table" role="table">
          <div className="activity-row activity-head" role="row">
            <span>{t("When", "Wann")}</span>
            <span>{t("Who", "Wer")}</span>
            <span>{t("Action", "Aktion")}</span>
            <span>{t("Details", "Details")}</span>
          </div>
          {shown.length === 0 ? (
            <p className="activity-empty">{t("No entries match these filters.", "Keine Einträge für diese Filter.")}</p>
          ) : (
            shown.map((entry) => <ActivityRow entry={entry} language={language} key={entry.id} />)
          )}
        </div>
      </div>
    </section>
  );
}

export function RecentActivity({ language }: { language: ActivityLang }) {
  const all = useEntries();
  const t = (en: string, de: string) => (language === "DE" ? de : en);
  return (
    <div className="recent-activity">
      <p className="kicker">{t("RECENT ACTIVITY", "LETZTE AKTIVITÄTEN")}</p>
      {all.slice(0, 3).map((entry) => (
        <ActivityRow entry={entry} language={language} key={entry.id} />
      ))}
    </div>
  );
}

/** Students only see published results; parents only see results shared with them. */
export function RoleActivity({
  role,
  language,
}: {
  role: "student" | "parent";
  language: ActivityLang;
}) {
  const all = useEntries();
  const t = (en: string, de: string) => (language === "DE" ? de : en);
  const wanted: ActivityKind[] = role === "student" ? ["published"] : ["share", "acknowledged"];
  // The teacher's on/off switch is an internal audit entry; parents only see what was shared with them.
  const shown = all.filter(
    (entry) =>
      wanted.includes(entry.kind) &&
      entry.student === "Khadija" &&
      !(role === "parent" && /turned (on|off)$/.test(entry.detail.EN)),
  );
  return (
    <article className="card role-activity">
      <p className="kicker">
        {role === "student" ? t("RESULTS HISTORY", "ERGEBNISVERLAUF") : t("SHARED WITH YOU", "MIT IHNEN GETEILT")}
      </p>
      <h2>
        {role === "student" ? t("Published results", "Veröffentlichte Ergebnisse") : t("Results shared", "Geteilte Ergebnisse")}
      </h2>
      {shown.length === 0 ? (
        <p>{t("Nothing yet.", "Noch nichts.")}</p>
      ) : (
        shown.map((entry) => (
          <div className="role-activity-row" key={entry.id}>
            <time>{entry.when[language]}</time>
            <span>{entry.detail[language]}</span>
          </div>
        ))
      )}
    </article>
  );
}