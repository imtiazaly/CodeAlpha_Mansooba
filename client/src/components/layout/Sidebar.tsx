import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Layers,
  LayoutDashboard,
  Plus,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";
import { logout } from "../../store/slices/authSlice";
import { disconnectSocket } from "../../lib/socket";
import { toast } from "sonner";

interface SidebarProps {
  onOpenCreateProject?: () => void;
}

export const Sidebar = ({ onOpenCreateProject }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    disconnectSocket();
    toast.info("Logged out successfully");
    navigate("/login");
  };

  const navItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/",
      active: location.pathname === "/",
    },
  ];

  return (
    <aside className="w-64 bg-[#0c0c0e] border-r border-[#27272a] flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="h-14 border-b border-[#27272a] flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-zinc-100">
            Mansooba
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            v1.0
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider px-2 mb-2">
            Overview
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    item.active
                      ? "bg-zinc-800/80 text-zinc-100 border border-zinc-700/60"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Quick Action */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
              Workspace
            </span>
            {onOpenCreateProject && (
              <button
                onClick={onOpenCreateProject}
                className="text-zinc-400 hover:text-zinc-100 p-0.5 rounded hover:bg-zinc-800 transition-colors"
                title="New Project"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={onOpenCreateProject}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-dashed border-[#27272a] hover:border-zinc-700 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* Bottom User Profile & Logout */}
      <div className="border-t border-[#27272a] p-3">
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
              <p className="text-[11px] text-zinc-500 truncate">
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
  );
};
