import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch user & listen for auth changes
  useEffect(() => {
    const getUser = async () => {
      setLoadingUser(true);
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
      setLoadingUser(false);
    };
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user || null)
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setDropdownOpen(false);
    navigate("/");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fullName = user?.user_metadata?.full_name || "User";
  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    `https://api.dicebear.com/8.x/initials/svg?seed=${fullName}`;

  return (
    <motion.nav
      initial={false}
      animate={{
        height: scrolled ? 60 : 80,
        boxShadow: scrolled
          ? "0 2px 8px rgba(0,0,0,0.05)"
          : "0 0 0 rgba(0,0,0,0)",
      }}
      transition={{ duration: 0.25 }}
      className="fixed top-0 left-0 w-full z-50 backdrop-blur-sm border-b border-gray-100"
    >
      <div className="max-w-6xl mx-auto flex justify-between items-center px-6 sm:px-8 h-full">
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-extrabold text-blue-700 tracking-tight"
          onClick={() => setIsOpen(false)}
        >
          HR<span className="text-gray-700">Portal</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden sm:flex items-center space-x-8 text-sm font-medium">
          <Link to="/" className="text-gray-700 hover:text-blue-600 transition">
            Home
          </Link>

          {user && (
            <Link
              to="/dashboard"
              className="text-gray-700 hover:text-blue-600 transition"
            >
              Dashboard
            </Link>
          )}

          {/* Auth / Profile */}
          {loadingUser ? (
            <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
          ) : !user ? (
            <Link
              to="/auth"
              className="text-gray-700 hover:text-blue-600 transition"
            >
              Login
            </Link>
          ) : (
            <div className="relative" ref={dropdownRef}>
              {/* Profile Dropdown Button */}
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-9 h-9 rounded-full object-cover border border-blue-200"
                />
                <span className="text-gray-700 font-medium hidden md:block">
                  {fullName.split(" ")[0]}
                </span>
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 mt-3 w-48 bg-white shadow-lg rounded-lg border border-gray-100 py-2 origin-top-right"
                  >
                    <Link
                      to="/candidate-profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Candidate Profile
                    </Link>
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="sm:hidden text-gray-700 focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden bg-white border-t border-gray-100 shadow-md"
          >
            <div className="flex flex-col px-6 py-4 space-y-3 text-sm font-medium">
              <Link
                to="/"
                className="text-gray-700 hover:text-blue-600 transition"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>

              {user && (
                <>
                  <Link
                    to="/dashboard"
                    className="text-gray-700 hover:text-blue-600 transition"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/candidate-profile"
                    className="text-gray-700 hover:text-blue-600 transition"
                    onClick={() => setIsOpen(false)}
                  >
                    Candidate Profile
                  </Link>
                </>
              )}

              {!user ? (
                <Link
                  to="/auth"
                  className="text-gray-700 hover:text-blue-600 transition"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
              ) : (
                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 transition text-left"
                >
                  Logout
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
