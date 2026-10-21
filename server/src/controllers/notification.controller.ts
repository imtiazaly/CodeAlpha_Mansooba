import { Request, Response } from "express";
import { NotificationService } from "../services/notification.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export class NotificationController {
  static getNotifications = asyncHandler(
    async (req: Request, res: Response) => {
      const result = await NotificationService.getUserNotifications(
        req.user!.id,
        req.query as any,
      );
      res
        .status(200)
        .json(
          new ApiResponse(200, result, "Notifications retrieved successfully"),
        );
    },
  );

  static markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const notification = await NotificationService.markAsRead(
      req.params.id as string,
      req.user!.id,
    );
    res
      .status(200)
      .json(new ApiResponse(200, notification, "Notification marked as read"));
  });

  static markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    const result = await NotificationService.markAllAsRead(req.user!.id);
    res
      .status(200)
      .json(new ApiResponse(200, result, "All notifications marked as read"));
  });
}
