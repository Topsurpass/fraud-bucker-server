import { jwtDecode } from "jwt-decode";

export function isTokenExpired(token: string): boolean {
	const decoded: { exp: number } = jwtDecode(token);
	if (!decoded.exp) {
		return true;
	}
	const currentTime = Date.now() / 1000;
	return decoded.exp < currentTime;
}
