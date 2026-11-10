import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "./ui";

type Lang = "EN" | "DE";
const makeT = (language: Lang) => (en: string, de: string) => (language === "DE" ? de : en);

/** Nielsen #3: Escape closes the dialog or popover that is open. */
export function useEscape(active: boolean, onClose: () => void) {
  const latest = useRef(onClose);
  latest.current = onClose;
  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") latest.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);
}

/**
 * Nielsen #10: small "What does this mean?" help. Opens on hover, on keyboard focus and on click;
 * Escape closes it. The explanation is linked with aria-describedby.
 */
export function HelpTip({ language, topic, children }: { language: Lang; topic: string; children: ReactNode }) {
  const t = makeT(language);
  const [open, setOpen] = useState(false);
  const id = useId();
  useEscape(open, () => setOpen(false));
  const label = `${t("What does this mean?", "Was bedeutet das?")} ${topic}`;
  return (
    <span className="help-tip" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className="help-tip-button"
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen(!open)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        ?
      </button>
      {open && (
        <span role="tooltip" id={id} className="help-tip-bubble">
          <strong>{topic}</strong>
          {children}
        </span>
      )}
    </span>
  );
}

/** Nielsen #9: an error says what happened and what to do next; icon + text, announced as an alert. */
export function ErrorNote({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="error-note" role="alert">
      <Icon name="warning" size={18} />
      <span>{children}</span>
      {action}
    </div>
  );
}

/** Nielsen #1: visible progress while the AI marks a paper (simulated, about 1.2 seconds). */
export function GradingLoader({ language, who, onDone }: { language: Lang; who: string; onDone: () => void }) {
  const t = makeT(language);
  const [progress, setProgress] = useState(0);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const start = Date.now();
    const id = window.setInterval(() => {
      const value = Math.min(100, Math.round((Date.now() - start) / 12));
      setProgress(value);
      if (value >= 100) {
        window.clearInterval(id);
        done.current();
      }
    }, 60);
    return () => window.clearInterval(id);
  }, []);
  const step =
    progress < 35
      ? t("Reading the checked answers…", "Geprüfte Antworten werden gelesen…")
      : progress < 70
        ? t("Comparing with the marking scheme…", "Vergleich mit dem Bewertungsschema…")
        : t("Working out partial marks…", "Teilpunkte werden berechnet…");
  return (
    <div className="grading-loader" role="status" aria-live="polite" aria-busy="true">
      <span className="grading-spinner" aria-hidden="true" />
      <div>
        <strong>{t(`AI is grading ${who}’s paper…`, `Die KI bewertet die Arbeit von ${who}…`)}</strong>
        <small>{step}</small>
        <div
          className="grading-progress"
          role="progressbar"
          aria-label={t("Grading progress", "Fortschritt der Bewertung")}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <i style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}

/** Nielsen #5: confirm before an action that is hard to take back. Escape and Cancel close it. */
export function ConfirmDialog({
  language,
  icon,
  title,
  children,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  language: Lang;
  icon: IconName;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = makeT(language);
  const id = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEscape(true, onCancel);
  useEffect(() => cancelRef.current?.focus(), []);
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby={id}>
      <div className="modal confirm-dialog">
        <button className="modal-close" onClick={onCancel} aria-label={t("Close", "Schließen")} title={t("Close", "Schließen")}>
          <Icon name="close" />
        </button>
        <span className="modal-icon">
          <Icon name={icon} />
        </span>
        <h2 id={id}>{title}</h2>
        {children}
        <div className="modal-actions">
          <button ref={cancelRef} type="button" className="button ghost" onClick={onCancel}>
            <Icon name="close" />
            {t("Cancel", "Abbrechen")}
          </button>
          <button type="button" className="button primary" onClick={onConfirm}>
            <Icon name="check" />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
