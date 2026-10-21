import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";

export const validate =
  (schema: ZodType) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Express 5 compatible assignment (mutates properties safely)
      if ((parsed as any).body !== undefined) {
        req.body = (parsed as any).body;
      }
      if (
        (parsed as any).query !== undefined &&
        typeof req.query === "object"
      ) {
        Object.assign(req.query, (parsed as any).query);
      }
      if (
        (parsed as any).params !== undefined &&
        typeof req.params === "object"
      ) {
        Object.assign(req.params, (parsed as any).params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        next(new ApiError(400, "Validation Failed", errorMessages));
      } else {
        next(error);
      }
    }
  };