import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Search, Command, Menu, PanelLeft } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../api/axios";
import { getSocket } from "../../lib/socket";
import { NotificationsPopover } from "../notifications/NotificationsPopover";
import type { Notification } from "../../types";
import { SearchDialog } from "./SearchDialog";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  toggleMobileSidebar,
  toggleDesktopSidebar,
} from "../../store/slices/uiSlice";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const Header = ({
  title = "Dashboard",
  subtitle,
  actions,
}: HeaderProps) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const queryClient = useQueryClient();

  const dispatch = useAppDispatch();
  const { isDesktopSidebarCollapsed } = useAppSelector((state) => state.ui);

  // 1. Fetch User Notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await apiClient.get<any>("/notifications");
      return (
        res.data.data?.notifications ||
        (Array.isArray(res.data.data) ? res.data.data : [])
      );
    },
  });

  // 2. Real-Time Socket Listener for Instant Live Updates (Zero Page Reload)
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      const handleNewNotification = (notification: Notification) => {
        // Instant Toast Alert on Screen
        toast.info(notification.title, {
          description: notification.message,
        });

        // Instant Cache Invalidation:
        // Automatically updates Bell badge, Pending Invitations Banner,
        // Workspace Switcher, and Team Members list in real-time!
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({ queryKey: ["pending-invitations"] });
        queryClient.invalidateQueries({ queryKey: ["organization-members"] });
        queryClient.invalidateQueries({ queryKey: ["my-organizations"] });
      };

      socket.on("notification:new", handleNewNotification);

      return () => {
        socket.off("notification:new", handleNewNotification);
      };
    }
  }, [queryClient]);

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const unreadCount = notifications.filter(
    (n: Notification) => !n.isRead,
  ).length;

  return (
    <header className="h-14 bg-[#0c0c0e] border-b border-[#27272a] px-3 sm:px-6 flex items-center justify-between shrink-0 relative">
      {/* Left side: Sidebar Toggles (Mobile & Desktop) + Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={() => dispatch(toggleMobileSidebar())}
          className="md:hidden p-1.5 -ml-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer shrink-0"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {isDesktopSidebarCollapsed && (
          <button
            onClick={() => dispatch(toggleDesktopSidebar())}
            className="hidden md:flex p-1.5 -ml-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Expand sidebar"
          >
            <PanelLeft className="w-4 h-4 text-indigo-400" />
          </button>
        )}

        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-zinc-100 tracking-tight truncate max-w-35 xs:max-w-[200px] sm:max-w-xs md:max-w-md">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[11px] text-zinc-500 leading-none mt-0.5 truncate max-w-35 xs:max-w-[200px] sm:max-w-xs">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {actions}

        {/* Search Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="hidden sm:flex items-center gap-2 bg-[#18181b] border border-[#27272a] hover:border-zinc-600 rounded-lg px-2.5 py-1 text-xs text-zinc-400 transition-colors cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-zinc-500">Search...</span>
          <kbd className="text-[10px] bg-zinc-800 text-zinc-400 px-1 rounded flex items-center gap-0.5">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </button>

        {/* Notifications Bell */}
        <button
          onClick={() => setIsNotificationsOpen((prev) => !prev)}
          className="relative p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-bold text-white bg-indigo-600 rounded-full ring-2 ring-[#0c0c0e]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications Popover Dropdown */}
      <NotificationsPopover
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
      />

      {/* Global Search Dialog */}
      <SearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </header>
  );
};