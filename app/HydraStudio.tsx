"use client";
import { useState } from "react";
import { Monster } from "./Monster";
import { HydraLook, PALETTES, PART_LABELS, PART_NAMES, PartKey, clampLook } from "./hydraArt";

const KEYS = Object.keys(PART_NAMES) as PartKey[];

// Design screen for the hydra. The preview shows the hatchling, so how many heads it
// grows later stays a surprise. Every choice carries through all of its forms.
export default function HydraStudio({
  initial,
  onSave,
  onCancel,
}: {
  initial: HydraLook | null;
  onSave: (look: HydraLook) => Promise<boolean>;
  onCancel?: () => void;
}) {
  const [look, setLook] = useState<HydraLook>(clampLook(initial));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const set = (patch: Partial<HydraLook>) => setLook((l) => ({ ...l, ...patch }));

  function surprise() {
    const r = (n: number) => Math.floor(Math.random() * n);
    setLook({ body: r(4), head: r(4), legs: r(4), arms: r(4), wings: r(4), bodyColor: r(8), wingColor: r(8) });
  }

  async function save() {
    setBusy(true);
    setErr("");
    const ok = await onSave(look);
    setBusy(false);
    if (!ok) setErr("Couldn’t save your design. Please try again.");
  }

  return (
    <main className="wrap">
      <header>
        <h1>Design your Hydra</h1>
        <p>Mix the parts and colors. Your design stays with it through every form.</p>
      </header>

      <section className="monster studio-preview">
        <Monster element="hydra" stage={1} look={look} size={230} />
        <button className="btn alt" onClick={surprise}>Surprise me</button>
      </section>

      {KEYS.map((key) => (
        <section className="studio-row" key={key}>
          <h3>{PART_LABELS[key]}</h3>
          <div className="opts">
            {PART_NAMES[key].map((name, i) => (
              <button key={name} className={`opt ${look[key] === i ? "on" : ""}`} aria-pressed={look[key] === i} onClick={() => set({ [key]: i })}>
                <Monster element="hydra" stage={1} look={{ ...look, [key]: i }} size={64} />
                <small>{name}</small>
              </button>
            ))}
          </div>
        </section>
      ))}

      {([["bodyColor", "Body color"], ["wingColor", "Wing color"]] as const).map(([key, label]) => (
        <section className="studio-row" key={key}>
          <h3>{label}</h3>
          <div className="swatches">
            {PALETTES.map((p, i) => (
              <button key={p.name} className={`swatch ${look[key] === i ? "on" : ""}`} style={{ background: p.main }}
                aria-label={p.name} aria-pressed={look[key] === i} onClick={() => set({ [key]: i })} />
            ))}
          </div>
        </section>
      ))}

      <div className="choose-actions">
        <button className="btn" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save design"}</button>
        {err && <p className="muted" role="status">{err}</p>}
        {onCancel && <button className="link" onClick={onCancel}>Cancel</button>}
      </div>
    </main>
  );
}