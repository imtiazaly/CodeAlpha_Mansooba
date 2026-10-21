import { Request, Response } from "express";
import { AuthService } from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export class AuthController {
  static register = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body);
    res
      .status(201)
      .json(new ApiResponse(201, result, "User registered successfully"));
  });

  static login = asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body);
    res.status(200).json(new ApiResponse(200, result, "Login successful"));
  });

  static getProfile = asyncHandler(async (req: Request, res: Response) => {
    res
      .status(200)
      .json(new ApiResponse(200, req.user, "Profile retrieved successfully"));
  });
}
