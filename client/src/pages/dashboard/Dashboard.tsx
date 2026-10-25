import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import {
  Plus,
  FolderKanban,
  Building2,
  ChevronsUpDown,
  Check,
  Loader2,
} from "lucide-react";
import { Header } from "../../components/layout/Header";
import { ProjectCard } from "../../components/projects/ProjectCard";
import { apiClient } from "../../api/axios";
import { useAppSelector, useAppDispatch } from "../../store";
import { setUser } from "../../store/slices/authSlice";
import type { ApiResponse, Project, User } from "../../types";
import { EditProjectModal } from "../../components/projects/EditProjectModal";
import { toast } from "sonner";

interface OrgItem {
  id: string;
  name: string;
  slug: string;
  membersCount: number;
  projectsCount: number;
}

export const Dashboard = () => {
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const currentUser = useAppSelector((state) => state.auth.user);
  const orgName = currentUser?.organization?.name || "Mansooba Organization";

  const { openCreateProject } = useOutletContext<{
    openCreateProject: () => void;
  }>();

  // Close switcher on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        switcherRef.current &&
        !switcherRef.current.contains(e.target as Node)
      ) {
        setIsSwitcherOpen(false);
      }
    };
    if (isSwitcherOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSwitcherOpen]);

  // Fetch Projects
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

  // Fetch My Organizations (for switcher)
  const { data: myOrgs = [], isLoading: isOrgsLoading } = useQuery<OrgItem[]>({
    queryKey: ["my-organizations"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<OrgItem[]>>(
        "/organizations/mine",
      );
      return res.data.data || [];
    },
  });

  // Switch Workspace Mutation
  const switchMutation = useMutation({
    mutationFn: (organizationId: string) =>
      apiClient.patch<ApiResponse<User>>("/organizations/switch", {
        organizationId,
      }),
    onSuccess: (res) => {
      const updatedUser = res.data.data;
      dispatch(setUser(updatedUser));

      // Tamam cached data invalidate karo (naye org ka data load ho)
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["organization-members"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["my-organizations"] });

      setIsSwitcherOpen(false);
      toast.success(
        `Switched to "${updatedUser.organization?.name}" workspace!`,
      );
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to switch workspace");
    },
  });

  const projectCount = projects?.length || 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#09090b]">
      {/* Top Header */}
      <Header
        title="Projects Dashboard"
        subtitle={`Workspace: ${orgName} • ${projectCount} Projects`}
        actions={
          <button
            onClick={openCreateProject}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* ── Workspace Context Banner with Switcher ── */}
        <div ref={switcherRef} className="relative">
          <div className="bg-[#121214] border border-[#27272a] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            {/* Left: Org Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/15 border border-indigo-500/25 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-zinc-100">
                    {orgName}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active Tenant
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {currentUser?.role === "ADMIN"
                    ? "Organization Administrator"
                    : "Standard Team Member"}{" "}
                  • Multi-tenant Workspace
                </p>
              </div>
            </div>

            {/* Right: Stats + Switcher Button */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              <span className="bg-[#18181b] border border-[#27272a] text-xs text-zinc-400 font-mono px-3 py-1.5 rounded-lg">
                {projectCount} Projects Active
              </span>

              {/* Workspace Switcher Button */}
              <button
                onClick={() => setIsSwitcherOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  isSwitcherOpen
                    ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300"
                    : "bg-[#18181b] border-[#27272a] text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
                }`}
              >
                <ChevronsUpDown className="w-3.5 h-3.5" />
                <span>Switch Workspace</span>
              </button>
            </div>
          </div>

          {/* ── Workspace Switcher Dropdown ── */}
          {isSwitcherOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-[#121214] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="px-4 py-3 border-b border-[#27272a]">
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Your Workspaces
                </p>
              </div>

              {/* Org List */}
              <div className="p-2 max-h-64 overflow-y-auto">
                {isOrgsLoading ? (
                  <div className="flex items-center justify-center py-6 text-zinc-500">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-xs">Loading workspaces...</span>
                  </div>
                ) : myOrgs.length === 0 ? (
                  <div className="py-6 text-center text-xs text-zinc-500">
                    No workspaces found
                  </div>
                ) : (
                  myOrgs.map((org) => {
                    const isActive = org.id === currentUser?.organization?.id;
                    const isSwitching =
                      switchMutation.isPending &&
                      switchMutation.variables === org.id;

                    return (
                      <button
                        key={org.id}
                        onClick={() => {
                          if (!isActive) switchMutation.mutate(org.id);
                        }}
                        disabled={switchMutation.isPending}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors cursor-pointer disabled:cursor-wait ${
                          isActive
                            ? "bg-indigo-950/30 border border-indigo-500/20"
                            : "hover:bg-zinc-800/50 border border-transparent"
                        }`}
                      >
                        {/* Org Avatar */}
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                            isActive
                              ? "bg-indigo-600/30 border border-indigo-500/40 text-indigo-300"
                              : "bg-zinc-800 border border-zinc-700 text-zinc-300"
                          }`}
                        >
                          {org.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Org Details */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs font-semibold truncate ${
                              isActive ? "text-indigo-200" : "text-zinc-200"
                            }`}
                          >
                            {org.name}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-mono truncate">
                            {org.projectsCount} projects • {org.membersCount}{" "}
                            members
                          </p>
                        </div>

                        {/* Active / Loading indicator */}
                        {isSwitching ? (
                          <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />
                        ) : isActive ? (
                          <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer Note */}
              <div className="px-4 py-2.5 border-t border-[#27272a] bg-[#0e0e10]">
                <p className="text-[10px] text-zinc-600">
                  Register a new account to create additional workspaces.
                </p>
              </div>
            </div>
          )}
        </div>

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
              No projects in this workspace
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              Get started by creating your first project to collaborate with
              your team.
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
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={(p) => setEditingProject(p)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
        />
      )}
    </div>
  );
};
