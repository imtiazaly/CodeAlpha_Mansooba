import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "./store";
import { setUser, logout } from "./store/slices/authSlice";
import { apiClient } from "./api/axios";
import { connectSocket } from "./lib/socket";
import { AppRoutes } from "./routes";
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

  return <AppRoutes />;
}
