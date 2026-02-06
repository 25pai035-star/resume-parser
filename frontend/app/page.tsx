"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [jd, setJd] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else setUser((await supabase.auth.getUser()).data.user);
  }

  async function signup() {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Check your email to confirm signup.");
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  async function submit() {
    if (!jd || files.length === 0) {
      alert("Add job description and resumes");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("job_description", jd);
    files.forEach(f => formData.append("files", f));

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/parse-resumes/`,
        { method: "POST", body: formData }
      );

      if (!res.ok) throw new Error("Backend not running");
      setResults(await res.json());
    } catch (err: any) {
      alert(err.message);
    }

    setLoading(false);
  }

  /* ---------- AUTH UI ---------- */
  if (!user) {
    return (
      <div style={center}>
        <div style={card}>
          <h2 style={{ marginBottom: 20 }}>Login / Sign Up</h2>

          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={input} />
          <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} style={input} />

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={login} style={btnBlue}>Login</button>
            <button onClick={signup} style={btnGreen}>Sign Up</button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- MAIN UI ---------- */
  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Smart Resume Parser</h1>
        <button onClick={logout} style={btnRed}>Logout</button>
      </div>

      <textarea placeholder="Paste Job Description..." value={jd} onChange={e => setJd(e.target.value)} style={textarea} />

      <input type="file" multiple accept=".pdf" onChange={e => setFiles(Array.from(e.target.files || []))} />

      <button onClick={submit} disabled={loading} style={btnBlue}>
        {loading ? "Parsing..." : "Parse Resumes"}
      </button>

      {results.map((r, i) => (
        <div key={i} style={resultCard}>
          <h3>{r.filename}</h3>
          <p><b>Match:</b> {r.match_score}%</p>
          <p style={{ color: r.eligibility === "ELIGIBLE" ? "green" : "red" }}>
            {r.eligibility}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ---------- styles ---------- */
const center = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" };
const card = { background: "#fff", padding: 30, borderRadius: 12, width: 320 };
const input = { width: "100%", padding: 10, marginBottom: 10 };
const textarea = { width: "100%", minHeight: 120, marginTop: 20 };
const btnBlue = { padding: 12, background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" };
const btnGreen = { ...btnBlue, background: "#10b981" };
const btnRed = { ...btnBlue, background: "#ef4444" };
const resultCard = { marginTop: 20, padding: 15, border: "1px solid #ccc", borderRadius: 8 };
