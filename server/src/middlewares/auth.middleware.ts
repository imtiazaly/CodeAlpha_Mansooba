import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";
import { prisma } from "../config/db.js";

interface JwtPayload {
  id: string;
  email: string;
  role: Role;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Authentication token is missing or malformed");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new ApiError(401, "Authentication token is required");
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        throw new ApiError(401, "Authentication token has expired");
      }
      throw new ApiError(401, "Invalid authentication token");
    }

    // Check karein ke user DB me maujood aur active hai
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new ApiError(401, "User account not found or deactivated");
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, "User not authenticated"));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          "Forbidden: You do not have permission to access this resource",
        ),
      );
    }

    next();
  };
};
