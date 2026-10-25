import type { RouteObject } from "react-router-dom";
import { Dashboard } from "../pages/dashboard/Dashboard";
import { ProjectDetail } from "../pages/projects/ProjectDetail";
import { MyTasks } from "../pages/tasks/MyTasks";
import { InboxPage } from "../pages/notifications/InboxPage";
import { MembersPage } from "../pages/members/MembersPage";

export const projectRoutes: RouteObject[] = [
  { path: "/", element: <Dashboard /> },
  { path: "/projects/:id", element: <ProjectDetail /> },
  { path: "/my-tasks", element: <MyTasks /> },
  { path: "/inbox", element: <InboxPage /> },
  { path: "/members", element: <MembersPage /> },
];