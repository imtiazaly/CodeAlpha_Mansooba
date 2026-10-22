import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "./store";
import { setUser, logout } from "./store/slices/authSlice";
import { apiClient } from "./api/axios";
import { connectSocket } from "./lib/socket";
import { PublicRoute } from "./components/auth/PublicRoute";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import type { ApiResponse, User } from "./types";

export default function App() {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem("token") || token;
      if (!savedToken) {
        setIsInitializing(false);
        return;
      }

      try {
        const res = await apiClient.get<ApiResponse<User>>("/auth/me");
        dispatch(setUser(res.data.data));
        connectSocket(savedToken);
      } catch (err) {
        dispatch(logout());
      } finally {
        setIsInitializing(false);
      }
    };

    restoreSession();
  }, [dispatch]);

  // Initial App Loading Screen
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
        <p className="text-xs text-zinc-500 font-mono tracking-wider uppercase">
          Initializing Mansooba...
        </p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes (Only for guest / unauthenticated users) */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Protected Routes (Only for logged-in users) */}
      <Route element={<ProtectedRoute />}>
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-[#09090b] text-zinc-100 p-8">
              <h1 className="text-2xl font-bold">
                Mansooba Dashboard (Phase 4 me Layout banayein ge)
              </h1>
              <p className="text-zinc-400 mt-2">Login kamyab ho chuka hai!</p>
            </div>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <div className="min-h-screen bg-[#09090b] text-zinc-100 p-8">
              <h1 className="text-2xl font-bold">Project Details</h1>
            </div>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
