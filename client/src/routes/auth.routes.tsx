import type { RouteObject } from "react-router-dom";
import { PublicRoute } from "../components/auth/PublicRoute";
import { Login } from "../pages/auth/Login";
import { Register } from "../pages/auth/Register";

export const authRoutes: RouteObject[] = [
  {
    element: <PublicRoute />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
    ],
  },
];
