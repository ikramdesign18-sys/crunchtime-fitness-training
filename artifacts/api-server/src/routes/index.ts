import { Router, type IRouter } from "express";
import agoraRouter from "./agora";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(agoraRouter);
router.use(healthRouter);

export default router;
