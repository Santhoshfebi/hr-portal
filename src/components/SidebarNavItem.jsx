import { Tooltip } from "react-tooltip";

/**
 * SidebarNavItem.jsx
 * Clean, responsive navigation item for sidebar.
 * Handles collapsed and expanded modes automatically.
 */
export default function SidebarNavItem({
  label,
  icon: Icon,
  active = false,
  collapsed = false,
  onClick = () => {},
}) {
  return (
    <div data-tooltip-id={collapsed ? `tip-${label}` : undefined}>
      <button
        onClick={onClick}
        className={`w-full flex items-center ${
          collapsed ? "justify-center" : "gap-3 justify-start px-3"
        } py-2 rounded-lg text-sm font-medium transition-all duration-150
          ${
            active
              ? "bg-sky-100 text-sky-700 font-semibold"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
          }`}
      >
        <Icon
          size={18}
          className={`${active ? "text-sky-600" : "text-gray-500"}`}
        />
        {!collapsed && <span>{label}</span>}
      </button>

      {/* Tooltip for collapsed state */}
      {collapsed && <Tooltip id={`tip-${label}`} place="right" content={label} />}
    </div>
  );
}
