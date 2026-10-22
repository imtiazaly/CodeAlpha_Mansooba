import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket: Socket | null = null;
let activeToken: string | null = null;

export const getSocket = (): Socket | null => socket;

export const connectSocket = (token: string): Socket => {
  // Agar same token ke sath already connected hai to naya mat banao
  if (socket && socket.connected && activeToken === token) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  activeToken = token;
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
    activeToken = null;
  }
};

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