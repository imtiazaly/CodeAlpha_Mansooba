import { Link, NavLink, useNavigate } from "react-router-dom";
import {
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
  Building2,
  Settings,
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
import { MansoobaLogo } from "../common/MansoobaLogo";

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

  const orgName = user?.organization?.name || "Mansooba Organization";

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
        {/* 1. Brand Header */}
        <div className="h-14 border-b border-[#27272a] flex items-center justify-between px-4 shrink-0">
          <Link
            to="/"
            onClick={handleNavClick}
            className="flex items-center gap-2 overflow-hidden"
          >
            <MansoobaLogo size="sm" badge="v1.0" />
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

        {/* 2. Active Organization Workspace Card */}
        <div className="px-3 pt-3.5 pb-1 shrink-0">
          <div className="p-2.5 rounded-xl bg-[#121214] border border-[#27272a] hover:border-zinc-700 flex items-center justify-between gap-2.5 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/15 border border-indigo-500/25 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="min-w-0">
                <p
                  className="text-xs font-semibold text-zinc-100 truncate"
                  title={orgName}
                >
                  {orgName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <p className="text-[10px] text-zinc-400 font-mono truncate">
                    {user?.role === "ADMIN"
                      ? "Admin Workspace"
                      : "Team Workspace"}
                  </p>
                </div>
              </div>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shrink-0">
              ORG
            </span>
          </div>
        </div>

        {/* 3. Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {/* OVERVIEW */}
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

          {/* MY WORK */}
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

          {/* WORKSPACE */}
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

        {/* 4. Bottom: User Profile + Settings + Logout */}
        <div className="border-t border-[#27272a] p-3 shrink-0 space-y-2">
          {/* Settings Link */}
          <NavLink
            to="/settings"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors w-full ${
                isActive
                  ? "bg-zinc-800/80 text-zinc-100 border border-zinc-700/60"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent"
              }`
            }
          >
            <Settings className="w-4 h-4" />
            Settings
          </NavLink>

          {/* User Profile Card */}
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
