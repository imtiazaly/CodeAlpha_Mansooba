import { z } from "zod";

export const searchUsersSchema = z.object({
  query: z.object({
    q: z
      .string()
      .min(1, "Search query must be at least 1 character long")
      .max(100),
    limit: z
      .string()
      .optional()
      .default("10")
      .transform((val) => Math.min(50, Math.max(1, parseInt(val, 10) || 10))),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid user ID format"),
  }),
});
