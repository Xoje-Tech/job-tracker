import { app } from "@/server.js";
import { env } from "@/shared/config/env.js";
import { prisma } from "@/shared/lib/prisma.js";
import { getLocalIPv4Addresses } from "./scripts/network-info.js";

async function bootstrap(): Promise<void> {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");

    app.listen(env.PORT, "0.0.0.0", () => {
      const localIPs = getLocalIPv4Addresses();
      console.log(`🚀 Job Tracker API running on http://localhost:${env.PORT}`);
      for (const ip of localIPs) {
        console.log(`🌐 Red local:    http://${ip}:${env.PORT}`);
      }
      console.log(`📋 Swagger docs: http://localhost:${env.PORT}/api/docs`);
      console.log(`❤️  Health check: http://localhost:${env.PORT}/api/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

bootstrap();
