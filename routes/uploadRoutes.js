import express from "express";
import multer from "multer";
import path from "path";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, "uploads/");
    },

    filename(req, file, cb) {
        const uniqueName = `${Date.now()}-${Math.round(
            Math.random() * 1e9
        )}${path.extname(file.originalname)}`;

        cb(null, uniqueName);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpg|jpeg|png|webp|pdf|doc|docx|ppt|pptx|zip/;
    const extname = allowedTypes.test(
        path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error("Only images, PDFs, Word, PowerPoint, and ZIP files are allowed"));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024,
    },
});

router.post(
    "/profile-image",
    protect,
    upload.single("image"),
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                message: "No image uploaded",
            });
        }

        res.json({
            imageUrl: `http://localhost:5000/uploads/${req.file.filename}`,
        });
    }
);

router.post(
    "/message-image",
    protect,
    upload.single("image"),
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                message: "No image uploaded",
            });
        }

        res.json({
            imageUrl: `http://localhost:5000/uploads/${req.file.filename}`,
        });
    }
);

router.post(
    "/message-file",
    protect,
    upload.single("file"),
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                message: "No file uploaded",
            });
        }

        res.json({
            fileUrl: `http://localhost:5000/uploads/${req.file.filename}`,
            fileName: req.file.originalname,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
        });
    }
);

export default router;