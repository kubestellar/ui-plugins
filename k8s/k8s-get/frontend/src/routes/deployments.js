import express from "express";
import { listAllDeployments } from "./k8s.js";

const router = express.Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const deployments = await listAllDeployments();
    res.json({ items: deployments });
  } catch (err) {
    console.error("Error fetching deployments:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
