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
} from "lucide-react";
import { toast } from "sonner";

interface MemberItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  totalTasks: number;
  totalProjects: number;
  projects: { id: string; name: string; role: string }[];
}

export const MembersPage = () => {
  const currentUser = useAppSelector((s) => s.auth.user);
  const isAdmin = currentUser?.role === "ADMIN";
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");

  // Invite modal state (Only for Admin)
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("USER");
  const [isInviting, setIsInviting] = useState(false);

  // Fetch Organization Members
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

  // Invite Member Handler
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
        title="Team Directory"
        subtitle="Manage organization members, roles, and project allocations"
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
        {/* ── Top Stats Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-[#121214] border border-[#27272a] rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-zinc-100">{totalMembers}</p>
              <p className="text-[11px] text-zinc-500">Total Teammates</p>
            </div>
          </div>

          <div className="bg-[#121214] border border-[#27272a] rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-zinc-100">{adminCount}</p>
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
        </div>

        {/* ── Search & Filter Controls ── */}
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

        {/* ── Members Grid ── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-xs text-zinc-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading organization directory...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-[#121214] border border-[#27272a] rounded-xl p-8">
            <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">
              No members match your criteria
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((m) => (
              <div
                key={m.id}
                className="bg-[#121214] border border-[#27272a] hover:border-zinc-700 rounded-xl p-4 flex flex-col justify-between transition-all duration-150"
              >
                <div>
                  {/* Top: Avatar, Name, Email & Role */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-sm font-semibold text-indigo-300 shrink-0">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-100 truncate">
                          {m.name}
                        </p>
                        <p className="text-[11px] text-zinc-500 truncate flex items-center gap-1">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span>{m.email}</span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${
                        m.role === "ADMIN"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}
                    >
                      {m.role}
                    </span>
                  </div>

                  {/* Projects Section */}
                  <div className="mt-3 pt-3 border-t border-[#27272a]">
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                      Projects ({m.projects.length})
                    </p>
                    {m.projects.length === 0 ? (
                      <p className="text-[11px] text-zinc-600 italic">
                        No accessible projects
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                        {m.projects.map((p) => (
                          <span
                            key={p.id}
                            className="text-[10px] bg-[#18181b] border border-[#27272a] text-zinc-300 px-2 py-0.5 rounded"
                          >
                            {p.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer: Task counts and Joined date */}
                <div className="flex items-center justify-between pt-3 mt-4 border-t border-[#27272a] text-[11px] text-zinc-500">
                  <span className="flex items-center gap-1">
                    <CheckSquare className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{m.totalTasks} tasks assigned</span>
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[10px]">
                    <Calendar className="w-3 h-3 text-zinc-500" />
                    <span>
                      {new Date(m.createdAt).toLocaleDateString("en-GB", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </span>
                </div>
              </div>
            ))}
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
