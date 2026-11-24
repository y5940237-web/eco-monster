"use client";
import { useState } from "react";
import { ART, ELEMENT_LIST, ELEMENTS, Element } from "./monsterArt";
import { HydraLook, LOCKED_EGG, hydraSvg } from "./hydraArt";

// Draws one monster. stage: 0 = egg, 1 = baby, 2 = evolved, 3 = final form.
// The hydra also needs its customised look.
export function Monster({ element, stage, size = 180, look }: { element: Element; stage: number; size?: number; look?: HydraLook | null }) {
  const art = element === "hydra" ? hydraSvg(look, stage) : ART[element][stage];
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label={ELEMENTS[element].names[stage]}
      dangerouslySetInnerHTML={{ __html: `<ellipse cx="100" cy="186" rx="54" ry="6" fill="#000" opacity=".25"/>${art}` }}
    />
  );
}

// Egg picker: used for the first egg and for every new egg after a monster is fully grown.
// How a monster evolves stays a secret until the player gets there.
export function ChooseMonster({
  onPick,
  onCancel,
  guardians = [],
  heading = "Choose your egg",
  intro = "Pick an element. How your monster evolves is a secret until you get there.",
}: {
  onPick: (e: Element) => Promise<boolean>;
  onCancel?: () => void;
  guardians?: { element: Element; look: HydraLook | null }[]; // monsters already fully grown, shown at the side
  heading?: string;
  intro?: string;
}) {
  const [sel, setSel] = useState<Element | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const collected = guardians.map((g) => g.element);
  const showHydra = collected.length > 0; // the secret egg only appears for returning players
  const done = ELEMENT_LIST.filter((e) => collected.includes(e)).length;
  const hydraOpen = done === ELEMENT_LIST.length;

  async function confirm() {
    if (!sel) return;
    setBusy(true);
    setErr("");
    const ok = await onPick(sel);
    setBusy(false);
    if (!ok) setErr("Couldn’t save your choice. Please try again.");
  }

  return (
    <div className="pick-page">
    <main className="wrap">
      <header>
        <h1>{heading}</h1>
        <p>{intro}</p>
      </header>

      <div className="choices">
        {ELEMENT_LIST.map((el) => {
          const owned = collected.filter((c) => c === el).length;
          return (
            <button key={el} className={`choice ${sel === el ? "on" : ""}`} aria-pressed={sel === el} onClick={() => setSel(el)}>
              <Monster element={el} stage={0} size={110} />
              <b>{ELEMENTS[el].label}</b>
              <small>{ELEMENTS[el].tagline}</small>
              {owned > 0 && <span className="tag">Guardian ×{owned}</span>}
            </button>
          );
        })}

        {showHydra && (
          <button className={`choice secret ${sel === "hydra" ? "on" : ""}`} disabled={!hydraOpen} aria-pressed={sel === "hydra"} onClick={() => setSel("hydra")}>
            {hydraOpen ? (
              <Monster element="hydra" stage={0} size={110} />
            ) : (
              <svg viewBox="0 0 200 200" width={110} height={110} aria-hidden="true" dangerouslySetInnerHTML={{ __html: LOCKED_EGG }} />
            )}
            <b>{hydraOpen ? "Hydra" : "???"}</b>
            <small>{hydraOpen ? "The secret guardian" : `Finish all four Guardians (${done}/4)`}</small>
            {hydraOpen && <span className="tag">Secret!</span>}
          </button>
        )}
      </div>

      {sel && (
        <section className="evo" aria-label="Its evolution is a secret">
          <div>
            <Monster element={sel} stage={0} size={72} />
            <small>Egg</small>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <span className="mystery big" aria-hidden="true">?</span>
              <small>???</small>
            </div>
          ))}
        </section>
      )}
      {sel === "hydra" && <p className="muted secret-note">The secret egg needs twice the XP of a normal monster to fully grow.</p>}

      <div className="choose-actions">
        <button className="btn" disabled={!sel || busy} onClick={confirm}>
          {busy ? "Hatching…" : sel ? `Hatch the ${ELEMENTS[sel].label} egg` : "Pick an egg"}
        </button>
        {err && <p className="muted" role="status">{err}</p>}
        {onCancel && <button className="link" onClick={onCancel}>Not yet</button>}
      </div>
    </main>

    {guardians.length > 0 && (
      <aside className="guardian-side" aria-label="Your Guardians">
        <h3>Your Guardians ({guardians.length})</h3>
        <div className="side-grid">
          {guardians.map((g, i) => (
            <div key={i} className={g.element === "hydra" ? "gold" : ""}>
              <Monster element={g.element} stage={3} look={g.look} size={84} />
              <small>{ELEMENTS[g.element].names[3]}</small>
            </div>
          ))}
        </div>
      </aside>
    )}
    </div>
  );
}