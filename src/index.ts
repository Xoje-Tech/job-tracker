import { app } from "./server.js";
import { env } from "./shared/config/env.js";
import { prisma } from "./shared/lib/prisma.js";

async function bootstrap(): Promise<void> {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log("✅ Database connected");

    app.listen(env.PORT, () => {
      console.log(`🚀 Job Tracker API running on http://localhost:${env.PORT}`);
      console.log(`📋 Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

bootstrap();
