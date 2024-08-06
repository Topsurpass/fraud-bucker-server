// Helper function to check for missing fields
export function validateFields(req, res, requiredFields) {
	for (const field of requiredFields) {
		if (!req.body[field]) {
			res.status(400).json({ error: `Missing ${field}` });
			return false;
		}
	}
	return true;
}