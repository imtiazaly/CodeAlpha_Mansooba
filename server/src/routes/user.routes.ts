import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

// GET /api/v1/users (Team Members Directory)
router.get("/", UserController.getOrganizationMembers);

// POST /api/v1/users/invite (Admin only)
router.post("/invite", UserController.inviteUser);

// GET /api/v1/users/search?q=
router.get("/search", UserController.searchUsers);

// GET /api/v1/users/:id
router.get("/:id", UserController.getUserById);

export const userRoutes = router;