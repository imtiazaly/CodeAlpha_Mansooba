import { Router } from "express";
import { ProjectController } from "../controllers/project.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdParamSchema,
  addMemberSchema,
  removeMemberSchema,
} from "../schemas/project.schema.js";

const router = Router();

// Saare project routes authenticated honge
router.use(authenticate);

router
  .route("/")
  .post(validate(createProjectSchema), ProjectController.createProject)
  .get(ProjectController.getProjects);

router
  .route("/:id")
  .get(validate(projectIdParamSchema), ProjectController.getProjectById)
  .patch(validate(updateProjectSchema), ProjectController.updateProject)
  .delete(validate(projectIdParamSchema), ProjectController.deleteProject);

// Members management routes
router.post(
  "/:id/members",
  validate(addMemberSchema),
  ProjectController.addMember,
);
router.delete(
  "/:id/members/:userId",
  validate(removeMemberSchema),
  ProjectController.removeMember,
);

export const projectRoutes = router;
