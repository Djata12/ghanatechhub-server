import express from "express";

import {
    applyForJob,
    getMyApplications,
    getApplicantsForMyJobs,
    updateApplicationStatus,
    updateRecruiterNotes,
} from "../controllers/applicationController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:jobId", protect, applyForJob);

router.get("/me/all", protect, getMyApplications);

router.get("/recruiter/all", protect, getApplicantsForMyJobs);

router.put("/:id/status", protect, updateApplicationStatus);

router.put("/:id/notes", protect, updateRecruiterNotes);

export default router;