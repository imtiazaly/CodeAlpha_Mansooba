import { Prisma, Role, TaskStatus, Priority } from "@prisma/client";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { assertProjectAccess } from "../utils/projectAccess.js";
import { ProjectRole } from "@prisma/client";
import { emitToProject } from "../config/socket.js";

interface CurrentUser {
  id: string;
  email: string;
  role: Role;
}

interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string;
  projectId: string;
  assigneeId?: string | null;
}

interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string | null;
  assigneeId?: string | null;
}

interface QueryTasksInput {
  page: number;
  limit: number;
  projectId?: string;
  status?: TaskStatus;
  priority?: Priority;
  search?: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export class TaskService {
  private static async validateAssignee(
    projectId: string,
    assigneeId?: string | null,
  ) {
    if (!assigneeId) return; // Agar null/undefined hai (unassign karna) to allow hai
    const user = await prisma.user.findUnique({
      where: { id: assigneeId },
      select: { id: true, isActive: true },
    });
    if (!user || !user.isActive) {
      throw new ApiError(400, "Assignee not found or user is inactive");
    }
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: assigneeId,
        },
      },
    });
    if (!membership) {
      throw new ApiError(400, "Assignee must be a member of this project");
    }
  }

  static async createTask(data: CreateTaskInput, user: CurrentUser) {
    // Check project access & role
    await assertProjectAccess(data.projectId, user, ProjectRole.MEMBER);
    // Validate assignee (agar diya gaya hai)
    await this.validateAssignee(data.projectId, data.assigneeId);
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        projectId: data.projectId,
        creatorId: user.id,
        assigneeId: data.assigneeId,
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    // Real-Time Event: Project members ko naye task ka notify karein
    emitToProject(task.projectId, "task:created", task);

    return task;
  }

  static async getTasks(query: any, user: CurrentUser) {
    const page = Math.max(1, parseInt(String(query.page || 1), 10));
    const limit = Math.max(
      1,
      Math.min(100, parseInt(String(query.limit || 10), 10)),
    );
    const sortBy = (query.sortBy as string) || "createdAt";
    const sortOrder: "asc" | "desc" =
      query.sortOrder === "asc" ? "asc" : "desc";
    const skip = (page - 1) * limit;

    const { projectId, status, priority, search } = query;

    const where: Prisma.TaskWhereInput = {
      isDeleted: false,
      project: {
        isDeleted: false,
        ...(user.role !== Role.ADMIN && {
          members: { some: { userId: user.id } },
        }),
      },
      ...(projectId && { projectId }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          creator: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true } },
          _count: { select: { comments: true } },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      tasks,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  static async getTaskById(id: string, user: CurrentUser) {
    const task = await prisma.task.findFirst({
      where: {
        id,
        isDeleted: false,
        project: { isDeleted: false },
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, isDeleted: true } },
        comments: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!task) throw new ApiError(404, "Task not found");

    // VIEWER bhi task read kar sakta hai
    await assertProjectAccess(task.projectId, user, ProjectRole.VIEWER);

    return task;
  }

  static async updateTask(
    id: string,
    data: UpdateTaskInput,
    user: CurrentUser,
  ) {
    const task = await this.getTaskById(id, user);

    // Edit permission check
    await assertProjectAccess(task.projectId, user, ProjectRole.MEMBER);

    // Validate assignee if updated
    if (data.assigneeId !== undefined) {
      await this.validateAssignee(task.projectId, data.assigneeId);
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
        ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    // Real-Time Event: Drag-and-drop ya task update live sync karein
    emitToProject(task.projectId, "task:updated", updatedTask);

    return updatedTask;
  }

  static async deleteTask(id: string, user: CurrentUser) {
    const task = await this.getTaskById(id, user);

    // Delete karne ke liye kam az kam MEMBER hona zaroori hai
    await assertProjectAccess(task.projectId, user, ProjectRole.MEMBER);

    await prisma.task.update({
      where: { id },
      data: { isDeleted: true },
    });

    // Real-Time Event: Task delete hone par board se hatayein
    emitToProject(task.projectId, "task:deleted", {
      id,
      projectId: task.projectId,
    });

    return { id, message: "Task successfully deleted" };
  }
}
