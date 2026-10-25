import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

// Team Members Directory
router.get("/", UserController.getOrganizationMembers);

// Update member role within workspace (Admin only)
router.patch("/members/:userId/role", UserController.updateMemberRole);

// Remove member from workspace (Admin only — user account stays safe)
router.delete("/members/:userId", UserController.removeOrganizationMember);

// Settings: Update profile name
router.patch("/profile", UserController.updateProfile);

// Settings: Change password
router.patch("/change-password", UserController.changePassword);

// Settings: Admin — Update organization name
router.patch("/organization", UserController.updateOrganization);

// Invite / Add member (Admin only)
router.post("/invite", UserController.inviteUser);

// Search users
router.get("/search", UserController.searchUsers);

// Get user by ID
router.get("/:id", UserController.getUserById);

export const userRoutes = router;