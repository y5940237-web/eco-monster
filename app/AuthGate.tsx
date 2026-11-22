"use client";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";

// Shows the login screen until someone is signed in, then shows the app.
export default function AuthGate({ children }: { children: (user: User, signOut: () => void) => ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const { data, error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { data: { username: username.trim() } } });
    setBusy(false);
    if (error) return setMsg(error.message);
    if (mode === "up" && !data.session) setMsg("Account created. Check your email to confirm it, then sign in.");
  }

  if (checking) return <p className="muted auth-loading">Loading…</p>;
  if (user) return <>{children(user, () => supabase.auth.signOut())}</>;

  return (
    <main className="wrap">
      <header>
        <h1>Eco Monster</h1>
        <p>Clean · Recycle · Walk · Grow</p>
      </header>
      <form className="auth" onSubmit={submit}>
        <div className="auth-egg" aria-hidden="true">🥚</div>
        <h2>{mode === "in" ? "Welcome back" : "Start your egg"}</h2>
        {mode === "up" && (
          <input placeholder="Monster trainer name" value={username} required maxLength={30}
            onChange={(e) => setUsername(e.target.value)} aria-label="Username" />
        )}
        <input type="email" placeholder="Email" value={email} required autoComplete="email"
          onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
        <input type="password" placeholder="Password (6+ characters)" value={password} required minLength={6}
          autoComplete={mode === "in" ? "current-password" : "new-password"}
          onChange={(e) => setPassword(e.target.value)} aria-label="Password" />
        <button className="btn" disabled={busy}>{busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}</button>
        {msg && <p className="muted" role="status">{msg}</p>}
        <button type="button" className="link" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(""); }}>
          {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}