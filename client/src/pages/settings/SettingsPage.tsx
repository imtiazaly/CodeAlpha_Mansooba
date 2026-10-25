import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Header } from "../../components/layout/Header";
import { apiClient } from "../../api/axios";
import { useAppSelector, useAppDispatch } from "../../store";
import { setUser } from "../../store/slices/authSlice";
import {
  User as UserIcon,
  Lock,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  Shield,
  Info,
} from "lucide-react";
import { toast } from "sonner";

type SettingsTab = "profile" | "security" | "workspace";

const TAB_CONFIG: { id: SettingsTab; label: string; icon: React.ReactNode }[] =
  [
    {
      id: "profile",
      label: "My Profile",
      icon: <UserIcon className="w-4 h-4" />,
    },
    { id: "security", label: "Security", icon: <Lock className="w-4 h-4" /> },
    {
      id: "workspace",
      label: "Workspace",
      icon: <Building2 className="w-4 h-4" />,
    },
  ];

export const SettingsPage = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.auth.user);
  const isAdmin = currentUser?.role === "ADMIN";

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // ── Profile Tab State ──
  const [profileName, setProfileName] = useState(currentUser?.name || "");

  // ── Security Tab State ──
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Workspace Tab State ──
  const [orgName, setOrgName] = useState(currentUser?.organization?.name || "");

  // Password strength check
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return null;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1)
      return { label: "Weak", color: "bg-rose-500", width: "w-1/4" };
    if (score === 2)
      return { label: "Fair", color: "bg-amber-500", width: "w-2/4" };
    if (score === 3)
      return { label: "Good", color: "bg-blue-500", width: "w-3/4" };
    return { label: "Strong", color: "bg-emerald-500", width: "w-full" };
  };

  const strength = getPasswordStrength(newPassword);

  // ── Mutations ──
  const profileMutation = useMutation({
    mutationFn: () => apiClient.patch("/users/profile", { name: profileName }),
    onSuccess: (res) => {
      dispatch(setUser({ ...currentUser!, name: res.data.data.name }));
      toast.success("Profile updated successfully!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update profile");
    },
  });

  const passwordMutation = useMutation({
    mutationFn: () =>
      apiClient.patch("/users/change-password", {
        currentPassword,
        newPassword,
      }),
    onSuccess: () => {
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to change password");
    },
  });

  const orgMutation = useMutation({
    mutationFn: () => apiClient.patch("/users/organization", { name: orgName }),
    onSuccess: (res) => {
      dispatch(
        setUser({
          ...currentUser!,
          organization: res.data.data,
        }),
      );
      toast.success("Organization name updated!");
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message || "Failed to update organization",
      );
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    passwordMutation.mutate();
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#09090b]">
      <Header
        title="Settings"
        subtitle="Manage your account, security, and workspace preferences"
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* ── Tabs ── */}
          <div className="flex items-center gap-1 bg-[#121214] border border-[#27272a] p-1 rounded-xl w-fit">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ════════════════════════════════════ */}
          {/* TAB 1: MY PROFILE                   */}
          {/* ════════════════════════════════════ */}
          {activeTab === "profile" && (
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="bg-[#121214] border border-[#27272a] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-zinc-100 mb-1">
                  Profile Information
                </h3>
                <p className="text-xs text-zinc-500 mb-5">
                  Update your display name within the organization.
                </p>

                {/* Avatar + Current Info */}
                <div className="flex items-center gap-4 mb-6 p-3 bg-[#18181b] border border-[#27272a] rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-lg font-bold text-indigo-300 shrink-0">
                    {currentUser?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">
                      {currentUser?.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {currentUser?.email}
                    </p>
                    <span
                      className={`inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        isAdmin
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}
                    >
                      {isAdmin ? "ADMIN" : "MEMBER"}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      Email Address
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        value={currentUser?.email || ""}
                        readOnly
                        className="flex-1 bg-[#0e0e10] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-zinc-500 cursor-not-allowed"
                      />
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1.5 rounded-lg shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-1 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Email address cannot be changed.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end mt-5 pt-4 border-t border-[#27272a]">
                  <button
                    onClick={() => profileMutation.mutate()}
                    disabled={
                      profileMutation.isPending ||
                      profileName.trim() === currentUser?.name ||
                      profileName.trim().length < 2
                    }
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {profileMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : null}
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Account Meta Info */}
              <div className="bg-[#121214] border border-[#27272a] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-zinc-100 mb-4">
                  Account Details
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-[#27272a]">
                    <span className="text-zinc-500">User ID</span>
                    <span className="font-mono text-zinc-400 text-[11px] bg-zinc-900 px-2 py-0.5 rounded">
                      {currentUser?.id?.slice(0, 12)}...
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#27272a]">
                    <span className="text-zinc-500">System Role</span>
                    <span
                      className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${
                        isAdmin
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}
                    >
                      {isAdmin ? "ADMIN" : "USER"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-zinc-500">Member Since</span>
                    <span className="font-mono text-zinc-400 text-[11px]">
                      {currentUser?.createdAt
                        ? new Date(currentUser.createdAt).toLocaleDateString(
                            "en-GB",
                            { day: "2-digit", month: "short", year: "numeric" },
                          )
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════ */}
          {/* TAB 2: SECURITY                     */}
          {/* ════════════════════════════════════ */}
          {activeTab === "security" && (
            <div className="space-y-4">
              <div className="bg-[#121214] border border-[#27272a] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-zinc-100 mb-1">
                  Change Password
                </h3>
                <p className="text-xs text-zinc-500 mb-5">
                  Ensure your account uses a strong, unique password.
                </p>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrent ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        required
                        className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 pr-9 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent((p) => !p)}
                        className="absolute right-2.5 top-2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                      >
                        {showCurrent ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        required
                        className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 pr-9 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew((p) => !p)}
                        className="absolute right-2.5 top-2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                      >
                        {showNew ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Password Strength Bar */}
                    {newPassword && strength && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-zinc-500">
                            Strength
                          </span>
                          <span
                            className={`text-[10px] font-medium ${
                              strength.label === "Weak"
                                ? "text-rose-400"
                                : strength.label === "Fair"
                                  ? "text-amber-400"
                                  : strength.label === "Good"
                                    ? "text-blue-400"
                                    : "text-emerald-400"
                            }`}
                          >
                            {strength.label}
                          </span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-1">
                          <div
                            className={`h-1 rounded-full transition-all duration-300 ${strength.color} ${strength.width}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        required
                        className={`w-full bg-[#18181b] border rounded-lg px-3 py-2 pr-9 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors ${
                          confirmPassword && confirmPassword !== newPassword
                            ? "border-rose-500/60 focus:border-rose-500"
                            : confirmPassword && confirmPassword === newPassword
                              ? "border-emerald-500/60 focus:border-emerald-500"
                              : "border-[#27272a] focus:border-indigo-500"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((p) => !p)}
                        className="absolute right-2.5 top-2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                      >
                        {showConfirm ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="text-[10px] text-rose-400 mt-1">
                        Passwords do not match
                      </p>
                    )}
                    {confirmPassword && confirmPassword === newPassword && (
                      <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Passwords match
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end pt-3 border-t border-[#27272a]">
                    <button
                      type="submit"
                      disabled={
                        passwordMutation.isPending ||
                        !currentPassword ||
                        !newPassword ||
                        !confirmPassword ||
                        newPassword !== confirmPassword
                      }
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {passwordMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Lock className="w-3.5 h-3.5" />
                      )}
                      Update Password
                    </button>
                  </div>
                </form>
              </div>

              {/* Security Info Card */}
              <div className="bg-[#121214] border border-[#27272a] rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-200 mb-1">
                      Security Recommendations
                    </h4>
                    <ul className="space-y-1.5 text-[11px] text-zinc-500">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                        Use at least 8 characters with a mix of letters, numbers
                        & symbols
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                        Avoid using personal information in your password
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                        Use a unique password not used on other platforms
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════ */}
          {/* TAB 3: WORKSPACE                    */}
          {/* ════════════════════════════════════ */}
          {activeTab === "workspace" && (
            <div className="space-y-4">
              <div className="bg-[#121214] border border-[#27272a] rounded-xl p-5">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100 mb-1">
                      Organization Details
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {isAdmin
                        ? "As an Administrator, you can update your organization's name."
                        : "View your current organization workspace information."}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-indigo-600/15 border border-indigo-500/25 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-indigo-400" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      value={
                        isAdmin
                          ? orgName
                          : currentUser?.organization?.name || ""
                      }
                      onChange={(e) => isAdmin && setOrgName(e.target.value)}
                      readOnly={!isAdmin}
                      placeholder="Organization name"
                      className={`w-full border rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors ${
                        isAdmin
                          ? "bg-[#18181b] border-[#27272a] focus:border-indigo-500"
                          : "bg-[#0e0e10] border-[#27272a] text-zinc-500 cursor-not-allowed"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      Organization Slug
                    </label>
                    <input
                      type="text"
                      value={currentUser?.organization?.slug || ""}
                      readOnly
                      className="w-full bg-[#0e0e10] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-zinc-500 cursor-not-allowed font-mono"
                    />
                    <p className="text-[10px] text-zinc-600 mt-1 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Slug is a permanent identifier and cannot be changed.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      Your Role
                    </label>
                    <div className="flex items-center gap-2 p-2.5 bg-[#0e0e10] border border-[#27272a] rounded-lg">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          isAdmin
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-zinc-800 text-zinc-400 border-zinc-700"
                        }`}
                      >
                        {isAdmin ? "ADMIN" : "MEMBER"}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {isAdmin
                          ? "Full administrative access to this workspace"
                          : "Standard member access to assigned projects"}
                      </span>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex justify-end mt-5 pt-4 border-t border-[#27272a]">
                    <button
                      onClick={() => orgMutation.mutate()}
                      disabled={
                        orgMutation.isPending ||
                        orgName.trim() === currentUser?.organization?.name ||
                        orgName.trim().length < 2
                      }
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {orgMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : null}
                      Save Organization
                    </button>
                  </div>
                )}
              </div>

              {/* Non-admin info banner */}
              {!isAdmin && (
                <div className="bg-[#121214] border border-amber-900/30 rounded-xl p-4 flex items-start gap-3">
                  <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-amber-300 mb-0.5">
                      Admin Access Required
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Organization settings can only be modified by an
                      Administrator. Contact your workspace admin for changes.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
