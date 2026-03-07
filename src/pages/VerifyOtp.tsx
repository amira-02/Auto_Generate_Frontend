// VerifyOtp.tsx
import { useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../hooks/AuthContext";
import { useTheme } from "../hooks/ThemeContext";
import { API } from "../services/api";

export default function Verify() {
  const { login } = useContext(AuthContext);
  const { t, isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    pasted.split("").forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async () => {
    const code = otp.join("");
    if (code.length < 6) return setError("Please enter the complete 6-digit code.");
    try {
      setLoading(true);
      setError("");
      const email = localStorage.getItem("pendingEmail");
      const res = await API.post("/auth/verify-otp", { email, code });
      login(res.data.token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const email = localStorage.getItem("pendingEmail");
      await API.post("/auth/resend-otp", { email });
      setError("");
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } catch {
      setError("Failed to resend OTP.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: t.bg, position: "relative", transition: "all 0.3s", fontFamily: "inherit" }}>

      {/* Back */}
      <button onClick={() => navigate("/auth")}
        style={{ position: "absolute", top: 24, left: 24, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: t.subtext, fontSize: 13, fontFamily: "inherit" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#00bfff")}
        onMouseLeave={(e) => (e.currentTarget.style.color = t.subtext)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Theme Toggle */}
      <button onClick={toggleTheme}
        style={{ position: "absolute", top: 24, right: 24, background: t.card, border: `1px solid ${t.border}`, borderRadius: 20, padding: "6px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: t.text, fontFamily: "inherit", transition: "all 0.3s" }}>
        <span style={{ fontSize: 16 }}>{isDark ? "☀️" : "🌙"}</span>
        {isDark ? "Light" : "Dark"}
      </button>

      {/* Card */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: 40, width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", alignItems: "center", gap: 24, boxShadow: isDark ? "0 25px 50px rgba(0,0,0,0.5)" : "0 25px 50px rgba(0,0,0,0.1)", transition: "all 0.3s" }}>

        {/* Icon */}
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#00bfff22", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 32, height: 32, color: "#00bfff" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: t.text, margin: "0 0 6px" }}>Verify your email</h2>
          <p style={{ color: t.subtext, fontSize: 13, margin: 0 }}>
            We sent a 6-digit code to{" "}
            <span style={{ color: "#00bfff" }}>{localStorage.getItem("pendingEmail") || "your email"}</span>
          </p>
        </div>

        {/* OTP Inputs */}
        <div style={{ display: "flex", gap: 12 }} onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              style={{
                width: 48, height: 48, textAlign: "center", fontSize: 20, fontWeight: 700,
                borderRadius: 8, border: digit ? "1px solid #00bfff" : `1px solid ${t.border}`,
                background: t.inputBg, color: t.text, outline: "none", fontFamily: "inherit",
                boxShadow: digit ? "0 0 10px rgba(0,191,255,0.3)" : "none",
                transition: "all 0.2s",
              }}
              onFocus={(e) => (e.target.style.border = "1px solid #00bfff")}
              onBlur={(e) => (e.target.style.border = digit ? "1px solid #00bfff" : `1px solid ${t.border}`)}
            />
          ))}
        </div>

        {/* Error */}
        {error && <p style={{ color: "#ff6680", fontSize: 13, textAlign: "center", margin: 0 }}>{error}</p>}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading || otp.join("").length < 6}
          style={{ width: "100%", padding: "12px", borderRadius: 8, fontWeight: 700, fontSize: 14, color: "#000", background: "#00bfff", border: "none", cursor: loading || otp.join("").length < 6 ? "not-allowed" : "pointer", opacity: loading || otp.join("").length < 6 ? 0.4 : 1, fontFamily: "inherit", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {loading ? (
            <>
              <svg style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Verifying...
            </>
          ) : "Verify Code"}
        </button>

        {/* Resend */}
        <p style={{ color: t.subtext, fontSize: 13, margin: 0 }}>
          Didn't receive the code?{" "}
          <button onClick={handleResend}
            style={{ background: "transparent", border: "none", color: "#00bfff", cursor: "pointer", fontFamily: "inherit", fontSize: 13, textDecoration: "underline" }}>
            Resend
          </button>
        </p>

      </div>
    </div>
  );
}