import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address format"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters long")
      .max(100, "Password is too long"),
    name: z.string().min(2, "Name must be at least 2 characters long"),
    role: z.enum(["USER", "ADMIN"]).optional().default("USER"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address format"),
    password: z.string().min(1, "Password is required"),
  }),
});
