import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../../services/api";
import { AuthContext } from "../../hooks/AuthContext";

export default function GeneratePost() {
  const auth = useContext(AuthContext);
  const token = auth?.token;

  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!prompt && !file) return;
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("Prompt", prompt);
      if (file) formData.append("JsonFile", file);

      const res = await API.post("/ai/generate", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      navigate("/editor", { state: { post: res.data.post, prompt } });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ffffff] to-[#ffffff] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-800">
            Generate LinkedIn Post ✨
          </h1>
          <p className="text-gray-500 mt-2">
            Describe your idea and let AI do the magic
          </p>
        </div>

        {/* Prompt Box */}
        <div className="mb-6">
          <textarea
            className="w-full h-40 p-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4E8B6B] resize-none"
            placeholder="Write something like: AI trends in 2025..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-gray-50 transition">
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <span className="text-gray-500">
              {file ? file.name : "Upload JSON file (optional)"}
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-[#4E8B6B] text-white font-medium shadow-md hover:scale-105 transition"
          >
            {loading ? "Generating..." : "Generate 🚀"}
          </button>

          <button
            onClick={() => {
              setPrompt("");
              setFile(null);
            }}
            className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
