import { z } from "zod";

export const notificationIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid notification ID format"),
  }),
});

export const queryNotificationsSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .default("1")
      .transform((val) => Math.max(1, parseInt(val, 10) || 1)),
    limit: z
      .string()
      .optional()
      .default("20")
      .transform((val) => Math.min(50, Math.max(1, parseInt(val, 10) || 20))),
    isRead: z
      .enum(["true", "false"])
      .optional()
      .transform((val) => (val === undefined ? undefined : val === "true")),
  }),
});
