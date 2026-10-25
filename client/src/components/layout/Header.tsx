import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Search, Command } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../api/axios";
import { getSocket } from "../../lib/socket";
import { NotificationsPopover } from "../notifications/NotificationsPopover";
import type { ApiResponse, Notification } from "../../types";

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
  const queryClient = useQueryClient();

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

  // 2. Real-Time Socket Listener for Instant Notifications
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      const handleNewNotification = (notification: Notification) => {
        // Instant Toast Alert on Screen
        toast.info(notification.title, {
          description: notification.message,
        });
        // Invalidate notifications cache to update badge
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      };

      socket.on("notification:new", handleNewNotification);

      return () => {
        socket.off("notification:new", handleNewNotification);
      };
    }
  }, [queryClient]);

  const unreadCount = notifications.filter(
    (n: Notification) => !n.isRead,
  ).length;

  return (
    <header className="h-14 bg-[#0c0c0e] border-b border-[#27272a] px-6 flex items-center justify-between shrink-0 relative">
      {/* Title / Breadcrumbs */}
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[11px] text-zinc-500 leading-none mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Actions slot */}
        {actions}

        {/* Search Mock */}
        <div className="hidden sm:flex items-center gap-2 bg-[#18181b] border border-[#27272a] rounded-lg px-2.5 py-1 text-xs text-zinc-400">
          <Search className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-zinc-500">Search...</span>
          <kbd className="text-[10px] bg-zinc-800 text-zinc-400 px-1 rounded flex items-center gap-0.5">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </div>

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
    </header>
  );
};
