import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const imageStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "ghanatechhub/images",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
    },
});

const fileStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "ghanatechhub/files",
        resource_type: "auto",
        allowed_formats: ["pdf", "doc", "docx", "ppt", "pptx", "zip"],
    },
});

const imageUpload = multer({
    storage: imageStorage,
    limits: {
        fileSize: 2 * 1024 * 1024,
    },
});

const fileUpload = multer({
    storage: fileStorage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

router.post(
    "/profile-image",
    protect,
    imageUpload.single("image"),
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                message: "No image uploaded",
            });
        }

        res.json({
            imageUrl: req.file.path || req.file.secure_url,
        });
    }
);

router.post(
    "/message-image",
    protect,
    imageUpload.single("image"),
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                message: "No image uploaded",
            });
        }

        res.json({
            imageUrl: req.file.path || req.file.secure_url,
        });
    }
);

router.post(
    "/message-file",
    protect,
    fileUpload.single("file"),
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                message: "No file uploaded",
            });
        }

        res.json({
            fileUrl: req.file.path || req.file.secure_url,
            fileName: req.file.originalname,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
        });
    }
);

router.use((error, req, res, next) => {
    console.error("Upload error:", error);

    res.status(500).json({
        message: error.message || "Upload failed",
    });
});

export default router;