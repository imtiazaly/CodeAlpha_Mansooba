import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { userRoutes } from "./user.routes.js";
import { projectRoutes } from "./project.routes.js";
import { taskRoutes } from "./task.routes.js";
import { notificationRoutes } from "./notification.routes.js";
import { organizationRoutes } from "./organization.routes.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const router = Router();

router.get("/health", (req, res) => {
  res.status(200).json(
    new ApiResponse(
      200,
      {
        status: "UP",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
      "API is healthy and operational",
    ),
  );
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);
router.use("/notifications", notificationRoutes);
router.use("/organizations", organizationRoutes);

export const apiRouter = router;