import { FaInstagram, FaLinkedinIn, FaTwitter, FaYoutube } from "react-icons/fa";

const Footer: React.FC = () => {
  return (
    <footer
      style={{
        background: "#fff1f3",
        borderTop: "1px solid #e5e7eb",
        color: "#111827",
      }}
      className="px-6 py-20"
    >
      <div className="max-w-6xl mx-auto">

        {/* Top grid */}
        <div className="grid md:grid-cols-4 gap-12">

          {/* Brand */}
          <div className="md:col-span-2">
            {/* Logo mark */}
            <div className="flex items-center gap-2.5 mb-5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "#e65787" }}
              >
                <span className="text-[10px] font-bold text-white">AG</span>
              </div>
              <span className="text-base font-bold" style={{ color: "#111827" }}>
                AutoGenerate
              </span>
            </div>

            <p className="text-sm leading-relaxed max-w-xs" style={{ color: "#6b7280" }}>
              AI-powered social media automation. Write, schedule, and analyze
              content across every platform — from one place.
            </p>

            {/* Social icons */}
            <div className="flex gap-4 mt-6" style={{ color: "#9ca3af" }}>
              <FaInstagram
                size={16}
                className="cursor-pointer transition-colors duration-200 hover:text-[#e65787]"
              />
              <FaLinkedinIn
                size={16}
                className="cursor-pointer transition-colors duration-200 hover:text-[#e65787]"
              />
              <FaTwitter
                size={16}
                className="cursor-pointer transition-colors duration-200 hover:text-[#e65787]"
              />
              <FaYoutube
                size={16}
                className="cursor-pointer transition-colors duration-200 hover:text-[#e65787]"
              />
            </div>
          </div>

          {/* Product links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "#9ca3af" }}>
              Product
            </h3>
            <ul className="space-y-3">
              {["Features", "Pricing", "Demo", "Reviews", "Contact"].map((item) => (
                <li key={item}>
                  <span
                    className="text-sm cursor-pointer transition-colors duration-200"
                    style={{ color: "#6b7280" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#e65787")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "#9ca3af" }}>
              Stay Updated
            </h3>
            <p className="text-sm mb-4" style={{ color: "#6b7280" }}>
              Tips on content, branding & automation.
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-2.5 text-sm rounded-l-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRight: "none",
                  color: "#111827",
                }}
              />
              <button
                className="px-5 py-2.5 text-sm font-semibold rounded-r-xl text-white transition-opacity duration-200 hover:opacity-90"
                style={{ background: "#e65787" }}
              >
                Join
              </button>
            </div>
          </div>

        </div>

        {/* Divider */}
        <div className="my-12" style={{ borderTop: "1px solid #e5e7eb" }} />

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs" style={{ color: "#9ca3af" }}>
            © {new Date().getFullYear()} AutoGenerate. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs" style={{ color: "#9ca3af" }}>
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
              <span
                key={item}
                className="cursor-pointer transition-colors duration-200"
                onMouseEnter={(e) => (e.currentTarget.style.color = "#e65787")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
              >
                {item}
              </span>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
