import { FaInstagram, FaLinkedinIn, FaTwitter, FaYoutube } from "react-icons/fa";

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0F172A] text-white px-6 py-20">
      <div className="max-w-6xl mx-auto">

        {/* Top Section */}
        <div className="grid md:grid-cols-3 gap-12">

          {/* Brand */}
          <div>
            <h2 className="text-3xl font-semibold">
              Your<span className="italic text-[#4F7D65] font-serif">Studio</span>
            </h2>
            <p className="mt-4 text-gray-400 max-w-sm">
              Building impactful digital presence for creators, brands,
              and entrepreneurs worldwide.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-lg font-medium mb-4">Navigation</h3>
            <ul className="space-y-3 text-gray-400">
              <li className="hover:text-white transition cursor-pointer">Home</li>
              <li className="hover:text-white transition cursor-pointer">Work</li>
              <li className="hover:text-white transition cursor-pointer">About</li>
              <li className="hover:text-white transition cursor-pointer">Contact</li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-medium mb-4">Stay Updated</h3>
            <p className="text-gray-400 mb-4">
              Get insights on content systems, branding & automation.
            </p>

            <div className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-3 rounded-l-xl bg-white/10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#4F7D65]"
              />
              <button className="px-6 py-3 rounded-r-xl bg-[#4F7D65] hover:opacity-90 transition">
                Join
              </button>
            </div>
          </div>

        </div>

        {/* Divider */}
        <div className="border-t border-white/10 my-12"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">

          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} YourStudio. All rights reserved.
          </p>

          <div className="flex gap-6 text-gray-400 text-lg">
            <FaInstagram className="hover:text-white transition cursor-pointer" />
            <FaLinkedinIn className="hover:text-white transition cursor-pointer" />
            <FaTwitter className="hover:text-white transition cursor-pointer" />
            <FaYoutube className="hover:text-white transition cursor-pointer" />
          </div>

        </div>

      </div>
    </footer>
  );
};

export default Footer;