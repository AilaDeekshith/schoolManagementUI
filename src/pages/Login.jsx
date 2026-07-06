import { useState } from "react";
import { authAPI } from "../api/apiService";

const ICONS = [
  { icon: "📚", x: "8%",  y: "12%", size: 52, rot: -15, delay: 0    },
  { icon: "🎓", x: "82%", y: "8%",  size: 60, rot:  12, delay: 0.3  },
  { icon: "✏️", x: "5%",  y: "55%", size: 44, rot: -25, delay: 0.6  },
  { icon: "🔬", x: "88%", y: "45%", size: 48, rot:  18, delay: 0.2  },
  { icon: "🌍", x: "15%", y: "80%", size: 56, rot:  -8, delay: 0.9  },
  { icon: "🏆", x: "78%", y: "78%", size: 50, rot:  20, delay: 0.5  },
  { icon: "📐", x: "50%", y: "6%",  size: 40, rot: -10, delay: 0.4  },
  { icon: "🖊️", x: "92%", y: "20%", size: 38, rot:  30, delay: 0.7  },
  { icon: "📏", x: "3%",  y: "30%", size: 36, rot: -35, delay: 0.1  },
  { icon: "🧪", x: "70%", y: "90%", size: 44, rot:  15, delay: 0.8  },
  { icon: "📓", x: "35%", y: "92%", size: 42, rot:  -5, delay: 0.35 },
  { icon: "🔭", x: "62%", y: "3%",  size: 46, rot:  -8, delay: 0.65 },
  { icon: "🧮", x: "24%", y: "5%",  size: 38, rot:  10, delay: 0.55 },
  { icon: "📊", x: "93%", y: "63%", size: 40, rot: -20, delay: 0.45 },
];

export default function Login({ onLogin }) {
  const [form, setForm]       = useState({ username: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) { setError("Username and password are required"); return; }
    setError("");
    setLoading(true);
    try {
      const data = await authAPI.login({ username: form.username, password: form.password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("authUser", JSON.stringify({
        username: data.username,
        name:     data.name,
        role:     data.role,
        passwordChanged: data.passwordChanged,
      }));
      onLogin(data);
    } catch (err) {
      setError(err.message || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", overflow: "hidden", position: "relative",
      background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 40%, #4C1D95 75%, #6D28D9 100%)",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Animated background blobs */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{
          position: "absolute", width: 400, height: 400,
          background: "radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%)",
          top: "-80px", left: "-80px", borderRadius: "50%",
          animation: "blobFloat 8s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", width: 500, height: 500,
          background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)",
          bottom: "-120px", right: "-100px", borderRadius: "50%",
          animation: "blobFloat 10s ease-in-out infinite reverse",
        }} />
        <div style={{
          position: "absolute", width: 300, height: 300,
          background: "radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)",
          top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          borderRadius: "50%", animation: "blobFloat 12s ease-in-out infinite 2s",
        }} />
      </div>

      {/* Floating school icons */}
      <style>{`
        @keyframes blobFloat { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,30px) scale(1.08)} }
        @keyframes iconFloat { 0%,100%{transform:translateY(0px) rotate(var(--rot))} 50%{transform:translateY(-16px) rotate(var(--rot))} }
        @keyframes cardIn   { from{opacity:0;transform:translateY(32px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        .login-input:focus  { border-color:#6C63FF !important; box-shadow:0 0 0 3px rgba(108,99,255,0.18) !important; }
        .login-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 28px rgba(108,99,255,0.55) !important; }
        .login-btn          { transition:all .2s; }
      `}</style>

      {ICONS.map((ic, i) => (
        <div key={i} style={{
          position: "absolute", left: ic.x, top: ic.y,
          fontSize: ic.size,
          "--rot": `${ic.rot}deg`,
          animation: `iconFloat ${5 + (i % 4)}s ease-in-out infinite ${ic.delay}s`,
          opacity: 0.22,
          filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.3))",
          userSelect: "none",
          pointerEvents: "none",
        }}>{ic.icon}</div>
      ))}

      {/* Login card */}
      <div style={{
        position: "relative", zIndex: 10,
        background: "rgba(255,255,255,0.97)",
        borderRadius: 24, padding: "44px 40px", width: 400,
        boxShadow: "0 32px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.15)",
        backdropFilter: "blur(12px)",
        animation: "cardIn 0.5s cubic-bezier(.4,0,.2,1) forwards",
      }}>

        {/* Logo + branding */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: "linear-gradient(135deg, #6C63FF, #A855F7)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 34, marginBottom: 16,
            boxShadow: "0 8px 28px rgba(108,99,255,0.45)",
          }}>🏫</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#1E1B4B", letterSpacing: -0.5 }}>
            School Management
          </div>
          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4, fontWeight: 500 }}>
            Sign in to your account
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Username */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6, letterSpacing: 0.3 }}>
              USERNAME
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none" }}>👤</span>
              <input
                className="login-input"
                type="text"
                placeholder="Enter your username"
                value={form.username}
                onChange={e => set("username", e.target.value)}
                autoFocus
                style={{
                  width: "100%", padding: "11px 14px 11px 40px",
                  borderRadius: 10, border: "1.5px solid #E5E7EB",
                  fontSize: 14, outline: "none", boxSizing: "border-box",
                  background: "#F9FAFB", color: "#111827",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6, letterSpacing: 0.3 }}>
              PASSWORD
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none" }}>🔑</span>
              <input
                className="login-input"
                type={showPw ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={e => set("password", e.target.value)}
                style={{
                  width: "100%", padding: "11px 40px 11px 40px",
                  borderRadius: 10, border: "1.5px solid #E5E7EB",
                  fontSize: 14, outline: "none", boxSizing: "border-box",
                  background: "#F9FAFB", color: "#111827",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", fontSize: 15,
                  color: "#9CA3AF", lineHeight: 1, padding: 2,
                }}
              >{showPw ? "🙈" : "👁️"}</button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: 10,
              background: "#fef2f2", color: "#dc2626",
              border: "1px solid #fecaca", fontSize: 13, fontWeight: 500,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Submit */}
          <button
            className="login-btn"
            type="submit"
            disabled={loading}
            style={{
              marginTop: 6, padding: "13px 0",
              background: loading
                ? "#9CA3AF"
                : "linear-gradient(135deg, #6C63FF, #A855F7)",
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 18px rgba(108,99,255,0.4)",
              letterSpacing: 0.3,
            }}
          >
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </form>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 24, fontSize: 11, color: "#9CA3AF" }}>
          Powered by School Management System
        </div>
      </div>
    </div>
  );
}
