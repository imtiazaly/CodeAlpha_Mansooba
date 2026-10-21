import { Role } from "@prisma/client";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";

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
      where: { id: taskId, isDeleted: false },
      include: { project: { include: { members: true } } },
    });

    if (!task) throw new ApiError(404, "Task not found");

    const isMember = task.project.members.some((m) => m.userId === user.id);
    if (user.role !== Role.ADMIN && !isMember) {
      throw new ApiError(
        403,
        "Forbidden: You must be a project member to comment",
      );
    }

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
      where: { id: taskId, isDeleted: false },
      include: { project: { include: { members: true } } },
    });

    if (!task) throw new ApiError(404, "Task not found");

    const isMember = task.project.members.some((m) => m.userId === user.id);
    if (user.role !== Role.ADMIN && !isMember) {
      throw new ApiError(403, "Forbidden: Access denied");
    }

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
    });

    if (!comment) throw new ApiError(404, "Comment not found");

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
