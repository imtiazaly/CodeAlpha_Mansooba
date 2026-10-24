import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Trash2, MessageSquare, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { apiClient } from "../../api/axios";
import { useAppSelector } from "../../store";
import type {
  ApiResponse,
  Comment,
  Priority,
  Project,
  Task,
  TaskStatus,
} from "../../types";

interface TaskDetailDrawerProps {
  task: Task | null;
  project: Project;
  onClose: () => void;
}

export const TaskDetailDrawer = ({
  task,
  project,
  onClose,
}: TaskDetailDrawerProps) => {
  if (!task) return null;

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [assigneeId, setAssigneeId] = useState<string>(task.assigneeId || "");
  const [dueDate, setDueDate] = useState<string>(
    task.dueDate ? task.dueDate.split("T")[0] : "",
  );

  const [commentText, setCommentText] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const queryClient = useQueryClient();
  const currentUserId = useAppSelector((state) => state.auth.user?.id);

  // Sync state whenever task prop changes
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || "");
    setStatus(task.status);
    setPriority(task.priority);
    setAssigneeId(task.assigneeId || "");
    setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
  }, [task]);

  // Escape key listener to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Fetch comments for this task
  const { data: comments = [], isLoading: isCommentsLoading } = useQuery({
    queryKey: ["comments", task.id],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Comment[]>>(
        `/tasks/${task.id}/comments`,
      );
      return res.data.data;
    },
  });

  // Save Task details changes
  const handleUpdateField = async (fields: Partial<Task>) => {
    try {
      setIsSaving(true);
      await apiClient.patch(`/tasks/${task.id}`, fields);
      queryClient.invalidateQueries({ queryKey: ["tasks", project.id] });
      toast.success("Task updated");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to update task");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async () => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      setIsDeleting(true);
      await apiClient.delete(`/tasks/${task.id}`);
      queryClient.invalidateQueries({ queryKey: ["tasks", project.id] });
      toast.success("Task deleted");
      onClose();
    } catch (err) {
      toast.error("Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  // Post Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setIsPostingComment(true);
      await apiClient.post(`/tasks/${task.id}/comments`, {
        content: commentText.trim(),
      });
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["comments", task.id] });
      queryClient.invalidateQueries({ queryKey: ["tasks", project.id] });
    } catch (err) {
      toast.error("Failed to post comment");
    } finally {
      setIsPostingComment(false);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      await apiClient.delete(`/tasks/${task.id}/comments/${commentId}`);
      queryClient.invalidateQueries({ queryKey: ["comments", task.id] });
      queryClient.invalidateQueries({ queryKey: ["tasks", project.id] });
    } catch (err) {
      toast.error("Failed to delete comment");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Container */}
      <div className="w-full max-w-lg bg-[#121214] border-l border-[#27272a] h-full flex flex-col shadow-2xl relative select-none animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-[#27272a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-500">
              #{task.id.slice(0, 8)}
            </span>
            {isSaving && (
              <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving...
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteTask}
              disabled={isDeleting}
              title="Delete Task"
              className="text-zinc-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Editable Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                if (title.trim() && title !== task.title) {
                  handleUpdateField({ title: title.trim() });
                }
              }}
              className="w-full text-base font-semibold text-zinc-100 bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-indigo-500 focus:outline-none pb-1 transition-colors"
            />
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-2 gap-4 bg-[#18181b] p-3.5 rounded-xl border border-[#27272a] text-xs">
            {/* Status */}
            <div>
              <span className="text-zinc-500 block mb-1">Status</span>
              <select
                value={status}
                onChange={(e) => {
                  const val = e.target.value as TaskStatus;
                  setStatus(val);
                  handleUpdateField({ status: val });
                }}
                className="w-full bg-[#121214] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <span className="text-zinc-500 block mb-1">Priority</span>
              <select
                value={priority}
                onChange={(e) => {
                  const val = e.target.value as Priority;
                  setPriority(val);
                  handleUpdateField({ priority: val });
                }}
                className="w-full bg-[#121214] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            {/* Assignee */}
            <div>
              <span className="text-zinc-500 block mb-1">Assignee</span>
              <select
                value={assigneeId}
                onChange={(e) => {
                  const val = e.target.value || null;
                  setAssigneeId(e.target.value);
                  handleUpdateField({ assigneeId: val });
                }}
                className="w-full bg-[#121214] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Unassigned</option>
                {/* Project Owner */}
                {project.owner && (
                  <option value={project.owner.id}>
                    {project.owner.name} (Owner)
                  </option>
                )}
                {/* Project Members */}
                {project.members
                  ?.filter((m) => m.userId !== project.ownerId)
                  .map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <span className="text-zinc-500 block mb-1">Due Date</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  const val = e.target.value || null;
                  setDueDate(e.target.value);
                  handleUpdateField({ dueDate: val });
                }}
                className="w-full bg-[#121214] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => {
                if (description !== (task.description || "")) {
                  handleUpdateField({
                    description: description.trim() || null,
                  });
                }
              }}
              placeholder="Add details, acceptance criteria, or notes..."
              className="w-full bg-[#18181b] border border-[#27272a] rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          {/* Comments Thread Section */}
          <div className="pt-4 border-t border-[#27272a] space-y-3">
            <h4 className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              Activity & Comments ({comments.length})
            </h4>

            {/* Add Comment Input */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isPostingComment || !commentText.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isPostingComment ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </form>

            {/* Comments List */}
            {isCommentsLoading ? (
              <div className="py-4 text-center">
                <Loader2 className="w-4 h-4 text-zinc-500 animate-spin mx-auto" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-xs text-zinc-600 italic py-2">
                No comments yet on this task.
              </p>
            ) : (
              <div className="space-y-2.5 pt-1">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-lg bg-[#18181b] border border-[#27272a] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-zinc-300">
                        {c.user?.name || "User"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500">
                          {new Date(c.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {c.userId === currentUserId && (
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="text-zinc-600 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      {c.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
