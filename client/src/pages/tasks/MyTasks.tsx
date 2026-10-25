import { useQuery } from "@tanstack/react-query";
import { Header } from "../../components/layout/Header";
import { apiClient } from "../../api/axios";
import { useAppSelector } from "../../store";
import type { ApiResponse, Task, TaskStatus } from "../../types";
import { CheckSquare, Clock, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

const STATUS_STYLES: Record<TaskStatus, string> = {
  TODO: "bg-zinc-700 text-zinc-300",
  IN_PROGRESS: "bg-amber-500/20 text-amber-400",
  DONE: "bg-emerald-500/20 text-emerald-400",
  CANCELLED: "bg-rose-500/20 text-rose-400",
};
const PRIORITY_STYLES = {
  LOW: "text-zinc-400",
  MEDIUM: "text-blue-400",
  HIGH: "text-amber-400",
  URGENT: "text-rose-400",
};

export const MyTasks = () => {
  const user = useAppSelector((s) => s.auth.user);

  const { data, isLoading } = useQuery({
    queryKey: ["my-tasks", user?.id],
    queryFn: async () => {
      const res =
        await apiClient.get<ApiResponse<{ tasks: Task[] | null }>>(
          `/tasks?limit=100`,
        );
      console.log("MyTasks data:", res);
      return res.data.data?.tasks || [];
    },
    enabled: !!user?.id,
  });

  const tasks = data || [];
  console.log("MyTasks tasks:", tasks);
  const todo = tasks.filter((t) => t.status === "TODO");
  const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS");
  const done = tasks.filter((t) => t.status === "DONE");

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#09090b]">
      <Header title="My Tasks" subtitle="All tasks assigned to you" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "To Do",
              count: todo.length,
              color: "text-zinc-300",
              icon: Clock,
            },
            {
              label: "In Progress",
              count: inProgress.length,
              color: "text-amber-400",
              icon: AlertCircle,
            },
            {
              label: "Done",
              count: done.length,
              color: "text-emerald-400",
              icon: CheckSquare,
            },
          ].map(({ label, count, color, icon: Icon }) => (
            <div
              key={label}
              className="bg-[#121214] border border-[#27272a] rounded-xl p-4 flex items-center gap-3"
            >
              <Icon className={`w-5 h-5 ${color}`} />
              <div>
                <p className={`text-lg font-bold ${color}`}>{count}</p>
                <p className="text-[11px] text-zinc-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tasks Table */}
        <div className="bg-[#121214] border border-[#27272a] rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_140px_100px_100px] text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-4 py-2.5 border-b border-[#27272a] bg-[#0c0c0e]">
            <span>Task</span>
            <span>Project</span>
            <span>Priority</span>
            <span>Status</span>
          </div>

          {isLoading && (
            <div className="p-6 text-center text-xs text-zinc-500">
              Loading tasks...
            </div>
          )}

          {!isLoading && tasks.length === 0 && (
            <div className="p-10 text-center">
              <CheckSquare className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">
                No tasks assigned to you yet.
              </p>
            </div>
          )}

          {tasks.map((task) => (
            <Link
              key={task.id}
              to={`/projects/${task.projectId}`}
              className="grid grid-cols-[1fr_140px_100px_100px] px-4 py-3 border-b border-[#27272a]/50 hover:bg-zinc-900/40 transition-colors items-center"
            >
              <p className="text-xs text-zinc-200 truncate pr-4">
                {task.title}
              </p>
              <p className="text-[11px] text-zinc-400 truncate">
                {(task as any).project?.name || "—"}
              </p>
              <span
                className={`text-[10px] font-mono ${PRIORITY_STYLES[task.priority]}`}
              >
                {task.priority}
              </span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded w-fit ${STATUS_STYLES[task.status]}`}
              >
                {task.status.replace("_", " ")}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
