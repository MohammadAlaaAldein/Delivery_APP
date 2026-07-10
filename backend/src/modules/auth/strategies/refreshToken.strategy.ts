import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWT_REFRESH_SECRET_TOKEN } from 'src/common/constants';
import { AuthService } from '../auth.service';

const refreshTokenExtractor = ExtractJwt.fromExtractors([
	ExtractJwt.fromAuthHeaderAsBearerToken(),
	ExtractJwt.fromBodyField('refresh'),
]);

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
	constructor(
		private readonly authService: AuthService,
	) {
		super({
			jwtFromRequest: refreshTokenExtractor,
			ignoreExpiration: false,
			secretOrKey: `${JWT_REFRESH_SECRET_TOKEN}`,
		});
	}

	async validate(payload: any) {
		try {
			const { sessionId, id } = payload;

			const token = await this.authService.getTokenSession(id);
			if (!token || token !== sessionId)
				throw new UnauthorizedException();

			return { id, sessionId };
		} catch (ex) {
			throw ex;
		}
	}
}
