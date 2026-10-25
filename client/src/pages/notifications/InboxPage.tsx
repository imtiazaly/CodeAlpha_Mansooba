import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "../../components/layout/Header";
import { apiClient } from "../../api/axios";
import { BellOff, CheckCheck } from "lucide-react";
import type { Notification } from "../../types";

const TYPE_ICONS: Record<string, string> = {
  TASK_ASSIGNED: "📋",
  TASK_STATUS_CHANGED: "🔄",
  COMMENT_ADDED: "💬",
  PROJECT_INVITATION: "📁",
};

export const InboxPage = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await apiClient.get<any>("/notifications?limit=50");
      return (res.data.data?.notifications || []) as Notification[];
    },
  });

  const notifications = data || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    await apiClient.patch("/notifications/read-all");
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markOneRead = async (id: string) => {
    await apiClient.patch(`/notifications/${id}/read`);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#09090b]">
      <Header
        title="Inbox"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} unread notifications`
            : "All caught up!"
        }
        actions={
          unreadCount > 0 ? (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-[#18181b] border border-[#27272a] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          {isLoading && (
            <div className="text-center text-xs text-zinc-500 py-10">
              Loading...
            </div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="text-center py-16">
              <BellOff className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">No notifications yet.</p>
            </div>
          )}

          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.isRead && markOneRead(n.id)}
                className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                  !n.isRead
                    ? "bg-indigo-950/20 border-indigo-500/20 hover:bg-indigo-950/30"
                    : "bg-[#121214] border-[#27272a] hover:bg-zinc-900/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg shrink-0">
                    {TYPE_ICONS[n.type] || "🔔"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-xs font-semibold ${!n.isRead ? "text-indigo-200" : "text-zinc-200"}`}
                      >
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-1.5 font-mono">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
