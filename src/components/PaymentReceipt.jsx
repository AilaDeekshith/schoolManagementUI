// components/PaymentReceipt.jsx
import { useRef, useState } from "react";
import { toast } from "../toast";
import { theme } from "../theme";

// ── amount → words (Indian numbering) ─────────────────────────
const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n) {
  if (n < 20) return ONES[n];
  return (TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "")).trim();
}

// eslint-disable-next-line react-refresh/only-export-components
export function amountInWords(amount) {
  let num = Math.floor(Number(amount) || 0);
  if (num === 0) return "Zero Rupees Only";
  const parts = [];
  const crore = Math.floor(num / 10000000); num %= 10000000;
  const lakh = Math.floor(num / 100000);    num %= 100000;
  const thousand = Math.floor(num / 1000);  num %= 1000;
  const hundred = Math.floor(num / 100);    num %= 100;
  if (crore)    parts.push(twoDigits(crore) + " Crore");
  if (lakh)     parts.push(twoDigits(lakh) + " Lakh");
  if (thousand) parts.push(twoDigits(thousand) + " Thousand");
  if (hundred)  parts.push(ONES[hundred] + " Hundred");
  if (num)      parts.push((parts.length ? "and " : "") + twoDigits(num));
  return parts.join(" ").trim() + " Rupees Only";
}

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

// ── the printable receipt sheet ───────────────────────────────
export function ReceiptSheet({ template = {}, profile = {}, payment = {} }) {
  const t = template;
  const accent = t.accentColor || theme.accent;

  const rows = [
    t.showReceiptNo      && ["Receipt No.", payment.receiptNo],
    t.showDate           && ["Payment Date", payment.date],
    ["Student Name", payment.studentName],
    ["Class", payment.studentClass],
    t.showAcademicYear   && payment.academicYear && ["Academic Year", payment.academicYear],
    t.showFeeType        && payment.feeType && ["Fee Type", payment.feeType],
    t.showPaymentMethod  && payment.paymentMethod && ["Payment Method", payment.paymentMethod],
    t.showTransactionId  && payment.transactionId && ["Transaction / Ref ID", payment.transactionId],
  ].filter(Boolean);

  return (
    <div style={{
      fontFamily: "'DM Sans', Arial, sans-serif",
      color: "#1f2937", background: "#fff",
      width: "100%", boxSizing: "border-box",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16,
        borderBottom: `3px solid ${accent}`, paddingBottom: 16, marginBottom: 18,
      }}>
        {t.showLogo && profile.logoBase64 && (
          <img src={profile.logoBase64} alt="logo"
            style={{ width: 64, height: 64, objectFit: "contain", flexShrink: 0 }} />
        )}
        <div style={{ flex: 1 }}>
          {t.showSchoolName && (
            <div style={{ fontSize: 22, fontWeight: 800, color: accent }}>
              {profile.schoolName || "School Name"}
            </div>
          )}
          {t.showSchoolAddress && profile.address && (
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{profile.address}</div>
          )}
          {t.showSchoolContact && (profile.phone || profile.email) && (
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
              {[profile.phone, profile.email].filter(Boolean).join("  •  ")}
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <div style={{
        textAlign: "center", fontSize: 16, fontWeight: 800, letterSpacing: 1,
        textTransform: "uppercase", color: "#111827", marginBottom: 18,
      }}>
        {t.title || "Fee Payment Receipt"}
      </div>

      {/* Detail rows */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 18 }}>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td style={{ padding: "6px 0", color: "#6b7280", width: "45%" }}>{label}</td>
              <td style={{ padding: "6px 0", fontWeight: 700, textAlign: "right" }}>{value || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Amount paid — highlight */}
      <div style={{
        background: `${accent}12`, border: `1px solid ${accent}44`, borderRadius: 10,
        padding: "14px 18px", display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: t.showAmountInWords ? 8 : 18,
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>Amount Paid</span>
        <span style={{ fontSize: 24, fontWeight: 900, color: accent }}>{money(payment.amountPaid)}</span>
      </div>
      {t.showAmountInWords && (
        <div style={{ fontSize: 12, fontStyle: "italic", color: "#6b7280", marginBottom: 18 }}>
          {amountInWords(payment.amountPaid)}
        </div>
      )}

      {/* Totals summary */}
      {t.showTotals && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 18 }}>
          <tbody>
            <tr>
              <td style={{ padding: "5px 0", color: "#6b7280" }}>Total Fee</td>
              <td style={{ padding: "5px 0", fontWeight: 700, textAlign: "right" }}>{money(payment.totalAmount)}</td>
            </tr>
            <tr>
              <td style={{ padding: "5px 0", color: "#6b7280" }}>Paid to Date</td>
              <td style={{ padding: "5px 0", fontWeight: 700, textAlign: "right", color: theme.green }}>{money(payment.paidToDate)}</td>
            </tr>
            <tr style={{ borderTop: "1px solid #e5e7eb" }}>
              <td style={{ padding: "8px 0 0", color: "#6b7280", fontWeight: 700 }}>Balance Due</td>
              <td style={{ padding: "8px 0 0", fontWeight: 800, textAlign: "right", color: Number(payment.dueAmount) > 0 ? theme.red : theme.green }}>
                {money(payment.dueAmount)}
              </td>
            </tr>
          </tbody>
        </table>
      )}

      {/* Thank you */}
      {t.thankYouMessage && (
        <div style={{ textAlign: "center", fontSize: 14, fontWeight: 700, color: accent, marginBottom: 24 }}>
          {t.thankYouMessage}
        </div>
      )}

      {/* Signature */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
        <div style={{ textAlign: "center", minWidth: 180 }}>
          <div style={{ borderTop: "1px solid #9ca3af", paddingTop: 6, fontSize: 12, color: "#6b7280" }}>
            {t.signatureLabel || "Authorised Signatory"}
          </div>
        </div>
      </div>

      {/* Footer note */}
      {t.footerNote && (
        <div style={{ textAlign: "center", fontSize: 11, color: "#9ca3af", borderTop: "1px dashed #e5e7eb", paddingTop: 12 }}>
          {t.footerNote}
        </div>
      )}
    </div>
  );
}

// ── modal wrapper shown after collecting a payment ────────────
export default function PaymentReceipt({ templates = [], profile, payment, onClose }) {
  const sheetRef = useRef(null);
  // Start on the default template (fall back to the first one).
  const initialId = (templates.find(t => t.isDefault) || templates[0])?.id;
  const [selectedId, setSelectedId] = useState(initialId);
  const template = templates.find(t => t.id === selectedId) || templates[0] || {};

  const handlePrint = () => {
    const html = sheetRef.current?.innerHTML;
    if (!html) return;
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) { toast.error("Please allow pop-ups to print the receipt."); return; }
    win.document.write(`
      <!DOCTYPE html><html><head><title>${(template?.title) || "Fee Receipt"}</title>
      <meta charset="utf-8" />
      <style>
        @page { margin: 18mm; }
        body { margin: 0; font-family: 'DM Sans', Arial, sans-serif; }
        .sheet { max-width: 620px; margin: 0 auto; }
      </style></head>
      <body><div class="sheet">${html}</div>
      <script>window.onload = function(){ window.print(); setTimeout(function(){ window.close(); }, 300); };</script>
      </body></html>`);
    win.document.close();
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "#1E1B4B55", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: 24,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 18, width: "100%", maxWidth: 640,
        maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 80px #6C63FF33",
      }}>
        {/* Action bar */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 24px", borderBottom: `1px solid ${theme.border}`,
          position: "sticky", top: 0, background: "#fff", zIndex: 1, borderRadius: "18px 18px 0 0",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800, color: theme.text, fontSize: 16 }}>
            <span>🧾</span> Payment Receipt
            {templates.length > 1 && (
              <select
                value={selectedId ?? ""}
                onChange={(e) => setSelectedId(Number(e.target.value))}
                style={{
                  fontSize: 13, fontWeight: 600, color: theme.text, padding: "6px 10px",
                  borderRadius: 8, border: `1.5px solid ${theme.border}`, background: theme.bg,
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}{t.isDefault ? " (Default)" : ""}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handlePrint} style={{
              background: theme.accent, color: "#fff", border: "none", borderRadius: 8,
              padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}>🖨️ Print</button>
            <button onClick={onClose} style={{
              background: "#F3F4F6", border: `1px solid ${theme.border}`, color: theme.muted,
              borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
            }}>Close</button>
          </div>
        </div>

        {/* The receipt */}
        <div style={{ padding: 28 }}>
          <div ref={sheetRef}>
            <ReceiptSheet template={template} profile={profile} payment={payment} />
          </div>
        </div>
      </div>
    </div>
  );
}
