import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersService } from '../users/users.service';
import { LocalStrategy } from './strategies/local-strategy';
import { JwtStrategy } from './strategies/jwt-strategy';
import { RefreshJwtStrategy } from './strategies/refreshToken.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { JWT_SECRET_TOKEN, JWT_SECRET_TOKEN_TTL } from '../../common/constants';
import { AuthCaptchaService } from './auth-captcha/auth-captcha.service';

@Module({
	providers: [
		AuthService,
		UsersService,
		LocalStrategy,
		JwtStrategy,
		RefreshJwtStrategy,
		UsersService,
		AuthCaptchaService,
	],
	controllers: [AuthController],
	imports: [
		TypeOrmModule.forFeature([User]),
		JwtModule.register({
			secret: `${JWT_SECRET_TOKEN}`,
			signOptions: { expiresIn: JWT_SECRET_TOKEN_TTL },
		}),
	],
})
export class AuthModule { }
