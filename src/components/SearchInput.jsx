// components/SearchInput.jsx
import { theme } from "../theme";

export default function SearchInput({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || "Search…"}
      style={{
        width: "100%",
        background: theme.card,
        border: `1px solid ${theme.border}`,
        borderRadius: 8,
        padding: "10px 16px",
        color: theme.text,
        fontSize: 14,
        marginBottom: 20,
        boxSizing: "border-box",
        outline: "none",
        fontFamily: "'DM Sans', sans-serif",
      }}
    />
  );
}