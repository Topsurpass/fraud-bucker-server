import nodemailer from "nodemailer";

export async function sendResetEmail(email, resetUrl) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset Request",
        html: `
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <a href="${resetUrl}">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
            `,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Error sending reset email:", error);
    }
}
