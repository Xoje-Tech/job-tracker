import { app } from "@/server.js";
import { env } from "@/shared/config/env.js";
import { prisma } from "@/shared/lib/prisma.js";

async function bootstrap(): Promise<void> {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");

    app.listen(env.PORT, "0.0.0.0", () => {
      console.log(`🚀 Job Tracker API running on http://0.0.0.0:${env.PORT}`);
      console.log(`🌐 Red local:    http://192.168.18.4:${env.PORT}`);
      console.log(`📋 Swagger docs: http://192.168.18.4:${env.PORT}/api/docs`);
      console.log(`❤️  Health check: http://192.168.18.4:${env.PORT}/api/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

bootstrap();
