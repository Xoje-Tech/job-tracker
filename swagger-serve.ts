import express from "express";
import { openapiRouter } from "@/shared/routes/openapi.js";

const app = express();
app.use("/api/docs", openapiRouter);

const PORT = 3100;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`📋 Swagger docs: http://0.0.0.0:${PORT}/api/docs`);
  console.log(`🌐 Red local:    http://192.168.18.4:${PORT}/api/docs`);
});
