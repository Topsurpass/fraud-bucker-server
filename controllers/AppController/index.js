import prisma from "../../utils/db.js";

export default class AppController {
	static async getStatus(_, res) {
		try {
			await prisma.$connect();
			res.status(200).json({
				db: "Connection successful!",
			});
		} catch (error) {
			res.status(500).json({
				db: "Connection failed!",
				error: error.message,
			});
		} finally {
			await prisma.$disconnect();
		}
	}
}
