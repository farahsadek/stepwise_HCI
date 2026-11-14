import { useEscape } from "./heuristics";
import { useEffect, useRef, useState, type CSSProperties } from "react";

type Lang = "EN" | "DE";
export type PageQuality = "checking" | "good" | "blurry" | "dark" | "small" | "pdf";

/**
 * Simple on-device photo check: too small, too dark, or blurry
 * (variance of the Laplacian on a downscaled grey copy). Nothing is uploaded.
 */
export function analyzePage(url: string): Promise<PageQuality> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth < 400 || img.naturalHeight < 400) return resolve("small");
      const scale = Math.min(1, 480 / img.naturalWidth);
      const w = Math.max(3, Math.round(img.naturalWidth * scale));
      const h = Math.max(3, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return resolve("good");
      ctx.drawImage(img, 0, 0, w, h);
      const { data } = ctx.getImageData(0, 0, w, h);
      const grey = new Float32Array(w * h);
      let total = 0;
      for (let i = 0; i < w * h; i++) {
        const g = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
        grey[i] = g;
        total += g;
      }
      if (total / (w * h) < 70) return resolve("dark");
      let sum = 0;
      let squares = 0;
      let count = 0;
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const i = y * w + x;
          const lap = 4 * grey[i] - grey[i - 1] - grey[i + 1] - grey[i - w] - grey[i + w];
          sum += lap;
          squares += lap * lap;
          count++;
        }
      }
      const variance = squares / count - (sum / count) ** 2;
      resolve(variance < 60 ? "blurry" : "good");
    };
    img.onerror = () => resolve("blurry");
    img.src = url;
  });
}

const closeIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

/** Live camera with a capture button. Falls back to a sample photo when no camera is available. */
export function CameraCapture({
  language,
  onCapture,
  onSample,
  onClose,
}: {
  language: Lang;
  onCapture: (url: string) => void;
  onSample: () => void;
  onClose: () => void;
}) {
  const t = (en: string, de: string) => (language === "DE" ? de : en);
  const videoRef = useRef<HTMLVideoElement>(null);
  useEscape(true, onClose);
  const [state, setState] = useState<"starting" | "live" | "unavailable">("starting");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("unavailable");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment", width: { ideal: 1600 } } })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => undefined);
        }
        setState("live");
      })
      .catch(() => setState("unavailable"));
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    onCapture(canvas.toDataURL("image/jpeg", 0.9));
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="camera-title">
      <div className="modal camera-modal">
        <button className="modal-close" onClick={onClose} aria-label={t("Close", "Schließen")} title={t("Close", "Schließen")}>
          {closeIcon}
        </button>
        <h2 id="camera-title">{t("Take a photo of your page", "Fotografiere deine Seite")}</h2>
        <div className={`camera-frame ${state}`}>
          <video ref={videoRef} playsInline muted aria-label={t("Camera picture", "Kamerabild")} />
          {state === "live" && <span className="camera-guide" aria-hidden="true" />}
          {state === "starting" && <p>{t("Starting the camera…", "Kamera wird gestartet…")}</p>}
          {state === "unavailable" && (
            <p>
              {t(
                "The camera is not available here. You can use a sample photo or choose a file.",
                "Die Kamera ist hier nicht verfügbar. Du kannst ein Beispielfoto nehmen oder eine Datei auswählen.",
              )}
            </p>
          )}
        </div>
        <p className="camera-tip">
          {t("Fit the whole page inside the frame.", "Die ganze Seite muss in den Rahmen passen.")}
        </p>
        <div className="modal-actions camera-actions">
          <button type="button" className="button secondary" onClick={onSample}>
            {t("Use sample photo (demo)", "Beispielfoto nehmen (Demo)")}
          </button>
          <button
            type="button"
            className="button primary"
            onClick={capture}
            disabled={state !== "live"}
          >
            {t("Take photo", "Foto aufnehmen")}
          </button>
        </div>
      </div>
    </div>
  );
}

const pie = (parts: number, filled: number, color: string): CSSProperties => ({
  background: `repeating-conic-gradient(#35433d 0deg 1.5deg, transparent 1.5deg ${360 / parts}deg), conic-gradient(${color} 0 ${(filled / parts) * 100}%, #eeeaf5 0)`,
});

const SCENE_MS = 5000;

/** Short animated explainer ("video") with captions, play/pause and replay. Works offline. */
export function ExplainerVideo({ language }: { language: Lang }) {
  const t = (en: string, de: string) => (language === "DE" ? de : en);
  const scenes = [
    {
      caption: t(
        "A fraction is part of a whole. The bottom number tells how many equal pieces there are.",
        "Ein Bruch ist ein Teil von einem Ganzen. Die untere Zahl sagt, wie viele gleiche Stücke es gibt.",
      ),
      visual: (
        <div className="video-pies">
          <span><i className="video-pie" style={pie(2, 0, "#6d4aff")} /><b>2</b></span>
          <span><i className="video-pie" style={pie(4, 0, "#ffb68a")} /><b>4</b></span>
        </div>
      ),
    },
    {
      caption: t(
        "More pieces means smaller pieces. One quarter is smaller than one half.",
        "Mehr Stücke heißt kleinere Stücke. Ein Viertel ist kleiner als eine Hälfte.",
      ),
      visual: (
        <div className="video-pies">
          <span><i className="video-pie" style={pie(2, 1, "#6d4aff")} /><b>1/2</b></span>
          <strong>&gt;</strong>
          <span><i className="video-pie" style={pie(4, 1, "#ffb68a")} /><b>1/4</b></span>
        </div>
      ),
    },
    {
      caption: t(
        "Different bottom numbers? Make them the same: 2/3 = 10/15 and 3/5 = 9/15.",
        "Verschiedene untere Zahlen? Mache sie gleich: 2/3 = 10/15 und 3/5 = 9/15.",
      ),
      visual: (
        <div className="video-strips">
          {[
            ["2/3 = 10/15", 10, "#6d4aff"],
            ["3/5 = 9/15", 9, "#ffb68a"],
          ].map(([label, filled, color]) => (
            <div key={label as string}>
              <b>{label}</b>
              <span>
                {Array.from({ length: 15 }, (_, i) => (
                  <i key={i} style={{ background: i < (filled as number) ? (color as string) : "#eeeaf5" }} />
                ))}
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      caption: t(
        "10 is more than 9, so 2/3 is bigger. Always look at both numbers!",
        "10 ist mehr als 9, also ist 2/3 größer. Schau immer auf beide Zahlen!",
      ),
      visual: (
        <div className="video-pies">
          <span><i className="video-pie" style={pie(3, 2, "#6d4aff")} /><b>2/3</b></span>
          <strong>&gt;</strong>
          <span><i className="video-pie" style={pie(5, 3, "#ffb68a")} /><b>3/5</b></span>
        </div>
      ),
    },
  ];
  const total = scenes.length * SCENE_MS;
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setElapsed((current) => {
        const next = current + 100;
        if (next >= total) {
          setPlaying(false);
          return total;
        }
        return next;
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [playing, total]);

  const finished = elapsed >= total;
  const scene = Math.min(scenes.length - 1, Math.floor(elapsed / SCENE_MS));
  const seconds = Math.round(total / 1000);

  return (
    <figure className="explainer-video" aria-label={t("Lesson video", "Lernvideo")}>
      <div className="video-stage">
        {scenes[scene].visual}
        <p className="video-caption" aria-live="polite">
          {scenes[scene].caption}
        </p>
      </div>
      <div className="video-controls">
        <button
          type="button"
          className="button primary"
          onClick={() => {
            if (finished) setElapsed(0);
            setPlaying(!playing || finished);
          }}
        >
          {playing ? t("Pause", "Pause") : finished ? t("Watch again", "Nochmal ansehen") : t("Play video", "Video abspielen")}
        </button>
        <div
          className="video-progress"
          role="progressbar"
          aria-label={t("Video progress", "Videofortschritt")}
          aria-valuemin={0}
          aria-valuemax={seconds}
          aria-valuenow={Math.round(elapsed / 1000)}
        >
          <i style={{ width: `${(elapsed / total) * 100}%` }} />
        </div>
        <span className="video-time">
          {Math.round(elapsed / 1000)} / {seconds} s
        </span>
      </div>
      <figcaption>
        {t("Scene", "Szene")} {scene + 1} {t("of", "von")} {scenes.length} · {t("captions on", "Untertitel an")}
      </figcaption>
    </figure>
  );
}

/* ---------- Picture guide for scanning (made for younger students) ---------- */

/** A small paper with "handwriting" lines, drawn at x,y. */
const paperLines = (x: number, y: number, w = 40, h = 52) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx="3" fill="#fff" stroke="#35433d" strokeWidth="2" />
    {[0, 1, 2, 3].map((n) => (
      <line
        key={n}
        x1={x + 7}
        x2={x + w - (n % 2 ? 12 : 7)}
        y1={y + 11 + n * 10}
        y2={y + 11 + n * 10}
        stroke="#35433d"
        strokeOpacity="0.55"
        strokeWidth="3"
        strokeLinecap="round"
      />
    ))}
  </g>
);

const guidePictures = [
  // 1. Paper flat on a table
  <svg viewBox="0 0 120 90" key="flat" aria-hidden="true">
    <rect x="6" y="62" width="108" height="8" rx="3" fill="#d9b88f" stroke="#35433d" strokeWidth="2" />
    <line x1="18" y1="70" x2="18" y2="86" stroke="#35433d" strokeWidth="3" />
    <line x1="102" y1="70" x2="102" y2="86" stroke="#35433d" strokeWidth="3" />
    <path d="M30 60 L44 44 H94 L84 60 Z" fill="#fff" stroke="#35433d" strokeWidth="2" strokeLinejoin="round" />
    <path d="M46 52 H80 M52 48 H84" stroke="#35433d" strokeOpacity="0.5" strokeWidth="2.5" strokeLinecap="round" />
  </svg>,
  // 2. Good light
  <svg viewBox="0 0 120 90" key="light" aria-hidden="true">
    <circle cx="28" cy="24" r="11" fill="#f5dfa8" stroke="#35433d" strokeWidth="2" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
      <line
        key={a}
        x1={28 + Math.cos((a * Math.PI) / 180) * 15}
        y1={24 + Math.sin((a * Math.PI) / 180) * 15}
        x2={28 + Math.cos((a * Math.PI) / 180) * 20}
        y2={24 + Math.sin((a * Math.PI) / 180) * 20}
        stroke="#35433d"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    ))}
    {paperLines(62, 26)}
  </svg>,
  // 3. Whole page in the frame
  <svg viewBox="0 0 120 90" key="frame" aria-hidden="true">
    <rect x="22" y="4" width="76" height="82" rx="9" fill="#b8d8e8" stroke="#35433d" strokeWidth="2.5" />
    {paperLines(40, 18, 40, 54)}
    <path
      d="M33 22 V13 H42 M78 13 H87 V22 M87 68 V77 H78 M42 77 H33 V68"
      fill="none"
      stroke="#2f7a52"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
  </svg>,
  // 4. Hold still, tap the button
  <svg viewBox="0 0 120 90" key="tap" aria-hidden="true">
    <rect x="14" y="8" width="92" height="66" rx="9" fill="#b8d8e8" stroke="#35433d" strokeWidth="2.5" />
    {paperLines(30, 16, 34, 46)}
    <circle cx="88" cy="41" r="9" fill="#fff" stroke="#35433d" strokeWidth="2.5" />
    <path d="M88 60 v-6 M82 82 c0-8 2-12 6-14 c4 2 6 6 6 14" fill="#f5dfa8" stroke="#35433d" strokeWidth="2" strokeLinecap="round" />
  </svg>,
  // 5. Check every page
  <svg viewBox="0 0 120 90" key="check" aria-hidden="true">
    {paperLines(18, 20)}
    {paperLines(62, 20)}
    <circle cx="52" cy="70" r="12" fill="#a8c9b5" stroke="#35433d" strokeWidth="2" />
    <path d="M46 70 l4 4 l8 -8" fill="none" stroke="#35433d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="96" cy="70" r="12" fill="#a8c9b5" stroke="#35433d" strokeWidth="2" />
    <path d="M90 70 l4 4 l8 -8" fill="none" stroke="#35433d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
];

/** Numbered picture steps that show how to photograph and send an exam. */
export function ScanGuide({ language }: { language: Lang }) {
  const t = (en: string, de: string) => (language === "DE" ? de : en);
  const steps = [
    t("Put the paper flat on a table.", "Lege das Blatt flach auf den Tisch."),
    t("Use good light. No shadows.", "Nutze gutes Licht. Keine Schatten."),
    t("Fit all 4 corners in the frame.", "Alle 4 Ecken müssen in den Rahmen."),
    t("Hold still. Tap the button.", "Halte still. Tippe auf den Knopf."),
    t("Do this for every page. Then check them.", "Mach das für jede Seite. Dann prüfe sie."),
  ];
  return (
    <ol className="scan-guide" aria-label={t("How to take a good photo", "So gelingt ein gutes Foto")}>
      {steps.map((text, index) => (
        <li key={text}>
          <span className="scan-guide-number" aria-hidden="true">
            {index + 1}
          </span>
          {guidePictures[index]}
          <span>{text}</span>
        </li>
      ))}
    </ol>
  );
}

export type ExampleKind = "good" | "blurry" | "dark" | "cutoff";

/** A tiny picture of a good or a bad page photo. */
export function ExamplePhoto({ kind }: { kind: ExampleKind }) {
  const id = `ex-${kind}`;
  return (
    <svg viewBox="0 0 60 76" className="example-photo" aria-hidden="true">
      <defs>
        <filter id={`${id}-blur`}>
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <clipPath id={`${id}-clip`}>
          <rect x="0" y="0" width="60" height="76" rx="6" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        <rect width="60" height="76" fill="#cdbfa8" />
        <g
          filter={kind === "blurry" ? `url(#${id}-blur)` : undefined}
          transform={kind === "cutoff" ? "translate(22 -14)" : undefined}
        >
          {paperLines(10, 10, 40, 56)}
        </g>
        {kind === "dark" && <rect width="60" height="76" fill="#0d1512" opacity="0.72" />}
      </g>
      <rect x="1" y="1" width="58" height="74" rx="6" fill="none" stroke="#35433d" strokeWidth="2" />
    </svg>
  );
}

/** "Which photo is good?" strip: one good example, three common problems. */
export function PhotoExamples({ language }: { language: Lang }) {
  const t = (en: string, de: string) => (language === "DE" ? de : en);
  const items: { kind: ExampleKind; label: string; good: boolean }[] = [
    { kind: "good", label: t("Clear and whole", "Scharf und ganz"), good: true },
    { kind: "blurry", label: t("Blurry", "Unscharf"), good: false },
    { kind: "dark", label: t("Too dark", "Zu dunkel"), good: false },
    { kind: "cutoff", label: t("Cut off", "Abgeschnitten"), good: false },
  ];
  return (
    <div className="photo-examples">
      <h3>{t("Which photo is good?", "Welches Foto ist gut?")}</h3>
      <ul>
        {items.map((item) => (
          <li key={item.kind} className={item.good ? "good" : "bad"}>
            <ExamplePhoto kind={item.kind} />
            <span className="example-mark" aria-hidden="true">
              {item.good ? "✓" : "✗"}
            </span>
            <span>
              <span className="sr-only">{item.good ? t("Good: ", "Gut: ") : t("Not good: ", "Nicht gut: ")}</span>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
