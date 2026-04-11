import React from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import { FaInstagram, FaLinkedinIn, FaTwitter } from "react-icons/fa";

const ContactPage: React.FC = () => {
  return (
    <section className="min-h-screen bg-[#ffffff] px-6 py-20 flex items-center justify-center">
     <div className="max-w-6xl w-full grid md:grid-cols-2 gap-16">

        {/* LEFT SIDE */}
        <div>
          <h1 className="text-5xl md:text-6xl font-semibold text-[#0F172A] leading-tight">
            Let’s build something{" "}
           <span 
    className="italic font-serif bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent font-semibold"
  >
    impactful
  </span>
          </h1>

          <p className="mt-6 text-lg text-gray-600 max-w-md">
            Whether you're a creator, entrepreneur, or brand —  
            I’d love to help you grow your digital presence.
          </p>

          {/* Contact Info */}
          <div className="mt-10 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white shadow-sm">
                <Mail className="text-[#ce22a9]" size={20} />
              </div>
              <span className="text-gray-700">hello@yourstudio.com</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white shadow-sm">
                <Phone className="text-[#ce22a9]" size={20} />
              </div>
              <span className="text-gray-700">+1 (555) 123-4567</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white shadow-sm">
                <MapPin className="text-[#ce22a9]" size={20} />
              </div>
              <span className="text-gray-700">Paris, France</span>
            </div>
          </div>

          {/* Socials */}
          <div className="flex gap-6 mt-10 text-[#ce22a9] text-xl">
            <FaInstagram className="cursor-pointer hover:scale-110 transition" />
            <FaLinkedinIn className="cursor-pointer hover:scale-110 transition" />
            <FaTwitter className="cursor-pointer hover:scale-110 transition" />
          </div>
        </div>

        {/* RIGHT SIDE - FORM */}
        <div className="bg-white/70 backdrop-blur-xl shadow-xl rounded-3xl p-10 border border-white/40">

          <form className="space-y-6">

            <div>
              <label className="text-sm text-gray-600">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ce22a9]"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Email</label>
              <input
                type="email"
                placeholder="john@email.com"
                className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ce22a9]"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Message</label>
              <textarea
                // rows="5"
                placeholder="Tell me about your project..."
                className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ce22a9]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 text-white font-medium shadow-lg hover:scale-[1.02] transition"
            >
              Send Message
            </button>
          </form>
        </div>

      </div>
    </section>
  );
};

export default ContactPage;