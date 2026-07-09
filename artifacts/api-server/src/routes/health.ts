import { Router } from "express";
import type { Request as ExpressRequest, Response as ExpressResponse } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router = Router();

function sendHealth(_req: ExpressRequest, res: ExpressResponse) {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
}

router.get("/health", sendHealth);
router.get("/healthz", sendHealth);

export default router;
