import rateLimit from "express-rate-limit";
import { ApiError } from "../utils/ApiError.js";

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      new ApiError(
        429,
        "Too many requests from this IP, please try again after 15 minutes",
      ),
    );
  },
});

// Dedicated strict limiter for authentication endpoints (Brute-force protection)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      new ApiError(
        429,
        "Too many authentication attempts from this IP, please try again after 15 minutes",
      ),
    );
  },
});