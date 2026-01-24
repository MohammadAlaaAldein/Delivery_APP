import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { translate } from 'src/common/utilities';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
	constructor(private authService: AuthService) {
		super({
			usernameField: 'email',
		});
	}

	async validate(email: string, password: string) {
		const user = await this.authService.validateUser(email, password);

		if (!user)
			throw new UnauthorizedException();

		// Check if user is active
		if (!user.is_active)
			throw new ForbiddenException(translate('auth.user_not_active'));

		return user;
	}
}
