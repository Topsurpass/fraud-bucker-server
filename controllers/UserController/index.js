import bcrypt from "bcrypt";
import prisma from "../../utils/db.js";
import jwt from "jsonwebtoken";
import { validateFields } from "../../utils/helpers.js";

function generateAccessToken(user) {
	return jwt.sign(
		{ userId: user.id, name: user.name, jobTitle: user.job, email: user.email },
		process.env.ACCESS_TOKEN_SECRET,
		{ expiresIn: "15m" },
	);
}

function generateRefreshToken(user) {
	return jwt.sign(
		{ userId: user.id, name: user.name, jobTitle: user.job, email: user.email },
		process.env.REFRESH_TOKEN_SECRET,
		{ expiresIn: "1d" },
	);
}
export default class UserController {
	/**
	 * Register new user
	 * @param {Request} req
	 * @param {Response} res
	 * @returns JSON
	 */

	static async signUp(req, res) {
		const { name, job, email, password } = req.body;
		const requiredFields = ['name', 'job', 'email', 'password'];

		if (!validateFields(req, res, requiredFields)) {
			return;
		}
		const user = await prisma.user.findUnique({
			where: { email },
		});
		if (user) {
			res.status(400).json({ error: "Email already exist" });
			return;
		}
		const hashedPassword = await bcrypt.hash(password, 10);
		const newUser = await prisma.user.create({
			data: {
				name,
				job,
				email,
				password: hashedPassword,
			},
		});
		res.status(201).json({ "New user created": newUser });
	}

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
			user: { id: user.id, name: user.name, job: user.job, email: user.email },
		});
	}

	static async getnewToken(req, res) {
		const token = req.cookies.refreshToken;

		if (!token) {
			return res.status(403).json({ error: "Refresh token is required" });
		}

		try {
			const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
			const user = await prisma.user.findUnique({
				where: { id: decoded.userId },
			});

			if (!user || user.refreshToken !== token) {
				return res.status(403).json({ error: "Invalid refresh token" });
			}

			const accessToken = generateAccessToken(user);
			const newRefreshToken = generateRefreshToken(user);

			await prisma.user.update({
				where: { id: user.id, email: user.email },
				data: { refreshToken: newRefreshToken },
			});

			res.cookie('refreshToken', newRefreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			});

			res.status(200).json({
				accessToken,
			});
		} catch (error) {
			res.status(403).json({ error: "Invalid refresh token" });
		}
	}
}
