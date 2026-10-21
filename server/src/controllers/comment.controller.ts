import { Request, Response } from "express";
import { CommentService } from "../services/comment.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export class CommentController {
  static createComment = asyncHandler(async (req: Request, res: Response) => {
    const comment = await CommentService.createComment(
      req.params.taskId as string,
      req.body.content,
      req.user!,
    );
    res
      .status(201)
      .json(new ApiResponse(201, comment, "Comment added successfully"));
  });

  static getComments = asyncHandler(async (req: Request, res: Response) => {
    const comments = await CommentService.getCommentsByTaskId(
      req.params.taskId as string,
      req.user!,
    );
    res
      .status(200)
      .json(new ApiResponse(200, comments, "Comments retrieved successfully"));
  });

  static deleteComment = asyncHandler(async (req: Request, res: Response) => {
    const result = await CommentService.deleteComment(
      req.params.taskId as string,
      req.params.id as string,
      req.user!,
    );
    res
      .status(200)
      .json(new ApiResponse(200, result, "Comment deleted successfully"));
  });
}
