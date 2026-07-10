import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local-strategy';
import { JwtStrategy } from './strategies/jwt-strategy';
import { RefreshJwtStrategy } from './strategies/refreshToken.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JWT_SECRET_TOKEN, JWT_SECRET_TOKEN_TTL } from '../../common/constants';
import { UsersModule } from '../users/users.module';
import { AuthCaptchaService } from './auth-captcha/auth-captcha.service';
import { ShopsModule } from '../shops/shops.module';
import { CompaniesModule } from '../companies/companies.module';
import { DriversModule } from '../drivers/drivers.module';

@Module({
	providers: [
		AuthService,
		LocalStrategy,
		JwtStrategy,
		RefreshJwtStrategy,
		AuthCaptchaService,
	],
	controllers: [AuthController],
	imports: [
		PassportModule.register({ session: false }),
		TypeOrmModule.forFeature([User]),
		JwtModule.register({
			secret: `${JWT_SECRET_TOKEN}`,
			signOptions: { expiresIn: JWT_SECRET_TOKEN_TTL },
		}),
		UsersModule,
		ShopsModule,
		CompaniesModule,
		DriversModule,
	],
})
export class AuthModule { }
