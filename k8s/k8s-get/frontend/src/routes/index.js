import express from "express";
import deploymentsRouter from "./deployments.js";

const router = express.Router();

router.use("/:pluginId/deployments", deploymentsRouter);

export default router;
