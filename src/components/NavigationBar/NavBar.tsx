import type { RefObject } from "react";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../hooks/AuthContext";
import "../../assets/NavBar.css";

type Sections = {
  about: RefObject<HTMLDivElement>;
  generate: RefObject<HTMLDivElement>;
  contact: RefObject<HTMLDivElement>;
  pricing: RefObject<HTMLDivElement>;
  blog: RefObject<HTMLDivElement>;
  dashboardPreview: RefObject<HTMLDivElement>;
};

interface NavBarProps {
  sections?: Sections;
}

export default function NavBar({ sections }: NavBarProps) {
  const { token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const scrollToSection = (key: keyof Sections) => {
    const ref = sections?.[key];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
 <nav className="navbar">

  {/* LEFT */}
  <div className="nav-left">
    <div className="logo" onClick={() => navigate("/")}>
      <span className="logo-icon">AG</span>
      Auto Generate
    </div>
  </div>

  {/* CENTER (IMPORTANT) */}
  <div className="nav-center">
    {sections && (
      <div className="links-container">
        <ul className="nav-links">
          <li onClick={() => scrollToSection("about")}>About Us</li>
          <li onClick={() => scrollToSection("generate")}>Generate Post</li>
          <li onClick={() => scrollToSection("contact")}>Contact</li>
          <li onClick={() => scrollToSection("pricing")}>Pricing</li>
          <li onClick={() => scrollToSection("blog")}>Blog</li>
          <li onClick={() => scrollToSection("dashboardPreview")}>
            Dash Preview
          </li>
        </ul>
      </div>
    )}
  </div>

  {/* RIGHT */}
  <div className="auth-container">
    <div className="nav-right">
      {token ? (
        <>
          <button className="signin" onClick={() => navigate("/dashboard")}>
            My Dashboard
          </button>
          <button className="signup" onClick={handleLogout}>
            Logout
          </button>
        </>
      ) : (
        <>
          <button className="signin" onClick={() => navigate("/auth")}>
            Sign In
          </button>
          <button className="signup" onClick={() => navigate("/auth")}>
            Sign Up
          </button>
        </>
      )}
    </div>
  </div>

</nav>
  );
}