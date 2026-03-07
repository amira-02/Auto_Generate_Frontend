import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../../services/api";
import { AuthContext } from "../../hooks/AuthContext";    
import "../../assets/GeneratePost.css";

const GeneratePost: React.FC = () => {
 const auth = useContext(AuthContext);

const token = auth?.token;

  const [prompt, setPrompt] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setFileName(selectedFile ? selectedFile.name : "");
  };

  // const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
  //   e.preventDefault();
  //   const dropped = e.dataTransfer.files[0];

  //   if (dropped && dropped.name.endsWith(".json")) {
  //     setFile(dropped);
  //     setFileName(dropped.name);
  //   }
  // };

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
    <div className="generate-post-page bg-gray-50 min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-transparent rounded-2xl shadow-lg p-8 flex flex-col gap-6">

        {/* Prompt */}
        <div>
          <label className="mb-2 font-medium block">Prompt</label>

          <div className="relative">
            <textarea
              className="w-full border rounded-lg p-3 pr-12 focus:ring-2 focus:ring-blue-400 resize-none"
              placeholder="E.g., Write a professional LinkedIn post about AI..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              maxLength={500}
            />

            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
              id="fileInput"
            />

            <label
              htmlFor="fileInput"
              className="absolute bottom-3 right-3 cursor-pointer text-gray-400 hover:text-blue-500 transition"
            >
              {fileName ? (
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    setFile(null);
                    setFileName("");
                  }}
                  className="text-xs text-black hover:text-red-600 font-medium"
                >
                  ✕ {fileName.length > 10 ? fileName.slice(0, 10) + "…" : fileName}
                </span>
              ) : (
                "⬆"
              )}
            </label>
          </div>

          <div className="text-sm text-gray-400 text-right">
            {prompt.length}/500
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleGenerate}
            disabled={loading || (!prompt && !file)}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 transition"
          >
            {loading ? "Generating..." : "⚡ Generate Post"}
          </button>

          {(prompt || file) && (
            <button
              onClick={handleClear}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition"
            >
              Clear
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default GeneratePost;