import express from "express";

import {
    registerUser,
    loginUser,
    verifyEmail,
    forgotPassword,
    resetPassword,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/verify-email/:token", verifyEmail);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password/:token", resetPassword);

router.get("/profile", protect, (req, res) => {
    res.json(req.user);
});

export default router;