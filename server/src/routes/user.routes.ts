import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  searchUsersSchema,
  userIdParamSchema,
} from "../schemas/user.schema.js";

const router = Router();

router.use(authenticate);

// GET /api/v1/users/search?q=john
router.get("/search", validate(searchUsersSchema), UserController.searchUsers);

// GET /api/v1/users/:id
router.get("/:id", validate(userIdParamSchema), UserController.getUserById);

export const userRoutes = router;
