import nodemailer from "nodemailer";
import config from "../@config/index.js";

export async function sendResetEmail(email, resetUrl) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: config.email.user,
            pass: config.email.pass,
        },
    });

    const mailOptions = {
        from: config.email.user,
        to: email,
        subject: "Password Reset Request",
        html: `
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <a href="${resetUrl}">Reset Password</a>
                <p>This link will expire in 15 minutes.</p>
            `,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Error sending reset email:", error);
    }
}
