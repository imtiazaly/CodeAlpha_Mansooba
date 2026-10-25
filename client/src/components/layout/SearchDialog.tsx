import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FolderKanban, CheckSquare, Loader2, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../api/axios";
import type { ApiResponse, Project, Task } from "../../types";

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchDialog = ({ isOpen, onClose }: SearchDialogProps) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Dialog open hone par input focus ho
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery(""); // Dialog band hone par search reset
    }
  }, [isOpen]);

  // Escape key se band ho
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Projects search (sirf naam match)
  const { data: projects = [], isFetching: isProjectsFetching } = useQuery<
    Project[]
  >({
    queryKey: ["search-projects", query],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Project[]>>("/projects");
      const all = res.data.data || [];
      return all.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          (p.description || "").toLowerCase().includes(query.toLowerCase()),
      );
    },
    enabled: isOpen && query.trim().length >= 1,
  });

  // Tasks search (backend search API)
  const { data: tasksData, isFetching: isTasksFetching } = useQuery<{
    tasks: Task[];
  }>({
    queryKey: ["search-tasks", query],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<{ tasks: Task[] }>>(
        `/tasks?search=${encodeURIComponent(query.trim())}&limit=8`,
      );
      return res.data.data;
    },
    enabled: isOpen && query.trim().length >= 2,
  });

  const tasks = tasksData?.tasks || [];
  const isFetching = isProjectsFetching || isTasksFetching;
  const hasResults = projects.length > 0 || tasks.length > 0;

  const handleProjectClick = (projectId: string) => {
    navigate(`/projects/${projectId}`);
    onClose();
  };

  const handleTaskClick = (projectId: string) => {
    navigate(`/projects/${projectId}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    // Backdrop
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
    >
      <div className="w-full max-w-xl bg-[#121214] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#27272a]">
          {isFetching ? (
            <Loader2 className="w-4 h-4 text-zinc-500 animate-spin shrink-0" />
          ) : (
            <Search className="w-4 h-4 text-zinc-500 shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects and tasks..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="text-[10px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-700">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {/* Empty / Idle state */}
          {!query && (
            <p className="text-xs text-zinc-500 text-center py-8">
              Type to search across your projects and tasks...
            </p>
          )}

          {/* No results */}
          {query.trim().length >= 1 && !isFetching && !hasResults && (
            <p className="text-xs text-zinc-500 text-center py-8">
              No results found for "
              <span className="text-zinc-300">{query}</span>"
            </p>
          )}

          {/* Projects Section */}
          {projects.length > 0 && (
            <div className="py-2">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-4 py-1.5">
                Projects
              </p>
              {projects.slice(0, 5).map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleProjectClick(project.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800/60 transition-colors text-left cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <FolderKanban className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-200 truncate">
                      {project.name}
                    </p>
                    {project.description && (
                      <p className="text-[11px] text-zinc-500 truncate">
                        {project.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Divider between sections */}
          {projects.length > 0 && tasks.length > 0 && (
            <div className="border-t border-[#27272a]/60 mx-4" />
          )}

          {/* Tasks Section */}
          {tasks.length > 0 && (
            <div className="py-2">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-4 py-1.5">
                Tasks
              </p>
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleTaskClick(task.projectId)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800/60 transition-colors text-left cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                    <CheckSquare className="w-3.5 h-3.5 text-zinc-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-200 truncate">
                      {task.title}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate">
                      {(task as any).project?.name || "Unknown Project"} ·{" "}
                      {task.status.replace("_", " ")}
                    </p>
                  </div>
                  <span
                    className={`ml-auto text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                      task.priority === "URGENT"
                        ? "bg-rose-500/15 text-rose-400"
                        : task.priority === "HIGH"
                          ? "bg-amber-500/15 text-amber-400"
                          : task.priority === "MEDIUM"
                            ? "bg-blue-500/15 text-blue-400"
                            : "bg-zinc-700 text-zinc-400"
                    }`}
                  >
                    {task.priority}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-[#27272a] px-4 py-2 flex items-center gap-3 text-[10px] text-zinc-600">
          <span>↵ to open</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};
