import { Request, Response } from "express";
import { UserService } from "../services/user.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export class UserController {
  static getOrganizationMembers = asyncHandler(
    async (req: Request, res: Response) => {
      const members = await UserService.getOrganizationMembers(req.user!);
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            members,
            "Organization members retrieved successfully"
          )
        );
    }
  );

  // PATCH /users/members/:userId/role — Update member role (Admin only)
  static updateMemberRole = asyncHandler(
    async (req: Request, res: Response) => {
      const { userId } = req.params;
      const { role } = req.body;

      if (!role || (role !== "ADMIN" && role !== "USER")) {
        return res
          .status(400)
          .json(new ApiResponse(400, null, "Role must be ADMIN or USER"));
      }

      const result = await UserService.updateMemberRole(
        userId,
        role,
        req.user!
      );
      res.status(200).json(new ApiResponse(200, result, result.message));
    }
  );

  // DELETE /users/members/:userId — Remove member from organization (Admin only)
  static removeOrganizationMember = asyncHandler(
    async (req: Request, res: Response) => {
      const { userId } = req.params;
      const result = await UserService.removeOrganizationMember(
        userId,
        req.user!
      );
      res.status(200).json(new ApiResponse(200, result, result.message));
    }
  );

  // PATCH /users/profile — Update name
  static updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const updatedUser = await UserService.updateProfile(req.user!.id, req.body);
    res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
  });

  // PATCH /users/change-password — Change password
  static changePassword = asyncHandler(async (req: Request, res: Response) => {
    const result = await UserService.changePassword(req.user!.id, req.body);
    res
      .status(200)
      .json(new ApiResponse(200, result, "Password changed successfully"));
  });

  // PATCH /users/organization — Admin: Rename org
  static updateOrganization = asyncHandler(
    async (req: Request, res: Response) => {
      const org = await UserService.updateOrganization(
        req.user!.id,
        req.user!.role,
        req.body,
      );
      res
        .status(200)
        .json(new ApiResponse(200, org, "Organization updated successfully"));
    }
  );

  static inviteUser = asyncHandler(async (req: Request, res: Response) => {
    const newUser = await UserService.inviteUser(req.body, req.user!);
    res
      .status(201)
      .json(new ApiResponse(201, newUser, "User invited successfully"));
  });

  static searchUsers = asyncHandler(async (req: Request, res: Response) => {
    const query = (req.query.q as string) || "";
    const limit = Math.max(1, parseInt(String(req.query.limit || 10), 10));
    const users = await UserService.searchUsers(query, req.user!.id, limit);
    res
      .status(200)
      .json(new ApiResponse(200, users, "Users retrieved successfully"));
  });

  static getUserById = asyncHandler(async (req: Request, res: Response) => {
    const user = await UserService.getUserById(req.params.id as string);
    res
      .status(200)
      .json(new ApiResponse(200, user, "User details retrieved successfully"));
  });
}