import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { AppLayout } from "../components/layout/AppLayout";
import { authRoutes } from "./auth.routes";
import { projectRoutes } from "./project.routes";

export const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. Auth Module Routes */}
      {authRoutes}

      {/* 2. Protected App Module Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>{projectRoutes}</Route>
      </Route>

      {/* 3. Global Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
