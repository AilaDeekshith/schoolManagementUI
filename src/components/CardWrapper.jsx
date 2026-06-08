// components/CardWrapper.jsx
import { theme } from "../theme";

export default function CardWrapper({ children, style = {} }) {
  return (
    <div style={{
      background: theme.card,
      border: `1px solid ${theme.border}`,
      borderRadius: 14,
      overflow: "hidden",
      ...style,
    }}>
      {children}
    </div>
  );
}