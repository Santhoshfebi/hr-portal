import { motion } from "framer-motion";
import {
  LogOut,
  Settings,
  LayoutDashboard,
  Briefcase,
  User2,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import SidebarNavItem from "./SidebarNavItem";

/**
 * SidebarRecruiter.jsx
 * Sidebar for Recruiter Dashboard — consistent with Candidate version
 */

export default function SidebarRecruiter({
  open,
  collapsed,
  userInfo,
  activeTab,
  onTabChange,
  onToggleCollapse,
  onCloseMobile,
  onLogout,
}) {
  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "profile", label: "Profile", icon: User2 },
    { id: "jobs", label: "Job Posts", icon: Briefcase },
    { id: "applicants", label: "Applicants", icon: Users },
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
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img
              src={userInfo.avatar}
              alt="Recruiter Avatar"
              className="w-10 h-10 rounded-full border border-gray-200 object-cover"
            />
            {!collapsed && (
              <div>
                <div className="font-semibold text-gray-800 text-sm leading-tight">
                  {userInfo.name || "Recruiter"}
                </div>
                <div className="text-xs text-gray-500">{userInfo.email}</div>
              </div>
            )}
          </div>

          {/* Collapse toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center p-1 rounded-md text-gray-600 hover:bg-gray-50 transition"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          {/* Mobile close */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden flex items-center justify-center p-1 rounded-md text-gray-600 hover:bg-gray-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map((item) => (
            <SidebarNavItem
              key={item.id}
              label={item.label}
              icon={item.icon}
              active={activeTab === item.id}
              onClick={() => onTabChange(item.id)}
              collapsed={collapsed}
            />
          ))}
        </nav>

        {/* Footer / Settings / Logout */}
        <div className="border-t border-gray-100 mt-auto py-3">
          <SidebarNavItem
            label="Settings"
            icon={Settings}
            collapsed={collapsed}
            active={activeTab === "settings"}
            onClick={() => onTabChange("settings")}
          />

          <SidebarNavItem
            label="Logout"
            icon={LogOut}
            collapsed={collapsed}
            onClick={onLogout}
          />
        </div>
      </div>
    </motion.aside>
  );
}
