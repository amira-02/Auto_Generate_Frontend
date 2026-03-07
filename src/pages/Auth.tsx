// Auth.tsx
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../hooks/AuthContext";
import { useTheme } from "../hooks/ThemeContext";
import { API } from "../services/api";

export default function Auth() {
  const { login } = useContext(AuthContext);
  const { t, isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email || !password) return setError("Please fill all fields.");
    try {
      setLoading(true);
      setError("");
      if (isLogin) {
        const res = await API.post("/auth/login", { email, password });
        login(res.data.token);
        navigate("/");
      } else {
        await API.post("/auth/register", { email, password });
        localStorage.setItem("pendingEmail", email);
        navigate("/verify");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: t.bg, position: "relative", transition: "all 0.3s", fontFamily: "inherit" }}>

      {/* Back to Home */}
      <button onClick={() => navigate("/")}
        style={{ position: "absolute", top: 24, left: 24, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: t.subtext, fontSize: 13, fontFamily: "inherit", transition: "color 0.2s" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#00bfff")}
        onMouseLeave={(e) => (e.currentTarget.style.color = t.subtext)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        Back to Home
      </button>

      {/* Theme Toggle */}
      <button onClick={toggleTheme}
        style={{ position: "absolute", top: 24, right: 24, background: t.card, border: `1px solid ${t.border}`, borderRadius: 20, padding: "6px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: t.text, fontFamily: "inherit", transition: "all 0.3s" }}>
        <span style={{ fontSize: 16 }}>{isDark ? "☀️" : "🌙"}</span>
        {isDark ? "Light" : "Dark"}
      </button>

      {/* Card */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: 40, width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 24, boxShadow: isDark ? "0 25px 50px rgba(0,0,0,0.5)" : "0 25px 50px rgba(0,0,0,0.1)", transition: "all 0.3s" }}>

        {/* Title */}
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: t.text, margin: "0 0 6px" }}>
            {isLogin ? "Welcome back" : "Create account"}
          </h2>
          <p style={{ color: t.subtext, fontSize: 13, margin: 0 }}>
            {isLogin ? "Sign in to your account" : "Register a new account"}
          </p>
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ color: t.subtext, fontSize: 12, display: "block", marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: "100%", background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: "12px 16px", color: t.text, outline: "none", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", transition: "border 0.2s" }}
              onFocus={(e) => (e.target.style.border = "1px solid #00bfff")}
              onBlur={(e) => (e.target.style.border = `1px solid ${t.border}`)}
            />
          </div>
          <div>
            <label style={{ color: t.subtext, fontSize: 12, display: "block", marginBottom: 6 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: "100%", background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: "12px 16px", color: t.text, outline: "none", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", transition: "border 0.2s" }}
              onFocus={(e) => (e.target.style.border = "1px solid #00bfff")}
              onBlur={(e) => (e.target.style.border = `1px solid ${t.border}`)}
            />
          </div>
        </div>

        {/* Error */}
        {error && <p style={{ color: "#ff6680", fontSize: 13, textAlign: "center", margin: 0 }}>{error}</p>}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading}
          style={{ width: "100%", padding: "12px", borderRadius: 8, fontWeight: 700, fontSize: 14, color: "#000", background: "#00bfff", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, fontFamily: "inherit", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {loading ? (
            <>
              <svg className="animate-spin" style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none">
                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              {isLogin ? "Signing in..." : "Registering..."}
            </>
          ) : (isLogin ? "Sign In" : "Sign Up")}
        </button>

        {/* Toggle */}
        <p style={{ color: t.subtext, fontSize: 13, textAlign: "center", margin: 0 }}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button onClick={() => { setIsLogin(!isLogin); setError(""); }}
            style={{ background: "transparent", border: "none", color: "#00bfff", cursor: "pointer", fontFamily: "inherit", fontSize: 13, textDecoration: "underline" }}>
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>

      </div>
    </div>
  );
}