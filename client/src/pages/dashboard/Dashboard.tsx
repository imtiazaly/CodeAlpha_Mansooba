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
  X,
  MailCheck,
} from "lucide-react";
import { Header } from "../../components/layout/Header";
import { ProjectCard } from "../../components/projects/ProjectCard";
import { apiClient } from "../../api/axios";
import { useAppSelector, useAppDispatch } from "../../store";
import { setUser } from "../../store/slices/authSlice";
import type {
  ApiResponse,
  Project,
  User,
  WorkspaceInvitation,
} from "../../types";
import { EditProjectModal } from "../../components/projects/EditProjectModal";
import { toast } from "sonner";

interface OrgItem {
  id: string;
  name: string;
  slug: string;
  role: string;
  membersCount: number;
  projectsCount: number;
}

export const Dashboard = () => {
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");

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

  // 1. Fetch Projects
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

  // 2. Fetch My Organizations (for switcher)
  const { data: myOrgs = [], isLoading: isOrgsLoading } = useQuery<OrgItem[]>({
    queryKey: ["my-organizations"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<OrgItem[]>>(
        "/organizations/mine",
      );
      return res.data.data || [];
    },
  });

  // 3. Fetch Pending Workspace Invitations
  const { data: invitations = [] } = useQuery<WorkspaceInvitation[]>({
    queryKey: ["pending-invitations"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<WorkspaceInvitation[]>>(
        "/organizations/invitations",
      );
      return res.data.data || [];
    },
  });

  const hasNoWorkspace =
    !currentUser?.organizationId || (!isOrgsLoading && myOrgs.length === 0);

  // Respond to Invitation Mutation (Accept or Decline)
  const respondMutation = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: "ACCEPT" | "DECLINE";
    }) =>
      apiClient.post(`/organizations/invitations/${id}/respond`, { action }),
    onSuccess: (res, vars) => {
      if (vars.action === "ACCEPT") {
        toast.success(res.data.message || "Invitation accepted!");
        queryClient.invalidateQueries({ queryKey: ["my-organizations"] });
      } else {
        toast.info("Invitation declined.");
      }
      queryClient.invalidateQueries({ queryKey: ["pending-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message || "Failed to respond to invitation",
      );
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

  const createOrgMutation = useMutation({
    mutationFn: (name: string) =>
      apiClient.post<ApiResponse<{ organization: any; user: User }>>(
        "/organizations",
        { name },
      ),
    onSuccess: (res) => {
      const updatedUser = res.data.data.user;
      dispatch(setUser(updatedUser));
      queryClient.invalidateQueries({ queryKey: ["my-organizations"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["organization-members"] });
      setIsCreateOrgOpen(false);
      setNewOrgName("");
      toast.success(
        `Workspace "${res.data.data.organization.name}" created successfully!`,
      );
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message || "Failed to create organization",
      );
    },
  });

  const projectCount = projects?.length || 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#09090b]">
      {/* Top Header */}
      {/* Top Header */}
      <Header
        title="Projects Dashboard"
        subtitle={
          hasNoWorkspace
            ? "No Active Workspace"
            : `Workspace: ${orgName} • ${projectCount} Projects`
        }
        actions={
          hasNoWorkspace ? (
            <button
              onClick={() => setIsCreateOrgOpen(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Workspace</span>
            </button>
          ) : (
            <button
              onClick={openCreateProject}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
          )
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {/* ── Pending Workspace Invitations Banners (Consent UI) ── */}
        {invitations.length > 0 && (
          <div className="space-y-3">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="bg-gradient-to-r from-indigo-950/40 via-purple-950/25 to-[#121214] border border-indigo-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <MailCheck className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-indigo-200">
                        Workspace Invitation
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Action Required
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 mt-0.5">
                      You were invited to join{" "}
                      <strong className="text-white font-semibold">
                        {inv.organizationName}
                      </strong>{" "}
                      as{" "}
                      <span className="text-indigo-300 font-medium font-mono text-[11px] bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-500/30">
                        {inv.role === "ADMIN"
                          ? "Administrator"
                          : "Standard Member"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                  <button
                    onClick={() =>
                      respondMutation.mutate({
                        id: inv.id,
                        action: "DECLINE",
                      })
                    }
                    disabled={respondMutation.isPending}
                    className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-[#27272a] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Decline</span>
                  </button>
                  <button
                    onClick={() =>
                      respondMutation.mutate({
                        id: inv.id,
                        action: "ACCEPT",
                      })
                    }
                    disabled={respondMutation.isPending}
                    className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/30"
                  >
                    {respondMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Accept & Join</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* ── Workspace-less Onboarding Card ── */}
        {hasNoWorkspace ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-lg mx-auto bg-[#121214] border border-[#27272a] rounded-2xl shadow-xl mt-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-5">
              <Building2 className="w-8 h-8 text-indigo-400" />
            </div>
            <h2 className="text-lg font-bold text-zinc-100">
              No Active Workspace
            </h2>
            <p className="text-xs text-zinc-400 mt-2 max-w-sm leading-relaxed">
              You are not currently part of any organization. Create your own
              workspace to start managing projects, or wait for an invitation
              from your team.
            </p>

            <button
              onClick={() => setIsCreateOrgOpen(true)}
              className="mt-6 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/20 hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Workspace</span>
            </button>
          </div>
        ) : (
          <>
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
                  <div className="px-4 py-3 border-b border-[#27272a]">
                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Your Workspaces
                    </p>
                  </div>

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
                        const isActive =
                          org.id === currentUser?.organization?.id;
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
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                                isActive
                                  ? "bg-indigo-600/30 border border-indigo-500/40 text-indigo-300"
                                  : "bg-zinc-800 border border-zinc-700 text-zinc-300"
                              }`}
                            >
                              {org.name.charAt(0).toUpperCase()}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-xs font-semibold truncate ${
                                  isActive ? "text-indigo-200" : "text-zinc-200"
                                }`}
                              >
                                {org.name}
                              </p>
                              <p className="text-[10px] text-zinc-500 font-mono truncate">
                                {org.projectsCount} projects •{" "}
                                {org.membersCount} members
                              </p>
                            </div>

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

                  <div className="p-2.5 border-t border-[#27272a] bg-zinc-950/40">
                    <button
                      onClick={() => {
                        setIsSwitcherOpen(false);
                        setIsCreateOrgOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/30 border border-indigo-500/20 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Workspace</span>
                    </button>
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
          </>
        )}
      </div>

      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
        />
      )}

      {/* ── Modal: Create New Organization ── */}
      {isCreateOrgOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreateOrgOpen(false);
          }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-[#121214] border border-[#27272a] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  Create Workspace
                </h3>
              </div>
              <button
                onClick={() => setIsCreateOrgOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newOrgName.trim()) {
                  createOrgMutation.mutate(newOrgName.trim());
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g. Acme Studio, Tech Ventures"
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  autoFocus
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setIsCreateOrgOpen(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newOrgName.trim() || createOrgMutation.isPending}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  {createOrgMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Create Workspace</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
