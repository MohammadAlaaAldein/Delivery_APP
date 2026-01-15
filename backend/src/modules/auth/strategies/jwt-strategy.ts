import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWT_SECRET_TOKEN } from 'src/common/constants';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
	constructor(
		private readonly authService: AuthService,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: `${JWT_SECRET_TOKEN}`,
		});
	}

	async validate(payload: any) {
		try {
			const { sessionId, id, name, role, entity_type, entity_id } = payload;

			const token = await this.authService.getTokenSession(id);
			if (!token || token !== sessionId)
				throw new UnauthorizedException();

			return { id, sessionId, name, role, entity_type, entity_id };
		} catch (ex) {
			throw ex;
		}
	}
}
