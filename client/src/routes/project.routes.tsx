import { Route } from "react-router-dom";
import { Dashboard } from "../pages/dashboard/Dashboard";
import { ProjectDetail } from "../pages/projects/ProjectDetail";

export const projectRoutes = (
  <>
    <Route path="/" element={<Dashboard />} />
    <Route path="/projects/:id" element={<ProjectDetail />} />
  </>
);
