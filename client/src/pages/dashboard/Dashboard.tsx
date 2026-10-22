import { useQuery } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { Plus, FolderKanban } from "lucide-react";
import { Header } from "../../components/layout/Header";
import { ProjectCard } from "../../components/projects/ProjectCard";
import { apiClient } from "../../api/axios";
import type { ApiResponse, Project } from "../../types";

export const Dashboard = () => {
  const { openCreateProject } = useOutletContext<{
    openCreateProject: () => void;
  }>();

  const {
    data: projects,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Project[]>>("/projects");
      return res.data.data;
    },
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#09090b]">
      {/* Top Header */}
      <Header
        title="Projects Dashboard"
        subtitle="Manage and track all your team workspaces"
        actions={
          <button
            onClick={openCreateProject}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        }
      />

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-[#121214] border border-[#27272a] rounded-xl p-5 h-44 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800" />
                  <div className="h-4 bg-zinc-800 rounded w-2/3" />
                  <div className="h-3 bg-zinc-800/60 rounded w-full" />
                </div>
                <div className="h-3 bg-zinc-800/40 rounded w-1/3 pt-2" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="bg-[#121214] border border-rose-900/40 rounded-xl p-8 text-center max-w-md mx-auto my-12">
            <p className="text-sm text-rose-400">
              Failed to load projects. Please refresh the page.
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && projects?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-[#27272a] flex items-center justify-center mb-4">
              <FolderKanban className="w-6 h-6 text-zinc-500" />
            </div>
            <h3 className="text-base font-medium text-zinc-200">
              No projects created yet
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              Get started by creating your first project workspace to
              collaborate with your team.
            </p>
            <button
              onClick={openCreateProject}
              className="mt-5 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Project
            </button>
          </div>
        )}

        {/* Projects Grid */}
        {!isLoading && !isError && projects && projects.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                All Projects ({projects.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
