import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AuthCaptchaService } from '../auth/auth-captcha/auth-captcha.service';
import { RolesService } from './roles.service';
import { ShopsModule } from '../shops/shops.module';
import { CompaniesModule } from '../companies/companies.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			User
		]),
		ShopsModule,
		CompaniesModule,
	],
	controllers: [UsersController],
	providers: [UsersService, RolesService, AuthCaptchaService],
	exports: [UsersService],
})
export class UsersModule { }
