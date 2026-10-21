import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { apiRateLimiter } from "./middlewares/rateLimiter.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { apiRouter } from "./routes/index.js";
import { ApiError } from "./utils/ApiError.js";

const app: Application = express();

app.set("trust proxy", 1);

// Security Middlewares
app.use(helmet());
app.use(cors({ origin: "*", credentials: true }));
app.use(apiRateLimiter);

// Body Parsers
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Root Route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to Secure RESTful API Engine",
    version: "v1",
    healthCheck: "/api/v1/health",
  });
});

// Mount Versioned API Routes
app.use("/api/v1", apiRouter);

// 404 Not Found Catch-all Handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found on this server`));
});

// Centralized Global Error Handler
app.use(errorHandler);

export default app;
