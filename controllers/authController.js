import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
    sendWelcomeEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
} from "../utils/sendEmail.js";
import crypto from "crypto";

const createUsername = (name) => {
    return name.replace(/\s+/g, "");
};

const createHandle = (username) => {
    return `@gth${username}`;
};

// REGISTER USER
export const registerUser = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role,
            bio,
            location,
            profileImage,
        } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists",
            });
        }
        
        const nameExists = await User.findOne({
            name: {
                $regex: `^${name}$`,
                $options: "i",
            },
        });
        
        if (nameExists) {
            const cleanName = name.replace(/\s+/g, "");
        
            return res.status(400).json({
                message: "Name already taken",
                suggestions: [
                    `${cleanName}${Math.floor(Math.random() * 100)}`,
                    `${cleanName}Dev`,
                    `${cleanName}GH`,
                ],
            });
        }

        const username = createUsername(name);
        const handle = createHandle(username);

        const usernameExists = await User.findOne({ username });

        if (usernameExists) {
            return res.status(400).json({
                message: "Username already exists",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const emailVerificationToken = crypto
        .randomBytes(32)
        .toString("hex");

        const user = await User.create({
            name,
            username,
            handle,
            email,
            password: hashedPassword,
            role,
            bio,
            location,
            profileImage,
            emailVerificationToken,
        });
        
        await sendWelcomeEmail(
            user.email,
            user.name,
            user.handle
        );
        
        await sendVerificationEmail(
            user.email,
            user.name,
            user.emailVerificationToken
        );

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                handle: user.handle,
                email: user.email,
                role: user.role,
                bio: user.bio,
                location: user.location,
                profileImage: user.profileImage,
            },
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// LOGIN USER
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid email or password",
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
            },
            "ghanatechhubsecret",
            {
                expiresIn: "7d",
            }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                handle: user.handle,
                email: user.email,
                role: user.role,
                bio: user.bio,
                location: user.location,
                profileImage: user.profileImage,
            },
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const verifyEmail = async (req, res) => {
    try {
        const user = await User.findOne({
            emailVerificationToken: req.params.token,
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired verification link",
            });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = "";

        await user.save();

        res.json({
            message: "Email verified successfully",
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.json({
                message: "If that email exists, a reset link has been sent",
            });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 1000 * 60 * 30;

        await user.save();

        await sendPasswordResetEmail(
            user.email,
            user.name,
            resetToken
        );

        res.json({
            message: "If that email exists, a reset link has been sent",
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { password } = req.body;

        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired reset link",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user.password = hashedPassword;
        user.resetPasswordToken = "";
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({
            message: "Password reset successfully",
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};