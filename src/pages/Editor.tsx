import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/ThemeContext";
import { useState } from "react";

export default function Editor() {
  const { state } = useLocation();
  const { t, isDark } = useTheme();
  const navigate = useNavigate();
  const [content, setContent] = useState<string>(state?.post || "");

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, fontFamily: "inherit", padding: 32 }}>
      <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => navigate(-1)}
            style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: t.subtext, fontSize: 13, fontFamily: "inherit" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#00bfff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = t.subtext)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Post Editor</h1>
          <div style={{ width: 60 }} />
        </div>

        {/* Prompt used */}
        {state?.prompt && (
          <div style={{ background: isDark ? "#1a1a1a" : "#f0fdf4", border: `1px solid ${t.border}`, borderRadius: 12, padding: "12px 16px" }}>
            <span style={{ fontSize: 11, color: t.muted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Prompt used</span>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: t.subtext }}>{state.prompt}</p>
          </div>
        )}

        {/* Editor */}
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${t.border}`, display: "flex", gap: 8 }}>
            <span style={{ fontSize: 12, color: t.muted }}>Generated Post</span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              width: "100%", minHeight: 300, background: "transparent",
              border: "none", outline: "none", padding: 20,
              color: t.text, fontSize: 15, fontFamily: "inherit",
              lineHeight: 1.7, resize: "vertical", boxSizing: "border-box"
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => { navigator.clipboard.writeText(content); alert("Copied!"); }}
            style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1px solid ${t.border}`, background: t.card, color: t.text, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
            📋 Copy
          </button>
          <button
            onClick={() => {
              const blob = new Blob([content], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = "post.txt"; a.click();
              URL.revokeObjectURL(url);
            }}
            style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1px solid ${t.border}`, background: t.card, color: t.text, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
            ⬇ Download
          </button>
          <button
            style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: "#00bfff", color: "#000", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>
            🚀 Publish
          </button>
        </div>

      </div>
    </div>
  );
}