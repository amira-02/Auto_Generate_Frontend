import { useRef } from "react";
import NavBar from "../components/NavigationBar/NavBar";
import AboutUs from "../components/Sections/AboutUs";
import Generate from "../components/Sections/GeneratePost";
import Contact from "../components/Sections/Contact";
import Footer from "../components/Footer/Footer";


export default function Home() {

  const aboutRef = useRef<HTMLDivElement>(null!);
  const generateRef = useRef<HTMLDivElement>(null!);
  const contactRef = useRef<HTMLDivElement>(null!);

  const sections = {
    about: aboutRef,
    generate: generateRef,
    contact: contactRef,
  };

  return (
    <>  
      <NavBar sections={sections} />

      <div ref={aboutRef}>
        <AboutUs />
      </div>

      <div ref={generateRef}>
        <Generate />
      </div>

      <div ref={contactRef}>
        <Contact />
      </div>

      <Footer />
    </>
  );
}