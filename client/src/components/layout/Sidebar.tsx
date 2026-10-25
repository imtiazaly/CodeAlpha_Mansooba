import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Layers,
  LayoutDashboard,
  CheckSquare,
  Bell,
  Plus,
  LogOut,
  User as UserIcon,
  FolderKanban,
  Users,
  X,
  PanelLeftClose,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";
import { logout } from "../../store/slices/authSlice";
import {
  closeMobileSidebar,
  toggleDesktopSidebar,
} from "../../store/slices/uiSlice";
import { disconnectSocket } from "../../lib/socket";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../api/axios";
import type { Notification } from "../../types";

interface SidebarProps {
  onOpenCreateProject?: () => void;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
    isActive
      ? "bg-zinc-800/80 text-zinc-100 border border-zinc-700/60"
      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent"
  }`;

export const Sidebar = ({ onOpenCreateProject }: SidebarProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { isMobileSidebarOpen, isDesktopSidebarCollapsed } = useAppSelector(
    (state) => state.ui,
  );

  // Unread notification count for badge
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await apiClient.get<any>("/notifications");
      return res.data.data?.notifications || [];
    },
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogout = () => {
    dispatch(logout());
    disconnectSocket();
    toast.info("Logged out successfully");
    navigate("/login");
  };

  const handleNavClick = () => {
    dispatch(closeMobileSidebar());
  };

  return (
    <>
      {/* ── Mobile Backdrop ── */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => dispatch(closeMobileSidebar())}
          className="fixed inset-0 bg-black/75 z-40 md:hidden backdrop-blur-xs transition-opacity duration-200"
        />
      )}

      {/* ── Sidebar Element ── */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 bg-[#0c0c0e] border-r border-[#27272a] flex flex-col h-screen select-none shrink-0 transition-all duration-200 ease-in-out ${
          isMobileSidebarOpen
            ? "translate-x-0 w-64 shadow-2xl"
            : "-translate-x-full md:translate-x-0"
        } ${
          isDesktopSidebarCollapsed
            ? "md:w-0 md:border-r-0 md:overflow-hidden md:opacity-0 md:pointer-events-none"
            : "md:w-64 md:opacity-100"
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 border-b border-[#27272a] flex items-center justify-between px-4 shrink-0">
          <Link
            to="/"
            onClick={handleNavClick}
            className="flex items-center gap-2.5 overflow-hidden"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-zinc-100 truncate">
              Mansooba
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 shrink-0">
              v1.0
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <button
              onClick={() => dispatch(toggleDesktopSidebar())}
              className="hidden md:flex text-zinc-500 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>

            <button
              onClick={() => dispatch(closeMobileSidebar())}
              className="md:hidden text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {/* --- OVERVIEW --- */}
          <div>
            <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider px-2 mb-1.5">
              Overview
            </p>
            <nav className="space-y-0.5">
              <NavLink
                to="/"
                end
                onClick={handleNavClick}
                className={navLinkClass}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </NavLink>
            </nav>
          </div>

          {/* --- MY WORK --- */}
          <div>
            <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider px-2 mb-1.5">
              My Work
            </p>
            <nav className="space-y-0.5">
              <NavLink
                to="/my-tasks"
                onClick={handleNavClick}
                className={navLinkClass}
              >
                <CheckSquare className="w-4 h-4" />
                My Tasks
              </NavLink>

              <NavLink
                to="/inbox"
                onClick={handleNavClick}
                className={navLinkClass}
              >
                <div className="flex items-center gap-2.5 flex-1">
                  <Bell className="w-4 h-4" />
                  <span>Inbox</span>
                </div>
                {unreadCount > 0 && (
                  <span className="ml-auto text-[9px] font-bold bg-indigo-600 text-white rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </NavLink>
            </nav>
          </div>

          {/* --- WORKSPACE --- */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1.5">
              <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
                Workspace
              </p>
              {onOpenCreateProject && (
                <button
                  onClick={() => {
                    handleNavClick();
                    onOpenCreateProject();
                  }}
                  className="text-zinc-500 hover:text-zinc-200 p-0.5 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="New Project"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <nav className="space-y-0.5">
              <NavLink
                to="/"
                end
                onClick={handleNavClick}
                className={navLinkClass}
              >
                <FolderKanban className="w-4 h-4" />
                All Projects
              </NavLink>

              {/* Naya Team Members Link */}
              <NavLink
                to="/members"
                onClick={handleNavClick}
                className={navLinkClass}
              >
                <Users className="w-4 h-4" />
                <span>Team Members</span>
              </NavLink>

              <button
                onClick={() => {
                  handleNavClick();
                  onOpenCreateProject?.();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 border border-dashed border-[#27272a] hover:border-zinc-700 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                New Project
              </button>
            </nav>
          </div>
        </div>

        {/* Bottom: User Profile & Logout */}
        <div className="border-t border-[#27272a] p-3 shrink-0">
          <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <span className="text-xs font-medium text-indigo-300">
                  {user?.name?.charAt(0).toUpperCase() || (
                    <UserIcon className="w-3.5 h-3.5" />
                  )}
                </span>
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-zinc-200 truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-[10px] text-zinc-500 truncate">
                  {user?.email || ""}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="text-zinc-500 hover:text-rose-400 p-1.5 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};