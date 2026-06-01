// Auth.tsx
import { useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { AuthContext } from "../hooks/AuthContext";
import { API } from "../services/api";
import "../assets/Auth.css";

export default function Auth() {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const { login } = useContext(AuthContext);
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
        try {
          const decoded: any = jwtDecode(res.data.token);
          const role = decoded.role ?? decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
          if (role === "Graphiste" || role === "Redacteur" || role === "ChefVisuel" || role === "ChefRedac" || role === "ChefEquipe") { navigate("/dashboard"); return; }
        } catch {}
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

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!pageRef.current) return;

    const bounds = pageRef.current.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    const rotateX = (0.5 - y) * 8;
    const rotateY = (x - 0.5) * 10;
    const shiftX = (x - 0.5) * 2;
    const shiftY = (y - 0.5) * 2;

    pageRef.current.style.setProperty("--auth-tilt-x", `${rotateX.toFixed(2)}deg`);
    pageRef.current.style.setProperty("--auth-tilt-y", `${rotateY.toFixed(2)}deg`);
    pageRef.current.style.setProperty("--auth-cursor-x", `${(x * 100).toFixed(1)}%`);
    pageRef.current.style.setProperty("--auth-cursor-y", `${(y * 100).toFixed(1)}%`);
    pageRef.current.style.setProperty("--auth-shift-x", shiftX.toFixed(3));
    pageRef.current.style.setProperty("--auth-shift-y", shiftY.toFixed(3));
  };

  const resetMouseMotion = () => {
    if (!pageRef.current) return;
    pageRef.current.style.setProperty("--auth-tilt-x", "0deg");
    pageRef.current.style.setProperty("--auth-tilt-y", "0deg");
    pageRef.current.style.setProperty("--auth-cursor-x", "50%");
    pageRef.current.style.setProperty("--auth-cursor-y", "50%");
    pageRef.current.style.setProperty("--auth-shift-x", "0");
    pageRef.current.style.setProperty("--auth-shift-y", "0");
  };

  return (
    <div className="auth-page" ref={pageRef} onMouseMove={handleMouseMove} onMouseLeave={resetMouseMotion}>
      <div className="auth-cursor-light" aria-hidden="true" />
      <div className="auth-glow auth-glow-one" aria-hidden="true" />
      <div className="auth-glow auth-glow-two" aria-hidden="true" />
      <div className="auth-grid-overlay" aria-hidden="true" />

      <button className="auth-home-btn" onClick={() => navigate("/")}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        Back to Home
      </button>

      <div className="auth-shell">
        <div className="auth-brand">
          <div className="auth-badge">AutoGenerate</div>
          <h1>Grow your socials with smoother workflows</h1>
          <p>Plan, generate, and ship high-performing content from one intelligent workspace.</p>
          <div className="auth-brand-stats">
            <div className="auth-stat-card">
              <span>Avg. speed boost</span>
              <strong>3.2x</strong>
            </div>
            <div className="auth-stat-card">
              <span>Posts automated</span>
              <strong>12K+</strong>
            </div>
          </div>
          <ul>
            <li>AI captions and media</li>
            <li>Topic-based organization</li>
            <li>Calendar and status tracking</li>
          </ul>
        </div>

        <div className="auth-card">
          <div className="auth-pill-row">
            <span className={`auth-pill ${isLogin ? "active" : ""}`}>Sign In</span>
            <span className={`auth-pill ${!isLogin ? "active" : ""}`}>Sign Up</span>
          </div>

          <div className="auth-header">
            <h2>{isLogin ? "Welcome back" : "Create account"}</h2>
            <p>{isLogin ? "Sign in to continue" : "Register a new account"}</p>
          </div>

          <div className="auth-fields">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />

            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <svg className="auth-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="auth-spin-track" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="auth-spin-head" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                {isLogin ? "Signing in..." : "Registering..."}
              </>
            ) : (
              isLogin ? "Sign In" : "Sign Up"
            )}
          </button>

          <p className="auth-switch">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}