import { Prisma, Role, TaskStatus, Priority } from "@prisma/client";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { assertProjectAccess } from "../utils/projectAccess.js";
import { ProjectRole } from "@prisma/client";
import { emitToProject } from "../config/socket.js";
import { NotificationService } from "./notification.service.js";
import { NotificationType } from "@prisma/client";

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
  order?: number; // Added
  dueDate?: string;
  projectId: string;
  assigneeId?: string | null;
}

interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: Priority;
  order?: number; // Added
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

    // Agar order specify nahi kiya gaya to us column ka highest order + 1000 calculate karein
    let taskOrder = data.order;
    if (taskOrder === undefined) {
      const highestTask = await prisma.task.findFirst({
        where: {
          projectId: data.projectId,
          status: data.status || TaskStatus.TODO,
          isDeleted: false,
        },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      taskOrder = highestTask ? highestTask.order + 1000 : 1000;
    }

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        order: taskOrder,
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

    // Notification: Agar task kisi doosre user ko assign kiya gaya hai
    if (task.assigneeId && task.assigneeId !== user.id) {
      await NotificationService.createNotification({
        userId: task.assigneeId,
        type: NotificationType.TASK_ASSIGNED,
        title: "New Task Assigned",
        message: `You have been assigned to task: "${task.title}"`,
        projectId: task.projectId,
        taskId: task.id,
      });
    }

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
      ...(user.role !== Role.ADMIN &&
        !query.assigneeId && {
          assigneeId: user.id,
        }),
      ...(projectId && { projectId }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(query.assigneeId && { assigneeId: query.assigneeId }),
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
        ...(data.order !== undefined && { order: data.order }), // Added for Kanban Drag & Drop
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

    // Notification 1: Agar task kisi naye user ko assign hua hai
    if (
      updatedTask.assigneeId &&
      updatedTask.assigneeId !== task.assigneeId &&
      updatedTask.assigneeId !== user.id
    ) {
      await NotificationService.createNotification({
        userId: updatedTask.assigneeId,
        type: NotificationType.TASK_ASSIGNED,
        title: "Task Assigned to You",
        message: `You were assigned to task: "${updatedTask.title}"`,
        projectId: task.projectId,
        taskId: task.id,
      });
    }

    // Notification 2: Agar task ka status change hua hai to creator & assignee ko notify karein
    if (data.status && data.status !== task.status) {
      const recipients = new Set<string>();
      if (task.creatorId && task.creatorId !== user.id)
        recipients.add(task.creatorId);
      if (task.assigneeId && task.assigneeId !== user.id)
        recipients.add(task.assigneeId);

      for (const recipientId of recipients) {
        await NotificationService.createNotification({
          userId: recipientId,
          type: NotificationType.TASK_STATUS_CHANGED,
          title: "Task Status Updated",
          message: `Task "${updatedTask.title}" status changed to ${updatedTask.status}`,
          projectId: task.projectId,
          taskId: task.id,
        });
      }
    }

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
