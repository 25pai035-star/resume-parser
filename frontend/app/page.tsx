"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Home() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [files, setFiles] = useState([]);
  const [jd, setJd] = useState("");
  const [results, setResults] = useState([]);
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/parse-resumes/`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Backend not running");

      const data = await res.json();
      setResults(data);
    } catch (err) {
      alert(err.message);
    }

    setLoading(false);
  }

  // ------------------ Auth UI ------------------
  if (!user) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#f5f5f5",
        fontFamily: "Arial, sans-serif"
      }}>
        <div style={{
          background: "#fff",
          padding: "40px 30px",
          borderRadius: "12px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
          width: "350px"
        }}>
          <h2 style={{ textAlign: "center", marginBottom: "30px" }}>Login / Sign Up</h2>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 15px",
              marginBottom: "15px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "14px"
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 15px",
              marginBottom: "20px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "14px"
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button
              onClick={login}
              style={{
                flex: 1,
                marginRight: "10px",
                padding: "12px 0",
                border: "none",
                borderRadius: "8px",
                background: "#4f46e5",
                color: "#fff",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "0.2s"
              }}
              onMouseOver={e => e.currentTarget.style.background = "#4338ca"}
              onMouseOut={e => e.currentTarget.style.background = "#4f46e5"}
            >
              Login
            </button>
            <button
              onClick={signup}
              style={{
                flex: 1,
                padding: "12px 0",
                border: "none",
                borderRadius: "8px",
                background: "#10b981",
                color: "#fff",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "0.2s"
              }}
              onMouseOver={e => e.currentTarget.style.background = "#059669"}
              onMouseOut={e => e.currentTarget.style.background = "#10b981"}
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ------------------ Main App UI ------------------
  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "40px", maxWidth: "900px", margin: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Smart Resume Parser</h1>
        <button
          onClick={logout}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            background: "#ef4444",
            color: "#fff",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "0.2s"
          }}
          onMouseOver={e => e.currentTarget.style.background = "#dc2626"}
          onMouseOut={e => e.currentTarget.style.background = "#ef4444"}
        >
          Logout
        </button>
      </div>

      <div style={{ marginTop: "30px" }}>
        <textarea
          placeholder="Paste Job Description here..."
          value={jd}
          onChange={e => setJd(e.target.value)}
          style={{
            width: "100%",
            minHeight: "120px",
            padding: "15px",
            borderRadius: "10px",
            border: "1px solid #ccc",
            fontSize: "14px",
            resize: "vertical"
          }}
        />

        <input
          type="file"
          multiple
          accept=".pdf"
          onChange={e => setFiles([...e.target.files])}
          style={{
            marginTop: "20px",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            cursor: "pointer"
          }}
        />

        <button
          onClick={submit}
          disabled={loading}
          style={{
            marginTop: "20px",
            width: "100%",
            padding: "15px",
            border: "none",
            borderRadius: "10px",
            background: "#4f46e5",
            color: "#fff",
            fontWeight: "bold",
            fontSize: "16px",
            cursor: "pointer",
            transition: "0.2s"
          }}
          onMouseOver={e => e.currentTarget.style.background = "#4338ca"}
          onMouseOut={e => e.currentTarget.style.background = "#4f46e5"}
        >
          {loading ? "Parsing..." : "Parse Resumes"}
        </button>
      </div>

      {results.length > 0 && (
        <div style={{ marginTop: "40px" }}>
          {results.map((r, i) => (
            <div
              key={i}
              style={{
                padding: "20px",
                border: "1px solid #ccc",
                borderRadius: "10px",
                marginBottom: "20px",
                background: "#f9f9f9"
              }}
            >
              <h3 style={{ marginBottom: "10px" }}>{r.filename}</h3>
              <p><b>Keywords:</b> {r.keywords.join(", ")}</p>
              <p><b>Experience:</b> {r.experience} years</p>
              <p><b>Match Score:</b> {r.match_score}%</p>
              <p>
                <b>Status:</b>{" "}
                <span
                  style={{
                    color: r.eligibility === "ELIGIBLE" ? "green" : "red",
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
