// src/components/MobileSidebarToggle.jsx
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";

export default function MobileSidebarToggle({ open, onToggle }) {
  return (
    <motion.button
      onClick={onToggle}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.95 }}
      aria-label={open ? "Close menu" : "Open menu"}
      className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-xl bg-white shadow-md border border-gray-100 hover:bg-slate-50 transition-all"
    >
      {open ? (
        <X size={20} className="text-gray-700" />
      ) : (
        <Menu size={20} className="text-gray-700" />
      )}
    </motion.button>
  );
}
