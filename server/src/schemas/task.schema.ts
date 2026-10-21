import { z } from "zod";

const taskStatusEnum = z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]);
const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(200),
    description: z.string().max(1000).optional(),
    status: taskStatusEnum.optional().default("TODO"),
    priority: priorityEnum.optional().default("MEDIUM"),
    dueDate: z
      .string()
      .datetime({ message: "Invalid ISO datetime string" })
      .optional(),
    projectId: z.string().uuid("Valid projectId is required"),
    assigneeId: z.string().uuid("Invalid assignee ID").optional().nullable(),
  }),
});

export const updateTaskSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid task ID format"),
  }),
  body: z
    .object({
      title: z.string().min(3).max(200).optional(),
      description: z.string().max(1000).optional().nullable(),
      status: taskStatusEnum.optional(),
      priority: priorityEnum.optional(),
      dueDate: z.string().datetime().optional().nullable(),
      assigneeId: z.string().uuid("Invalid assignee ID").optional().nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update",
    }),
});

export const taskIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid task ID format"),
  }),
});

export const queryTasksSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .default("1")
      .transform((val) => Math.max(1, parseInt(val, 10) || 1)),
    limit: z
      .string()
      .optional()
      .default("10")
      .transform((val) => Math.min(100, Math.max(1, parseInt(val, 10) || 10))),
    projectId: z.string().uuid("Invalid projectId").optional(),
    status: taskStatusEnum.optional(),
    priority: priorityEnum.optional(),
    search: z.string().optional(),
    sortBy: z
      .enum(["createdAt", "dueDate", "title", "priority"])
      .optional()
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});