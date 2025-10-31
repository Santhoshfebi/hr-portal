// src/components/Sidebar.jsx
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  LayoutDashboard,
  FileText,
  Briefcase,
  Settings,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import NavItem from "./SidebarNavItem";
import { Tooltip } from "react-tooltip";

export default function Sidebar({
  open,
  collapsed,
  userInfo = {},
  activeTab,
  onTabChange,
  onToggleCollapse,
  onCloseMobile,
  onLogout,
  toast,
}) {
  const { name, email, avatar } = userInfo || {};

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  const navItems = [
    { label: "Overview", icon: LayoutDashboard, key: "overview" },
    { label: "Profile", icon: User, key: "profile" },
    { label: "Resume", icon: FileText, key: "resume" },
    { label: "Applications", icon: Briefcase, key: "applications" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          exit={{ x: -300 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`fixed left-0 top-20 bottom-0 z-50 bg-white border-r border-gray-100 shadow-md flex flex-col
          ${collapsed ? "w-20" : "w-64"} lg:w-64`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100">
            {!collapsed && (
              <div className="flex items-center gap-3">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="User avatar"
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full font-semibold">
                    {initials}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800 truncate max-w-[140px]">
                    {name || "User"}
                  </span>
                  <span className="text-xs text-gray-500 truncate max-w-[140px]">
                    {email || ""}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-1">
              <button
                aria-label="Collapse sidebar"
                onClick={onToggleCollapse}
                className="p-2 rounded-md hover:bg-slate-50"
              >
                {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
              <button
                aria-label="Close sidebar (mobile)"
                onClick={onCloseMobile}
                className="p-2 rounded-md hover:bg-slate-50 lg:hidden"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-1 overflow-auto flex-1">
            {navItems.map(({ label, icon: Icon, key }) => (
              <div key={key} data-tooltip-id={collapsed ? `tip-${key}` : undefined}>
                <NavItem
                  icon={Icon}
                  label={label}
                  active={activeTab === key}
                  onClick={() => onTabChange(key)}
                  compact={collapsed}
                />
                {collapsed && (
                  <Tooltip id={`tip-${key}`} place="right" content={label} />
                )}
              </div>
            ))}

            <div className="border-t border-gray-100 pt-3 mt-3">
              <NavItem
                icon={Settings}
                label="Settings"
                onClick={() => toast("Settings coming soon", "info")}
                compact={collapsed}
              />

              <button
                onClick={onLogout}
                className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg mt-2 text-red-600 hover:bg-red-50 ${
                  collapsed ? "justify-center" : ""
                }`}
              >
                <LogOut size={18} />
                {!collapsed && (
                  <span className="text-sm font-medium">Logout</span>
                )}
              </button>
            </div>
          </nav>

          {/* Footer section */}
          <div className="p-3 border-t border-gray-100 text-xs text-gray-500 text-center">
            {!collapsed && "Candidate Portal • Professional View"}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
