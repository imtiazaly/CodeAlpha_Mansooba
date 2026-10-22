import { Bell, Search, Command } from "lucide-react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onOpenNotifications?: () => void;
  unreadCount?: number;
  actions?: React.ReactNode;
}

export const Header = ({
  title = "Dashboard",
  subtitle,
  onOpenNotifications,
  unreadCount = 0,
  actions,
}: HeaderProps) => {
  return (
    <header className="h-14 bg-[#0c0c0e] border-b border-[#27272a] px-6 flex items-center justify-between shrink-0">
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
        {/* Actions slot (e.g. Invite Member / New Task button) */}
        {actions}

        {/* Global Search / Command Bar Mock */}
        <div className="hidden sm:flex items-center gap-2 bg-[#18181b] border border-[#27272a] rounded-lg px-2.5 py-1 text-xs text-zinc-400">
          <Search className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-zinc-500">Search...</span>
          <kbd className="text-[10px] bg-zinc-800 text-zinc-400 px-1 rounded flex items-center gap-0.5">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </div>

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-[#0c0c0e]" />
          )}
        </button>
      </div>
    </header>
  );
};
