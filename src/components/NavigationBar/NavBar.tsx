import type { RefObject } from "react";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../hooks/AuthContext";
import "../../assets/NavBar.css";

type Sections = {
  about: RefObject<HTMLDivElement>;
  generate: RefObject<HTMLDivElement>;
  contact: RefObject<HTMLDivElement>;
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
      <div className="logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
        Auto Generate
      </div>

      {/* Scroll links — seulement sur Home */}
      {sections && (
        <ul className="nav-links">
          <li onClick={() => scrollToSection("about")}>About Us</li>
          <li onClick={() => scrollToSection("generate")}>Generate Post</li>
          <li onClick={() => scrollToSection("contact")}>Contact</li>
        </ul>
      )}

      <div className="nav-right">
        {token ? (
          // Connecté
          <>
            <button className="signin" onClick={() => navigate("/dashboard")}>
              My Dashboard
            </button>
            <button className="signup" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          // Non connecté
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
    </nav>
  );
}