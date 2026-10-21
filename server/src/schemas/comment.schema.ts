import { z } from "zod";

export const createCommentSchema = z.object({
  params: z.object({
    taskId: z.string().uuid("Invalid task ID format"),
  }),
  body: z.object({
    content: z.string().min(1, "Comment content cannot be empty").max(2000),
  }),
});

export const getCommentsSchema = z.object({
  params: z.object({
    taskId: z.string().uuid("Invalid task ID format"),
  }),
});

export const deleteCommentSchema = z.object({
  params: z.object({
    taskId: z.string().uuid("Invalid task ID format"),
    id: z.string().uuid("Invalid comment ID format"),
  }),
});
