import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "./env.js";
import { assertProjectAccess } from "../utils/projectAccess.js";

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
}

let io: Server | null = null;

export const initSocket = (httpServer: HttpServer): Server => {
  const allowedOrigins = [
    env.CLIENT_URL,
    "http://localhost:5173",
    "http://localhost:3000",
  ];

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  // 1. Socket Authentication Middleware (JWT Verification)
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication error: Token missing"));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        id: string;
        email: string;
        role: Role;
      };

      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid or expired token"));
    }
  });

  // 2. Connection Handling
  io.on("connection", (socket: AuthenticatedSocket) => {
    const user = socket.user!;
    console.log(`🔌 WebSocket connected: User ${user.email} (${socket.id})`);

    // Har user apne personal room mein automatically join hota hai (for direct notifications)
    socket.join(`user:${user.id}`);

    // Project room join karna (Frontend jab kisi board par navigate kare)
    socket.on("join:project", async (projectId: string) => {
      try {
        // Verify user is a member of this project
        await assertProjectAccess(projectId, user);
        socket.join(`project:${projectId}`);
        console.log(
          `User ${user.email} joined project room: project:${projectId}`,
        );
      } catch (err: any) {
        socket.emit("error", {
          message: err.message || "Failed to join project room",
        });
      }
    });

    // Project room leave karna
    socket.on("leave:project", (projectId: string) => {
      socket.leave(`project:${projectId}`);
      console.log(`User ${user.email} left project room: project:${projectId}`);
    });

    socket.on("disconnect", () => {
      console.log(
        `🔌 WebSocket disconnected: User ${user.email} (${socket.id})`,
      );
    });
  });

  return io;
};

// Helper to get active IO instance
export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.io not initialized! Call initSocket first.");
  }
  return io;
};

// Helpers for emitting real-time events from services
export const emitToProject = (projectId: string, event: string, data: any) => {
  if (io) {
    io.to(`project:${projectId}`).emit(event, data);
  }
};

export const emitToUser = (userId: string, event: string, data: any) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};
