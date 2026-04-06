import React from "react";
import IgMock from "./IgMock";

type Props = {
  modal: any;
  setM: (data: any) => void;
  closeModal: () => void;

  handleGenerate: () => void;
  handlePublish: () => void;
  handleSaveDraft: () => void;

  handleFileUpload: any;
  handleImageUpload: any;
  handleVideoUpload: any;
  handleGenerateImage: any;

  togglePlatform: any;
  removeImage: any;
  copyCaption: any;

  fileInputRef: any;
  imageInputRef: any;
  videoInputRef: any;

  copyDone: boolean;
  PLATFORMS: any[];
};

/* ✅ FIX TS HERE */
const S: { [key: string]: React.CSSProperties } = {
  col: {
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 12
  },
  divider: {
    borderRight: "1px solid #e5e7eb"
  },
  colTitle: {
    fontSize: 13,
    fontWeight: 700
  },
  label: {
    fontSize: 12,
    fontWeight: 600
  },
  input: {
    width: "100%",
    padding: "8px",
    borderRadius: 6,
    border: "1px solid #d1d5db"
  }
};

export default function CreatePostModal(props: Props) {
  const {
    modal,
    setM,
    closeModal,
    handleGenerate,
    handlePublish,
    handleSaveDraft,
    handleFileUpload,
    handleImageUpload,
    handleVideoUpload,
    handleGenerateImage,
    togglePlatform,
    removeImage,
    copyCaption,
    fileInputRef,
    imageInputRef,
    videoInputRef,
    copyDone,
    PLATFORMS
  } = props;

  if (!modal.open) return null;

  return (
    <div
      onClick={closeModal}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.52)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 1000
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          width: "95vw",
          maxWidth: 1380,
          height: "90vh",
          borderRadius: 20,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
      >

        {/* HEADER */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <h2 style={{ margin: 0 }}>Create Post</h2>
          <button
            onClick={closeModal}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 20,
              cursor: "pointer"
            }}
          >
            ✕
          </button>
        </div>

        {/* ================= FORM ================= */}
        {modal.step === "form" && (
          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

            {/* LEFT */}
          {/* COL 1 — Inputs */}
<div style={{ ...S.col, ...S.divider, maxWidth: 320, minWidth: 280 }}>
  <div style={S.colTitle}>📝 Content Settings</div>

  {/* Topic */}
  <div>
    <label style={S.label}>Topic</label>
    <textarea
      rows={3}
      placeholder="What's your post about?"
      value={modal.topic}
      onChange={(e) => setM({ topic: e.target.value, error: "" })}
      style={{ ...S.input, resize: "vertical" as const }}
    />
  </div>

  {/* Upload */}
  <div>
    <label style={S.label}>
      Upload file{" "}
      <span style={{ fontWeight: 400, color: "#9ca3af" }}>
        (PDF / TXT)
      </span>
    </label>

    <div
      onClick={() => fileInputRef.current?.click()}
      style={{
        border: "1.5px dashed #d1d5db",
        borderRadius: 8,
        padding: "12px",
        textAlign: "center",
        cursor: "pointer",
        fontSize: 12,
        color: "#6b7280"
      }}
    >
      {modal.fileName ? `✅ ${modal.fileName}` : "📄 Click to upload"}
    </div>

    <input
      ref={fileInputRef}
      type="file"
      accept=".txt,.pdf"
      onChange={handleFileUpload}
      style={{ display: "none" }}
    />
  </div>

  {/* Caption Length */}
  <div>
    <label style={S.label}>Caption length</label>

    <div style={{ display: "flex", gap: 6 }}>
      {(["short", "medium", "long"] as const).map((v) => (
        <button
          key={v}
          onClick={() => setM({ captionLength: v })}
          style={{
            flex: 1,
            padding: "7px 4px",
            borderRadius: 7,
            fontSize: 11,
            fontWeight: modal.captionLength === v ? 700 : 400,
            border: "1px solid",
            borderColor:
              modal.captionLength === v ? "#3b82f6" : "#d1d5db",
            background:
              modal.captionLength === v ? "#eff6ff" : "#fff",
            color:
              modal.captionLength === v ? "#3b82f6" : "#6b7280",
            cursor: "pointer"
          }}
        >
          {v.charAt(0).toUpperCase() + v.slice(1)}
        </button>
      ))}
    </div>
  </div>

  {/* Tone */}
  <div>
    <label style={S.label}>Tone of voice</label>

    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {(["professional", "casual", "funny", "inspirational"] as const).map(
        (v) => (
          <button
            key={v}
            onClick={() => setM({ tone: v })}
            style={{
              padding: "6px 10px",
              borderRadius: 7,
              fontSize: 11,
              fontWeight: modal.tone === v ? 700 : 400,
              border: "1px solid",
              borderColor:
                modal.tone === v ? "#3b82f6" : "#d1d5db",
              background:
                modal.tone === v ? "#eff6ff" : "#fff",
              color:
                modal.tone === v ? "#3b82f6" : "#6b7280",
              cursor: "pointer"
            }}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        )
      )}
    </div>
  </div>

  {/* Hashtags */}
  <div>
    <label style={S.label}>Hashtags</label>

    <input
      placeholder="#automation #n8n #ai"
      value={modal.hashtags}
      onChange={(e) => setM({ hashtags: e.target.value })}
      style={S.input}
    />
  </div>

  {/* Platforms */}
  <div>
    <label style={S.label}>Platforms</label>

    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {PLATFORMS.map((p) => {
        const sel = modal.selectedPlatforms.includes(p.id);

        return (
          <button
            key={p.id}
            onClick={() => togglePlatform(p.id)}
            style={{
              padding: "6px 10px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: sel ? 700 : 400,
              border: "1px solid",
              borderColor: sel ? p.color : "#d1d5db",
              background: sel ? p.color + "18" : "#fff",
              color: sel ? p.color : "#6b7280",
              cursor: "pointer"
            }}
          >
            {p.icon} {p.label}
          </button>
        );
      })}
    </div>
  </div>

  {/* Error */}
  {modal.error && (
    <div
      style={{
        background: "#fef2f2",
        border: "1px solid #fecaca",
        borderRadius: 8,
        padding: "10px 12px",
        fontSize: 12,
        color: "#dc2626"
      }}
    >
      ⚠️ {modal.error}
    </div>
  )}

  {/* Generate */}
  <button
    onClick={handleGenerate}
    disabled={
      (!modal.topic && !modal.fileContent) ||
      modal.selectedPlatforms.length === 0
    }
    style={{
      marginTop: "auto",
      padding: "12px",
      borderRadius: 9,
      border: "none",
      background:
        (!modal.topic && !modal.fileContent) ||
        modal.selectedPlatforms.length === 0
          ? "#9ca3af"
          : "#3b82f6",
      color: "#fff",
      cursor:
        (!modal.topic && !modal.fileContent) ||
        modal.selectedPlatforms.length === 0
          ? "not-allowed"
          : "pointer",
      fontSize: 14,
      fontWeight: 700
    }}
  >
    ✨ Generate Content
  </button>
</div>

            {/* CENTER */}
            <div style={{ ...S.col, ...S.divider, flex: 1 }}>
              <div style={S.colTitle}>📄 Caption</div>

              <textarea
                value={modal.generatedContent || ""}
                onChange={(e) =>
                  setM({ generatedContent: e.target.value })
                }
                style={{ ...S.input, flex: 1, minHeight: 200 }}
              />

              <button onClick={copyCaption}>
                {copyDone ? "✅ Copied" : "📋 Copy"}
              </button>
            </div>

            {/* RIGHT */}
            <div style={{ ...S.col, maxWidth: 320 }}>
              <div style={S.colTitle}>📱 Preview</div>

            <IgMock
  caption={modal.generatedContent}
  image={modal.uploadedImages?.[0]}
/>

              <button onClick={handleGenerateImage}>
                🎨 AI Image
              </button>

              <button onClick={() => imageInputRef.current?.click()}>
                📸 Upload Image
              </button>

              <button onClick={() => videoInputRef.current?.click()}>
                🎥 Upload Video
              </button>

              <input
                ref={imageInputRef}
                type="file"
                onChange={handleImageUpload}
                hidden
              />

              <input
                ref={videoInputRef}
                type="file"
                onChange={handleVideoUpload}
                hidden
              />

              {/* Images */}
              {modal.uploadedImages?.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {modal.uploadedImages.map((img: string, i: number) => (
                    <div key={i} style={{ position: "relative" }}>
                      <img
                        src={img}
                        style={{
                          width: 60,
                          height: 60,
                          objectFit: "cover",
                          borderRadius: 6
                        }}
                      />
                      <button
                        onClick={() => removeImage(i)}
                        style={{
                          position: "absolute",
                          top: -5,
                          right: -5,
                          background: "red",
                          color: "#fff",
                          border: "none",
                          borderRadius: "50%",
                          width: 18,
                          height: 18,
                          cursor: "pointer"
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= GENERATING ================= */}
        {modal.step === "generating" && (
          <div
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            ⏳ Generating...
          </div>
        )}

        {/* ================= PREVIEW ================= */}
        {modal.step === "preview" && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              padding: 20
            }}
          >
            <textarea
              value={modal.generatedContent}
              onChange={(e) =>
                setM({ generatedContent: e.target.value })
              }
              style={{ flex: 1 }}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handlePublish}>🚀 Publish</button>
              <button onClick={handleSaveDraft}>💾 Draft</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}