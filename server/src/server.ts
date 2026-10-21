import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/db.js";

const server = app.listen(env.PORT, () => {
  console.log(
    `🚀 Server successfully started on port ${env.PORT} in ${env.NODE_ENV} mode`,
  );
  console.log(`🔗 Health Check: http://localhost:${env.PORT}/api/v1/health`);
});

// Graceful Shutdown Handler
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log("🔌 HTTP Server closed.");
    try {
      await prisma.$disconnect();
      console.log("🗄️ Database connection closed safely.");
      process.exit(0);
    } catch (err) {
      console.error("Error during database disconnection:", err);
      process.exit(1);
    }
  });

  // Force shutdown agar 10s me close na ho
  setTimeout(() => {
    console.error("⚠️ Forcefully shutting down due to timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
