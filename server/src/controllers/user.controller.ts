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
            "Organization members retrieved successfully",
          ),
        );
    },
  );

  static inviteUser = asyncHandler(async (req: Request, res: Response) => {
    const newUser = await UserService.inviteUser(req.body, req.user!);
    res
      .status(201)
      .json(new ApiResponse(201, newUser, "User invited successfully"));
  });

  static searchUsers = asyncHandler(async (req: Request, res: Response) => {
    const query = (req.query.q as string) || "";
    const limit = (req.query.limit as unknown as number) || 10;
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