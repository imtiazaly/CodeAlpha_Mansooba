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
  organizationId?: string | null;
}

interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  order?: number;
  dueDate?: string;
  projectId: string;
  assigneeId?: string | null;
}

interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: Priority;
  order?: number;
  dueDate?: string | null;
  assigneeId?: string | null;
}

export class TaskService {
  private static async validateAssignee(
    projectId: string,
    assigneeId?: string | null,
  ) {
    if (!assigneeId) return;
    const user = await prisma.user.findUnique({
      where: { id: assigneeId },
      select: { id: true, isActive: true },
    });
    if (!user || !user.isActive) {
      throw new ApiError(400, "Assignee not found or user is inactive");
    }
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: assigneeId },
      },
    });
    if (!membership) {
      throw new ApiError(400, "Assignee must be a member of this project");
    }
  }

  static async createTask(data: CreateTaskInput, user: CurrentUser) {
    await assertProjectAccess(data.projectId, user, ProjectRole.MEMBER);
    await this.validateAssignee(data.projectId, data.assigneeId);

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

    emitToProject(task.projectId, "task:created", task);

    // CASE 3: Notification on Initial Task Assign
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
    const HARD_LIMIT = 500;
    const DEFAULT_LIMIT = 20;
    const limit = Math.max(
      1,
      Math.min(HARD_LIMIT, parseInt(String(query.limit || DEFAULT_LIMIT), 10)),
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
        ...(user.organizationId && { organizationId: user.organizationId }),
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
        project: {
          isDeleted: false,
          ...(user.organizationId && { organizationId: user.organizationId }),
        },
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, isDeleted: true } },
        comments: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!task) throw new ApiError(404, "Task not found");

    await assertProjectAccess(task.projectId, user, ProjectRole.VIEWER);

    return task;
  }

  static async updateTask(
    id: string,
    data: UpdateTaskInput,
    user: CurrentUser,
  ) {
    const task = await this.getTaskById(id, user);

    await assertProjectAccess(task.projectId, user, ProjectRole.MEMBER);

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
        ...(data.order !== undefined && { order: data.order }),
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

    emitToProject(task.projectId, "task:updated", updatedTask);

    // CASE 3: New assignee notification
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

    // CASE 5: Unassign notification
    if (
      task.assigneeId &&
      data.assigneeId !== undefined &&
      data.assigneeId !== task.assigneeId &&
      task.assigneeId !== user.id
    ) {
      await NotificationService.createNotification({
        userId: task.assigneeId,
        type: NotificationType.TASK_UNASSIGNED,
        title: "Unassigned from Task",
        message: `You were unassigned from task: "${task.title}"`,
        projectId: task.projectId,
        taskId: task.id,
      });
    }

    // CASE 4: Status / Priority update notification
    const isStatusChanged = data.status && data.status !== task.status;
    const isPriorityChanged = data.priority && data.priority !== task.priority;

    if (isStatusChanged || isPriorityChanged) {
      const recipients = new Set<string>();
      if (task.creatorId && task.creatorId !== user.id) {
        recipients.add(task.creatorId);
      }
      if (updatedTask.assigneeId && updatedTask.assigneeId !== user.id) {
        recipients.add(updatedTask.assigneeId);
      }

      const updateMsg = isStatusChanged
        ? `Task "${updatedTask.title}" status changed to ${updatedTask.status}`
        : `Task "${updatedTask.title}" priority changed to ${updatedTask.priority}`;

      for (const recipientId of recipients) {
        await NotificationService.createNotification({
          userId: recipientId,
          type: NotificationType.TASK_STATUS_CHANGED,
          title: isStatusChanged ? "Task Status Updated" : "Task Updated",
          message: updateMsg,
          projectId: task.projectId,
          taskId: task.id,
        });
      }
    }

    return updatedTask;
  }

  static async deleteTask(id: string, user: CurrentUser) {
    const task = await this.getTaskById(id, user);

    await assertProjectAccess(task.projectId, user, ProjectRole.MEMBER);

    await prisma.task.update({
      where: { id },
      data: { isDeleted: true },
    });

    emitToProject(task.projectId, "task:deleted", {
      id,
      projectId: task.projectId,
    });

    return { id, message: "Task successfully deleted" };
  }
}