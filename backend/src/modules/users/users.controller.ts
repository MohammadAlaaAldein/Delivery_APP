import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	UseGuards,
	Req,
	UnauthorizedException,
	Query,
	Res,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtGuard } from '../auth/guards/jwt-auth.guard';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ChangeUserPasswordDto } from './dto/change-password.dto';
import { UpdateAccessFunctionsDto } from './dto/update-access-functions.dto';
import { hasAccessFunction } from '../auth/auth.service';
import { ACCESS_FUNCTIONS } from 'src/common/access-functions';
import { handleSuccessApiResponse, handleThrowApiError } from 'src/common/api-response';
import { ListUsersDto } from './dto/list-users.dto';
import { getControllersPrefixes, translate } from 'src/common/utilities';
import { AuthCaptchaService } from '../auth/auth-captcha/auth-captcha.service';
import { ForgotPasswordDto, ResetUserPasswordDto } from './dto/forgot-password.dto';
import { NotAuthenticatedGuard } from '../auth/guards/not-authenticated.guard';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';

@Controller(getControllersPrefixes('users'))

export class UsersController {

	readonly THROW_API_MODULE: string = 'users';

	constructor(
		private readonly usersService: UsersService,
		private readonly authCaptchaService: AuthCaptchaService,
	) { }

	@Post('register')
	async registerUser(
		@Body() createUserDto: CreateUserDto,
		@Req() req: FastifyRequest,
	) {
		const result = await this.usersService.create(createUserDto, { req });

		if (result.err)
			return handleThrowApiError(this.THROW_API_MODULE, result.err);

		return result;
	}

	@UseGuards(JwtGuard)
	@Patch(':id')
	async update(
		@Req() req: FastifyRequest,
		@Param('id') id: number,
		@Body() updateUserDto: UpdateUserDto,
	) {
		if (!hasAccessFunction(req, ACCESS_FUNCTIONS.ADMIN) && req.user.id !== id)
			throw new UnauthorizedException();

		const result = await this.usersService.update(id, updateUserDto, { req });

		if (result.err)
			return handleThrowApiError(this.THROW_API_MODULE, result.err);

		return handleSuccessApiResponse({ message: translate('users.user_updated_successfully'), data: result.res });
	}

	@UseGuards(JwtGuard)
	@Patch('change-password')
	async changeUserPassword(
		@Body() data: ChangeUserPasswordDto,
		@Req() req: FastifyRequest,
	) {
		const result = await this.usersService.changeUserPassword(req.user.id, data);

		if (result?.err)
			return handleThrowApiError(this.THROW_API_MODULE, result.err);

		return handleSuccessApiResponse({ message: translate('users.password_changed_successfully'), data: result.res });
	}

	@UseGuards(JwtGuard)
	@Patch('update-user-access-functions')
	async updateUserAccessFunctions(
		@Body() data: UpdateAccessFunctionsDto,
		@Req() req: FastifyRequest
	) {
		if (!hasAccessFunction(req, ACCESS_FUNCTIONS.ADMIN))
			throw new UnauthorizedException();

		const result = await this.usersService.updateUserAccessFunctions(data, req);

		if (result.err)
			return handleThrowApiError(this.THROW_API_MODULE, result.err);

		return handleSuccessApiResponse({ message: translate('users.access_functions_updated_successfully'), data: result.res });
	}

	@UseGuards(JwtGuard)
	@Get('get-access-function/:userId')
	async getAccessFunctions(
		@Req() req: FastifyRequest,
		@Param('userId') userId: number,
	) {
		if (!hasAccessFunction(req, ACCESS_FUNCTIONS.MANAGEMENT_FUNCTION))
			throw new UnauthorizedException();

		const adminAccessFunctions = req.user.access_functions;
		const result = await this.usersService.getAccessFunctions(adminAccessFunctions, +userId);

		if (result.err)
			return handleThrowApiError(this.THROW_API_MODULE, result.err);

		return handleSuccessApiResponse({ data: result });
	}

	@UseGuards(JwtGuard)
	@Get('get-current-user-access-functions')
	async getCurrentUserAccessFunctions(
		@Req() req: FastifyRequest,
	) {
		const access_functions = req.user?.access_functions || {};
		return handleSuccessApiResponse({ data: access_functions });
	}

	@UseGuards(JwtGuard)
	@Delete(':id')
	async delete(
		@Req() req: FastifyRequest,
		@Param('id') id: number,
	) {
		if (!hasAccessFunction(req, ACCESS_FUNCTIONS.ADMIN))
			throw new UnauthorizedException();

		await this.usersService.deleteUser(+id, { req });

		return handleSuccessApiResponse({ message: translate('users.user_deleted_successfully') });
	}

	@UseGuards(JwtGuard)
	@Get('list')
	async listUsers(
		@Req() req: FastifyRequest,
		@Query() filters: ListUsersDto,
	) {
		if (!hasAccessFunction(req, ACCESS_FUNCTIONS.ADMIN))
			throw new UnauthorizedException();

		const users = await this.usersService.getUsers(filters);

		return handleSuccessApiResponse({ data: users });
	}

	@UseGuards(NotAuthenticatedGuard)
	@Post('forgotPassword')
	async forgotPassword(
		@Req() req: FastifyRequest,
		@Body() body: ForgotPasswordDto
	) {
		const response = await this.usersService.forgotPassword(body, { req });
		if (response.err)
			return handleThrowApiError(this.THROW_API_MODULE, response.err);
		return handleSuccessApiResponse({ data: translate('users.forgot_email_sent_successfully') });
	}

	@Get('captchaImage')
	async getCaptchaImage(
		@Query('captchaKey') captchaKey: string,
		@Res() res: FastifyReply
	) {
		const captchaImg = await this.authCaptchaService.getCaptcha(captchaKey, true);

		res.header('Content-Type', 'image/svg+xml');
		res.header('Cache-Control', 'no-store');
		res.send(captchaImg); // SVG string
	}

	@UseGuards(NotAuthenticatedGuard)
	@Post('reset-password')
	async resetPassword(
		@Req() req: FastifyRequest,
		@Body() changePasswordData: ResetUserPasswordDto
	) {
		const response = await this.usersService.resetUserPassword(changePasswordData, { req });
		if (response.err)
			return handleThrowApiError(this.THROW_API_MODULE, response.err);
		return handleSuccessApiResponse({ data: response });
	}

	@UseGuards(JwtGuard)
	@Post('update-user-password')
	async updateUserPassword(
		@Req() req: FastifyRequest,
		@Body() updateUserPasswords: UpdateUserPasswordDto
	) {
		if (!hasAccessFunction(req, ACCESS_FUNCTIONS.ADMIN))
			throw new UnauthorizedException();

		const response = await this.usersService.updateUserPassword(updateUserPasswords, { req });
		if (response.err)
			return handleThrowApiError(this.THROW_API_MODULE, response.err);
		return handleSuccessApiResponse({ data: response });
	}
}
