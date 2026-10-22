import type { RouteObject } from "react-router-dom";
import { Dashboard } from "../pages/dashboard/Dashboard";
import { ProjectDetail } from "../pages/projects/ProjectDetail";

export const projectRoutes: RouteObject[] = [
  { path: "/", element: <Dashboard /> },
  { path: "/projects/:id", element: <ProjectDetail /> },
];
