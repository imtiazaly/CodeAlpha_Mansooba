import { Link } from "react-router-dom";
import { FolderKanban, Users, CheckSquare, ArrowUpRight } from "lucide-react";
import type { Project } from "../../types";

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
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
          <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors">
            <ArrowUpRight className="w-4 h-4" />
          </span>
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
        <div className="flex items-center gap-1.5" title="Team Members">
          <Users className="w-3.5 h-3.5 text-zinc-400" />
          <span>{project._count?.members || 1} members</span>
        </div>

        <div className="flex items-center gap-1.5" title="Active Tasks">
          <CheckSquare className="w-3.5 h-3.5 text-zinc-400" />
          <span>{project._count?.tasks || 0} tasks</span>
        </div>
      </div>
    </Link>
  );
};
