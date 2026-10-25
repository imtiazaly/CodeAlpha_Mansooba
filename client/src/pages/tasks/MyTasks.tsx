import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "../../components/layout/Header";
import { apiClient } from "../../api/axios";
import { useAppSelector } from "../../store";
import type {
  ApiResponse,
  Project,
  Task,
  TaskStatus,
  Priority,
} from "../../types";
import {
  CheckSquare,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  SlidersHorizontal,
  Plus,
  Pencil,
  Trash2,
  X,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

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

export const MyTasks = () => {
  const user = useAppSelector((s) => s.auth.user);
  const queryClient = useQueryClient();

  // Filters & Pagination State
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "">("");
  const [page, setPage] = useState(1);

  // CRUD Modals State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form states for Create
  const [createProjectId, setCreateProjectId] = useState("");
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createPriority, setCreatePriority] = useState<Priority>("MEDIUM");
  const [createStatus, setCreateStatus] = useState<TaskStatus>("TODO");
  const [createDueDate, setCreateDueDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Form states for Edit
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<Priority>("MEDIUM");
  const [editStatus, setEditStatus] = useState<TaskStatus>("TODO");
  const [editDueDate, setEditDueDate] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // 1. Fetch User's Projects for task creation
  const { data: userProjects = [] } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Project[]>>("/projects");
      return res.data.data || [];
    },
    enabled: isCreateOpen,
  });

  // 2. Build Query & Fetch Tasks
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

  // 3. Stats Query (for count cards)
  const { data: allStats } = useQuery({
    queryKey: ["my-tasks-stats", user?.id],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Task[]>>(`/tasks?limit=500`);
      return Array.isArray(res.data.data) ? res.data.data : ([] as Task[]);
    },
    enabled: !!user?.id,
  });

  const allTasks: Task[] = allStats || [];
  const todoCount = allTasks.filter((t) => t.status === "TODO").length;
  const inProgCount = allTasks.filter((t) => t.status === "IN_PROGRESS").length;
  const doneCount = allTasks.filter((t) => t.status === "DONE").length;

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

  // ─── CRUD Action Handlers ──────────────────────────────────────
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createProjectId) {
      toast.error("Please select a project");
      return;
    }
    if (!createTitle.trim()) {
      toast.error("Task title is required");
      return;
    }

    try {
      setIsCreating(true);
      await apiClient.post("/tasks", {
        projectId: createProjectId,
        title: createTitle.trim(),
        description: createDescription.trim() || undefined,
        priority: createPriority,
        status: createStatus,
        dueDate: createDueDate
          ? new Date(createDueDate).toISOString()
          : undefined,
        assigneeId: user?.id, // Assign to self
      });

      toast.success("Task created successfully!");
      setIsCreateOpen(false);
      // Reset form
      setCreateTitle("");
      setCreateDescription("");
      setCreateDueDate("");
      setCreateProjectId("");
      // Refresh
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["my-tasks-stats"] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create task");
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditPriority(task.priority);
    setEditStatus(task.status);
    setEditDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    if (!editTitle.trim()) {
      toast.error("Task title is required");
      return;
    }

    try {
      setIsUpdating(true);
      await apiClient.patch(`/tasks/${editingTask.id}`, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        priority: editPriority,
        status: editStatus,
        dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
      });

      toast.success("Task updated successfully!");
      setEditingTask(null);
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["my-tasks-stats"] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update task");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${taskTitle}"?`))
      return;

    try {
      setIsDeletingId(taskId);
      await apiClient.delete(`/tasks/${taskId}`);
      toast.success("Task deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["my-tasks-stats"] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete task");
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#09090b]">
      {/* Header with + New Task Button */}
      <Header
        title="My Tasks"
        subtitle="Manage and track all tasks assigned to you"
        actions={
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        }
      />

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

          {hasActiveFilter && (
            <button
              onClick={clearFilters}
              className="text-xs text-zinc-500 hover:text-zinc-200 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          )}

          {isFetching && (
            <Loader2 className="w-3.5 h-3.5 text-zinc-500 animate-spin ml-auto" />
          )}

          {meta && (
            <span className="ml-auto text-[11px] text-zinc-600">
              {meta.total} task{meta.total !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* ── Tasks Table ── */}
        <div className="bg-[#121214] border border-[#27272a] rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_150px_90px_110px_90px_70px] text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-4 py-2.5 border-b border-[#27272a] bg-[#0c0c0e]">
            <span>Task</span>
            <span>Project</span>
            <span>Priority</span>
            <span>Status</span>
            <span>Due Date</span>
            <span className="text-right">Actions</span>
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
              <div
                key={task.id}
                className="grid grid-cols-[1fr_150px_90px_110px_90px_70px] px-4 py-3 border-b border-[#27272a]/50 hover:bg-zinc-900/40 transition-colors items-center group"
              >
                {/* Title */}
                <p className="text-xs text-zinc-200 truncate pr-3 font-medium">
                  {task.title}
                </p>

                {/* Project Link */}
                <Link
                  to={`/projects/${task.projectId}`}
                  className="text-[11px] text-zinc-400 hover:text-indigo-300 transition-colors truncate flex items-center gap-1"
                  title="Open Project Board"
                >
                  <span className="truncate">
                    {(task as any).project?.name || "Project"}
                  </span>
                  <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>

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

                {/* Actions (Edit & Delete) */}
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => openEditModal(task)}
                    className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                    title="Edit Task"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id, task.title)}
                    disabled={isDeletingId === task.id}
                    className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer disabled:opacity-50"
                    title="Delete Task"
                  >
                    {isDeletingId === task.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
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

      {/* ── Modal: CREATE TASK ── */}
      {isCreateOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreateOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md bg-[#121214] border border-[#27272a] rounded-xl shadow-2xl p-6 relative">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-semibold text-zinc-100 mb-1">
              Create New Task
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Add a new task to your workspace
            </p>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Project *
                </label>
                <select
                  value={createProjectId}
                  onChange={(e) => setCreateProjectId(e.target.value)}
                  required
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select a project...</option>
                  {userProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="e.g. Integrate Payment Gateway"
                  required
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Detailed requirements or acceptance criteria..."
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Status
                  </label>
                  <select
                    value={createStatus}
                    onChange={(e) =>
                      setCreateStatus(e.target.value as TaskStatus)
                    }
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Priority
                  </label>
                  <select
                    value={createPriority}
                    onChange={(e) =>
                      setCreatePriority(e.target.value as Priority)
                    }
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={createDueDate}
                  onChange={(e) => setCreateDueDate(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isCreating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Create Task"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: EDIT TASK ── */}
      {editingTask && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingTask(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md bg-[#121214] border border-[#27272a] rounded-xl shadow-2xl p-6 relative">
            <button
              onClick={() => setEditingTask(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-semibold text-zinc-100 mb-1">
              Edit Task
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Update task details and progress
            </p>

            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(e.target.value as TaskStatus)
                    }
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Priority
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) =>
                      setEditPriority(e.target.value as Priority)
                    }
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isUpdating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
