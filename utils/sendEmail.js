import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendWelcomeEmail = async (email, name, handle) => {
    try {
        const response = await resend.emails.send({
            from: "GhanaTechHub <onboarding@resend.dev>",
            to: email,
            subject: "Welcome to GhanaTechHub ",
            html: `
                <h1>Welcome to GhanaTechHub </h1>
                <p>Hello ${name},</p>
                <p>Your account has been created successfully.</p>
                <p>Handle: <strong>${handle}</strong></p>
                <p>Complete your profile, add projects, showcase your skills and connect with developers.</p>
                <hr />
                <p>GhanaTechHub Team</p>
            `,
        });

        if (response.error) {
            console.log("Email failed:", response.error);
            return;
        }
        
        console.log("Email sent:", response.data);
    } catch (error) {
        console.log("Email error:", error);
    }
};

export const sendVerificationEmail = async (email, name, token) => {
    const verificationLink = `http://localhost:5173/verify-email/${token}`;

    try {
        const response = await resend.emails.send({
            from: "GhanaTechHub <onboarding@resend.dev>",
            to: email,
            subject: "Verify your GhanaTechHub email",
            html: `
                <h1>Verify your email</h1>
                <p>Hello ${name},</p>
                <p>Click the link below to verify your GhanaTechHub account:</p>
                <a href="${verificationLink}">Verify Email</a>
                <p>If you did not create this account, ignore this email.</p>
            `,
        });

        if (response.error) {
            console.log("Verification email failed:", response.error);
            return;
        }

        console.log("Verification email sent:", response.data);
    } catch (error) {
        console.log("Verification email error:", error);
    }
};

export const sendPasswordResetEmail = async (email, name, token) => {
    const resetLink = `http://localhost:5173/reset-password/${token}`;

    try {
        const response = await resend.emails.send({
            from: "GhanaTechHub <onboarding@resend.dev>",
            to: email,
            subject: "Reset your GhanaTechHub password",
            html: `
                <h1>Reset your password</h1>
                <p>Hello ${name},</p>
                <p>Click the link below to reset your GhanaTechHub password:</p>
                <a href="${resetLink}">Reset Password</a>
                <p>This link expires in 30 minutes.</p>
                <p>If you did not request this, ignore this email.</p>
            `,
        });

        if (response.error) {
            console.log("Password reset email failed:", response.error);
            return;
        }

        console.log("Password reset email sent:", response.data);
    } catch (error) {
        console.log("Password reset email error:", error);
    }
};



