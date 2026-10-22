import { useRoutes, Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { AppLayout } from "../components/layout/AppLayout";
import { authRoutes } from "./auth.routes";
import { projectRoutes } from "./project.routes";

export const AppRoutes = () => {
  const routes: RouteObject[] = [
    // 1. Auth Module Routes
    ...authRoutes,

    // 2. Protected App Module Routes
    {
      element: <ProtectedRoute />,
      children: [
        {
          element: <AppLayout />,
          children: projectRoutes,
        },
      ],
    },

    // 3. Fallback Catch-all
    {
      path: "*",
      element: <Navigate to="/" replace />,
    },
  ];

  return useRoutes(routes);
};
