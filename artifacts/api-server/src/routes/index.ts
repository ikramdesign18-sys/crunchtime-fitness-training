import { Router, type IRouter } from "express";
import agoraRouter from "./agora";
import bookingsRouter from "./bookings";
import healthRouter from "./health";
import stripeRouter from "./stripe";

const router: IRouter = Router();

router.use(agoraRouter);
router.use(bookingsRouter);
router.use(stripeRouter);
router.use(healthRouter);

export default router;
