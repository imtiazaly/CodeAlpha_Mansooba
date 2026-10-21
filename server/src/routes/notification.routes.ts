import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  notificationIdParamSchema,
  queryNotificationsSchema,
} from "../schemas/notification.schema.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  validate(queryNotificationsSchema),
  NotificationController.getNotifications,
);

router.patch("/read-all", NotificationController.markAllAsRead);

router.patch(
  "/:id/read",
  validate(notificationIdParamSchema),
  NotificationController.markAsRead,
);

export const notificationRoutes = router;
