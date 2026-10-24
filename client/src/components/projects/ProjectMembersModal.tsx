import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  X,
  Users,
  UserPlus,
  Trash2,
  Search,
  Loader2,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { apiClient } from "../../api/axios";
import { useAppSelector } from "../../store";
import type { ApiResponse, Project, ProjectRole, User } from "../../types";

interface ProjectMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const ProjectMembersModal = ({
  isOpen,
  onClose,
  project,
}: ProjectMembersModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<ProjectRole>("MEMBER");
  const [isAdding, setIsAdding] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const currentUserId = useAppSelector((state) => state.auth.user?.id);
  const isOwner = project.ownerId === currentUserId;

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Search users API call
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const res = await apiClient.get<ApiResponse<User[]>>(
        `/users/search?q=${encodeURIComponent(searchQuery.trim())}`,
      );
      // Filter out users who are already members
      const existingUserIds = new Set(
        project.members?.map((m) => m.userId) || [],
      );
      existingUserIds.add(project.ownerId);

      const availableUsers = (res.data.data || []).filter(
        (u) => !existingUserIds.has(u.id),
      );
      setSearchResults(availableUsers);

      if (availableUsers.length === 0) {
        toast.info("No new users found matching your search");
      }
    } catch (err) {
      toast.error("Failed to search users");
    } finally {
      setIsSearching(false);
    }
  };

  // Add Member
  const handleAddMember = async () => {
    if (!selectedUser) return;

    try {
      setIsAdding(true);
      await apiClient.post(`/projects/${project.id}/members`, {
        userId: selectedUser.id,
        role: selectedRole,
      });

      toast.success(`${selectedUser.name} added to the project`);
      setSelectedUser(null);
      setSearchQuery("");
      setSearchResults([]);
      queryClient.invalidateQueries({ queryKey: ["project", project.id] });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to add member");
      }
    } finally {
      setIsAdding(false);
    }
  };

  // Remove Member
  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!window.confirm(`Remove ${userName} from this project?`)) return;

    try {
      setRemovingUserId(userId);
      await apiClient.delete(`/projects/${project.id}/members/${userId}`);
      toast.success(`${userName} removed from project`);
      queryClient.invalidateQueries({ queryKey: ["project", project.id] });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to remove member");
      }
    } finally {
      setRemovingUserId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg bg-[#121214] border border-[#27272a] rounded-xl shadow-2xl p-6 relative flex flex-col max-h-[85vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-100">
              Project Members
            </h3>
            <p className="text-xs text-zinc-400">
              Manage who has access to {project.name}
            </p>
          </div>
        </div>

        {/* Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* Invite Section (Owner or Admin only) */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4">
            <h4 className="text-xs font-semibold text-zinc-200 mb-2 flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-indigo-400" />
              Invite Team Member
            </h4>

            {/* Search Input */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full bg-[#121214] border border-[#27272a] rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
              </div>
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSearching ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  "Search"
                )}
              </button>
            </form>

            {/* Search Results Dropdown List */}
            {searchResults.length > 0 && (
              <div className="mt-2.5 max-h-36 overflow-y-auto border border-[#27272a] rounded-lg bg-[#121214] divide-y divide-[#27272a]">
                {searchResults.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className={`p-2 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                      selectedUser?.id === u.id
                        ? "bg-indigo-600/20 text-indigo-300"
                        : "hover:bg-zinc-900 text-zinc-300"
                    }`}
                  >
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-[10px] text-zinc-500">{u.email}</p>
                    </div>
                    {selectedUser?.id === u.id && (
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono">
                        Selected
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Role select & Submit Button */}
            {selectedUser && (
              <div className="mt-3 pt-3 border-t border-[#27272a] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Role:</span>
                  <select
                    value={selectedRole}
                    onChange={(e) =>
                      setSelectedRole(e.target.value as ProjectRole)
                    }
                    className="bg-[#121214] border border-[#27272a] rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                </div>

                <button
                  onClick={handleAddMember}
                  disabled={isAdding}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isAdding ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Add to Project"
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Members List */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Current Members ({project.members?.length || 1})
            </h4>

            <div className="border border-[#27272a] rounded-xl bg-[#18181b] divide-y divide-[#27272a] overflow-hidden">
              {/* Project Owner Row */}
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-medium text-indigo-300">
                    {project.owner?.name?.charAt(0).toUpperCase() || "O"}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-200">
                      {project.owner?.name || "Project Owner"}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {project.owner?.email || ""}
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Shield className="w-3 h-3" />
                  OWNER
                </span>
              </div>

              {/* Other Members */}
              {project.members
                ?.filter((m) => m.userId !== project.ownerId)
                .map((member) => (
                  <div
                    key={member.id}
                    className="p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-300">
                        {member.user?.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-zinc-200">
                          {member.user?.name}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {member.user?.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                        {member.role}
                      </span>

                      {/* Remove button (Only Owner or if removing oneself) */}
                      {(isOwner || member.userId === currentUserId) && (
                        <button
                          onClick={() =>
                            handleRemoveMember(member.userId, member.user?.name)
                          }
                          disabled={removingUserId === member.userId}
                          title="Remove Member"
                          className="text-zinc-500 hover:text-rose-400 p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          {removingUserId === member.userId ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
