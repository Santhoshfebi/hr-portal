import { Link } from "react-router-dom";
import { Facebook, Linkedin, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-linear-to-b from-gray-600 to-gray-900 text-gray-300 mt-24">
      <div className="max-w-7xl mx-auto px-6 py-14 grid gap-10 sm:grid-cols-3">
        {/* Column 1 */}
        <div>
          <h2 className="text-3xl font-extrabold text-white mb-3">HR Portal</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-5">
            Streamlining the hiring process for candidates and HR teams with simplicity,
            transparency, and security — all in one platform.
          </p>

          <div className="flex gap-4 justify-center sm:justify-start">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-gray-700 hover:bg-gray-500 transition"
              aria-label="Facebook"
            >
              <Facebook size={18} className="text-white" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-gray-700 hover:bg-gray-500 transition"
              aria-label="LinkedIn"
            >
              <Linkedin size={18} className="text-white" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-gray-700 hover:bg-gray-500 transition"
              aria-label="Twitter"
            >
              <Twitter size={18} className="text-white" />
            </a>
          </div>
        </div>

        {/* Column 2 */}
        <div className="text-center sm:text-left">
          <h3 className="font-semibold text-white mb-4 text-lg">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            {["Home", "Dashboard", "About", "Contact"].map((item) => (
              <li key={item}>
                <Link
                  to={`/${item.toLowerCase()}`}
                  className="hover:text-blue-400 transition-colors duration-200"
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3 */}
        <div className="text-center sm:text-left">
          <h3 className="font-semibold text-white mb-4 text-lg">Contact Us</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            📍 123 Corporate Avenue, Bengaluru, India <br />
            ✉️{" "}
            <a
              href="mailto:support@hrportal.com"
              className="hover:text-blue-400 transition"
            >
              support@hrportal.com
            </a>{" "}
            <br />
            ☎️ +91 98765 43210
          </p>
        </div>
      </div>

      <div className="border-t border-gray-700 text-center py-5 text-gray-500 text-sm">
        <p>
          © {new Date().getFullYear()}{" "}
          <span className="font-semibold text-white">HR Portal</span>. All rights
          reserved.
        </p>
        <p className="text-xs mt-1">Built with React & Supabase</p>
      </div>
    </footer>
  );
}
