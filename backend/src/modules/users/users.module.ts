import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AuthCaptchaService } from '../auth/auth-captcha/auth-captcha.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			User
		]),
	],
	controllers: [UsersController],
	providers: [UsersService, AuthCaptchaService],
	exports: [UsersService],
})
export class UsersModule { }
