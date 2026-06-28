import { useState } from "react";
import { authAPI } from "../api/apiService";
import { theme } from "../theme";

export default function Login({ onLogin }) {
  const [form, setForm]     = useState({ username: "", password: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

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
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", background: theme.bg, fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: "48px 40px", width: 380,
        boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
      }}>
        {/* Logo / branding */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: theme.accent, display: "inline-flex",
            alignItems: "center", justifyContent: "center",
            fontSize: 28, marginBottom: 12,
          }}>🏫</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: theme.text ?? "#1E1B4B" }}>
            School Management
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: theme.muted }}>
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Username</label>
          <input
            style={inputStyle}
            type="text"
            placeholder="Enter username"
            value={form.username}
            onChange={e => set("username", e.target.value)}
            autoFocus
          />

          <label style={{ ...labelStyle, marginTop: 16 }}>Password</label>
          <input
            style={inputStyle}
            type="password"
            placeholder="Enter password"
            value={form.password}
            onChange={e => set("password", e.target.value)}
          />

          {error && (
            <div style={{
              marginTop: 12, padding: "10px 14px", borderRadius: 8,
              background: "#fef2f2", color: "#dc2626", fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 24, width: "100%", padding: "12px 0",
              background: loading ? theme.muted : theme.accent,
              color: "#fff", border: "none", borderRadius: 10,
              fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block", fontSize: 13, fontWeight: 600,
  color: "#374151", marginBottom: 6,
};

const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 8,
  border: "1.5px solid #d1d5db", fontSize: 14, outline: "none",
  boxSizing: "border-box", background: "#f9fafb",
};
