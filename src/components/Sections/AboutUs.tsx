import React from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTwitter,
  FaYoutube,
  FaTiktok,
  FaSnapchat,
  FaPinterest,
  FaWhatsapp,
  FaSnapchatGhost
} from "react-icons/fa";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useTheme } from "../../hooks/ThemeContext";


const AboutUs: React.FC = () => {
  const floatVariants: Variants = {
    float: {
      y: [0, -20, 0],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
    },
  };
const { t, isDark, toggleTheme } = useTheme();
  return (
    <div style={{ background: t.bg, color: t.text }}>
      {/* <button onClick={toggleTheme}>
        {isDark ? "☀️ Light" : "🌙 Dark"}
      </button> */}
    
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 bg-[#ffffff] overflow-hidden">

     {/* Floating 3D Icons */}
{/* Floating 3D Icons */}
<div className="absolute inset-0 pointer-events-none overflow-hidden">

  {/* LEFT SIDE */}
  {[
    { Icon: FaFacebookF, color: "#1877F2", x: "15%", y: "30%", size: "text-5xl" },
    { Icon: FaLinkedinIn, color: "#0A66C2", x: "20%", y: "60%", size: "text-4xl" },
    { Icon: FaSnapchat, color: "#FFFC00", x: "10%", y: "75%", size: "text-5xl" },
    { Icon: FaPinterest, color: "#E60023", x: "25%", y: "45%", size: "text-5xl" },
  ].map((item, i) => (
    <motion.div
      key={`left-${i}`}
      animate={{
        y: [0, -20, 0],
        rotate: [0, 8, -8, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 4 + i,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={`absolute ${item.size} opacity-30`}
      style={{
        left: item.x,
        top: item.y,
        color: item.color,
        filter: "drop-shadow(0px 10px 20px rgba(0,0,0,0.25))",
        transform: "translate(-50%, -50%)",
      }}
    >
      <item.Icon />
    </motion.div>
  ))}

  {/* RIGHT SIDE */}
  {[
    { Icon: FaInstagram, color: "#E4405F", x: "85%", y: "35%", size: "text-6xl" },
    { Icon: FaTwitter, color: "#1DA1F2", x: "80%", y: "60%", size: "text-5xl" },
    { Icon: FaYoutube, color: "#FF0000", x: "90%", y: "75%", size: "text-6xl" },
    { Icon: FaTiktok, color: "#000", x: "75%", y: "50%", size: "text-5xl" },
    { Icon: FaWhatsapp, color: "#25D366", x: "88%", y: "45%", size: "text-5xl" },
  ].map((item, i) => (
    <motion.div
      key={`right-${i}`}
      animate={{
        y: [0, -25, 0],
        rotate: [0, -10, 10, 0],
        scale: [1, 1.15, 1],
      }}
      transition={{
        duration: 5 + i,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={`absolute ${item.size} opacity-30`}
      style={{
        left: item.x,
        top: item.y,
        color: item.color,
        filter: "drop-shadow(0px 10px 20px rgba(0,0,0,0.25))",
        transform: "translate(-50%, -50%)",
      }}
    >
      <item.Icon />
    </motion.div>
  ))}

</div>
        

     

    

      {/* Title */}
      <h1 className="text-5xl md:text-7xl font-semibold text-[#0F172A] leading-tight max-w-4xl mb-4">
        Building impactful digital presence in{" "}
        <span 
    className="italic font-serif bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent font-semibold"
  >
    seconds
  </span>
      </h1>

      {/* Description */}
      <p className="mt-4 max-w-2xl text-lg text-gray-600 mb-8">
        I help creators and entrepreneurs grow across all platforms
        with smart content systems, automation tools, and scalable strategies.
      </p>




{/* Social Icons AUTO SCROLL CENTERED */}
<div className="overflow-hidden w-[400px] mx-auto mb-6">
  <motion.div
    className="flex gap-8 text-4xl w-max"
    animate={{ x: ["0%", "-50%"] }}
    transition={{
      repeat: Infinity,
      duration: 50,
      ease: "linear",
    }}
  >
    {/* FIRST SET */}
    <FaFacebookF className="text-[#1877F2]" />
    <FaInstagram className="text-[#E4405F]" />
    <FaLinkedinIn className="text-[#0A66C2]" />
    <FaSnapchat className="text-yellow-500" />
    <FaTwitter className="text-[#1DA1F2]" />
    <FaYoutube className="text-[#FF0000]" />
    <FaTiktok className="text-black" />

    {/* DUPLICATE SET */}
    <FaFacebookF className="text-[#1877F2]" />
    <FaInstagram className="text-[#E4405F]" />
    <FaLinkedinIn className="text-[#0A66C2]" />
    <FaSnapchat className="text-yellow-500" />
    <FaTwitter className="text-[#1DA1F2]" />
    <FaYoutube className="text-[#FF0000]" />
    <FaTiktok className="text-black" />
  </motion.div>
</div>                                              
      {/* Buttons */}
<div className="mt-4 flex gap-6 mb-8">
  <button className="px-10 py-2 rounded-2xl bg-white border border-gray-300 text-gray-700">
    Watch
  </button>
  <button className="px-10 py-2 rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 text-white shadow-lg">
    Work
  </button>


      {/* Reviews */}
      <div className="flex items-center gap-4">
        <div className="flex -space-x-3">
          {[1, 2, 3, 4].map((i) => (
            <img
              key={i}
              src={`https://i.pravatar.cc/40?img=${i}`}
              className="w-8 h-8 rounded-full border-2 border-white"
              alt={`avatar-${i}`}
            />
          ))}
        </div>

        <div className="text-left">
          <div className="text-yellow-500 text-sm">⭐⭐⭐⭐⭐</div>
          <p className="text-gray-600 text-sm">Trusted by 500+ creators</p>
        </div>
      </div>
      </div>
    </section>
    </div>
    
  );
};

export default AboutUs;