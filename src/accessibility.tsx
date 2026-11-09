import { useEffect, useRef, useState } from "react";

type Lang = "EN" | "DE";
type TextSize = "md" | "lg" | "xl";

const SIZE_KEY = "stepwise-text-size";
const CONTRAST_KEY = "stepwise-contrast";
export const READ_ALOUD_EVENT = "stepwise-read-aloud";
/** Ask the student toolbar to read the current screen (or the open dialog) aloud. */
export const requestReadAloud = () => window.dispatchEvent(new Event(READ_ALOUD_EVENT));

function readPref<T extends string>(key: string, allowed: T[], fallback: T): T {
  try {
    const value = window.localStorage.getItem(key) as T | null;
    return value && allowed.includes(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function savePref(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: preference lasts for this visit only */
  }
}

/**
 * Student accessibility toolbar: read aloud for whatever screen is showing,
 * three text sizes and a high-contrast mode. Preferences are remembered.
 */
export function AccessibilityToolbar({
  language,
  targetSelector,
  screenKey,
}: {
  language: Lang;
  targetSelector: string;
  screenKey: string;
}) {
  const t = (en: string, de: string) => (language === "DE" ? de : en);
  const [size, setSize] = useState<TextSize>(() => readPref<TextSize>(SIZE_KEY, ["md", "lg", "xl"], "md"));
  const [contrast, setContrast] = useState(() => readPref(CONTRAST_KEY, ["normal", "high"], "normal") === "high");
  const [reading, setReading] = useState(false);
  const runId = useRef(0);
  const highlighted = useRef<Element | null>(null);

  useEffect(() => {
    document.documentElement.dataset.textSize = size;
    document.documentElement.dataset.contrast = contrast ? "high" : "normal";
    savePref(SIZE_KEY, size);
    savePref(CONTRAST_KEY, contrast ? "high" : "normal");
  }, [size, contrast]);

  const clearHighlight = () => {
    highlighted.current?.classList.remove("reading-now");
    highlighted.current = null;
  };

  const stop = () => {
    runId.current += 1;
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* speech not available */
    }
    clearHighlight();
    setReading(false);
  };

  // Leaving the student view (or changing screen) stops the reading and restores the page.
  useEffect(() => {
    stop();
  }, [screenKey, language]);
  useEffect(
    () => () => {
      stop();
      delete document.documentElement.dataset.textSize;
      delete document.documentElement.dataset.contrast;
    },
    [],
  );

  const start = () => {
    // An open dialog is read instead of the page behind it.
    const root = document.querySelector(".student-shell .modal") ?? document.querySelector(targetSelector);
    if (!root) return;
    const candidates = Array.from(
      root.querySelectorAll<HTMLElement>(
        [
          "h1, h2, h3, p, label, li, dt, dd, figcaption",
          ".status, .q-result strong",
          ".question-row div > span:not(.status)",
          ".home-update-row > span, .learning-spot strong, .repeat-evidence span",
          ".video-caption",
        ].join(", "),
      ),
    ).filter((el) => (el.innerText ?? "").trim().length > 1 && el.offsetParent !== null);
    // Skip elements that sit inside another block that is already read.
    const blocks = candidates.filter((el) => !candidates.some((other) => other !== el && other.contains(el)));
    if (blocks.length === 0) return;
    const id = ++runId.current;
    setReading(true);
    const speakBlock = (index: number) => {
      if (runId.current !== id) return;
      clearHighlight();
      if (index >= blocks.length) {
        setReading(false);
        return;
      }
      const el = blocks[index];
      el.classList.add("reading-now");
      highlighted.current = el;
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      const text = el.innerText.replace(/\s+/g, " ").trim();
      const next = () => speakBlock(index + 1);
      const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
      if (synth && typeof SpeechSynthesisUtterance !== "undefined") {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = language === "DE" ? "de-DE" : "en-US";
          utterance.rate = 0.9;
          let finished = false;
          const done = () => {
            if (finished) return;
            finished = true;
            next();
          };
          utterance.onend = done;
          // No voice available (some browsers/devices): keep the highlight moving at reading pace.
          utterance.onerror = () => window.setTimeout(done, Math.max(1200, text.length * 55));
          synth.speak(utterance);
          // Safety net: some browsers never fire onend.
          window.setTimeout(done, Math.max(2500, text.length * 120));
          return;
        } catch {
          /* fall through to silent highlight mode */
        }
      }
      window.setTimeout(next, Math.max(1200, text.length * 55));
    };
    speakBlock(0);
  };

  // Other student controls (e.g. a dialog's own read-aloud button) can ask the toolbar to read.
  const startRef = useRef(start);
  startRef.current = start;
  useEffect(() => {
    const onRequest = () => {
      stop();
      startRef.current();
    };
    window.addEventListener(READ_ALOUD_EVENT, onRequest);
    return () => window.removeEventListener(READ_ALOUD_EVENT, onRequest);
  }, []);

  const sizes: { id: TextSize; label: string; name: string }[] = [
    { id: "md", label: "A", name: t("Normal text", "Normaler Text") },
    { id: "lg", label: "A+", name: t("Large text", "Großer Text") },
    { id: "xl", label: "A++", name: t("Extra large text", "Sehr großer Text") },
  ];

  return (
    <div className="a11y-toolbar" role="toolbar" aria-label={t("Accessibility tools", "Hilfen")}>
      <button
        type="button"
        className={`a11y-read ${reading ? "active" : ""}`}
        onClick={reading ? stop : start}
        aria-pressed={reading}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 10v4h4l5 4V6l-5 4zM16 9c1.5 1.7 1.5 4.3 0 6M19 6c3 3.4 3 8.6 0 12" />
        </svg>
        {reading ? t("Stop reading", "Vorlesen stoppen") : t("Read aloud", "Vorlesen")}
      </button>
      <div className="a11y-group" role="group" aria-label={t("Text size", "Textgröße")}>
        {sizes.map((item) => (
          <button
            type="button"
            key={item.id}
            className={size === item.id ? "active" : ""}
            aria-pressed={size === item.id}
            aria-label={item.name}
            onClick={() => setSize(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className={`a11y-contrast ${contrast ? "active" : ""}`}
        aria-pressed={contrast}
        onClick={() => setContrast(!contrast)}
      >
        {t("High contrast", "Hoher Kontrast")}
      </button>
    </div>
  );
}