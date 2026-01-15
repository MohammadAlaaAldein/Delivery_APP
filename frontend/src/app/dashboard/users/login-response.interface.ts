export interface LoginResponse {
	err: string;
	name?: string,
	email?: string,
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