"use client";
import { useEffect, useRef, useState } from "react";
import Hotspots from "./Hotspots";
import { distanceM } from "./lib/geo";

type Stage = { name: string; at: number; face: string; note: string };
type LogEntry = { id: number; text: string; points: number };
type Kind = "litter" | "refund";

// XP needed to reach each stage
const STAGES: Stage[] = [
  { name: "Egg", at: 0, face: "🥚", note: "Waiting to hatch" },
  { name: "Hatch", at: 100, face: "🐣", note: "Baby sprout" },
  { name: "Evolve", at: 500, face: "🌿", note: "Leaf warrior" },
  { name: "Guardian", at: 1500, face: "🐉", note: "Final evolution" },
];

const XP = { litter: 20, refundPerDollar: 100, stepsPer: 1000, stepXp: 10 };

const STEP_LENGTH_M = 0.75; // average walking step, in metres

function stageFor(xp: number): number {
  let i = 0;
  STAGES.forEach((s, n) => {
    if (xp >= s.at) i = n;
  });
  return i;
}

// Button that lets the person choose: open the camera or pick a file
function PhotoButton({ label, busy, onFile }: { label: string; busy: boolean; onFile: (f: File) => void }) {
  const [open, setOpen] = useState(false);
  const [cam, setCam] = useState(false);
  const [msg, setMsg] = useState("");
  const files = useRef<HTMLInputElement>(null);
  const phoneCamera = useRef<HTMLInputElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);

  // Show the live camera feed once the video element exists
  useEffect(() => {
    if (cam && video.current && stream.current) video.current.srcObject = stream.current;
  }, [cam]);
  useEffect(() => () => stream.current?.getTracks().forEach((t) => t.stop()), []);

  function picked(input: HTMLInputElement) {
    const f = input.files?.[0];
    input.value = "";
    setOpen(false);
    if (f) onFile(f);
  }

  async function openCamera() {
    setMsg("");
    // Browsers without camera access fall back to the phone camera input
    if (!navigator.mediaDevices?.getUserMedia) return phoneCamera.current?.click();
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      setCam(true);
    } catch {
      setMsg("Camera is blocked or unavailable. Allow camera access in your browser, or choose from files.");
    }
  }

  function closeCamera() {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setCam(false);
    setOpen(false);
  }

  function snap() {
    const v = video.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d")?.drawImage(v, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      closeCamera();
      onFile(new File([blob], "photo.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.9);
  }

  return (
    <div className="picker">
      <button className="btn" disabled={busy} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {busy ? "Checking…" : label}
      </button>
      {open && !busy && (
        <div className="menu">
          <button className="btn alt" onClick={openCamera}>Open camera</button>
          <button className="btn alt" onClick={() => files.current?.click()}>Choose from files</button>
          {msg && <p className="muted" role="status">{msg}</p>}
        </div>
      )}
      {cam && (
        <div className="camera" role="dialog" aria-modal="true" aria-label="Camera">
          <video ref={video} autoPlay playsInline muted />
          <div className="row">
            <button className="btn" onClick={snap}>Capture</button>
            <button className="btn alt" onClick={closeCamera}>Cancel</button>
          </div>
        </div>
      )}
      <input ref={phoneCamera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => picked(e.target)} />
      <input ref={files} type="file" accept="image/*" hidden onChange={(e) => picked(e.target)} />
    </div>
  );
}

export default function Home() {
  const [xp, setXp] = useState<number>(0);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [steps, setSteps] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);

  // GPS walk tracking
  const [tracking, setTracking] = useState<boolean>(false);
  const [sessionM, setSessionM] = useState<number>(0);
  const [geoMsg, setGeoMsg] = useState<string>("");
  const watchId = useRef<number | null>(null);
  const lastPoint = useRef<{ lat: number; lng: number; t: number } | null>(null);
  const spareSteps = useRef<number>(0); // steps not yet turned into whole XP
  const sessionXp = useRef<number>(0);
  const sessionSteps = useRef<number>(0);
  const wakeLock = useRef<{ release: () => Promise<void> } | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("eco-monster") || "{}");
      setXp(saved.xp || 0);
      setLog(saved.log || []);
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem("eco-monster", JSON.stringify({ xp, log }));
  }, [xp, log, loaded]);

  function earn(points: number, text: string) {
    setXp((x) => x + points);
    setLog((l) => [{ text, points, id: Date.now() }, ...l].slice(0, 8));
  }

  async function analyse(kind: Kind, file: File) {
    setBusy(true);
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind }), // later: also send the photo
    });
    const data = await res.json();
    setBusy(false);
    if (kind === "litter") earn(data.count * XP.litter, `Cleaned ${data.count} × ${data.type}`);
    if (kind === "refund")
      earn(Math.round(data.amount * XP.refundPerDollar), `Recycled, refund $${data.amount.toFixed(2)}`);
  }

  function addSteps() {
    const n = parseInt(steps, 10);
    if (!n || n < 0) return;
    earn(Math.floor(n / XP.stepsPer) * XP.stepXp, `Walked ${n.toLocaleString()} steps`);
    setSteps("");
  }

  function onPosition(pos: GeolocationPosition) {
    const { latitude: lat, longitude: lng, accuracy } = pos.coords;
    const t = pos.timestamp;
    if (accuracy > 30) return; // weak GPS signal, ignore
    const prev = lastPoint.current;
    if (!prev) {
      lastPoint.current = { lat, lng, t };
      return;
    }
    const d = distanceM(prev, { lat, lng });
    if (d < Math.max(5, accuracy / 2)) return; // GPS jitter while standing still
    const seconds = (t - prev.t) / 1000;
    lastPoint.current = { lat, lng, t };
    if (seconds <= 0 || d / seconds > 3.5) return; // too fast to be walking (bus, car)

    const steps = d / STEP_LENGTH_M;
    setSessionM((m) => m + d);
    sessionSteps.current += steps;
    spareSteps.current += steps;
    const stepsPerXp = XP.stepsPer / XP.stepXp; // 100 steps = 1 XP
    const gained = Math.floor(spareSteps.current / stepsPerXp);
    if (gained > 0) {
      spareSteps.current -= gained * stepsPerXp;
      sessionXp.current += gained;
      setXp((x) => x + gained);
    }
  }

  function onGeoError(err: GeolocationPositionError) {
    setGeoMsg(
      err.code === err.PERMISSION_DENIED
        ? "Location is blocked. Allow location access in your browser settings and try again."
        : "Can't find your location. Go outside or check that GPS is on."
    );
    stopTracking();
  }

  async function startTracking() {
    if (!("geolocation" in navigator)) {
      setGeoMsg("This browser can't share your location.");
      return;
    }
    setGeoMsg("");
    setSessionM(0);
    lastPoint.current = null;
    spareSteps.current = 0;
    sessionXp.current = 0;
    sessionSteps.current = 0;
    watchId.current = navigator.geolocation.watchPosition(onPosition, onGeoError, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 20000,
    });
    setTracking(true);
    try {
      // keep the screen on, because tracking pauses when the phone sleeps
      wakeLock.current = await (navigator as any).wakeLock?.request("screen");
    } catch {}
  }

  function stopTracking() {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    wakeLock.current?.release().catch(() => {});
    wakeLock.current = null;
    setTracking(false);
    if (sessionXp.current > 0) {
      const text = `Walked ${Math.round(sessionSteps.current).toLocaleString()} steps (GPS)`;
      setLog((l) => [{ text, points: sessionXp.current, id: Date.now() }, ...l].slice(0, 8));
    }
    sessionXp.current = 0;
  }

  useEffect(() => () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
  }, []);

  const stage = stageFor(xp);
  const next: Stage | undefined = STAGES[stage + 1];
  const pct = next ? ((xp - STAGES[stage].at) / (next.at - STAGES[stage].at)) * 100 : 100;

  return (
    <main className="wrap">
      <header>
        <h1>Eco Monster</h1>
        <p>Clean · Recycle · Walk · Grow</p>
      </header>

      <section className="monster" aria-live="polite">
        <div className={`face stage-${stage}`}>{STAGES[stage].face}</div>
        <h2>{STAGES[stage].name}</h2>
        <p className="muted">{STAGES[stage].note}</p>
        <div className="bar" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ width: `${pct}%` }} />
        </div>
        <p className="xp">
          {xp} XP{next ? ` · ${next.at - xp} XP to ${next.name}` : " · Max level"}
        </p>
        <ol className="path">
          {STAGES.map((s, i) => (
            <li key={s.name} className={i <= stage ? "on" : ""}>
              {s.face}
              <span>{s.name}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="actions">
        <article>
          <h3>Clean up litter</h3>
          <p>Photograph what you collected. The AI counts it and gives XP.</p>
          <PhotoButton label="Take photo" busy={busy} onFile={(f) => analyse("litter", f)} />
        </article>

        <article>
          <h3>Recycle for bonus XP</h3>
          <p>Photograph the refund on the machine screen.</p>
          <PhotoButton label="Upload refund photo" busy={busy} onFile={(f) => analyse("refund", f)} />
        </article>

        <article>
          <h3>Walk more</h3>
          <p>{XP.stepXp} XP for every {XP.stepsPer.toLocaleString()} steps.</p>
          {tracking ? (
            <>
              <p className="live" role="status">
                {Math.round(sessionM / STEP_LENGTH_M).toLocaleString()} steps · {(sessionM / 1000).toFixed(2)} km
              </p>
              <button className="btn" onClick={stopTracking}>Stop tracking</button>
            </>
          ) : (
            <button className="btn" onClick={startTracking}>Track my walk</button>
          )}
          {geoMsg && <p className="muted" role="status">{geoMsg}</p>}
          <details>
            <summary>Enter steps manually</summary>
            <div className="row">
              <input type="number" min="0" inputMode="numeric" placeholder="e.g. 5000"
                value={steps} onChange={(e) => setSteps(e.target.value)} aria-label="Steps walked" />
              <button className="btn" onClick={addSteps}>Add steps</button>
            </div>
          </details>
        </article>
      </section>

      <Hotspots />

      <section className="history">
        <h3>Recent activity</h3>
        {log.length === 0 ? (
          <p className="muted">Nothing yet. Do one action to start hatching your egg.</p>
        ) : (
          <ul>
            {log.map((e) => (
              <li key={e.id}><span>{e.text}</span><b>+{e.points} XP</b></li>
            ))}
          </ul>
        )}
        <button className="link" onClick={() => { setXp(0); setLog([]); }}>Reset progress</button>
      </section>
    </main>
  );
}