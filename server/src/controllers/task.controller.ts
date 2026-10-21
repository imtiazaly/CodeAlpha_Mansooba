import { Request, Response } from "express";
import { TaskService } from "../services/task.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export class TaskController {
  static createTask = asyncHandler(async (req: Request, res: Response) => {
    const task = await TaskService.createTask(req.body, req.user!);
    res
      .status(201)
      .json(new ApiResponse(201, task, "Task created successfully"));
  });

  static getTasks = asyncHandler(async (req: Request, res: Response) => {
    const { tasks, meta } = await TaskService.getTasks(
      req.query as any,
      req.user!,
    );
    res
      .status(200)
      .json(new ApiResponse(200, tasks, "Tasks retrieved successfully", meta));
  });

  static getTaskById = asyncHandler(async (req: Request, res: Response) => {
    const task = await TaskService.getTaskById(
      req.params.id as string,
      req.user!,
    );
    res
      .status(200)
      .json(new ApiResponse(200, task, "Task retrieved successfully"));
  });

  static updateTask = asyncHandler(async (req: Request, res: Response) => {
    const updatedTask = await TaskService.updateTask(
      req.params.id as string,
      req.body,
      req.user!,
    );
    res
      .status(200)
      .json(new ApiResponse(200, updatedTask, "Task updated successfully"));
  });

  static deleteTask = asyncHandler(async (req: Request, res: Response) => {
    const result = await TaskService.deleteTask(
      req.params.id as string,
      req.user!,
    );
    res
      .status(200)
      .json(new ApiResponse(200, result, "Task deleted successfully"));
  });
}
