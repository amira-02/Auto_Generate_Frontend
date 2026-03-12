import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../../services/api";
import { AuthContext } from "../../hooks/AuthContext";

const GeneratePost: React.FC = () => {
  const auth = useContext(AuthContext);
  const token = auth?.token;

  const [prompt, setPrompt] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [focused, setFocused] = useState<boolean>(false);

  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setFileName(selectedFile ? selectedFile.name : "");
  };

  const handleGenerate = async () => {
    if (!prompt && !file) return alert("Prompt or JSON file is required");
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("Prompt", prompt);
      if (file) formData.append("JsonFile", file);
      const res = await API.post("/ai/generate", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/editor", { state: { post: res.data.post, prompt } });
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Error generating post.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setPrompt("");
    setFile(null);
    setFileName("");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,400&display=swap');

        .gp-root {
          font-family: 'Plus Jakarta Sans', sans-serif;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
          overflow: hidden;
          background: #f0faf4;
        }

        /* Light mesh background */
        .gp-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 70% 55% at 15% 15%, rgba(134, 239, 172, 0.45) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 85% 75%, rgba(52, 211, 153, 0.3) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 55% 5%,  rgba(187, 247, 208, 0.5) 0%, transparent 50%),
            radial-gradient(ellipse 40% 35% at 90% 20%, rgba(110, 231, 183, 0.25) 0%, transparent 50%);
          animation: meshShift 14s ease-in-out infinite alternate;
          pointer-events: none;
          z-index: 0;
        }

        /* Floating orbs */
        .gp-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(70px);
          pointer-events: none;
          z-index: 0;
          animation: float 9s ease-in-out infinite;
        }
        .gp-orb-1 {
          width: 320px; height: 320px;
          background: rgba(74, 222, 128, 0.22);
          top: -100px; left: -100px;
          animation-delay: 0s;
        }
        .gp-orb-2 {
          width: 260px; height: 260px;
          background: rgba(16, 185, 129, 0.18);
          bottom: -70px; right: -70px;
          animation-delay: -4.5s;
        }
        .gp-orb-3 {
          width: 200px; height: 200px;
          background: rgba(134, 239, 172, 0.25);
          top: 40%; right: 10%;
          animation-delay: -2s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-28px) scale(1.04); }
        }
        @keyframes meshShift {
          0%   { opacity: 0.85; transform: scale(1) rotate(0deg); }
          100% { opacity: 1;    transform: scale(1.04) rotate(2deg); }
        }

        /* Card — light glassmorphism */
        .gp-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 600px;
          background: rgba(255, 255, 255, 0.55);
          backdrop-filter: blur(28px) saturate(160%);
          -webkit-backdrop-filter: blur(28px) saturate(160%);
          border: 1px solid rgba(255, 255, 255, 0.75);
          border-radius: 28px;
          padding: 2.5rem;
          box-shadow:
            0 0 0 1px rgba(52, 211, 153, 0.18),
            0 24px 60px rgba(16, 185, 129, 0.12),
            0 4px 16px rgba(0, 0, 0, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
          animation: cardIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }

        /* Header */
        .gp-header {
          margin-bottom: 2rem;
          text-align: center;
        }
        .gp-eyebrow {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #059669;
          margin-bottom: 0.5rem;
        }
        .gp-title {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          font-weight: 700;
          color: #064e3b;
          line-height: 1.15;
          margin: 0;
        }
        .gp-title span {
          font-style: italic;
          font-weight: 400;
          background: linear-gradient(135deg, #059669, #10b981, #34d399);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .gp-subtitle {
          margin-top: 0.5rem;
          font-size: 0.85rem;
          color: #6b7280;
          font-weight: 400;
        }

        /* Divider */
        .gp-divider {
          width: 48px;
          height: 2.5px;
          background: linear-gradient(90deg, #059669, #34d399, #a7f3d0);
          border-radius: 99px;
          margin: 1rem auto 0;
        }

        /* Label */
        .gp-label {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #6b7280;
          display: block;
          margin-bottom: 0.6rem;
        }

        /* Textarea wrapper */
        .gp-textarea-wrap {
          position: relative;
          border-radius: 16px;
        }
        .gp-textarea-wrap::before {
          content: '';
          position: absolute;
          inset: -1.5px;
          border-radius: 17.5px;
          background: linear-gradient(135deg, #059669, #34d399, #6ee7b7);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
          z-index: 0;
        }
        .gp-textarea-wrap.focused::before {
          opacity: 0.7;
        }

        textarea.gp-textarea {
          position: relative;
          z-index: 1;
          width: 100%;
          background: rgba(255, 255, 255, 0.7);
          border: 1.5px solid rgba(167, 243, 208, 0.7);
          border-radius: 16px;
          padding: 1rem 3.5rem 1rem 1.1rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.92rem;
          font-weight: 400;
          color: #064e3b;
          resize: none;
          outline: none;
          box-sizing: border-box;
          transition: background 0.3s ease, border-color 0.3s ease;
          line-height: 1.65;
        }
        textarea.gp-textarea::placeholder {
          color: #9ca3af;
          font-style: italic;
          font-weight: 300;
        }
        textarea.gp-textarea:focus {
          background: rgba(255, 255, 255, 0.9);
          border-color: transparent;
        }

        /* File trigger */
        .gp-file-trigger {
          position: absolute;
          bottom: 12px;
          right: 12px;
          z-index: 2;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: rgba(16, 185, 129, 0.1);
          border: 1.5px solid rgba(52, 211, 153, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #059669;
          font-size: 0.85rem;
        }
        .gp-file-trigger:hover {
          background: rgba(16, 185, 129, 0.18);
          border-color: rgba(52, 211, 153, 0.6);
          color: #047857;
          transform: scale(1.06);
        }
        .gp-file-trigger.has-file {
          background: rgba(16, 185, 129, 0.12);
          border-color: rgba(52, 211, 153, 0.5);
          color: #047857;
          width: auto;
          padding: 0 10px;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.03em;
          gap: 4px;
        }
        .gp-file-trigger.has-file:hover {
          background: rgba(220, 38, 38, 0.08);
          border-color: rgba(248, 113, 113, 0.4);
          color: #dc2626;
        }

        /* Counter */
        .gp-counter {
          text-align: right;
          font-size: 0.72rem;
          color: #9ca3af;
          margin-top: 0.4rem;
          font-weight: 400;
          letter-spacing: 0.03em;
        }

        /* Buttons */
        .gp-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.5rem;
        }

        .gp-btn-primary {
          flex: 1;
          position: relative;
          overflow: hidden;
          border: none;
          border-radius: 14px;
          padding: 0.95rem 1.5rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 700;
          color: #fff;
          cursor: pointer;
          background: linear-gradient(135deg, #059669 0%, #10b981 55%, #34d399 100%);
          box-shadow:
            0 4px 20px rgba(16, 185, 129, 0.35),
            0 1px 3px rgba(0,0,0,0.08),
            inset 0 1px 0 rgba(255,255,255,0.25);
          transition: all 0.3s ease;
          letter-spacing: 0.02em;
        }
        .gp-btn-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 55%);
        }
        .gp-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow:
            0 8px 30px rgba(16, 185, 129, 0.45),
            0 2px 6px rgba(0,0,0,0.1),
            inset 0 1px 0 rgba(255,255,255,0.3);
        }
        .gp-btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }
        .gp-btn-primary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* Shimmer */
        .gp-btn-primary.loading::after {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: shimmer 1.2s infinite;
        }
        @keyframes shimmer { to { left: 100%; } }

        .gp-btn-secondary {
          flex: 0 0 auto;
          border: 1.5px solid rgba(16, 185, 129, 0.25);
          border-radius: 14px;
          padding: 0.95rem 1.4rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          color: #6b7280;
          background: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(8px);
          letter-spacing: 0.02em;
        }
        .gp-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.75);
          border-color: rgba(16, 185, 129, 0.45);
          color: #374151;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
        }

        /* Spinner */
        .gp-spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          margin-right: 8px;
          vertical-align: middle;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="gp-root">
        <div className="gp-orb gp-orb-1" />
        <div className="gp-orb gp-orb-2" />
        <div className="gp-orb gp-orb-3" />

        <div className="gp-card">
          {/* Header */}
          <div className="gp-header">
            <p className="gp-eyebrow">✦ AI Content Studio</p>
            <h1 className="gp-title">
              Create your <span>LinkedIn post</span>
            </h1>
            <p className="gp-subtitle">Describe your idea — the AI handles the rest</p>
            <div className="gp-divider" />
          </div>

          {/* Prompt */}
          <div>
            <label className="gp-label">Your prompt</label>
            <div className={`gp-textarea-wrap ${focused ? "focused" : ""}`}>
              <textarea
                className="gp-textarea"
                placeholder="E.g., Write a professional LinkedIn post about AI trends in 2025…"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                rows={6}
                maxLength={500}
              />

              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                id="fileInput"
                style={{ display: "none" }}
              />

              <label
                htmlFor="fileInput"
                className={`gp-file-trigger ${fileName ? "has-file" : ""}`}
                onClick={
                  fileName
                    ? (e) => {
                        e.preventDefault();
                        setFile(null);
                        setFileName("");
                      }
                    : undefined
                }
              >
                {fileName ? (
                  <>✕ {fileName.length > 10 ? fileName.slice(0, 10) + "…" : fileName}</>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                )}
              </label>
            </div>
            <div className="gp-counter">{prompt.length} / 500</div>
          </div>

          {/* Actions */}
          <div className="gp-actions">
            <button
              onClick={handleGenerate}
              disabled={loading || (!prompt && !file)}
              className={`gp-btn-primary ${loading ? "loading" : ""}`}
            >
              {loading ? (
                <><span className="gp-spinner" />Generating…</>
              ) : (
                "⚡ Generate Post"
              )}
            </button>

            {(prompt || file) && (
              <button onClick={handleClear} className="gp-btn-secondary">
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default GeneratePost;