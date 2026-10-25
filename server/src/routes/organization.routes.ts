import { Router } from "express";
import { OrganizationController } from "../controllers/organization.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

// GET /api/v1/organizations/mine
router.get("/mine", OrganizationController.getMyOrganizations);

// PATCH /api/v1/organizations/switch
router.patch("/switch", OrganizationController.switchOrganization);

export const organizationRoutes = router;
