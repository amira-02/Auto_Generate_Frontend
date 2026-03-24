import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../../services/api";
import { AuthContext } from "../../hooks/AuthContext";
import "../../assets/Editor.css";
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