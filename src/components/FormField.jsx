// components/FormField.jsx
import { theme } from "../theme";

const inputStyle = {
  width: "100%",
  background: theme.surface,
  border: `1px solid ${theme.border}`,
  borderRadius: 8,
  padding: "10px 14px",
  color: theme.text,
  fontSize: 14,
  outline: "none",
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};

export function FormField({ label, required, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: theme.muted, fontFamily: "monospace", letterSpacing: 1, textTransform: "uppercase" }}>
        {label}{required && <span style={{ color: theme.accent, marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

export function TextInput({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={inputStyle}
      onFocus={e => (e.target.style.borderColor = theme.accent)}
      onBlur={e => (e.target.style.borderColor = theme.border)}
    />
  );
}

export function SelectInput({ value, onChange, options, placeholder, disabled = false }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      style={{ ...inputStyle, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1 }}
      onFocus={e => (e.target.style.borderColor = theme.accent)}
      onBlur={e => (e.target.style.borderColor = theme.border)}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt =>
        typeof opt === "string"
          ? <option key={opt} value={opt}>{opt}</option>
          : <option key={opt.value} value={opt.value}>{opt.label}</option>
      )}
    </select>
  );
}

export function TextareaInput({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{ ...inputStyle, resize: "vertical" }}
      onFocus={e => (e.target.style.borderColor = theme.accent)}
      onBlur={e => (e.target.style.borderColor = theme.border)}
    />
  );
}

export function FormRow({ children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {children}
    </div>
  );
}

export function FormActions({ onCancel, submitLabel = "Save Record" }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
      <button
        type="button"
        onClick={onCancel}
        style={{
          background: "transparent", border: `1px solid ${theme.border}`,
          color: theme.muted, borderRadius: 8, padding: "10px 20px",
          cursor: "pointer", fontSize: 14, fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Cancel
      </button>
      <button
        type="submit"
        style={{
          background: theme.accent, border: "none",
          color: "#0D1117", borderRadius: 8, padding: "10px 24px",
          cursor: "pointer", fontSize: 14, fontWeight: 800,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {submitLabel}
      </button>
    </div>
  );
}