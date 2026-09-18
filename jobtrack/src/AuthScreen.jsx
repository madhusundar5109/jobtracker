import { useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { Briefcase } from "lucide-react";

export default function AuthScreen() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(""); setInfo(""); setBusy(true);
    const { error } = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    if (mode === "signup") setInfo("Account created. If email confirmation is enabled in Supabase, check your inbox before signing in.");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F6F7F5", fontFamily: 'ui-sans-serif,-apple-system,"Segoe UI",Roboto,sans-serif', padding: 16 }}>
      <form onSubmit={submit} style={{ width: 340, background: "#fff", border: "1px solid #DEE3E0", borderRadius: 10, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "#2F6F5E", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Briefcase size={15} color="#fff" />
          </div>
          <div style={{ fontWeight: 600, fontSize: 15, color: "#161B18" }}>JobTrack</div>
        </div>
        <div style={{ fontSize: 13, color: "#5C6862", marginBottom: 16 }}>
          {mode === "signin" ? "Sign in to your synced workspace" : "Create your workspace"}
        </div>

        {err && <div style={{ fontSize: 12, color: "#C4453A", marginBottom: 10 }}>{err}</div>}
        {info && <div style={{ fontSize: 12, color: "#2F6F5E", marginBottom: 10 }}>{info}</div>}

        <label style={{ fontSize: 11, color: "#5C6862" }}>Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" required
          style={{ width: "100%", padding: "8px 10px", border: "1px solid #DEE3E0", borderRadius: 6, marginBottom: 10, marginTop: 4, boxSizing: "border-box" }} />

        <label style={{ fontSize: 11, color: "#5C6862" }}>Password</label>
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" required minLength={6}
          style={{ width: "100%", padding: "8px 10px", border: "1px solid #DEE3E0", borderRadius: 6, marginBottom: 16, marginTop: 4, boxSizing: "border-box" }} />

        <button disabled={busy} type="submit"
          style={{ width: "100%", padding: "10px", borderRadius: 6, background: "#2F6F5E", color: "#fff", border: "none", fontWeight: 500, fontSize: 14 }}>
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
        </button>
        <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErr(""); setInfo(""); }}
          style={{ width: "100%", marginTop: 10, background: "none", border: "none", color: "#2F6F5E", fontSize: 12 }}>
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
