import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  /* ---------------- Fetch user ---------------- */
  useEffect(() => {
    const getUser = async () => {
      setLoadingUser(true);
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
      setLoadingUser(false);
    };
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  /* ---------------- Handle Logout ---------------- */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/auth");
  };

  /* ---------------- Scroll Shadow ---------------- */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ---------------- Component Render ---------------- */
  return (
    <motion.nav
      initial={false}
      animate={{
        height: scrolled ? 60 : 80,
        boxShadow: scrolled ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
      }}
      transition={{ duration: 0.25 }}
      className="fixed top-0 left-0 w-full z-50 backdrop-blur-sm border-b border-gray-100 bg-white/80"
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

          {/* Show Login button only if not logged in */}
          {loadingUser ? (
            <div className="w-9 h-4 rounded bg-gray-200 animate-pulse" />
          ) : !user ? (
            <Link
              to="/auth"
              className="text-gray-700 hover:text-blue-600 transition"
            >
              Login
            </Link>
          ) : (
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 transition text-sm flex items-center gap-1"
            >
              <LogOut size={16} /> Logout
            </button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="sm:hidden text-gray-700 focus:outline-none"
          aria-label="Toggle menu"
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
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-blue-600 transition"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
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
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="text-red-600 hover:text-red-700 transition text-left flex items-center gap-1"
                >
                  <LogOut size={16} /> Logout
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
