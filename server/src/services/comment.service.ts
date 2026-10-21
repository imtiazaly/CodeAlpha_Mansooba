import { Role } from "@prisma/client";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { assertProjectAccess } from "../utils/projectAccess.js";
import { ProjectRole } from "@prisma/client";

interface CurrentUser {
  id: string;
  email: string;
  role: Role;
}

export class CommentService {
  static async createComment(
    taskId: string,
    content: string,
    user: CurrentUser,
  ) {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        isDeleted: false,
        project: { isDeleted: false }, // Deleted project block
      },
      select: { id: true, projectId: true },
    });

    if (!task) throw new ApiError(404, "Task not found");

    await assertProjectAccess(task.projectId, user, ProjectRole.MEMBER);

    return prisma.comment.create({
      data: {
        content,
        taskId,
        userId: user.id,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  static async getCommentsByTaskId(taskId: string, user: CurrentUser) {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        isDeleted: false,
        project: { isDeleted: false }, // Deleted project block
      },
      select: { id: true, projectId: true },
    });

    if (!task) throw new ApiError(404, "Task not found");

    await assertProjectAccess(task.projectId, user, ProjectRole.VIEWER);

    return prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  static async deleteComment(
    taskId: string,
    commentId: string,
    user: CurrentUser,
  ) {
    const comment = await prisma.comment.findFirst({
      where: { id: commentId, taskId },
      include: {
        task: {
          select: {
            projectId: true,
            isDeleted: true,
            project: { select: { isDeleted: true } },
          },
        },
      },
    });

    if (!comment || comment.task.isDeleted || comment.task.project.isDeleted) {
      throw new ApiError(404, "Comment not found");
    }

    await assertProjectAccess(comment.task.projectId, user, ProjectRole.MEMBER);

    if (user.role !== Role.ADMIN && comment.userId !== user.id) {
      throw new ApiError(
        403,
        "Forbidden: You can only delete your own comments",
      );
    }

    await prisma.comment.delete({ where: { id: commentId } });

    return { id: commentId, message: "Comment deleted successfully" };
  }
}
