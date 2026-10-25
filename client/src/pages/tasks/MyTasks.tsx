import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "../../components/layout/Header";
import { apiClient } from "../../api/axios";
import { useAppSelector } from "../../store";
import type { ApiResponse, Task, TaskStatus, Priority } from "../../types";
import {
  CheckSquare,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";
import { Link } from "react-router-dom";

// ─── Style Maps ─────────────────────────────────────────────
const STATUS_STYLES: Record<TaskStatus, string> = {
  TODO: "bg-zinc-700/60 text-zinc-300",
  IN_PROGRESS: "bg-amber-500/15 text-amber-400",
  DONE: "bg-emerald-500/15 text-emerald-400",
  CANCELLED: "bg-rose-500/15 text-rose-400",
};
const PRIORITY_DOT: Record<Priority, string> = {
  LOW: "bg-zinc-500",
  MEDIUM: "bg-blue-500",
  HIGH: "bg-amber-500",
  URGENT: "bg-rose-500",
};
const PRIORITY_TEXT: Record<Priority, string> = {
  LOW: "text-zinc-400",
  MEDIUM: "text-blue-400",
  HIGH: "text-amber-400",
  URGENT: "text-rose-400",
};

const PAGE_LIMIT = 15;

// ─── Component ──────────────────────────────────────────────
export const MyTasks = () => {
  const user = useAppSelector((s) => s.auth.user);

  // Filter State
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "">("");
  const [page, setPage] = useState(1);

  // Build query string
  const buildQuery = () => {
    const params = new URLSearchParams();
    params.set("limit", String(PAGE_LIMIT));
    params.set("page", String(page));
    if (statusFilter) params.set("status", statusFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    return params.toString();
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["my-tasks", user?.id, statusFilter, priorityFilter, page],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Task[]>>(
        `/tasks?${buildQuery()}`,
      );
      // Backend directly array bhejta hai controller mein
      return {
        tasks:
          (Array.isArray(res.data.data)
            ? res.data.data
            : (res.data as any).data?.tasks) || ([] as Task[]),
        meta: (res.data as any).meta as
          | {
              total: number;
              totalPages: number;
              hasNextPage: boolean;
              hasPrevPage: boolean;
            }
          | undefined,
      };
    },
    enabled: !!user?.id,
  });

  const tasks: Task[] = data?.tasks || [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages || 1;

  // Stats: yeh filtered nahi — sab assigned tasks ki count ke liye alag query
  const { data: allStats } = useQuery({
    queryKey: ["my-tasks-stats", user?.id],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Task[]>>(`/tasks?limit=500`);
      return Array.isArray(res.data.data) ? res.data.data : ([] as Task[]);
    },
    enabled: !!user?.id,
  });
  const allTasks = allStats || [];
  const todoCount = allTasks.filter((t) => t.status === "TODO").length;
  const inProgCount = allTasks.filter((t) => t.status === "IN_PROGRESS").length;
  const doneCount = allTasks.filter((t) => t.status === "DONE").length;

  // Filter change → page reset
  const handleStatusChange = (val: TaskStatus | "") => {
    setStatusFilter(val);
    setPage(1);
  };
  const handlePriorityChange = (val: Priority | "") => {
    setPriorityFilter(val);
    setPage(1);
  };
  const clearFilters = () => {
    setStatusFilter("");
    setPriorityFilter("");
    setPage(1);
  };

  const hasActiveFilter = !!statusFilter || !!priorityFilter;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#09090b]">
      <Header title="My Tasks" subtitle="All tasks assigned to you" />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "To Do",
              count: todoCount,
              color: "text-zinc-300",
              icon: Clock,
              status: "TODO" as TaskStatus,
            },
            {
              label: "In Progress",
              count: inProgCount,
              color: "text-amber-400",
              icon: AlertCircle,
              status: "IN_PROGRESS" as TaskStatus,
            },
            {
              label: "Done",
              count: doneCount,
              color: "text-emerald-400",
              icon: CheckSquare,
              status: "DONE" as TaskStatus,
            },
          ].map(({ label, count, color, icon: Icon, status }) => (
            <button
              key={label}
              onClick={() =>
                handleStatusChange(statusFilter === status ? "" : status)
              }
              className={`bg-[#121214] border rounded-xl p-4 flex items-center gap-3 text-left transition-all cursor-pointer ${
                statusFilter === status
                  ? "border-indigo-500/50 bg-indigo-950/20"
                  : "border-[#27272a] hover:border-zinc-600"
              }`}
            >
              <Icon className={`w-5 h-5 ${color}`} />
              <div>
                <p className={`text-lg font-bold ${color}`}>{count}</p>
                <p className="text-[11px] text-zinc-500">{label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* ── Filter Bar ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) =>
              handleStatusChange(e.target.value as TaskStatus | "")
            }
            className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) =>
              handlePriorityChange(e.target.value as Priority | "")
            }
            className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          {/* Clear filters */}
          {hasActiveFilter && (
            <button
              onClick={clearFilters}
              className="text-xs text-zinc-500 hover:text-zinc-200 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          )}

          {/* Fetch indicator */}
          {isFetching && (
            <Loader2 className="w-3.5 h-3.5 text-zinc-500 animate-spin ml-auto" />
          )}

          {/* Total count */}
          {meta && (
            <span className="ml-auto text-[11px] text-zinc-600">
              {meta.total} task{meta.total !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* ── Tasks Table ── */}
        <div className="bg-[#121214] border border-[#27272a] rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_160px_90px_120px_100px] text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-4 py-2.5 border-b border-[#27272a] bg-[#0c0c0e]">
            <span>Task</span>
            <span>Project</span>
            <span>Priority</span>
            <span>Status</span>
            <span>Due Date</span>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-12 text-xs text-zinc-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading tasks...
            </div>
          )}

          {/* Empty */}
          {!isLoading && tasks.length === 0 && (
            <div className="py-12 text-center">
              <CheckSquare className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">
                {hasActiveFilter
                  ? "No tasks match the selected filters."
                  : "No tasks assigned to you yet."}
              </p>
              {hasActiveFilter && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-indigo-400 mt-1 hover:underline cursor-pointer"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Rows */}
          {tasks.map((task) => {
            const isOverdue =
              task.dueDate &&
              task.status !== "DONE" &&
              task.status !== "CANCELLED" &&
              new Date(task.dueDate) < new Date();

            return (
              <Link
                key={task.id}
                to={`/projects/${task.projectId}`}
                className="grid grid-cols-[1fr_160px_90px_120px_100px] px-4 py-3 border-b border-[#27272a]/50 hover:bg-zinc-900/40 transition-colors items-center group"
              >
                {/* Title */}
                <p className="text-xs text-zinc-200 truncate pr-4 group-hover:text-indigo-300 transition-colors">
                  {task.title}
                </p>

                {/* Project */}
                <p className="text-[11px] text-zinc-400 truncate">
                  {(task as any).project?.name || "—"}
                </p>

                {/* Priority */}
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`}
                  />
                  <span
                    className={`text-[10px] font-mono ${PRIORITY_TEXT[task.priority]}`}
                  >
                    {task.priority}
                  </span>
                </div>

                {/* Status */}
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded w-fit ${STATUS_STYLES[task.status]}`}
                >
                  {task.status.replace("_", " ")}
                </span>

                {/* Due Date */}
                <span
                  className={`text-[10px] font-mono ${isOverdue ? "text-rose-400" : "text-zinc-500"}`}
                >
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      })
                    : "—"}
                </span>
              </Link>
            );
          })}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-zinc-600">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!meta?.hasPrevPage}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#18181b] border border-[#27272a] rounded-lg text-zinc-400 hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum =
                    Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-7 h-7 text-xs rounded-lg transition-colors cursor-pointer ${
                        page === pageNum
                          ? "bg-indigo-600 text-white"
                          : "bg-[#18181b] border border-[#27272a] text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={!meta?.hasNextPage}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#18181b] border border-[#27272a] rounded-lg text-zinc-400 hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
