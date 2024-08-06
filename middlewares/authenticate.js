import jwt from "jsonwebtoken";


// Middleware function to verify JWT
export default function authenticateToken(req, res, next) {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>
	const accesstokensecret = process.env.ACCESS_TOKEN_SECRET;

	if (!token) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	jwt.verify(token, accesstokensecret, (err, user) => {
		if (err) {
			return res.status(403).json({ error: "Invalid token" });
		}
		req.user = user;
		next();
	});
}

