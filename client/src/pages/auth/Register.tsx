import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowRight,
  Loader2,
  Building2,
  User as UserIcon,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";
import { apiClient } from "../../api/axios";
import { useAppDispatch } from "../../store";
import { setCredentials } from "../../store/slices/authSlice";
import { connectSocket } from "../../lib/socket";
import type { ApiResponse, User } from "../../types";
import { MansoobaLogo } from "../../components/common/MansoobaLogo";

type Step = 1 | 2;

export const Register = () => {
  const [step, setStep] = useState<Step>(1);

  // Step 1 fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2 fields
  const [orgName, setOrgName] = useState("");

  // Slug preview (auto-generate)
  const slugPreview = orgName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);

  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Step 1 validation → go to step 2
  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setStep(2);
  };

  // Step 2: Final submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || orgName.trim().length < 2) {
      toast.error("Workspace name must be at least 2 characters");
      return;
    }

    try {
      setIsLoading(true);
      const res = await apiClient.post<
        ApiResponse<{ user: User; token: string }>
      >("/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        organizationName: orgName.trim(),
      });

      const { user, token } = res.data.data;
      dispatch(setCredentials({ user, token }));
      connectSocket(token);

      toast.success(`Welcome to Mansooba! Workspace "${orgName}" is ready.`);
      navigate("/");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message || "Registration failed";
        toast.error(msg);
        // Email conflict par step 1 par wapas
        if (err.response?.status === 409) setStep(1);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <MansoobaLogo size="xl" showWordmark={false} className="mb-4" />
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
            {step === 1 ? "Create your account" : "Set up your workspace"}
          </h1>
          <p className="text-sm text-zinc-400 mt-1 text-center">
            {step === 1
              ? "Start collaborating with your team on Mansooba."
              : "Your workspace is where your team manages projects together."}
          </p>
        </div>

        {/* Step Progress Indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {/* Step 1 */}
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all ${
                step === 1
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-indigo-500/20 border-indigo-500/40 text-indigo-400"
              }`}
            >
              {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : "1"}
            </div>
            <span
              className={`text-xs font-medium ${step === 1 ? "text-zinc-200" : "text-indigo-400"}`}
            >
              Your Account
            </span>
          </div>

          <div className="w-8 h-px bg-zinc-700" />

          {/* Step 2 */}
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all ${
                step === 2
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-zinc-800 border-zinc-700 text-zinc-500"
              }`}
            >
              2
            </div>
            <span
              className={`text-xs font-medium ${step === 2 ? "text-zinc-200" : "text-zinc-500"}`}
            >
              Your Workspace
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#121214] border border-[#27272a] rounded-xl p-6 shadow-xl">
          {/* ── STEP 1: Account Info ── */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <UserIcon className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-zinc-200">
                  Personal Information
                </h2>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ali Raza"
                  required
                  autoFocus
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ── STEP 2: Workspace Setup ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-zinc-200">
                  Workspace Details
                </h2>
              </div>

              {/* Account Summary */}
              <div className="flex items-center gap-3 p-3 bg-[#18181b] border border-[#27272a] rounded-lg">
                <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-200 truncate">
                    {name}
                  </p>
                  <p className="text-[11px] text-zinc-500 truncate">{email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="ml-auto text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 shrink-0 cursor-pointer"
                >
                  <ChevronLeft className="w-3 h-3" />
                  Edit
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Ali's Agency, XYZ Corp"
                  required
                  autoFocus
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                {/* Slug Preview */}
                {slugPreview && (
                  <p className="text-[10px] text-zinc-500 mt-1.5 flex items-center gap-1 font-mono">
                    Workspace URL:
                    <span className="text-indigo-400">
                      mansooba.app/{slugPreview}
                    </span>
                  </p>
                )}
              </div>

              <div className="p-3 bg-indigo-950/20 border border-indigo-500/15 rounded-lg">
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  You will be the{" "}
                  <span className="text-indigo-300 font-medium">
                    Administrator
                  </span>{" "}
                  of this workspace. You can invite team members and manage
                  projects after setup.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || orgName.trim().length < 2}
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating workspace...
                  </>
                ) : (
                  <>
                    Create Workspace
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-zinc-500 mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};