type Props = {
  caption?: string;
  image?: string;
};

export default function IgMock({ caption, image }: Props) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 260,
        border: "1px solid #dbdbdb",
        borderRadius: 12,
        overflow: "hidden",
        background: "#fff",
        fontFamily: "Arial, sans-serif"
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "8px 10px",
          gap: 8
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7)"
          }}
        />
        <div style={{ fontWeight: 600, fontSize: 12 }}>
          your_brand
        </div>
      </div>

      {/* IMAGE */}
      <div
        style={{
          width: "100%",
          height: 180,
          background: image
            ? `url(${image}) center/cover`
            : "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#9ca3af",
          fontSize: 12
        }}
      >
        {!image && "Your image"}
      </div>

      {/* ACTIONS */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "8px 10px",
          fontSize: 16
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          ❤️ 💬 📤
        </div>
        <div>🔖</div>
      </div>

      {/* LIKES */}
      <div
        style={{
          padding: "0 10px",
          fontSize: 12,
          fontWeight: 600
        }}
      >
        123 likes
      </div>

      {/* CAPTION */}
      <div
        style={{
          padding: "4px 10px 10px",
          fontSize: 12,
          lineHeight: 1.4,
          color: "#111"
        }}
      >
        <span style={{ fontWeight: 600 }}>your_brand </span>
        {caption || "Your caption will appear here..."}
      </div>
    </div>
  );
}