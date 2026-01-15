import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { JWT_SECRET_TOKEN, JWT_REFRESH_SECRET_TOKEN, JWT_SECRET_TOKEN_TTL, JWT_REFRESH_SECRET_TOKEN_TTL, getSiteBaseURL, WHITELISTED_IPS } from 'src/common/constants';
import { comparePasswords, generateOtpCode, generateSessionId, translate } from 'src/common/utilities';
import { FastifyRequest } from 'fastify';
import { RedisService } from '../redis/redis.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MailersService } from '../mailers/mailers.service';
import { ErrorKeys } from 'src/common/api-response';
import moment from 'moment';
import { UserResponse } from './auth.interface';
import { encrypt } from 'src/common/common';

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private jwtService: JwtService,
		private redisService: RedisService,
		private readonly eventEmitter: EventEmitter2,
		// private readonly mailersService: MailersService
	) { }

	getUserTokenSessionKey(userId: number) {
		return `user:${userId}:session`;
	}

	private getIsPassedOTPKey(userId: number) {
		return `user_${userId}_passed_otp`;
	}

	private getUserOTPCodeKey(userId: number) {
		return `user_${userId}_otp_code`;
	}

	private getUserOTPCodeDetailsKey(userId: number) {
		return `user_${userId}_otp_code_details`;
	}

	cacheKeys = {
		"login_tries": "login_tries",
		"login_unblock": "login_unblock",
	}

	private MAX_VERIFY_PER_OTP_CODE = 5;
	private MAX_ALLOWED_GENERATED_OTP = 3;

	async validateUser(email: string, password: string) {
		try {
			const user = await this.usersService.findOneByEmail(email);

			if (user && (await comparePasswords(password, user.password))) {
				const { password, ...result } = user;
				return result;
			}

			return null;
		} catch (ex) {
			throw ex;
		}
	}

	async login(user: User, options?: { req?: FastifyRequest }) {
		try {
			const sessionId = generateSessionId();
			const accessToken = this.generateAccessToken(user, sessionId);
			const refreshToken = this.generateRefreshToken(user, sessionId);

			await this.storeTokenSession(user.id, sessionId, JWT_REFRESH_SECRET_TOKEN_TTL);

			await this.eventEmitter.emitAsync('action.log', {
				old_values: {},
				new_values: {},
				action_name: 'user_login',
				related_id: user.id,
				forceLog: true,
				req: options.req,
			});

			const response: UserResponse = {
				name: user.name,
				email: user.email,
				role: user?.role,
				// entity_type: user?.entity_type,
				entity_id: user?.entity_id,
				accessToken,
				refreshToken,
			};

			return response;
		} catch (ex) {
			throw ex;
		}
	}

	async logout(req: FastifyRequest) {
		try {
			const userId = req.user.id;
			await this.invalidateSession(userId);
			// Remove session destroy since we're not using sessions anymore
		} catch (ex) {
			throw ex;
		}
	}

	async refreshAccessToken(user: any) {
		// Get fresh user data for the refresh token
		const userData = await this.usersService.getUsersInfo([user.id]);
		if (!userData || userData.length === 0) {
			throw new UnauthorizedException();
		}

		return {
			accessToken: this.generateAccessToken(userData[0], user.sessionId),
		};
	}

	generateAccessToken(user: User, sessionId: string) {
		return this.jwtService.sign(
			{
				id: user.id,
				sessionId,
				name: user.name,
				role: user.role,
				// entity_type: user.entity_type,
				entity_id: user.entity_id,
			}, // Payload
			{ secret: JWT_SECRET_TOKEN, expiresIn: JWT_SECRET_TOKEN_TTL },
		);
	}

	generateRefreshToken(user: User, sessionId: string) {
		return this.jwtService.sign(
			{
				id: user.id,
				sessionId,
				name: user.name,
				role: user.role,
				// entity_type: user.entity_type,
				entity_id: user.entity_id,
			}, // Payload
			{ secret: JWT_REFRESH_SECRET_TOKEN, expiresIn: JWT_REFRESH_SECRET_TOKEN_TTL }, // 7 days expiration
		);
	}

	async storeTokenSession(userId: number, sessionId: string, expiration: number): Promise<void> {
		try {
			const cacheKey = this.getUserTokenSessionKey(userId);
			await this.redisService.set(cacheKey, sessionId, expiration);
		} catch (ex) {
			throw ex;
		}
	}

	async getTokenSession(userId: number): Promise<string | null> {
		try {
			const cacheKey = this.getUserTokenSessionKey(userId);
			return await this.redisService.get(cacheKey);
		} catch (ex) {
			throw ex;
		}
	}

	async invalidateSession(userId: number): Promise<void> {
		try {
			const cacheKey = this.getUserTokenSessionKey(userId);
			await this.redisService.del([cacheKey]);
		} catch (ex) {
			throw ex;
		}
	}

	async resetOTPCodeValues(userId: number) {
		try {
			const otpCodeKey = this.getUserOTPCodeKey(userId);
			const otpCodeKeyDetails = this.getUserOTPCodeDetailsKey(userId);

			await this.redisService.del([otpCodeKey, otpCodeKeyDetails]);
		} catch (ex) {
			throw ex;
		}
	}

	async send2SVCodeEmail(userInfo: User) {
		try {
			const generatedCode = await this.generateOTPCode(userInfo.id);
			if (generatedCode.err)
				return { err: generatedCode.err, res: null };

			await this.prepare2SVCodeEmail(userInfo, generatedCode.res.otpCode);
			return { err: generatedCode.res.error || null, res: null };
		} catch (ex) {
			throw ex;
		}
	}

	async generateOTPCode(userId: number) {
		try {
			const otpCodeKeyDetails = this.getUserOTPCodeDetailsKey(userId);
			const otpDetails = await this.redisService.hgetall(otpCodeKeyDetails);
			const generatedCodesCount = +(otpDetails.generated_codes_count || 0) + 1;

			if (generatedCodesCount > this.MAX_ALLOWED_GENERATED_OTP)
				return { err: 'otp_generation_limit_exceeded' };

			const otpCode = generateOtpCode();
			const otpCodeKey = this.getUserOTPCodeKey(userId);
			await this.redisService.set(otpCodeKey, otpCode, 10 * 60, false, 0); // 10 mins

			const fields = ['generated_codes_count', 'current_code_attempts'];
			const values = [generatedCodesCount, 0];

			await this.redisService.hset(otpCodeKeyDetails, fields, values, 60 * 60 * 24)

			let error = null;
			if (generatedCodesCount == this.MAX_ALLOWED_GENERATED_OTP)
				error = 'last_allowed_otp_code_generated';

			return { res: { otpCode, error }, err: null };
		} catch (ex) {
			throw ex;
		}
	}

	async prepare2SVCodeEmail(userInfo: User, otpCode: string) {
		try {
			const envelope = {
				subject: translate('otp.your_verification_code'),
				to: userInfo.email,
			};

			const viewParams = {
				code: otpCode,
			};

			// return await this.mailersService.sendMailTemplate('loginVerificationCode', viewParams, envelope);
		} catch (ex) {
			throw ex;
		}
	}

	async resendLoginOtp(email: string) {
		try {
			const userInfo = await this.usersService.findOneByEmail(email);
			if (!userInfo)
				return { err: ErrorKeys.INVALID_USER, res: null };

			return await this.send2SVCodeEmail(userInfo);
		} catch (ex) {
			throw ex;
		}
	}

	async verifyLoginWithOtp(email: string, code: string, options?: { req?: FastifyRequest }) {
		try {
			const userInfo = await this.usersService.findOneByEmail(email);
			if (!userInfo)
				return { err: ErrorKeys.INVALID_USER, res: null };

			return await this.verifyOTPCode(userInfo, code, options);
		} catch (ex) {
			throw ex;
		}
	}

	async verifyOTPCode(userInfo: User, inputOtpCode: string, options?: { req?: FastifyRequest }) {
		try {
			const otpCodeKey = this.getUserOTPCodeKey(userInfo.id);
			const userOTPCode = await this.redisService.get(otpCodeKey);

			if (inputOtpCode == userOTPCode) {
				await this.redisService.set(this.getIsPassedOTPKey(userInfo.id), true, 2 * 60, false, 0);
				await this.resetOTPCodeValues(userInfo.id);
				return { err: null, res: true };
			}

			const otpCodeKeyDetails = this.getUserOTPCodeDetailsKey(userInfo.id);
			const otpDetails = await this.redisService.hgetall(otpCodeKeyDetails);
			const otpAttempts = +(otpDetails.current_code_attempts || 0);
			const generatedCodesCount = +(otpDetails.generated_codes_count || 0);

			// Increase the attempts
			await this.redisService.hset(otpCodeKeyDetails, 'current_code_attempts', otpAttempts + 1);

			if (otpAttempts + 1 >= this.MAX_VERIFY_PER_OTP_CODE) {
				if (generatedCodesCount >= this.MAX_ALLOWED_GENERATED_OTP)
					return await this.blockUserByInvalidOTP(userInfo, options);

				return { err: 'force_resend_otp', res: null };
			}

			if (userOTPCode)
				return { err: 'invalid_otp', res: null };

			// OTP expired and Reach to limit of generated codes
			if (generatedCodesCount >= this.MAX_ALLOWED_GENERATED_OTP)
				return await this.blockUserByInvalidOTP(userInfo, options);

			return { err: 'otp_expired', res: null };
		} catch (ex) {
			throw ex;
		}
	}

	async blockUserByInvalidOTP(userInfo: User, options?: { req?: FastifyRequest }) {
		try {
			await this.resetOTPCodeValues(userInfo.id);
			const userIP = options.req['DEF-IPaddress'] || options.req.headers['x-real-ip'] || options.req.connection.remoteAddress || '';
			const skipLockLoginIPs = WHITELISTED_IPS.split(',') || [];

			if (!skipLockLoginIPs.includes(userIP)) {
				await this.redisService.set(this.cacheKeys.login_tries, { count: 6, time: Date.now() }, 30 * 60, true, userInfo.email);
				await this.sendBlockedUserEmail(userInfo.email);

				return { err: 'blocked', res: null };
			}

			return { err: null, res: true };
		} catch (ex) {
			throw ex;
		}
	}

	async sendBlockedUserEmail(userEmail: string) {
		try {
			const userInfo = await this.usersService.findOneByEmail(userEmail);
			if (!userInfo)
				return { err: ErrorKeys.INVALID_USER, res: null };

			const emailContentToEncrypt = `${userInfo.id},${userEmail},${moment().utc().format('X')}`;
			const encryptedData = encrypt(emailContentToEncrypt, process.env.ENCRYPTION_SALT);

			await this.redisService.set(this.cacheKeys.login_unblock, userEmail, 30 * 60, false, encryptedData);

			let envelope = {
				'subject': translate('otp.blocked_login_subject'),
				'to': userEmail,
			};

			let viewParams = {
				link: `${getSiteBaseURL()}/auth/unblock-login?enc=${encryptedData}`,
			};

			// return await this.mailersService.sendMailTemplate('blocked_login', viewParams, envelope);
		} catch (ex) {
			throw ex;
		}
	}

	async unBlockLogin(encKey: string) {
		try {
			if (!encKey)
				return { err: 'invalid_enc', res: null };

			const cacheKey = this.cacheKeys.login_unblock;
			const blockedEmail = await this.redisService.get(cacheKey, encKey);
			if (!blockedEmail)
				return { err: 'link_expired', res: null };

			await this.redisService.del([cacheKey + '_' + encKey]);
			await this.redisService.del([this.cacheKeys.login_tries + '_' + blockedEmail]);
			return { err: null, res: true };
		} catch (ex) {
			throw ex;
		}
	}

	async cleanUpExpiredUnblockLoginKeys(enc: string) {
		try {
			const cacheKey = this.cacheKeys.login_unblock;
			return await this.redisService.get(cacheKey, enc);
		} catch (ex) {
			throw ex;
		}
	}
}