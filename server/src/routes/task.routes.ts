import { Router } from "express";
import { TaskController } from "../controllers/task.controller.js";
import { commentRoutes } from "./comment.routes.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createTaskSchema,
  updateTaskSchema,
  taskIdParamSchema,
  queryTasksSchema,
} from "../schemas/task.schema.js";

const router = Router();

router.use(authenticate);

// Nested Comments Router: /api/v1/tasks/:taskId/comments
router.use("/:taskId/comments", commentRoutes);

router
  .route("/")
  .post(validate(createTaskSchema), TaskController.createTask)
  .get(validate(queryTasksSchema), TaskController.getTasks);

router
  .route("/:id")
  .get(validate(taskIdParamSchema), TaskController.getTaskById)
  .patch(validate(updateTaskSchema), TaskController.updateTask)
  .delete(validate(taskIdParamSchema), TaskController.deleteTask);

export const taskRoutes = router;