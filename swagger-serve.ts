import express from "express";
import { openapiRouter } from "@/shared/routes/openapi.js";
import { getLocalIPv4Addresses } from "./scripts/network-info.js";

const app = express();
app.use("/api/docs", openapiRouter);

const PORT = 3100;
app.listen(PORT, "0.0.0.0", () => {
  const localIPs = getLocalIPv4Addresses();
  console.log(`📋 Swagger docs: http://localhost:${PORT}/api/docs`);
  for (const ip of localIPs) {
    console.log(`🌐 Red local:    http://${ip}:${PORT}/api/docs`);
  }
});
