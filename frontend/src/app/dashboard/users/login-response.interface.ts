import { USER_ROLE } from "./users.service";

export interface LoginResponse {
	err: string;
	name?: string,
	email?: string,
	role?: USER_ROLE,
	accessToken?: string,
	refreshToken?: string
	data?: OtpResponse
}

interface OtpResponse {
	has_2sv?: boolean;
	timeRemaining?: number;
}

export interface OtpVerifyResponse {
	err: string,
	res: string | null;
}