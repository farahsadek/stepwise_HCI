import { useState } from "react";
import { logActivity } from "./activity";
import { LineChart, conceptColors, conceptShape } from "./charts";
import { ExplainerVideo } from "./student-media";
import { messageText, messageTime } from "./teacher";
import { Button, Icon, Status } from "./ui";
import {
  addThreadMessage,
  khadijaConcepts,
  questionTitlesDe,
  questions,
  updateClassState,
  useClassState,
  type Lang,
  type Notifier,
} from "./store";

export type ParentTab = "overview" | "results" | "progress" | "resources" | "messages" | "profile";
export type Child = "Khadija" | "Yara";

/** What the parent may see about Khadija's Quiz 4 (only after publish AND share). */
export type ParentQuiz = {
  visible: boolean;
  publishedNotShared: boolean;
  flagConfirmed: boolean;
  score: number | null;
  percent: number | null;
  awardedMark: number | null;
  studentAnswer: string;
  teacherFeedback: string;
  practiced: boolean;
  practiceScore: number | null;
};

const makeT = (language: Lang) => (en: string, de: string) => (language === "DE" ? de : en);

// ---------------------------------------------------------------------------
// D9 – child switcher and tabs
// ---------------------------------------------------------------------------
export function ChildSwitcher({
  language,
  child,
  setChild,
}: {
  language: Lang;
  child: Child;
  setChild: (c: Child) => void;
}) {
  const t = makeT(language);
  return (
    <div className="child-switcher parent-wide" role="group" aria-label={t("Choose a child", "Kind auswählen")}>
      {(
        [
          ["Khadija", t("Grade 4B", "Klasse 4B")],
          ["Yara", t("Grade 2A", "Klasse 2A")],
        ] as const
      ).map(([name, grade]) => (
        <button
          key={name}
          className={child === name ? "active" : ""}
          aria-pressed={child === name}
          onClick={() => setChild(name)}
        >
          <span className="child-avatar">{name[0]}</span>
          <span>
            <strong>{name}</strong>
            <small>{grade}</small>
          </span>
        </button>
      ))}
    </div>
  );
}

export function ParentTabs({
  language,
  tab,
  setTab,
  unreadMessages,
}: {
  language: Lang;
  tab: ParentTab;
  setTab: (tab: ParentTab) => void;
  unreadMessages: number;
}) {
  const t = makeT(language);
  const tabs: [ParentTab, string][] = [
    ["overview", t("Overview", "Übersicht")],
    ["results", t("Quiz results", "Quizergebnisse")],
    ["progress", t("Progress", "Fortschritt")],
    ["resources", t("Help at home", "Hilfe zu Hause")],
    ["messages", t("Messages", "Nachrichten")],
  ];
  return (
    <nav className="parent-tabs parent-wide" aria-label={t("Sections", "Bereiche")}>
      {tabs.map(([id, label]) => (
        <button key={id} className={tab === id ? "active" : ""} aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}>
          {label}
          {id === "messages" && unreadMessages > 0 && <b>{unreadMessages}</b>}
        </button>
      ))}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// D3 + D4 – teacher-confirmed learning alert and repeated mistake
// ---------------------------------------------------------------------------
export function LearningAlert({ language, quiz, onHelp }: { language: Lang; quiz: ParentQuiz; onHelp: () => void }) {
  const t = makeT(language);
  if (!quiz.visible) return null;
  return quiz.flagConfirmed ? (
    <article className="card parent-alert parent-wide">
      <span className="parent-alert-icon">
        <Icon name="flag" />
      </span>
      <div>
        <Status type="warn">{t("Learning alert · confirmed by Ms. Ashraf", "Lernhinweis · von Frau Ashraf bestätigt")}</Status>
        <h2>{t("Comparing fractions needs extra practice", "Brüche vergleichen braucht mehr Übung")}</h2>
        <p>
          {t(
            "In Quiz 2, Quiz 3 and Quiz 4 Khadija compared fractions by looking only at the bottom number (for example, she wrote 2/3 < 3/5). This is a common step in learning fractions. Ms. Ashraf has set a short lesson and quiz for her.",
            "In Quiz 2, Quiz 3 und Quiz 4 hat Khadija Brüche nur über die untere Zahl verglichen (zum Beispiel schrieb sie 2/3 < 3/5). Das ist ein üblicher Schritt beim Lernen von Brüchen. Frau Ashraf hat ihr eine kurze Lektion und ein Quiz gegeben.",
          )}
        </p>
        <Button icon="idea" variant="secondary" onClick={onHelp}>
          {t("How you can help at home", "So können Sie zu Hause helfen")}
        </Button>
      </div>
    </article>
  ) : (
    <article className="card parent-alert calm parent-wide">
      <span className="parent-alert-icon">
        <Icon name="check" />
      </span>
      <div>
        <Status type="good">{t("No learning alerts", "Keine Lernhinweise")}</Status>
        <p>{t("Ms. Ashraf has not raised any concern for Quiz 4.", "Frau Ashraf hat für Quiz 4 keine Sorge gemeldet.")}</p>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// D7 – practice and pop-quiz status (short card for the overview)
// ---------------------------------------------------------------------------
export function PracticeStatus({ language, quiz }: { language: Lang; quiz: ParentQuiz }) {
  const t = makeT(language);
  const assigned = quiz.visible && quiz.flagConfirmed;
  return (
    <article className="card parent-practice">
      <p className="kicker">{t("PRACTICE AT SCHOOL", "ÜBUNG IN DER SCHULE")}</p>
      <h2>{t("Lesson and pop quiz", "Lektion und Kurz-Quiz")}</h2>
      {!assigned ? (
        <Status type="neutral">{t("No practice assigned right now", "Zurzeit keine Übung zugewiesen")}</Status>
      ) : quiz.practiced ? (
        <>
          <Status type={quiz.practiceScore === 3 ? "good" : "neutral"}>
            {t("Done", "Erledigt")} · {quiz.practiceScore} {t("of 3 right in the pop quiz", "von 3 im Kurz-Quiz richtig")}
          </Status>
          <p>
            {quiz.practiceScore === 3
              ? t("Khadija understood the lesson.", "Khadija hat die Lektion verstanden.")
              : t("Khadija is getting there; one more try will help.", "Khadija ist auf dem Weg; ein weiterer Versuch hilft.")}
          </p>
        </>
      ) : (
        <>
          <Status type="warn">{t("Assigned – not done yet", "Zugewiesen – noch nicht erledigt")}</Status>
          <p>{t("About 5 minutes: a short lesson, then 3 questions.", "Etwa 5 Minuten: eine kurze Lektion, dann 3 Fragen.")}</p>
        </>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// D10 – progress report and acknowledgment
// ---------------------------------------------------------------------------
export function ProgressReport({
  language,
  quiz,
  addNotification,
  notify,
}: {
  language: Lang;
  quiz: ParentQuiz;
  addNotification: Notifier;
  notify: (m: string) => void;
}) {
  const t = makeT(language);
  const s = useClassState();
  if (!quiz.visible) return null;
  const lines = [
    t("Stepwise progress report – Khadija, Grade 4B", "Stepwise-Fortschrittsbericht – Khadija, Klasse 4B"),
    "",
    `${t("Quiz 4: Fractions and word problems", "Quiz 4: Brüche und Sachaufgaben")} – ${quiz.score}/25 (${quiz.percent}%)`,
    `${t("Quiz history", "Quizverlauf")}: 52%, 58%, 64%, ${quiz.percent}%`,
    `${t("Going well", "Das klappt gut")}: ${t("multiplication facts", "Einmaleins")}`,
    `${t("Working on", "Daran arbeitet sie")}: ${t("comparing fractions", "Brüche vergleichen")}${
      quiz.flagConfirmed ? ` (${t("repeated mistake confirmed by Ms. Ashraf", "wiederholter Fehler, von Frau Ashraf bestätigt")})` : ""
    }`,
    `${t("Next step", "Nächster Schritt")}: ${t(
      "a short lesson and quiz in Stepwise; 10 minutes of drawing fractions at home helps.",
      "eine kurze Lektion und ein Quiz in Stepwise; 10 Minuten Brüche malen zu Hause helfen.",
    )}`,
    `${t("Note from Ms. Ashraf", "Notiz von Frau Ashraf")}: ${quiz.teacherFeedback}`,
  ];
  const download = () => {
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = language === "DE" ? "khadija-fortschrittsbericht-quiz4.txt" : "khadija-progress-report-quiz4.txt";
    a.click();
    URL.revokeObjectURL(url);
    notify(t("Report downloaded.", "Bericht heruntergeladen."));
  };
  return (
    <article className="card parent-report parent-wide">
      <div>
        <p className="kicker">{t("PROGRESS REPORT · QUIZ 4", "FORTSCHRITTSBERICHT · QUIZ 4")}</p>
        <h2>{t("Khadija’s report in short", "Khadijas Bericht in Kürze")}</h2>
        <ul>
          <li>
            {t(`Score ${quiz.score}/25 (${quiz.percent}%), up from 52% in Quiz 1.`, `Ergebnis ${quiz.score}/25 (${quiz.percent} %), gestiegen von 52 % in Quiz 1.`)}
          </li>
          <li>{t("Strong in multiplication.", "Stark im Multiplizieren.")}</li>
          <li>{t("Working on comparing fractions.", "Arbeitet am Vergleichen von Brüchen.")}</li>
        </ul>
      </div>
      <div className="report-actions">
        <Button icon="book" variant="secondary" onClick={download}>
          {t("Download report", "Bericht herunterladen")}
        </Button>
        {s.parentAck ? (
          <Status type="good">{t("You confirmed that you read this report", "Sie haben bestätigt, dass Sie den Bericht gelesen haben")}</Status>
        ) : (
          <Button
            icon="check"
            onClick={() => {
              updateClassState({ parentAck: true });
              logActivity("acknowledged", "Khadija", {
                EN: "Parent confirmed reading the Quiz 4 report",
                DE: "Elternteil hat das Lesen des Quiz-4-Berichts bestätigt",
              });
              addNotification(
                "teacher",
                { EN: "Khadija’s parent read the report", DE: "Khadijas Elternteil hat den Bericht gelesen" },
                {
                  EN: "The parent confirmed reading the Quiz 4 progress report.",
                  DE: "Das Elternteil hat das Lesen des Quiz-4-Fortschrittsberichts bestätigt.",
                },
                { EN: "View insights", DE: "Analyse ansehen" },
                "insights",
              );
              notify(t("Thank you – Ms. Ashraf can see that you read the report.", "Danke – Frau Ashraf sieht, dass Sie den Bericht gelesen haben."));
            }}
          >
            {t("I have read this report", "Ich habe den Bericht gelesen")}
          </Button>
        )}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// D2 – approved results and feedback, question by question
// ---------------------------------------------------------------------------
export function ParentResults({ language, quiz, onMessage }: { language: Lang; quiz: ParentQuiz; onMessage: () => void }) {
  const t = makeT(language);
  if (!quiz.visible)
    return (
      <article className="card parent-wide parent-empty">
        <Icon name="lock" />
        <div>
          <h2>{t("Quiz 4 results are not shared yet", "Die Ergebnisse von Quiz 4 sind noch nicht geteilt")}</h2>
          <p>
            {quiz.publishedNotShared
              ? t("Ms. Ashraf has published the results to Khadija but has not shared them with you yet.", "Frau Ashraf hat die Ergebnisse für Khadija veröffentlicht, aber noch nicht mit Ihnen geteilt.")
              : t("Ms. Ashraf is still checking the quiz. You will get a notification.", "Frau Ashraf prüft das Quiz noch. Sie erhalten eine Benachrichtigung.")}
          </p>
        </div>
      </article>
    );
  const explain: Record<number, string> = {
    2: t("Ms. Ashraf adjusted this mark after checking the working.", "Frau Ashraf hat die Punkte nach Prüfung des Rechenwegs angepasst."),
    3: t("Shaded 2 of the 4 parts instead of 3.", "Hat 2 von 4 Teilen statt 3 gefärbt."),
    5: t("Right answer, but the calculation was not written down.", "Richtiges Ergebnis, aber die Rechnung fehlt."),
    7: t("Compared the fractions by looking only at the bottom numbers.", "Hat die Brüche nur über die unteren Zahlen verglichen."),
  };
  return (
    <section className="parent-wide parent-results">
      <article className="card parent-result-head">
        <div>
          <p className="kicker">{t("QUIZ 4 · MATHEMATICS · 17 OCTOBER", "QUIZ 4 · MATHEMATIK · 17. OKTOBER")}</p>
          <h2>{t("Fractions and word problems", "Brüche und Sachaufgaben")}</h2>
          <p>
            <b>{t("Note from Ms. Ashraf:", "Notiz von Frau Ashraf:")}</b> {quiz.teacherFeedback}
          </p>
          <Status type="good">{t("Checked and approved by Ms. Ashraf", "Von Frau Ashraf geprüft und freigegeben")}</Status>
        </div>
        <strong>
          {quiz.score}
          <small>/25 · {quiz.percent}%</small>
        </strong>
      </article>
      <article className="card parent-question-list">
        {questions.map((q) => {
          const mark = q.n === 2 ? `${quiz.awardedMark} / 3` : q.marks;
          const full = mark.split("/").map((x) => x.trim());
          const correct = full[0] === full[1];
          const note = q.n === 2 ? (quiz.awardedMark !== null && quiz.awardedMark < 3 ? explain[2] : null) : explain[q.n];
          return (
            <div className="parent-question" key={q.n}>
              <span>
                <small>
                  {t("Question", "Aufgabe")} {q.n}
                </small>
                <strong>{language === "DE" ? questionTitlesDe[q.n - 1] : q.title}</strong>
                {note && <em>{note}</em>}
              </span>
              <Status type={correct ? "good" : "warn"}>{correct ? t("Correct", "Richtig") : t("Needs practice", "Braucht Übung")}</Status>
              <b>{mark}</b>
            </div>
          );
        })}
      </article>
      <Button icon="message" variant="secondary" onClick={onMessage}>
        {t("Ask Ms. Ashraf about these results", "Frau Ashraf zu diesen Ergebnissen fragen")}
      </Button>
    </section>
  );
}

// ---------------------------------------------------------------------------
// D5 + D7 – progress by topic and practice history
// ---------------------------------------------------------------------------
export function ParentConcepts({ language, quiz }: { language: Lang; quiz: ParentQuiz }) {
  const t = makeT(language);
  const labels = { good: t("Strong", "Stark"), neutral: t("Getting better", "Wird besser"), warn: t("Needs practice", "Braucht Übung") };
  return (
    <article className="card parent-concepts parent-wide">
      <p className="kicker">{t("BY TOPIC", "NACH THEMA")}</p>
      <h2>{t("How each topic is going", "So entwickeln sich die Themen")}</h2>
      <LineChart
        language={language}
        fontSize={13}
        title={t("Khadija’s score in each topic, Quiz 2 to Quiz 4", "Khadijas Ergebnisse pro Thema, Quiz 2 bis Quiz 4")}
        xLabels={["Quiz 2", "Quiz 3", "Quiz 4"]}
        pendingNote={t("not shared yet", "noch nicht geteilt")}
        series={khadijaConcepts.map((concept, index) => ({
          name: concept.name[language],
          values: quiz.visible ? concept.values : [...concept.values.slice(0, 2), null],
          color: conceptColors[index],
          shape: conceptShape(index),
        }))}
      />
      <div className="topic-status-row">
        {khadijaConcepts.map((concept) => (
          <span key={concept.name.EN}>
            <strong>{concept.name[language]}</strong>
            <Status type={concept.level}>{labels[concept.level]}</Status>
          </span>
        ))}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// D6 – teacher-approved resources for home
// ---------------------------------------------------------------------------
export function ParentResources({ language, quiz, notify }: { language: Lang; quiz: ParentQuiz; notify: (m: string) => void }) {
  const t = makeT(language);
  const s = useClassState();
  const r = s.resources;
  if (!quiz.visible || !quiz.flagConfirmed)
    return (
      <article className="card parent-wide parent-empty">
        <Icon name="book" />
        <div>
          <h2>{t("No home activities right now", "Zurzeit keine Aktivitäten für zu Hause")}</h2>
          <p>
            {t(
              "When Ms. Ashraf shares results and recommends practice, the approved materials appear here.",
              "Wenn Frau Ashraf Ergebnisse teilt und Übung empfiehlt, erscheint das freigegebene Material hier.",
            )}
          </p>
        </div>
      </article>
    );
  return (
    <section className="parent-wide parent-resources">
      <p className="kicker">{t("APPROVED BY MS. ASHRAF", "VON FRAU ASHRAF FREIGEGEBEN")}</p>
      <h2>{t("Help Khadija compare fractions at home", "Helfen Sie Khadija zu Hause beim Vergleichen von Brüchen")}</h2>
      <div className="parent-resource-grid">
        {r.video && (
          <article className="card">
            <h3>{t("Watch together (20 seconds)", "Gemeinsam ansehen (20 Sekunden)")}</h3>
            <ExplainerVideo language={language} />
          </article>
        )}
        <article className="card">
          <h3>{t("10-minute activity", "Aktivität für 10 Minuten")}</h3>
          <ol>
            <li>{t("Draw two same-size circles or cut two paper strips.", "Zeichnen Sie zwei gleich große Kreise oder schneiden Sie zwei Papierstreifen.")}</li>
            <li>{t("Colour 2/3 of one and 3/5 of the other.", "Färben Sie 2/3 des einen und 3/5 des anderen.")}</li>
            <li>{t("Ask: which has more coloured? Why?", "Fragen Sie: Wo ist mehr gefärbt? Warum?")}</li>
            <li>{t("Praise looking at both numbers, not just the bottom one.", "Loben Sie, wenn sie auf beide Zahlen schaut, nicht nur auf die untere.")}</li>
          </ol>
          {r.printable !== "none" && (
            <Button
              icon="book"
              variant="secondary"
              onClick={() =>
                notify(
                  r.printable === "game"
                    ? t("Fraction strips game ready to print (demo only).", "Bruchstreifen-Spiel zum Drucken bereit (nur Demo).")
                    : t("Worksheet ready to print (demo only).", "Arbeitsblatt zum Drucken bereit (nur Demo)."),
                )
              }
            >
              {r.printable === "game" ? t("Print fraction strips game", "Bruchstreifen-Spiel drucken") : t("Print worksheet", "Arbeitsblatt drucken")}
            </Button>
          )}
        </article>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// D8 – messages with the teacher
// ---------------------------------------------------------------------------
export function ParentMessages({
  language,
  addNotification,
  notify,
}: {
  language: Lang;
  addNotification: Notifier;
  notify: (m: string) => void;
}) {
  const t = makeT(language);
  const s = useClassState();
  const thread = s.threads.find((x) => x.kind === "parent" && x.student === "Khadija");
  const [text, setText] = useState("");
  if (!thread) return null;
  const topics = [
    t("How can I help with fractions at home?", "Wie kann ich zu Hause bei Brüchen helfen?"),
    t("Could we arrange a short meeting?", "Können wir ein kurzes Gespräch vereinbaren?"),
    t("Could you explain the Quiz 4 mark?", "Können Sie die Punkte in Quiz 4 erklären?"),
  ];
  const send = () => {
    const message = text.trim();
    if (!message) return;
    addThreadMessage(thread.id, { from: "parent", text: message, at: Date.now() }, "open");
    logActivity("parent", "Khadija", { EN: `Parent message: “${message}”`, DE: `Nachricht der Eltern: „${message}“` }, "parent");
    addNotification(
      "teacher",
      { EN: "Message from Khadija’s parent", DE: "Nachricht von Khadijas Elternteil" },
      { EN: message, DE: message },
      { EN: "Open messages", DE: "Nachrichten öffnen" },
      "messages",
    );
    notify(t("Message sent to Ms. Ashraf.", "Nachricht an Frau Ashraf gesendet."));
    setText("");
  };
  return (
    <article className="card parent-wide parent-chat">
      <p className="kicker">{t("MESSAGES", "NACHRICHTEN")}</p>
      <h2>{t("Messages with Ms. Ashraf", "Nachrichten mit Frau Ashraf")}</h2>
      <div className="chat">
        {thread.messages.map((m, i) => (
          <p key={i} className={`bubble ${m.from}`} data-free-text>
            <small>
              {m.from === "teacher" ? t("Ms. Ashraf", "Frau Ashraf") : t("You", "Sie")} · {messageTime(m, language)}
            </small>
            {messageText(m, language)}
          </p>
        ))}
      </div>
      {thread.status === "open" && (
        <Status type="neutral">{t("Ms. Ashraf usually replies within a school day.", "Frau Ashraf antwortet meist innerhalb eines Schultags.")}</Status>
      )}
      <div className="template-chips">
        {topics.map((topic) => (
          <button key={topic} type="button" onClick={() => setText(topic)}>
            {topic}
          </button>
        ))}
      </div>
      <label className="parent-field">
        {t("Your message", "Ihre Nachricht")}
        <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <Button icon="arrow" disabled={!text.trim()} onClick={send}>
        {t("Send to Ms. Ashraf", "An Frau Ashraf senden")}
      </Button>
    </article>
  );
}

// ---------------------------------------------------------------------------
// D9 – parent profile and linked children
// ---------------------------------------------------------------------------
export function ParentProfile({
  language,
  setLanguage,
  notify,
  onBack,
}: {
  language: Lang;
  setLanguage: (l: Lang) => void;
  notify: (m: string) => void;
  onBack: () => void;
}) {
  const t = makeT(language);
  const [prefs, setPrefs] = useState({ results: true, alerts: true, weekly: false });
  const toggles: [keyof typeof prefs, string, string][] = [
    ["results", t("Tell me when results are shared", "Benachrichtigen, wenn Ergebnisse geteilt werden"), t("In the app and by email (demo).", "In der App und per E-Mail (Demo).")],
    ["alerts", t("Learning alerts confirmed by the teacher", "Von der Lehrkraft bestätigte Lernhinweise"), t("Only alerts the teacher has checked.", "Nur Hinweise, die die Lehrkraft geprüft hat.")],
    ["weekly", t("Weekly summary", "Wöchentliche Zusammenfassung"), t("A short email every Friday (demo).", "Jeden Freitag eine kurze E-Mail (Demo).")],
  ];
  return (
    <section className="parent-wide parent-profile">
      <button className="back-link" onClick={onBack}>
        <Icon name="arrow" /> {t("Back to overview", "Zurück zur Übersicht")}
      </button>
      <p className="kicker">{t("PROFILE", "PROFIL")}</p>
      <h1>{t("Your details", "Ihre Angaben")}</h1>
      <div className="parent-profile-grid">
        <article className="card">
          <dl>
            <div><dt>{t("Name", "Name")}</dt><dd>Amira Hassan</dd></div>
            <div><dt>{t("Email", "E-Mail")}</dt><dd>parent@stepwise.demo</dd></div>
            <div>
              <dt>{t("Linked children", "Verknüpfte Kinder")}</dt>
              <dd>
                Khadija · {t("Grade 4B, Ms. Somaya Ashraf", "Klasse 4B, Frau Somaya Ashraf")}
                <br />
                Yara · {t("Grade 2A, Ms. Dina Hamed", "Klasse 2A, Frau Dina Hamed")}
              </dd>
            </div>
          </dl>
        </article>
        <article className="card">
          <label className="parent-field">
            {t("Language", "Sprache")}
            <select value={language} onChange={(e) => setLanguage(e.target.value as Lang)}>
              <option value="EN">English</option>
              <option value="DE">Deutsch</option>
            </select>
          </label>
          {toggles.map(([key, label, hint]) => (
            <label className="share-toggle" key={key}>
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={(e) => {
                  setPrefs({ ...prefs, [key]: e.target.checked });
                  notify(t("Notification setting saved.", "Benachrichtigungseinstellung gespeichert."));
                }}
              />
              <span>
                <strong>{label}</strong>
                <small>{hint}</small>
              </span>
            </label>
          ))}
        </article>
      </div>
    </section>
  );
}


// ---------------------------------------------------------------------------
// D9 – second linked child: same tabs and layout as Khadija, Yara's own data
// ---------------------------------------------------------------------------
const yaraQuizzes = [
  { n: 1, en: "Numbers to 100", de: "Zahlen bis 100", date: { EN: "10 September", DE: "10. September" }, score: 14, of: 20 },
  { n: 2, en: "Addition", de: "Addition", date: { EN: "24 September", DE: "24. September" }, score: 19, of: 25 },
  { n: 3, en: "Addition and subtraction", de: "Addition und Subtraktion", date: { EN: "8 October", DE: "8. Oktober" }, score: 41, of: 50 },
];
/** Kept outside the component so messages survive switching between children. */
let yaraMessages: { text: string; at: number }[] = [];
const yaraTopics = [
  { en: "Adding", de: "Addieren", values: [72, 80, 88], level: "good" as const },
  { en: "Subtracting", de: "Subtrahieren", values: [64, 70, 78], level: "good" as const },
  { en: "Telling the time", de: "Uhrzeit lesen", values: [50, 55, 60], level: "neutral" as const },
];

export function SiblingView({
  language,
  tab,
  setTab,
  notify,
}: {
  language: Lang;
  tab: ParentTab;
  setTab: (tab: ParentTab) => void;
  notify: (m: string) => void;
}) {
  const t = makeT(language);
  const [messages, setMessages] = useState(yaraMessages);
  const [text, setText] = useState("");
  const percents = yaraQuizzes.map((q) => Math.round((q.score / q.of) * 100));
  const labels = { good: t("Strong", "Stark"), neutral: t("Getting better", "Wird besser"), warn: t("Needs practice", "Braucht Übung") };
  const latest = yaraQuizzes[yaraQuizzes.length - 1];
  return (
    <>
      <section className="parent-hello">
        <div className="parent-avatar">Y</div>
        <div>
          <p className="kicker">{t("YARA’S LEARNING", "YARAS LERNEN")}</p>
          <h1>{t("A clear view of her learning.", "Ein klarer Blick auf ihren Lernstand.")}</h1>
          <p>{t("Grade 2A · Ms. Dina Hamed", "Klasse 2A · Frau Dina Hamed")}</p>
        </div>
      </section>
      <ParentTabs language={language} tab={tab} setTab={setTab} unreadMessages={0} />

      {tab === "overview" && (
        <>
          <article className="parent-score card previous-score">
            <div>
              <Status type="good">{t("Published", "Veröffentlicht")}</Status>
              <p className="kicker">{t("QUIZ 3 · MATHEMATICS", "QUIZ 3 · MATHEMATIK")}</p>
              <h2>{t(latest.en, latest.de)}</h2>
              <p>{latest.date[language]}</p>
            </div>
            <strong>
              {latest.score}
              <small>/{latest.of} · {percents[2]}%</small>
            </strong>
          </article>
          <article className="card parent-alert calm parent-wide">
            <span className="parent-alert-icon">
              <Icon name="check" />
            </span>
            <div>
              <Status type="good">{t("No learning alerts", "Keine Lernhinweise")}</Status>
              <p>{t("Ms. Hamed has not raised any concern.", "Frau Hamed hat keine Sorge gemeldet.")}</p>
            </div>
          </article>
          <article className="parent-message card">
            <span>
              <Icon name="check" />
            </span>
            <div>
              <h2>{t("What’s going well", "Das klappt gut")}</h2>
              <p>{t("Yara adds two-digit numbers confidently.", "Yara addiert zweistellige Zahlen sicher.")}</p>
            </div>
          </article>
          <article className="parent-message peach card">
            <span>
              <Icon name="idea" />
            </span>
            <div>
              <h2>{t("What to practice next", "Das sollte sie als Nächstes üben")}</h2>
              <p>{t("Telling the time to the half hour.", "Die Uhrzeit auf die halbe Stunde lesen.")}</p>
            </div>
          </article>
          <article className="card parent-practice">
            <p className="kicker">{t("PRACTICE AT SCHOOL", "ÜBUNG IN DER SCHULE")}</p>
            <h2>{t("Lesson and pop quiz", "Lektion und Kurz-Quiz")}</h2>
            <Status type="neutral">{t("No practice assigned right now", "Zurzeit keine Übung zugewiesen")}</Status>
          </article>
          <Button icon="message" onClick={() => setTab("messages")}>
            {t("Message Ms. Hamed", "Frau Hamed schreiben")}
          </Button>
        </>
      )}

      {tab === "results" && (
        <section className="parent-wide parent-results">
          <article className="card parent-question-list">
            {yaraQuizzes
              .slice()
              .reverse()
              .map((q) => (
                <div className="parent-question" key={q.n}>
                  <span>
                    <small>
                      Quiz {q.n} · {q.date[language]}
                    </small>
                    <strong>{t(q.en, q.de)}</strong>
                  </span>
                  <Status type="good">{t("Published", "Veröffentlicht")}</Status>
                  <b>
                    {q.score} / {q.of}
                  </b>
                </div>
              ))}
          </article>
          <p className="parent-note">
            <Icon name="lock" size={15} />{" "}
            {t("Ms. Hamed has not given a new quiz since 8 October.", "Frau Hamed hat seit dem 8. Oktober kein neues Quiz gegeben.")}
          </p>
        </section>
      )}

      {tab === "progress" && (
        <>
          <article className="card parent-concepts parent-wide">
            <p className="kicker">{t("PUBLISHED QUIZZES", "VERÖFFENTLICHTE QUIZZE")}</p>
            <h2>{t("Progress so far", "Bisheriger Fortschritt")}</h2>
            <LineChart
              language={language}
              fontSize={13}
              title={t("Yara’s quiz results, Quiz 1 to Quiz 3", "Yaras Quizergebnisse, Quiz 1 bis Quiz 3")}
              xLabels={["Quiz 1", "Quiz 2", "Quiz 3"]}
              series={[{ name: "Yara", values: percents, color: conceptColors[0], shape: conceptShape(0) }]}
            />
          </article>
          <article className="card parent-concepts parent-wide">
            <p className="kicker">{t("BY TOPIC", "NACH THEMA")}</p>
            <h2>{t("How each topic is going", "So entwickeln sich die Themen")}</h2>
            <LineChart
              language={language}
              fontSize={13}
              title={t("Yara’s score in each topic, Quiz 1 to Quiz 3", "Yaras Ergebnisse pro Thema, Quiz 1 bis Quiz 3")}
              xLabels={["Quiz 1", "Quiz 2", "Quiz 3"]}
              series={yaraTopics.map((topic, index) => ({
                name: t(topic.en, topic.de),
                values: topic.values,
                color: conceptColors[index],
                shape: conceptShape(index),
              }))}
            />
            <div className="topic-status-row">
              {yaraTopics.map((topic) => (
                <span key={topic.en}>
                  <strong>{t(topic.en, topic.de)}</strong>
                  <Status type={topic.level}>{labels[topic.level]}</Status>
                </span>
              ))}
            </div>
          </article>
        </>
      )}

      {tab === "resources" && (
        <article className="card parent-wide parent-empty">
          <Icon name="book" />
          <div>
            <h2>{t("No home activities right now", "Zurzeit keine Aktivitäten für zu Hause")}</h2>
            <p>
              {t(
                "When Ms. Hamed recommends practice for Yara, the approved materials appear here.",
                "Wenn Frau Hamed Übung für Yara empfiehlt, erscheint das freigegebene Material hier.",
              )}
            </p>
          </div>
        </article>
      )}

      {tab === "messages" && (
        <article className="card parent-wide parent-chat">
          <p className="kicker">{t("MESSAGES", "NACHRICHTEN")}</p>
          <h2>{t("Messages with Ms. Hamed", "Nachrichten mit Frau Hamed")}</h2>
          {messages.length === 0 ? (
            <p>{t("No messages yet.", "Noch keine Nachrichten.")}</p>
          ) : (
            <div className="chat">
              {messages.map((m, i) => (
                <p key={i} className="bubble parent" data-free-text>
                  <small>
                    {t("You", "Sie")} · {t("Just now", "Gerade eben")}
                  </small>
                  {m.text}
                </p>
              ))}
            </div>
          )}
          <label className="parent-field">
            {t("Your message", "Ihre Nachricht")}
            <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          <Button
            icon="arrow"
            disabled={!text.trim()}
            onClick={() => {
              yaraMessages = [...messages, { text: text.trim(), at: Date.now() }];
              setMessages(yaraMessages);
              setText("");
              notify(t("Message sent to Ms. Hamed.", "Nachricht an Frau Hamed gesendet."));
            }}
          >
            {t("Send to Ms. Hamed", "An Frau Hamed senden")}
          </Button>
        </article>
      )}
    </>
  );
}
