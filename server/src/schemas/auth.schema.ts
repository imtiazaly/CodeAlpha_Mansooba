import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address format"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(100, "Password is too long"),
    name: z.string().min(2, "Name must be at least 2 characters long"),
    organizationName: z
      .string()
      .min(2, "Workspace name must be at least 2 characters")
      .max(60, "Workspace name is too long"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address format"),
    password: z.string().min(1, "Password is required"),
  }),
});