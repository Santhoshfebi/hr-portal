// src/components/SidebarNavItem.jsx
import { motion } from "framer-motion";

export default function SidebarNavItem({
  icon: Icon,
  label,
  active = false,
  onClick,
  compact = false,
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`
        group flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all
        ${active
          ? "bg-blue-50 text-blue-600 shadow-sm"
          : "text-gray-700 hover:bg-slate-50 hover:text-blue-600"
        }
        ${compact ? "justify-center" : ""}
      `}
      aria-label={label}
    >
      {/* Icon */}
      <Icon
        size={18}
        className={`shrink-0 ${active ? "text-blue-600" : "text-gray-500 group-hover:text-blue-600"}`}
      />

      {/* Label (hidden when collapsed) */}
      {!compact && (
        <span className="truncate transition-all duration-200">{label}</span>
      )}
    </motion.button>
  );
}
