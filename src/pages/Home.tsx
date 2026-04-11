import { useRef } from "react";
import NavBar from "../components/NavigationBar/NavBar";
import AboutUs from "../components/Sections/AboutUs";
import Generate from "../components/Sections/GeneratePost";
import Contact from "../components/Sections/Contact";
import Footer from "../components/Footer/Footer";
import Phone from "../components/Sections/Phone";
import PricingSection from "../components/Sections/PricingSection";
import DashboardPreview from "../components/Sections/DashboardPreview";
export default function Home() {

  const aboutRef = useRef<HTMLDivElement>(null!);
  const generateRef = useRef<HTMLDivElement>(null!);
  const contactRef = useRef<HTMLDivElement>(null!);
const phoneRef = useRef<HTMLDivElement>(null!);
const   pricingRef = useRef<HTMLDivElement>(null!);
const dashboardPreviewRef = useRef<HTMLDivElement>(null!);
const blogRef = useRef<HTMLDivElement>(null!);
const previewRef = useRef<HTMLDivElement>(null!);


  const sections = {
    about: aboutRef,
    generate: generateRef,
    contact: contactRef,
    phone: phoneRef,
    pricing: pricingRef,
    dashboardPreview: dashboardPreviewRef,
    blog: blogRef,
    preview: previewRef,
  };

  return (
    <>  
      <NavBar sections={sections} />

      <div ref={aboutRef}>
        <AboutUs />
         <Phone />  
         
      </div>

      <div ref={dashboardPreviewRef}>
        <DashboardPreview />
      </div>
    
      <div ref={generateRef}>
        <Generate />
      </div>


      <div ref={contactRef}>
        <Contact />
      </div>


   <div ref={pricingRef}>
    <PricingSection />
   </div>

      <Footer />
    </>
  );
}