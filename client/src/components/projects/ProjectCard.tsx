import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FolderKanban,
  Users,
  CheckSquare,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "../../api/axios";
import type { Project } from "../../types";

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void; // Edit modal kholne ke liye
}

export const ProjectCard = ({ project, onEdit }: ProjectCardProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Click outside se menu band ho
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Link navigate na ho
    e.stopPropagation();
    if (!window.confirm(`"${project.name}" ko permanently delete karen?`))
      return;

    try {
      await apiClient.delete(`/projects/${project.id}`);
      toast.success("Project deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete project");
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    onEdit(project); // Parent ko batao ke yeh project edit honi hai
  };

  return (
    <Link
      to={`/projects/${project.id}`}
      className="group bg-[#121214] border border-[#27272a] hover:border-zinc-700 rounded-xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg relative overflow-hidden"
    >
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <FolderKanban className="w-5 h-5 text-indigo-400" />
          </div>

          {/* 3-dot menu */}
          <div ref={menuRef} className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen((prev) => !prev);
              }}
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-7 w-36 bg-[#1c1c1f] border border-[#27272a] rounded-lg shadow-xl z-20 py-1 text-xs">
                <button
                  onClick={handleEditClick}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit Project
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Project
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Project Name & Description */}
        <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-indigo-300 transition-colors line-clamp-1">
          {project.name}
        </h3>
        <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
          {project.description || "No description provided for this project."}
        </p>
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#27272a] text-xs text-zinc-500">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-zinc-400" />
          <span>{project._count?.members || 1} members</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckSquare className="w-3.5 h-3.5 text-zinc-400" />
          <span>{project._count?.tasks || 0} tasks</span>
        </div>
      </div>
    </Link>
  );
};
