import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "../../components/layout/Header";
import { apiClient } from "../../api/axios";
import { useAppSelector } from "../../store";
import type { ApiResponse, Role } from "../../types";
import {
  Users,
  Search,
  Shield,
  Briefcase,
  CheckSquare,
  UserPlus,
  Loader2,
  X,
  SlidersHorizontal,
  Mail,
  Calendar,
  FolderKanban,
} from "lucide-react";
import { toast } from "sonner";

interface MemberProject {
  id: string;
  name: string;
  role: string;
}

interface MemberItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  totalTasks: number | null;
  totalProjects: number | null;
  projects: MemberProject[];
}

export const MembersPage = () => {
  const currentUser = useAppSelector((s) => s.auth.user);
  const isAdmin = currentUser?.role === "ADMIN";
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");
  const [activeProjectPopover, setActiveProjectPopover] = useState<
    string | null
  >(null);

  // Invite modal state (Admin only)
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("USER");
  const [isInviting, setIsInviting] = useState(false);

  // Fetch Members
  const { data: members = [], isLoading } = useQuery<MemberItem[]>({
    queryKey: ["organization-members"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<MemberItem[]>>("/users");
      return res.data.data || [];
    },
  });

  // Filter logic
  const filtered = members.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  const totalMembers = members.length;
  const adminCount = members.filter((m) => m.role === "ADMIN").length;
  const userCount = members.filter((m) => m.role === "USER").length;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast.error("Name and Email are required");
      return;
    }

    try {
      setIsInviting(true);
      await apiClient.post("/users/invite", {
        name: inviteName.trim(),
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      });

      toast.success(`${inviteName} added to the organization!`);
      setIsInviteOpen(false);
      setInviteName("");
      setInviteEmail("");
      setInviteRole("USER");
      queryClient.invalidateQueries({ queryKey: ["organization-members"] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add member");
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#09090b]">
      {/* Header */}
      <Header
        title={isAdmin ? "Team Directory" : "Project Teammates"}
        subtitle={
          isAdmin
            ? "Manage organization members, system roles, and project allocations"
            : "Colleagues collaborating with you across shared projects"
        }
        actions={
          isAdmin && (
            <button
              onClick={() => setIsInviteOpen(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </button>
          )
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {/* ── Top Summary Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-[#121214] border border-[#27272a] rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-zinc-100">{totalMembers}</p>
              <p className="text-[11px] text-zinc-500">
                {isAdmin ? "Total Teammates" : "Your Co-workers"}
              </p>
            </div>
          </div>

          {isAdmin ? (
            <>
              <div className="bg-[#121214] border border-[#27272a] rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-zinc-100">
                    {adminCount}
                  </p>
                  <p className="text-[11px] text-zinc-500">Administrators</p>
                </div>
              </div>

              <div className="bg-[#121214] border border-[#27272a] rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-zinc-100">{userCount}</p>
                  <p className="text-[11px] text-zinc-500">Standard Members</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-[#121214] border border-[#27272a] rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <FolderKanban className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-zinc-100">
                    {
                      new Set(
                        members.flatMap((m) => m.projects.map((p) => p.id)),
                      ).size
                    }
                  </p>
                  <p className="text-[11px] text-zinc-500">Active Workspaces</p>
                </div>
              </div>

              <div className="bg-[#121214] border border-[#27272a] rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-zinc-100">Protected</p>
                  <p className="text-[11px] text-zinc-500">
                    Privacy-Scoped View
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Search & Filter Bar ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#121214] border border-[#27272a] p-3 rounded-xl">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full bg-[#18181b] border border-[#27272a] rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as Role | "ALL")}
              className="bg-[#18181b] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admins</option>
              <option value="USER">Members</option>
            </select>
          </div>
        </div>

        {/* ── Members Table ── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-xs text-zinc-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading organization directory...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-[#121214] border border-[#27272a] rounded-xl p-8">
            <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">
              No teammates match your criteria
            </p>
          </div>
        ) : (
          <div className="bg-[#121214] border border-[#27272a] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300 border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-[#18181b]/70 border-b border-[#27272a] text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4 w-32">System Role</th>
                    <th className="py-3 px-4">
                      {isAdmin ? "Assigned Projects" : "Shared Projects"}
                    </th>
                    {isAdmin && <th className="py-3 px-4 w-36">Workload</th>}
                    <th className="py-3 px-4 w-36">Joined Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#27272a]/60">
                  {filtered.map((m) => {
                    const isPopoverOpen = activeProjectPopover === m.id;
                    const visiblePills = m.projects.slice(0, 2);
                    const remainingCount = m.projects.length - 2;

                    return (
                      <tr
                        key={m.id}
                        className="hover:bg-zinc-900/40 transition-colors"
                      >
                        {/* 1. Member Info (Avatar, Name, Email) */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-semibold text-indigo-300 shrink-0">
                              {m.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-zinc-100 truncate">
                                {m.name}
                              </p>
                              <p className="text-[11px] text-zinc-500 truncate flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3 shrink-0 text-zinc-600" />
                                <span>{m.email}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. System Role Badge */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${
                              m.role === "ADMIN"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-zinc-800/80 text-zinc-300 border-zinc-700/60"
                            }`}
                          >
                            {m.role === "ADMIN" ? "ADMIN" : "MEMBER"}
                          </span>
                        </td>

                        {/* 3. Projects (Pills with +N More Popover) */}
                        <td className="py-3 px-4 relative">
                          {m.projects.length === 0 ? (
                            <span className="text-zinc-600 text-[11px] italic">
                              No mutual projects
                            </span>
                          ) : (
                            <div className="flex items-center flex-wrap gap-1.5">
                              {visiblePills.map((p) => (
                                <span
                                  key={p.id}
                                  className="inline-flex items-center text-[10px] bg-[#18181b] border border-[#27272a] text-zinc-300 px-2 py-0.5 rounded max-w-[150px] truncate"
                                  title={`${p.name} (${p.role})`}
                                >
                                  {p.name}
                                </span>
                              ))}

                              {remainingCount > 0 && (
                                <div className="relative inline-block">
                                  <button
                                    onClick={() =>
                                      setActiveProjectPopover(
                                        isPopoverOpen ? null : m.id,
                                      )
                                    }
                                    className="text-[10px] bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-mono transition-colors cursor-pointer"
                                  >
                                    +{remainingCount} more
                                  </button>

                                  {/* Popover List */}
                                  {isPopoverOpen && (
                                    <>
                                      <div
                                        onClick={() =>
                                          setActiveProjectPopover(null)
                                        }
                                        className="fixed inset-0 z-40"
                                      />
                                      <div className="absolute left-0 top-7 z-50 w-64 bg-[#18181b] border border-[#27272a] rounded-xl shadow-xl p-3 animate-in fade-in zoom-in-95 duration-150">
                                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#27272a]">
                                          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                                            {isAdmin
                                              ? "All Assigned Projects"
                                              : "Shared Projects"}
                                          </p>
                                          <button
                                            onClick={() =>
                                              setActiveProjectPopover(null)
                                            }
                                            className="text-zinc-500 hover:text-zinc-300"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                          {m.projects.map((p) => (
                                            <div
                                              key={p.id}
                                              className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-zinc-800/50"
                                            >
                                              <span className="text-zinc-200 truncate pr-2">
                                                {p.name}
                                              </span>
                                              <span className="text-[9px] font-mono px-1.5 py-0.2 bg-zinc-900 border border-zinc-700/60 text-zinc-400 rounded shrink-0">
                                                {p.role}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 4. Workload / Tasks (Admin Only) */}
                        {isAdmin && (
                          <td className="py-3 px-4 whitespace-nowrap">
                            {m.totalTasks !== null ? (
                              <span className="flex items-center gap-1.5 text-zinc-300 font-mono text-[11px]">
                                <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                                <span>{m.totalTasks} active tasks</span>
                              </span>
                            ) : (
                              <span className="text-zinc-600">-</span>
                            )}
                          </td>
                        )}

                        {/* 5. Joined Date */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="flex items-center gap-1.5 text-zinc-400 text-[11px] font-mono">
                            <Calendar className="w-3 h-3 text-zinc-600" />
                            <span>
                              {new Date(m.createdAt).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal: Invite New Member (Admin Only) ── */}
      {isInviteOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsInviteOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md bg-[#121214] border border-[#27272a] rounded-xl shadow-2xl p-6 relative">
            <button
              onClick={() => setIsInviteOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-semibold text-zinc-100 mb-1">
              Add Team Member
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Add a new member to your organization workspace
            </p>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Asad Rehman"
                  required
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="asad@example.com"
                  required
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Organization Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Role)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="USER">Standard Member</option>
                  <option value="ADMIN">Administrator</option>
                </select>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Default login password will be:{" "}
                  <code className="text-zinc-300">Password123!</code>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isInviting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Add Member"
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
