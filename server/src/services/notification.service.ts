import { NotificationType } from "@prisma/client";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { emitToUser } from "../config/socket.js";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  projectId?: string;
  taskId?: string;
}

export class NotificationService {
  // Notification create karke user ko WebSocket par live push karega
  static async createNotification(data: CreateNotificationInput) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        projectId: data.projectId,
        taskId: data.taskId,
      },
    });

    // Real-Time Event: User ko instantly notification deliver karein
    emitToUser(data.userId, "notification:new", notification);

    return notification;
  }

  static async getUserNotifications(
    userId: string,
    query: { page?: number; limit?: number; isRead?: boolean } = {},
  ) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(query?.isRead !== undefined && { isRead: query.isRead }),
    };

    const [total, unreadCount, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      notifications,
      unreadCount,
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

  static async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== userId) {
      throw new ApiError(404, "Notification not found");
    }

    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  static async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { message: "All notifications marked as read" };
  }
}
