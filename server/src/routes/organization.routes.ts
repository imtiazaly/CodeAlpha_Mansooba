import { Router } from "express";
import { OrganizationController } from "../controllers/organization.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

// GET /api/v1/organizations/mine
router.get("/mine", OrganizationController.getMyOrganizations);

// GET /api/v1/organizations/invitations (User's pending invitations)
router.get("/invitations", OrganizationController.getPendingInvitations);

// POST /api/v1/organizations/invitations/:id/respond (Accept or Decline)
router.post(
  "/invitations/:id/respond",
  OrganizationController.respondToInvitation,
);

// PATCH /api/v1/organizations/switch
router.patch("/switch", OrganizationController.switchOrganization);

export const organizationRoutes = router;