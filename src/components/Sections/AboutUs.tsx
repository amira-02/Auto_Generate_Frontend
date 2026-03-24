import React from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTwitter,
  FaYoutube,
  FaTiktok,
  FaSnapchat,
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
    
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 bg-[#F4F5F3] overflow-hidden">

      {/* Floating Animated Icons */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          variants={floatVariants}
          animate="float"
          className="absolute left-10 top-20 text-[#1877F2] text-4xl opacity-20"
        >
          <FaFacebookF />
        </motion.div>

        <motion.div
          variants={floatVariants}
          animate="float"
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute left-20 bottom-32 text-[#E4405F] text-5xl opacity-20"
        >
          <FaInstagram />
        </motion.div>

        <motion.div
          variants={floatVariants}
          animate="float"
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute left-5 top-1/2 text-[#0A66C2] text-4xl opacity-20"
        >
          <FaLinkedinIn />
        </motion.div>

        <motion.div
          variants={floatVariants}
          animate="float"
          transition={{ duration: 4.5, repeat: Infinity }}
          className="absolute right-10 top-24 text-[#1DA1F2] text-4xl opacity-20"
        >
          <FaTwitter />
        </motion.div>

        <motion.div
          variants={floatVariants}
          animate="float"
          transition={{ duration: 5.5, repeat: Infinity }}
          className="absolute right-16 bottom-40 text-[#FF0000] text-5xl opacity-20"
        >
          <FaYoutube />
        </motion.div>

        <motion.div
          variants={floatVariants}
          animate="float"
          transition={{ duration: 6.5, repeat: Infinity }}
          className="absolute right-5 top-1/2 text-black text-4xl opacity-20"
        >
          <FaTiktok />
        </motion.div>
      </div>

      {/* Badge */}
      <div className="mb-6 bg-white/70 backdrop-blur-md px-6 py-2 rounded-full text-sm text-gray-600 shadow-sm">
        ● Just released: Personal Branding Studio
      </div>

      {/* Social Icons */}
      <div className="flex items-center gap-4 text-4xl mb-6">
        <FaFacebookF className="text-[#1877F2] hover:scale-110 transition-transform cursor-pointer" />
        <FaInstagram className="text-[#E4405F] hover:scale-110 transition-transform cursor-pointer" />
        <FaLinkedinIn className="text-[#0A66C2] hover:scale-110 transition-transform cursor-pointer" />
        <FaSnapchat className="text-yellow-500 hover:scale-110 transition-transform cursor-pointer" />
        <FaTwitter className="text-[#1DA1F2] hover:scale-110 transition-transform cursor-pointer" />
        <FaYoutube className="text-[#FF0000] hover:scale-110 transition-transform cursor-pointer" />
        <FaTiktok className="text-black hover:scale-110 transition-transform cursor-pointer" />
      </div>

      {/* Title */}
      <h1 className="text-5xl md:text-7xl font-semibold text-[#0F172A] leading-tight max-w-4xl mb-4">
        Building impactful digital presence in{" "}
        <span className="italic text-[#4F7D65] font-serif">seconds</span>
      </h1>

      {/* Description */}
      <p className="mt-4 max-w-2xl text-lg text-gray-600 mb-8">
        I help creators and entrepreneurs grow across all platforms
        with smart content systems, automation tools, and scalable strategies.
      </p>

      {/* Buttons */}
      <div className="mt-4 flex gap-6 mb-8">
        <button className="px-8 py-4 rounded-xl bg-white border border-gray-300 text-gray-700 hover:shadow-md transition">
          Watch
        </button>
        <button className="px-8 py-4 rounded-xl bg-[#4E8B6B] text-white shadow-lg hover:scale-105 transition">
          Work
        </button>
      </div>

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
    </section>
    </div>
  );
};

export default AboutUs;