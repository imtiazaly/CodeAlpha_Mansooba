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

  // GET /organizations/invitations
  static getPendingInvitations = asyncHandler(
    async (req: Request, res: Response) => {
      const invitations = await OrganizationService.getPendingInvitations(
        req.user!.id,
      );
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            invitations,
            "Pending invitations retrieved successfully",
          ),
        );
    },
  );

  // POST /organizations/invitations/:id/respond
  static respondToInvitation = asyncHandler(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const { action } = req.body;

      if (!action || (action !== "ACCEPT" && action !== "DECLINE")) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              null,
              "Action must be either ACCEPT or DECLINE",
            ),
          );
      }

      const result = await OrganizationService.respondToInvitation(
        req.user!.id,
        id,
        action,
      );

      res.status(200).json(new ApiResponse(200, result, result.message));
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