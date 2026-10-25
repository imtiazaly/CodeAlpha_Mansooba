import { Request, Response } from "express";
import { OrganizationService } from "../services/organization.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export class OrganizationController {
  // GET /organizations/mine
  static getMyOrganizations = asyncHandler(
    async (req: Request, res: Response) => {
      const orgs = await OrganizationService.getMyOrganizations(req.user!.id);
      res
        .status(200)
        .json(
          new ApiResponse(200, orgs, "Organizations retrieved successfully"),
        );
    },
  );

  // PATCH /organizations/switch
  static switchOrganization = asyncHandler(
    async (req: Request, res: Response) => {
      const { organizationId } = req.body;
      if (!organizationId) {
        return res
          .status(400)
          .json(new ApiResponse(400, null, "organizationId is required"));
      }

      const updatedUser = await OrganizationService.switchOrganization(
        req.user!.id,
        organizationId,
      );

      res
        .status(200)
        .json(
          new ApiResponse(200, updatedUser, "Workspace switched successfully"),
        );
    },
  );
}
