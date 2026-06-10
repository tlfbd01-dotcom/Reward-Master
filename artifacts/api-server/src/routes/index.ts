import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import userRouter from "./user";
import offersRouter from "./offers";
import postbackRouter from "./postback";
import withdrawalsRouter from "./withdrawals";
import apiKeysRouter from "./apikeys";
import networksRouter from "./networks";
import leaderboardRouter from "./leaderboard";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(userRouter);
router.use(offersRouter);
router.use(postbackRouter);
router.use(withdrawalsRouter);
router.use(apiKeysRouter);
router.use(networksRouter);
router.use(leaderboardRouter);
router.use(adminRouter);

export default router;
