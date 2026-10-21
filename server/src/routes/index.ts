import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { projectRoutes } from "./project.routes.js";
import { taskRoutes } from "./task.routes.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const router = Router();

// Health check endpoint
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

// Mounted Versioned Resource Routes
router.use("/auth", authRoutes);
router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);

export const apiRouter = router;