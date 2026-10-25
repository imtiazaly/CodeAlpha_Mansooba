import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

// Team Members Directory
router.get("/", UserController.getOrganizationMembers);

// Settings: Update profile name
router.patch("/profile", UserController.updateProfile);

// Settings: Change password
router.patch("/change-password", UserController.changePassword);

// Settings: Admin — Update organization name
router.patch("/organization", UserController.updateOrganization);

// Invite new member (Admin only)
router.post("/invite", UserController.inviteUser);

// Search users
router.get("/search", UserController.searchUsers);

// Get user by ID
router.get("/:id", UserController.getUserById);

export const userRoutes = router;