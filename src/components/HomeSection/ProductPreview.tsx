const navItems = [
  { label: "Dashboard" },
  { label: "Generate", active: true },
  { label: "Schedule" },
  { label: "Analytics" },
  { label: "Settings" },
];

const generatedPosts = [
  {
    platform: "Instagram",
    dot: "#E1306C",
    text: "🚀 Something exciting just landed. A smarter way to create content — meet AutoGenerate.",
  },
  {
    platform: "LinkedIn",
    dot: "#0A66C2",
    text: "Thrilled to announce the launch of AutoGenerate — a new approach to social media content at scale.",
  },
  {
    platform: "TikTok",
    dot: "#374151",
    text: "POV: You just found the tool that writes your content so you don't have to ✨",
  },
  {
    platform: "Facebook",
    dot: "#1877F2",
    text: "Big news! We've been quietly building something special. It's finally ready — come see.",
  },
];

export function ProductPreview() {
  return (
    <div
      className="w-full overflow-hidden rounded-xl md:rounded-2xl"
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        boxShadow:
          "0 0 0 1px rgba(0,0,0,0.03), 0 24px 48px -12px rgba(0,0,0,0.12), 0 0 80px -20px rgba(99,102,241,0.08)",
      }}
    >
      {/* Browser chrome */}
      <div
        className="flex items-center px-4 h-9 flex-shrink-0"
        style={{ background: "#f3f4f6", borderBottom: "1px solid #e5e7eb" }}
      >
        <div className="flex items-center gap-[5px]">
          <span className="w-2.5 h-2.5 rounded-full block" style={{ background: "#ff5f57" }} />
          <span className="w-2.5 h-2.5 rounded-full block" style={{ background: "#febc2e" }} />
          <span className="w-2.5 h-2.5 rounded-full block" style={{ background: "#28c840" }} />
        </div>

        <div
          className="mx-auto flex items-center gap-1.5 px-3 py-[3px] rounded-md text-[11px]"
          style={{ background: "#e5e7eb", color: "#6b7280" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#28c840" }}
          />
          app.autogenerate.io
        </div>
      </div>

      {/* App shell */}
      <div className="flex" style={{ height: "460px" }}>
        {/* Sidebar */}
        <div
          className="w-44 flex-shrink-0 flex flex-col p-4"
          style={{ background: "#f9fafb", borderRight: "1px solid #e5e7eb" }}
        >
          {/* Logo mark */}
          <div className="flex items-center gap-2 mb-7">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: "#6366f1" }}
            >
              <span className="text-[8px] font-bold text-white leading-none">AG</span>
            </div>
            <span className="text-[11px] font-semibold" style={{ color: "#111827" }}>
              AutoGenerate
            </span>
          </div>

          {/* Nav items */}
          <nav className="flex flex-col gap-0.5">
            {navItems.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-2.5 py-[7px] rounded-lg text-[11px] cursor-default"
                style={{
                  background: item.active ? "#eef2ff" : "transparent",
                  color: item.active ? "#6366f1" : "#9ca3af",
                }}
              >
                <span
                  className="w-[5px] h-[5px] rounded-full flex-shrink-0"
                  style={{
                    background: item.active ? "#6366f1" : "#e5e7eb",
                  }}
                />
                {item.label}
              </div>
            ))}
          </nav>

          {/* Bottom usage indicator */}
          <div className="mt-auto">
            <div className="text-[9px] mb-1.5" style={{ color: "#9ca3af" }}>
              Posts this month
            </div>
            <div
              className="w-full h-1 rounded-full overflow-hidden"
              style={{ background: "#e5e7eb" }}
            >
              <div
                className="h-full rounded-full"
                style={{ width: "38%", background: "#6366f1" }}
              />
            </div>
            <div className="text-[9px] mt-1" style={{ color: "#9ca3af" }}>
              19 / 50 used
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-5 overflow-hidden flex flex-col bg-white">
          {/* Header row */}
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h2 className="text-[12px] font-semibold" style={{ color: "#111827" }}>
              Generate Post
            </h2>
            <div
              className="text-[9px] px-2.5 py-1 rounded-full"
              style={{ background: "#eef2ff", color: "#6366f1", border: "1px solid #c7d2fe" }}
            >
              ● AI Ready
            </div>
          </div>

          {/* Brief input */}
          <div
            className="p-3 rounded-xl mb-3 text-[11px] leading-relaxed flex-shrink-0"
            style={{
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              color: "#374151",
            }}
          >
            Announcing our product launch — highlight speed, simplicity, and
            how it saves time for creators...
            <span
              className="inline-block w-[2px] h-[11px] ml-px align-middle animate-pulse"
              style={{ background: "#6366f1", borderRadius: "1px" }}
            />
          </div>

          {/* Platform selector */}
          <div className="flex gap-1.5 mb-4 flex-shrink-0 flex-wrap">
            {["Instagram", "LinkedIn", "TikTok", "Facebook"].map((p, i) => (
              <span
                key={i}
                className="text-[10px] px-2.5 py-1 rounded-full"
                style={{
                  background: i < 2 ? "#eef2ff" : "#f3f4f6",
                  border: `1px solid ${i < 2 ? "#c7d2fe" : "#e5e7eb"}`,
                  color: i < 2 ? "#6366f1" : "#9ca3af",
                }}
              >
                {p}
              </span>
            ))}
          </div>

          {/* Results label */}
          <p className="text-[9px] mb-2.5 flex-shrink-0" style={{ color: "#9ca3af" }}>
            Generated · 4 variations
          </p>

          {/* Generated post cards */}
          <div className="grid grid-cols-2 gap-2 overflow-hidden">
            {generatedPosts.map((post, i) => (
              <div
                key={i}
                className="p-3 rounded-xl"
                style={{
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <span
                    className="w-[5px] h-[5px] rounded-full flex-shrink-0"
                    style={{ background: post.dot }}
                  />
                  <span className="text-[9px]" style={{ color: "#6b7280" }}>
                    {post.platform}
                  </span>
                </div>
                <p className="text-[10px] leading-[1.55]" style={{ color: "#374151" }}>
                  {post.text.slice(0, 72)}…
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
