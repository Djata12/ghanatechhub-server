import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

const uploadToCloudinary = (fileBuffer, folder, resourceType = "image") => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: resourceType,
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );

        stream.end(fileBuffer);
    });
};

router.post(
    "/profile-image",
    protect,
    upload.single("image"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    message: "No image uploaded",
                });
            }

            const result = await uploadToCloudinary(
                req.file.buffer,
                "ghanatechhub/images",
                "image"
            );

            res.json({
                imageUrl: result.secure_url,
            });
        } catch (error) {
            console.error("Profile image upload error:", error);

            res.status(500).json({
                message: error.message || "Image upload failed",
            });
        }
    }
);

router.post(
    "/message-image",
    protect,
    upload.single("image"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    message: "No image uploaded",
                });
            }

            const result = await uploadToCloudinary(
                req.file.buffer,
                "ghanatechhub/images",
                "image"
            );

            res.json({
                imageUrl: result.secure_url,
            });
        } catch (error) {
            console.error("Message image upload error:", error);

            res.status(500).json({
                message: error.message || "Image upload failed",
            });
        }
    }
);

router.post(
    "/message-file",
    protect,
    upload.single("file"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    message: "No file uploaded",
                });
            }

            const result = await uploadToCloudinary(
                req.file.buffer,
                "ghanatechhub/files",
                "auto"
            );

            res.json({
                fileUrl: result.secure_url,
                fileName: req.file.originalname,
                fileType: req.file.mimetype,
                fileSize: req.file.size,
            });
        } catch (error) {
            console.error("Message file upload error:", error);

            res.status(500).json({
                message: error.message || "File upload failed",
            });
        }
    }
);

export default router;