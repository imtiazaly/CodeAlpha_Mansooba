import React, { useState } from "react";
import { Droppable } from "@hello-pangea/dnd";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { TaskCard } from "./TaskCard";
import { apiClient } from "../../api/axios";
import type { Task, TaskStatus } from "../../types";

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  colorDot: string;
  tasks: Task[];
  projectId: string;
  onTaskClick: (task: Task) => void;
}

export const KanbanColumn = ({
  status,
  title,
  colorDot,
  tasks,
  projectId,
  onTaskClick,
}: KanbanColumnProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const queryClient = useQueryClient();

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setIsLoading(true);
      await apiClient.post("/tasks", {
        title: newTitle.trim(),
        status,
        projectId,
        priority: "MEDIUM",
        order: tasks.length,
      });

      setNewTitle("");
      setIsCreating(false);
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast.success("Task created");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create task");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-80 shrink-0 flex flex-col bg-[#121214] border border-[#27272a] rounded-xl max-h-full overflow-hidden select-none">
      {/* Column Header */}
      <div className="p-3 border-b border-[#27272a] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${colorDot}`} />
          <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
            {title}
          </h3>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="text-zinc-500 hover:text-zinc-200 p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Add task to this column"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Droppable Task List */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-2.5 overflow-y-auto space-y-2.5 min-h-37.5 transition-colors ${
              snapshot.isDraggingOver ? "bg-zinc-900/40" : ""
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onClick={onTaskClick}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Quick Add Task Form / Button */}
      <div className="p-2 border-t border-[#27272a] shrink-0 bg-[#121214]">
        {isCreating ? (
          <form onSubmit={handleQuickCreate} className="space-y-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              className="w-full bg-[#18181b] border border-indigo-500/60 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
            />
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewTitle("");
                }}
                className="text-zinc-400 hover:text-zinc-200 p-1 rounded text-xs hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <button
                type="submit"
                disabled={isLoading || !newTitle.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  "Add"
                )}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add task</span>
          </button>
        )}
      </div>
    </div>
  );
};
