import express from "express";

import {
    createJob,
    getJobs,
    deleteJob,
    toggleSaveJob,
    getSavedJobs,
} from "../controllers/jobController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getJobs);

router.get("/saved", protect, getSavedJobs);

router.post("/", protect, createJob);

router.put("/:id/save", protect, toggleSaveJob);

router.delete("/:id", protect, deleteJob);

export default router;