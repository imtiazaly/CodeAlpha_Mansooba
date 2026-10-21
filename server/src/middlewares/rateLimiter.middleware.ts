import rateLimit from "express-rate-limit";
import { ApiError } from "../utils/ApiError.js";

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per IP per windowMs
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
