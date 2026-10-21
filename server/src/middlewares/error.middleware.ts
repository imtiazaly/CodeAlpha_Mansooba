import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  let error = err;

  // 1. Prisma Known Request Errors ko sahi HTTP status mein map karein
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": {
        const target = (err.meta?.target as string[])?.join(", ") || "field";
        error = new ApiError(
          409,
          `Unique constraint violation: Duplicate value for ${target}`,
        );
        break;
      }
      case "P2003": {
        error = new ApiError(
          400,
          "Foreign key constraint failed: Related record does not exist",
        );
        break;
      }
      case "P2025": {
        error = new ApiError(404, "Record not found or already deleted");
        break;
      }
      default: {
        error = new ApiError(400, `Database error: ${err.message}`);
        break;
      }
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    error = new ApiError(400, "Database validation error: Invalid input data");
  }

  // 2. Agar generic error hai to ApiError mein convert karein
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const isProduction = env.NODE_ENV === "production";

    // Production mein 500 par internal message leak na ho
    const message =
      statusCode === 500 && isProduction
        ? "Internal Server Error"
        : error.message || "Internal Server Error";

    error = new ApiError(statusCode, message, [], err.stack);
  }

  // 3. Server console par 500 errors ko log karein
  if (error.statusCode >= 500) {
    console.error("💥 Internal Server Error:", err);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors,
    ...(env.NODE_ENV === "development" && { stack: error.stack }),
  };

  res.status(error.statusCode).json(response);
};
