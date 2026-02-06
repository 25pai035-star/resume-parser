"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
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
      alert("Please add job description and resumes");
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

  /* ---------------- AUTH UI ---------------- */
  if (!user) {
    return (
      <div style={styles.centerPage}>
        <div style={styles.card}>
          <h2 style={styles.title}>Smart Resume Parser</h2>
          <p style={styles.subtitle}>Login or create an account</p>

          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <div style={{ display: "flex", gap: 12 }}>
            <button style={styles.primaryBtn} onClick={login}>
              Login
            </button>
            <button style={styles.secondaryBtn} onClick={signup}>
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- MAIN APP UI ---------------- */
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1>Smart Resume Parser</h1>
        <button style={styles.logoutBtn} onClick={logout}>
          Logout
        </button>
      </header>

      <div style={styles.card}>
        <label style={styles.label}>Job Description</label>
        <textarea
          style={styles.textarea}
          placeholder="Paste job description here..."
          value={jd}
          onChange={e => setJd(e.target.value)}
        />

        <label style={styles.label}>Upload Resumes (PDF)</label>
        <input
          type="file"
          multiple
          accept=".pdf"
          onChange={e => setFiles([...e.target.files])}
        />

        <button style={styles.primaryBtn} onClick={submit} disabled={loading}>
          {loading ? "Parsing..." : "Parse Resumes"}
        </button>
      </div>

      {results.length > 0 && (
        <div style={{ marginTop: 30 }}>
          {results.map((r, i) => (
            <div key={i} style={styles.resultCard}>
              <h3>{r.filename}</h3>
              <p><b>Keywords:</b> {r.keywords.join(", ")}</p>
              <p><b>Experience:</b> {r.experience} years</p>
              <p><b>Match Score:</b> {r.match_score}%</p>
              <p>
                <b>Status:</b>{" "}
                <span
                  style={{
                    color: r.eligibility === "ELIGIBLE" ? "#16a34a" : "#dc2626",
                    fontWeight: "bold"
                  }}
                >
                  {r.eligibility}
                </span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles: { [key: string]: React.CSSProperties } = {
  centerPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f1f5f9"
  },
  page: {
    maxWidth: 900,
    margin: "40px auto",
    padding: "0 20px",
    fontFamily: "Arial, Helvetica, sans-serif"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30
  },
  card: {
    background: "#ffffff",
    padding: 24,
    borderRadius: 12,
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    marginBottom: 20
  },
  resultCard: {
    background: "#f8fafc",
    padding: 20,
    borderRadius: 10,
    marginBottom: 16,
    border: "1px solid #e5e7eb"
  },
  title: {
    textAlign: "center",
    marginBottom: 6
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 20,
    color: "#64748b"
  },
  label: {
    fontWeight: "bold",
    marginBottom: 6,
    display: "block"
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    marginBottom: 14,
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 14
  },
  textarea: {
    width: "100%",
    minHeight: 120,
    padding: 14,
    marginBottom: 14,
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    resize: "vertical"
  },
  primaryBtn: {
    width: "100%",
    padding: "12px",
    background: "#4f46e5",
    color: "#ffffff",
    border: "none",
    borderRadius: 8,
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: 10
  },
  secondaryBtn: {
    width: "100%",
    padding: "12px",
    background: "#10b981",
    color: "#ffffff",
    border: "none",
    borderRadius: 8,
    fontWeight: "bold",
    cursor: "pointer"
  },
  logoutBtn: {
    padding: "8px 14px",
    background: "#ef4444",
    color: "#ffffff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer"
  }
};
