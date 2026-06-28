import { useState } from "react";
import { authAPI } from "../api/apiService";
import { theme } from "../theme";

export default function ChangePassword({ onDone, user }) {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.current || !form.next || !form.confirm) {
      setError("All fields are required"); return;
    }
    if (form.next !== form.confirm) {
      setError("New passwords do not match"); return;
    }
    if (form.next.length < 8) {
      setError("New password must be at least 8 characters"); return;
    }
    setError("");
    setLoading(true);
    try {
      await authAPI.changePassword({ currentPassword: form.current, newPassword: form.next });
      const stored = JSON.parse(localStorage.getItem("authUser") || "{}");
      stored.passwordChanged = true;
      localStorage.setItem("authUser", JSON.stringify(stored));
      onDone();
    } catch (err) {
      setError(err.message || "Failed to change password");
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
        background: "#fff", borderRadius: 16, padding: "48px 40px", width: 400,
        boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, background: "#fef3c7",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, marginBottom: 12,
          }}>🔑</div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: theme.text ?? "#1E1B4B" }}>
            Change Your Password
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>
            Welcome, {user?.name || "User"}! For security, please set a new password before continuing.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {[
            { label: "Current Password",  key: "current",  placeholder: "Your current password" },
            { label: "New Password",       key: "next",     placeholder: "At least 8 characters" },
            { label: "Confirm Password",   key: "confirm",  placeholder: "Repeat new password" },
          ].map(({ label, key, placeholder }) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <label style={labelStyle}>{label}</label>
              <input
                style={inputStyle}
                type="password"
                placeholder={placeholder}
                value={form[key]}
                onChange={e => set(key, e.target.value)}
              />
            </div>
          ))}

          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: 8,
              background: "#fef2f2", color: "#dc2626", fontSize: 13, marginBottom: 8,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8, width: "100%", padding: "12px 0",
              background: loading ? theme.muted : theme.accent,
              color: "#fff", border: "none", borderRadius: 10,
              fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Saving…" : "Set New Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 };
const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 8,
  border: "1.5px solid #d1d5db", fontSize: 14, outline: "none",
  boxSizing: "border-box", background: "#f9fafb",
};
