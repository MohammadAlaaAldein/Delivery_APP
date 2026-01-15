import { Body, Controller, Post, Request, UseGuards, Version, Get, Query, Redirect, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshJwtGuard } from './guards/refresh-jwt-auth.guard';
import { FastifyReply, FastifyRequest } from 'fastify';
import { JwtGuard } from './guards/jwt-auth.guard';
import { handleSuccessApiResponse } from 'src/common/api-response';
import { translate, getControllersPrefixes } from 'src/common/utilities';
import { IgnoreLogging } from 'src/decorators/ignoreLogging';
import { getSiteBaseURL } from 'src/common/constants';

@Controller(getControllersPrefixes('auth'))
export class AuthController {
	constructor(
		private authService: AuthService,
	) { }

	@UseGuards(LocalAuthGuard)
	@IgnoreLogging()
	@Version(['1', '2'])
	@Post('login')
	async login(@Request() req: FastifyRequest) {
		return await this.authService.login(req.user, { req });
	}

	@UseGuards(JwtGuard)
	@IgnoreLogging()
	@Post('logout')
	async logout(@Request() req: any) {
		await this.authService.logout(req);
		return handleSuccessApiResponse({ message: translate('users.successfully_logged_out') });
	}

	@UseGuards(RefreshJwtGuard)
	@IgnoreLogging()
	@Version(['1', '2'])
	@Post('refresh')
	async refreshToken(@Request() req: FastifyRequest) {
		return this.authService.refreshAccessToken(req.user);
	}

	@Post('resend-login-otp')
	async resendLoginOtp(
		@Body() body: { email: string }
	) {
		const sendOtpResult = await this.authService.resendLoginOtp(body.email);
		return handleSuccessApiResponse({ data : sendOtpResult});
	}

	@Post('verify-login-otp-code')
	async verifyLoginOtp(
		@Request() req: FastifyRequest,
		@Body() body: { email: string, otpCode: string } 
	) {
		const otpResult = await this.authService.verifyLoginWithOtp(body.email, body.otpCode, { req });
		return handleSuccessApiResponse({ data: otpResult });
	}

	@Get('unblock-login')
	@Redirect()
	async unblockLoginDeepLink(
		@Query('enc') enc?: string,
	) {
		const siteBaseURL = getSiteBaseURL();
		if (!enc) 
			return {
				url:`${siteBaseURL}/login`,
				statusCode: HttpStatus.FOUND
			}

		const response = await this.authService.cleanUpExpiredUnblockLoginKeys(enc);
		if (!response) {
			return{
				url:`${siteBaseURL}/unblock-login/?link_expired=true`,
				statusCode: HttpStatus.FOUND
			}
		}

		return {
			url: `${siteBaseURL}/unblock-login/?enc=${enc}`,
			statusCode: HttpStatus.FOUND
		}
	}

	@Post('unblockLogin')
	async unblockLogin(@Body() body: { encKey: string }) {
		const response = await this.authService.unBlockLogin(body.encKey);
		return handleSuccessApiResponse({ data: response });
	}
}
