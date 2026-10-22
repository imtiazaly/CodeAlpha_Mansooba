import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket: Socket | null = null;

// Initialize or get existing socket connection
export const getSocket = (): Socket | null => socket;

export const connectSocket = (token: string): Socket => {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    transports: ["websocket"],
    autoConnect: true,
  });

  socket.on("connect", () => {
    console.log("⚡ Real-time Socket connected:", socket?.id);
  });

  socket.on("connect_error", (error) => {
    console.error("❌ Socket connection error:", error.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("🔌 Socket disconnected:", reason);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Project Rooms Helper
export const joinProjectRoom = (projectId: string) => {
  if (socket && socket.connected) {
    socket.emit("join:project", projectId);
  }
};

export const leaveProjectRoom = (projectId: string) => {
  if (socket && socket.connected) {
    socket.emit("leave:project", projectId);
  }
};
