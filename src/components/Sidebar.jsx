// src/components/Sidebar.jsx
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  User,
  FileText,
  Briefcase,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
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
}) {
  const { name = "User", email = "" } = userInfo;

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "profile", label: "Profile", icon: User },
    { id: "resume", label: "Resume", icon: FileText },
    { id: "browse", label: "Browse Jobs", icon: Briefcase },
    { id: "applications", label: "My Applications", icon: Briefcase },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{
        width: open ? (collapsed ? 72 : 256) : 0,
        opacity: open ? 1 : 0,
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed left-0 top-20 bottom-0 z-50 bg-white border-r border-gray-200 shadow-sm overflow-hidden"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 bg-gray-50">
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-gray-800 text-sm truncate">
                {name}
              </span>
              <span className="text-xs text-gray-500 truncate">{email}</span>
            </div>
          )}

          {/* Collapse toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center p-1 rounded-md text-gray-600 hover:bg-gray-100 transition"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          {/* Mobile close */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden flex items-center justify-center p-1 rounded-md text-gray-600 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <div key={item.id} data-tooltip-id={collapsed ? `tip-${item.id}` : undefined}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center ${
                    collapsed ? "justify-center" : "gap-3 justify-start px-3"
                  } py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-sky-100 text-sky-700 font-semibold"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                  }`}
                >
                  <Icon
                    size={18}
                    className={`${
                      isActive ? "text-sky-600" : "text-gray-500"
                    }`}
                  />
                  {!collapsed && <span>{item.label}</span>}
                </button>

                {collapsed && (
                  <Tooltip
                    id={`tip-${item.id}`}
                    place="right"
                    content={item.label}
                  />
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer / Settings / Logout */}
        <div className="border-t border-gray-100 mt-auto py-3 space-y-1">
          <div data-tooltip-id={collapsed ? "tip-settings" : undefined}>
            <button
              onClick={() => onTabChange("settings")}
              className={`w-full flex items-center ${
                collapsed ? "justify-center" : "gap-3 justify-start px-3"
              } py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "settings"
                  ? "bg-sky-100 text-sky-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              <Settings
                size={18}
                className={`${
                  activeTab === "settings" ? "text-sky-600" : "text-gray-500"
                }`}
              />
              {!collapsed && <span>Settings</span>}
            </button>

            {collapsed && (
              <Tooltip id="tip-settings" place="right" content="Settings" />
            )}
          </div>

          <div data-tooltip-id={collapsed ? "tip-logout" : undefined}>
            <button
              onClick={onLogout}
              className={`w-full flex items-center ${
                collapsed ? "justify-center" : "gap-3 justify-start px-3"
              } py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all`}
            >
              <LogOut size={18} className="text-red-600" />
              {!collapsed && <span>Logout</span>}
            </button>

            {collapsed && (
              <Tooltip id="tip-logout" place="right" content="Logout" />
            )}
          </div>
        </div>

        {/* Footer text */}
        {!collapsed && (
          <div className="text-center text-xs text-gray-500 py-2 border-t border-gray-100 bg-gray-50">
            Candidate Portal • Professional View
          </div>
        )}
      </div>
    </motion.aside>
  );
}
