import bcrypt from "bcrypt";
import prisma from "../../utils/db.js";
import jwt from "jsonwebtoken";
import { validateFields } from "../../utils/helpers.js";

function generateAccessToken(user) {
    return jwt.sign(
        {
            id: user.id,
            firstname: user.firstname,
            lastname: user.lastname,
            role: user.role,
            email: user.email,
            phone: user.phone,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1h" }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        {
            id: user.id,
            firstname: user.firstname,
            lastname: user.lastname,
            role: user.role,
            email: user.email,
            phone: user.phone,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "1d" }
    );
}
export default class AuthController {
    static async signIn(req, res) {
        /**
         * Sign in user
         * @param {Request} req
         * @param {Response} res
         * @returns JSON
         */
        const email = req.body ? req.body.email : null;
        const password = req.body ? req.body.password : null;

        if (!email) {
            res.status(400).json({ error: "Missing email" });
            return;
        }
        if (!password) {
            res.status(400).json({ error: "Missing password" });
            return;
        }
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            res.status(400).json({ error: "Email does not exist !" });
            return;
        }
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            res.status(400).json({ error: "Incorrect password !" });
            return;
        }
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        await prisma.user.update({
            where: { id: user.id, email: user.email },
            data: { refreshToken },
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Use secure cookies in production
            sameSite: "strict",
        });

        res.status(200).json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                firstname: user.firstname,
                lastname: user.lastname,
                role: user.role,
                email: user.email,
                phone: user.phone,
            },
        });
    }

    static async getNewToken(req, res) {
        const { refreshToken } = req.body;

        const requiredFields = ["refreshToken"];
        if (!validateFields(req, res, requiredFields)) {
            return;
        }

        try {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
            });

            if (!user || user.refreshToken !== refreshToken) {
                return res.status(403).json({ error: "Invalid refresh token" });
            }

            const accessToken = generateAccessToken(user);
            const newRefreshToken = generateRefreshToken(user);

            await prisma.user.update({
                where: { id: user.id },
                data: { refreshToken: newRefreshToken },
            });

            return res.status(200).json({ accessToken });
        } catch (error) {
            return res.status(403).json({ error: "Invalid or expired refresh token" });
        }
    }
}
