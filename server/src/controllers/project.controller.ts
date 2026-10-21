import { Request, Response } from "express";
import { ProjectService } from "../services/project.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export class ProjectController {
  static createProject = asyncHandler(async (req: Request, res: Response) => {
    const project = await ProjectService.createProject(req.body, req.user!);
    res
      .status(201)
      .json(new ApiResponse(201, project, "Project created successfully"));
  });

  static getProjects = asyncHandler(async (req: Request, res: Response) => {
    const projects = await ProjectService.getProjects(req.user!);
    res
      .status(200)
      .json(new ApiResponse(200, projects, "Projects retrieved successfully"));
  });

  static getProjectById = asyncHandler(async (req: Request, res: Response) => {
    const project = await ProjectService.getProjectById(
      req.params.id as string,
      req.user!,
    );
    res
      .status(200)
      .json(new ApiResponse(200, project, "Project retrieved successfully"));
  });

  static updateProject = asyncHandler(async (req: Request, res: Response) => {
    const project = await ProjectService.updateProject(
      req.params.id as string,
      req.body,
      req.user!,
    );
    res
      .status(200)
      .json(new ApiResponse(200, project, "Project updated successfully"));
  });

  static deleteProject = asyncHandler(async (req: Request, res: Response) => {
    const result = await ProjectService.deleteProject(
      req.params.id as string,
      req.user!,
    );
    res
      .status(200)
      .json(new ApiResponse(200, result, "Project deleted successfully"));
  });

  static addMember = asyncHandler(async (req: Request, res: Response) => {
    const member = await ProjectService.addMember(
      req.params.id as string,
      req.body.userId,
      req.body.role,
      req.user!,
    );
    res
      .status(201)
      .json(new ApiResponse(201, member, "Member added successfully"));
  });

  static removeMember = asyncHandler(async (req: Request, res: Response) => {
    const result = await ProjectService.removeMember(
      req.params.id as string,
      req.params.userId as string,
      req.user!,
    );
    res
      .status(200)
      .json(new ApiResponse(200, result, "Member removed successfully"));
  });
}
