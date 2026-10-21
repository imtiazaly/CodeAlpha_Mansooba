import { z } from "zod";

const projectRoleEnum = z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]);

export const createProjectSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, "Project name must be at least 3 characters")
      .max(100),
    description: z.string().max(1000).optional(),
  }),
});

export const updateProjectSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid project ID format"),
  }),
  body: z
    .object({
      name: z.string().min(3).max(100).optional(),
      description: z.string().max(1000).optional().nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided for update",
    }),
});

export const projectIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid project ID format"),
  }),
});

export const addMemberSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid project ID format"),
  }),
  body: z.object({
    userId: z.string().uuid("Invalid user ID format"),
    role: projectRoleEnum.optional().default("MEMBER"),
  }),
});

export const removeMemberSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid project ID format"),
    userId: z.string().uuid("Invalid user ID format"),
  }),
});
