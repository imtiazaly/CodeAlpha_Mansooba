import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Layers, ArrowRight, Loader2 } from "lucide-react";
import { apiClient } from "../../api/axios";
import { useAppDispatch } from "../../store";
import { setCredentials } from "../../store/slices/authSlice";
import { connectSocket } from "../../lib/socket";
import type { ApiResponse, User } from "../../types";

export const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      setIsLoading(true);
      const res = await apiClient.post<
        ApiResponse<{ user: User; token: string }>
      >("/auth/register", { name, email, password });

      const { user, token } = res.data.data;
      dispatch(setCredentials({ user, token }));
      connectSocket(token);

      toast.success("Account created successfully!");
      navigate("/");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message || "Registration failed";
        toast.error(msg);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-100">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-11 h-11 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-3">
            <Layers className="w-6 h-6 text-indigo-500" />
          </div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
            Create your Mansooba account
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Start collaborating with your team today.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-[#121214] border border-[#27272a] rounded-xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Email address
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
                placeholder="Minimum 6 characters"
                required
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Link */}
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
