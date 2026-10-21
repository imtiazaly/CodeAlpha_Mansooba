import { Prisma, Role, TaskStatus, Priority } from "@prisma/client";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { assertProjectAccess } from "../utils/projectAccess.js";
import { ProjectRole } from "@prisma/client";

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
  static async createTask(data: CreateTaskInput, user: CurrentUser) {
    // 1. Check karein project exist karta hai aur user kam az kam MEMBER hai (VIEWER block ho jayega)
    await assertProjectAccess(data.projectId, user, ProjectRole.MEMBER);

    return prisma.task.create({
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
      ...(projectId && { projectId }),
      ...(user.role !== Role.ADMIN && {
        project: { members: { some: { userId: user.id } } },
      }),
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
      where: { id, isDeleted: false },
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

    // Edit karne ke liye kam az kam MEMBER hona zaroori hai (VIEWER ko 403 milega)
    await assertProjectAccess(task.projectId, user, ProjectRole.MEMBER);

    return prisma.task.update({
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
  }

  static async deleteTask(id: string, user: CurrentUser) {
    const task = await this.getTaskById(id, user);

    // Delete karne ke liye kam az kam MEMBER hona zaroori hai
    await assertProjectAccess(task.projectId, user, ProjectRole.MEMBER);

    await prisma.task.update({
      where: { id },
      data: { isDeleted: true },
    });

    return { id, message: "Task successfully deleted" };
  }
}