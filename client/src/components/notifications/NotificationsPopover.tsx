import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCheck, BellOff, X } from "lucide-react";
import { apiClient } from "../../api/axios";
import type { Notification } from "../../types";

const TYPE_ICONS: Record<string, string> = {
  TASK_ASSIGNED: "📋",
  TASK_STATUS_CHANGED: "🔄",
  COMMENT_ADDED: "💬",
  PROJECT_INVITATION: "📁",
  PROJECT_REMOVED: "🚪",
  TASK_UNASSIGNED: "👤",
};

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
}

export const NotificationsPopover = ({
  isOpen,
  onClose,
  notifications,
}: NotificationsPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch("/notifications/read-all");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div
      ref={popoverRef}
      className="absolute right-6 top-14 w-80 bg-[#121214] border border-[#27272a] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="p-3 border-b border-[#27272a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-semibold text-zinc-100">Notifications</h4>
          {unreadCount > 0 && (
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono px-1.5 py-0.5 rounded-full border border-indigo-500/30">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              title="Mark all as read"
              className="text-zinc-400 hover:text-zinc-200 text-[11px] p-1 rounded hover:bg-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Read all</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-[#27272a]/60">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-zinc-500">
            <BellOff className="w-6 h-6 mx-auto mb-2 text-zinc-600" />
            <p className="text-xs">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleMarkAsRead(n.id, n.isRead)}
              className={`p-3 text-xs cursor-pointer transition-colors ${
                !n.isRead
                  ? "bg-indigo-950/20 hover:bg-indigo-950/30"
                  : "hover:bg-zinc-900/60"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className="text-sm shrink-0 mt-0.5">
                  {TYPE_ICONS[n.type] || "🔔"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <p
                      className={`font-medium leading-tight ${
                        !n.isRead ? "text-indigo-200" : "text-zinc-300"
                      }`}
                    >
                      {n.title}
                    </p>
                    {!n.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-zinc-400 text-[11px] mt-0.5 leading-snug">
                    {n.message}
                  </p>
                  <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
                    {new Date(n.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};