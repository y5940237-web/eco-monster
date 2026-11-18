"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import { distanceM, type Point } from "./lib/geo";

type Spot = Point & { id: string; name: string; note: string; custom?: boolean };
type Route = { meters: number; coords: [number, number][] };

// Starter spots (approximate locations). Replace with real reports from your users.
const SAMPLE_SPOTS: Spot[] = [
  { id: "s1", name: "East Coast Park", note: "Sample spot: beach and shoreline", lat: 1.3008, lng: 103.9125 },
  { id: "s2", name: "MacRitchie Reservoir", note: "Sample spot: trails and waterfront", lat: 1.341, lng: 103.8338 },
  { id: "s3", name: "Pasir Ris Beach", note: "Sample spot: beach and park edge", lat: 1.3811, lng: 103.9553 },
  { id: "s4", name: "Bishan-Ang Mo Kio Park", note: "Sample spot: river and paths", lat: 1.3626, lng: 103.8465 },
];

const WALK_KM_H = 5;

function fmtDistance(m: number): string {
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;
}

export default function Hotspots() {
  const [custom, setCustom] = useState<Spot[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [me, setMe] = useState<Point | null>(null);
  const [locMsg, setLocMsg] = useState("");
  const [selected, setSelected] = useState<Spot | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [routeMsg, setRouteMsg] = useState("");
  const [routing, setRouting] = useState(false);
  const [adding, setAdding] = useState(false);
  const [picking, setPicking] = useState(false);
  const [form, setForm] = useState<{ name: string; note: string; point: Point | null }>({ name: "", note: "", point: null });
  const [ready, setReady] = useState(false);

  const mapEl = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const layers = useRef<LayerGroup | null>(null);
  const leaflet = useRef<typeof import("leaflet") | null>(null);
  const pickingRef = useRef(false);

  // Keep the ref in sync after each render (not during it)
  useEffect(() => {
    pickingRef.current = picking;
  }, [picking]);

  const allSpots = useMemo(() => [...SAMPLE_SPOTS, ...custom], [custom]);

  // Nearest first once we know where the person is
  const list = useMemo(
    () =>
      allSpots
        .map((s) => ({ s, d: me ? distanceM(me, s) : null }))
        .sort((a, b) => (a.d === null || b.d === null ? 0 : a.d - b.d)),
    [allSpots, me]
  );

  // Saved spots (browser only for now)
  useEffect(() => {
    try {
      setCustom(JSON.parse(localStorage.getItem("eco-spots") || "[]"));
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem("eco-spots", JSON.stringify(custom));
  }, [custom, loaded]);

  // Create the map once (Leaflet needs the browser, so it loads inside the effect)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !mapEl.current || map.current) return;
      leaflet.current = L;
      const m = L.map(mapEl.current).setView([1.3521, 103.8198], 11);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      }).addTo(m);
      layers.current = L.layerGroup().addTo(m);
      m.on("click", (e) => {
        if (!pickingRef.current) return;
        setForm((f) => ({ ...f, point: { lat: e.latlng.lat, lng: e.latlng.lng } }));
        setPicking(false);
      });
      map.current = m;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      setReady(false);
    };
  }, []);

  // Draw spots, you, the route and the new-spot pin
  useEffect(() => {
    const L = leaflet.current;
    const g = layers.current;
    if (!ready || !L || !g) return;
    g.clearLayers();
    allSpots.forEach((s) => {
      const on = selected?.id === s.id;
      L.circleMarker([s.lat, s.lng], {
        radius: on ? 12 : 9, color: "#fff", weight: 2, fillColor: on ? "#d9480f" : "#f08a24",
        fillOpacity: 1, bubblingMouseEvents: false,
      })
        .bindTooltip(s.name)
        .on("click", () => selectSpot(s))
        .addTo(g);
    });
    if (route) L.polyline(route.coords, { color: "#2f7cf6", weight: 5, opacity: 0.85 }).addTo(g);
    if (me)
      L.circleMarker([me.lat, me.lng], { radius: 8, color: "#fff", weight: 3, fillColor: "#2f7cf6", fillOpacity: 1 })
        .bindTooltip("You")
        .addTo(g);
    if (form.point)
      L.circleMarker([form.point.lat, form.point.lng], { radius: 10, color: "#0f3d2e", weight: 3, fillColor: "#4cc26b", fillOpacity: 1 })
        .bindTooltip("New spot")
        .addTo(g);
  }, [ready, allSpots, selected, route, me, form.point]);

  // Move the map: show the whole route, or the chosen spot, or you
  useEffect(() => {
    const m = map.current;
    const L = leaflet.current;
    if (!ready || !m || !L) return;
    if (route) m.fitBounds(L.polyline(route.coords).getBounds(), { padding: [30, 30] });
    else if (selected) m.setView([selected.lat, selected.lng], 15);
  }, [ready, route, selected]);

  useEffect(() => {
    if (ready && me && !selected && map.current) map.current.setView([me.lat, me.lng], 13);
  }, [ready, me]);

  // Get a walking route whenever a spot is chosen
  useEffect(() => {
    if (!selected) return;
    if (!me) {
      findMe();
      return;
    }
    const ctrl = new AbortController();
    setRouting(true);
    setRoute(null);
    setRouteMsg("");
    const url =
      `https://routing.openstreetmap.de/routed-foot/route/v1/foot/` +
      `${me.lng},${me.lat};${selected.lng},${selected.lat}?overview=full&geometries=geojson`;
    fetch(url, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => {
        const r = data.routes?.[0];
        if (!r) throw new Error("no route");
        setRoute({
          meters: r.distance,
          coords: r.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]),
        });
      })
      .catch((e) => {
        if (e.name !== "AbortError") setRouteMsg("Couldn't load the walking route. Try again, or open it in Maps.");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setRouting(false);
      });
    return () => ctrl.abort();
  }, [selected, me]);

  function findMe() {
    if (!("geolocation" in navigator)) {
      setLocMsg("This browser can't share your location.");
      return;
    }
    setLocMsg("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setMe({ lat: p.coords.latitude, lng: p.coords.longitude });
        setLocMsg("");
      },
      (e) =>
        setLocMsg(
          e.code === e.PERMISSION_DENIED
            ? "Location is blocked. Allow location access in your browser settings to see distances and routes."
            : "Can't find your location. Check that GPS is on and try again."
        ),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  function selectSpot(s: Spot) {
    setSelected(s);
    setRoute(null);
    setRouteMsg("");
  }

  function clearSelection() {
    setSelected(null);
    setRoute(null);
    setRouteMsg("");
  }

  function setFormToMyLocation() {
    if (me) return setForm((f) => ({ ...f, point: me }));
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pt = { lat: p.coords.latitude, lng: p.coords.longitude };
        setMe(pt);
        setForm((f) => ({ ...f, point: pt }));
      },
      () => setLocMsg("Location is blocked. Pick the spot on the map instead.")
    );
  }

  function saveSpot() {
    if (!form.name.trim() || !form.point) return;
    const point = form.point;
    setCustom((c) => [
      ...c,
      { id: `u-${Date.now()}`, name: form.name.trim(), note: form.note.trim() || "Added by you", ...point, custom: true },
    ]);
    setForm({ name: "", note: "", point: null });
    setAdding(false);
    setPicking(false);
  }

  function removeSpot(id: string) {
    setCustom((c) => c.filter((x) => x.id !== id));
    clearSelection();
  }

  const mapsLink = selected
    ? `https://www.google.com/maps/dir/?api=1${me ? `&origin=${me.lat},${me.lng}` : ""}` +
      `&destination=${selected.lat},${selected.lng}&travelmode=walking`
    : "";

  return (
    <section className="hotspots">
      <h3>Litter hotspots</h3>
      <p className="muted">Places that need a clean-up. Tap one to see the walking route from where you are.</p>

      <div className="row">
        <button className="btn" onClick={findMe}>{me ? "Update my location" : "Find spots near me"}</button>
        <button className="btn alt" onClick={() => { setAdding((a) => !a); setPicking(false); }}>
          {adding ? "Close" : "Add a spot"}
        </button>
      </div>
      {locMsg && <p className="muted" role="status">{locMsg}</p>}

      {adding && (
        <div className="spot-form">
          <input placeholder="Place name, e.g. Pasir Ris Beach" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} aria-label="Place name" />
          <input placeholder="What's there? e.g. bottles near the benches" value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} aria-label="Note" />
          <div className="row">
            <button className="btn alt" onClick={setFormToMyLocation}>Use my location</button>
            <button className="btn alt" onClick={() => setPicking(true)}>Pick on map</button>
          </div>
          <p className="muted" role="status">
            {picking ? "Tap the map to place the spot." : form.point ? "Location set. You can save this spot." : "Choose where the spot is."}
          </p>
          <button className="btn" disabled={!form.name.trim() || !form.point} onClick={saveSpot}>Save spot</button>
        </div>
      )}

      <div ref={mapEl} className={`map ${picking ? "picking" : ""}`} aria-label="Map of litter hotspots" />

      <ul className="spots">
        {list.map(({ s, d }, i) => (
          <li key={s.id}>
            <button className={`spot ${selected?.id === s.id ? "on" : ""}`} onClick={() => selectSpot(s)}>
              <span>
                <b>{s.name}</b>
                {me && i === 0 && <span className="tag">Nearest</span>}
                <small>{s.note}</small>
              </span>
              <em>{d === null ? "" : fmtDistance(d)}</em>
            </button>
          </li>
        ))}
      </ul>
      {me && <p className="muted small">Distances in the list are in a straight line.</p>}

      {selected && (
        <div className="routebox" role="status">
          <h4>Route to {selected.name}</h4>
          {routing && <p>Finding the walking route…</p>}
          {route && (
            <p>
              {fmtDistance(route.meters)} on foot · about {Math.max(1, Math.round((route.meters / 1000 / WALK_KM_H) * 60))} min
            </p>
          )}
          {routeMsg && <p>{routeMsg}</p>}
          <div className="row">
            <a className="btn" href={mapsLink} target="_blank" rel="noreferrer">Open in Maps</a>
            <button className="btn alt" onClick={clearSelection}>Clear route</button>
            {selected.custom && <button className="btn alt" onClick={() => removeSpot(selected.id)}>Remove spot</button>}
          </div>
        </div>
      )}
    </section>
  );
}