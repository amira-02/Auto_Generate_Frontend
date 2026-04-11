import { useEffect, useRef, useState } from "react";

// ✅ TYPES FIX
type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
  captions?: Record<string, string> | null;
};

export default function ChatBotPage() {
  // ✅ FIX never[]
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // 🔥 SEND MESSAGE
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      captions: null,
    };

    const updatedMessages: Message[] = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          history: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      const botMessage: Message = {
        id: crypto.randomUUID(),
        role: "bot",
        content: data.reply || data.message || "No response from server",
        captions: data.platform_posts ? extractCaptions(data) : null,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "bot",
        content: "❌ Error connecting to server",
        captions: null,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 SAFE N8N PARSER
  const extractCaptions = (data: any): Record<string, string> => {
    const p = data?.platform_posts || {};

    const captions: Record<string, string> = {};

    if (p?.Instagram?.caption) captions["Instagram"] = p.Instagram.caption;
    if (p?.LinkedIn?.post) captions["LinkedIn"] = p.LinkedIn.post;
    if (p?.Facebook?.post) captions["Facebook"] = p.Facebook.post;
    if (p?.["X-Twitter"]?.post) captions["X"] = p["X-Twitter"].post;
    if (p?.TikTok?.caption) captions["TikTok"] = p.TikTok.caption;

    return captions;
  };

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>🤖 ChatBot Test</div>

      {/* CHAT */}
      <div style={styles.chatBox}>
        {messages.length === 0 && (
          <div style={styles.empty}>
            Start a conversation 👇
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              ...styles.messageRow,
              justifyContent:
                msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                ...styles.bubble,
                background:
                  msg.role === "user" ? "#3b82f6" : "#f3f4f6",
                color: msg.role === "user" ? "#fff" : "#111",
              }}
            >
              {msg.content}

              {/* CAPTIONS */}
              {msg.captions && (
                <div style={styles.captionBox}>
                  {Object.entries(msg.captions).map(
                    ([platform, text]) => (
                      <div key={platform}>
                        <strong>{platform}:</strong> {text}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && <div style={styles.loading}>⏳ Thinking...</div>}

        <div ref={chatBottomRef} />
      </div>

      {/* INPUT */}
      <div style={styles.inputBar}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask something..."
          style={styles.input}
        />

        <button onClick={sendMessage} style={styles.button}>
          ➤
        </button>
      </div>
    </div>
  );
}

// 🎨 STYLES (typed safe)
const styles: Record<string, React.CSSProperties> = {
  page: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#fff",
    fontFamily: "Arial",
  },
  header: {
    padding: 14,
    borderBottom: "1px solid #eee",
    fontWeight: 700,
  },
  chatBox: {
    flex: 1,
    padding: 16,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  empty: {
    textAlign: "center",
    color: "#aaa",
    marginTop: 50,
  },
  messageRow: {
    display: "flex",
  },
  bubble: {
    maxWidth: "70%",
    padding: "10px 14px",
    borderRadius: 12,
    fontSize: 14,
    whiteSpace: "pre-wrap",
  },
  captionBox: {
    marginTop: 8,
    fontSize: 12,
    background: "#fff",
    padding: 8,
    borderRadius: 8,
    border: "1px solid #ddd",
  },
  loading: {
    fontSize: 12,
    color: "#888",
  },
  inputBar: {
    display: "flex",
    padding: 10,
    borderTop: "1px solid #eee",
    gap: 8,
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ddd",
    outline: "none",
  },
  button: {
    padding: "10px 14px",
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
};