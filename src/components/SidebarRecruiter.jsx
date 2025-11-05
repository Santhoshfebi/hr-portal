import { motion, AnimatePresence } from "framer-motion";
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
  Menu,
} from "lucide-react";
import SidebarNavItem from "./SidebarNavItem";

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
    { id: "candidates", label: "Candidates", icon: Users },
  ];

  return (
    <>
      {/* 🖥️ Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: open ? (collapsed ? 72 : 256) : 0,
          opacity: open ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden lg:flex fixed left-0 top-20 bottom-0 bg-white border-r border-gray-200 shadow-sm overflow-hidden z-40"
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
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex items-center justify-center p-1 rounded-md text-gray-600 hover:bg-gray-50 transition"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          {/* Nav Items */}
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

          {/* Footer */}
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

      {/* 📱 Mobile Dropdown */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
            />

            {/* Dropdown Menu */}
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute top-16 left-2 right-2 bg-white shadow-lg rounded-2xl z-50 border border-gray-200 p-4 lg:hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={userInfo.avatar}
                    alt="Recruiter Avatar"
                    className="w-9 h-9 rounded-full border border-gray-200 object-cover"
                  />
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">
                      {userInfo.name || "Recruiter"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {userInfo.email}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onCloseMobile}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Nav Items */}
              <div className="flex flex-col space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      onCloseMobile();
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-left transition ${
                      activeTab === item.id
                        ? "bg-sky-50 text-sky-700"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </button>
                ))}

                <hr className="my-2" />

                <button
                  onClick={() => {
                    onTabChange("settings");
                    onCloseMobile();
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Settings size={16} /> Settings
                </button>

                <button
                  onClick={() => {
                    onLogout();
                    onCloseMobile();
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
