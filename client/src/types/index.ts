// Roles & Enums
export type Role = "USER" | "ADMIN";
export type ProjectRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_STATUS_CHANGED"
  | "COMMENT_ADDED"
  | "PROJECT_INVITATION"
  | "PROJECT_REMOVED"
  | "TASK_UNASSIGNED";

// Organization
export interface Organization {
  id: string;
  name: string;
  slug: string;
}

// User
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  organizationId?: string | null;
  organization?: Organization | null;
  createdAt: string;
  updatedAt: string;
}

// Project & Members
export interface ProjectMember {
  id: string;
  role: ProjectRole;
  createdAt: string;
  projectId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner?: User;
  members?: ProjectMember[];
  _count?: {
    tasks: number;
    members: number;
  };
}

// Task & Comment
export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  order: number;
  dueDate?: string | null;
  projectId: string;
  creatorId: string;
  assigneeId?: string | null;
  createdAt: string;
  updatedAt: string;
  creator?: User;
  assignee?: User | null;
  _count?: {
    comments: number;
  };
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

// Notification
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  userId: string;
  projectId?: string | null;
  taskId?: string | null;
  createdAt: string;
}

// Standard API Response Envelope
export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}