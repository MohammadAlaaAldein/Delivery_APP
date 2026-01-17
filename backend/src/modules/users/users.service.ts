import { forwardRef, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { comparePasswords, hashPassword, nowTime, translate } from '../../common/utilities';
import { ChangeUserPasswordDto } from './dto/change-password.dto';
import { FastifyRequest } from 'fastify';
import { ErrorKeys } from 'src/common/api-response';
import { ListUsersDto } from './dto/list-users.dto';
import { AuthCaptchaService } from '../auth/auth-captcha/auth-captcha.service';
import { ForgotPasswordDto, ResetUserPasswordDto } from './dto/forgot-password.dto';
import moment from 'moment';
import { RedisService } from '../redis/redis.service';
// import { MailersService } from '../mailers/mailers.service';
import { getSiteBaseURL, RESET_PASSWORD_LINK_TTL } from 'src/common/constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { encrypt } from 'src/common/common';
import { ShopsService } from '../shops/shops.service';
import { CompaniesService } from '../companies/companies.service';
import { keyBy } from 'lodash';

export enum USER_ROLE {
	ADMIN = 'admin',
	SHOP = 'shop',
	COMPANY = 'company',
	DRIVER = 'driver',
};

@Injectable()
export class UsersService {
	private CACHE_KEYS = {
		FORGOT_PASSWORD_EMAIL_CONTENT: 'forgot_password_email_v1'
	};

	constructor(
		@InjectRepository(User)
		private readonly usersRepository: Repository<User>,
		private connection: DataSource,
		private authCaptchaService: AuthCaptchaService,
		private redisService: RedisService,
		// private mailerService: MailersService,
		private readonly eventEmitter: EventEmitter2,
		private readonly shopsService: ShopsService,
		private readonly companiesService: CompaniesService,
	) { }

	private getUserRepository(entityManager?: EntityManager): Repository<User> {
		return entityManager ? entityManager.getRepository(User) : this.connection.getRepository(User);
	}

	async create(createUserDto: CreateUserDto, options?: { req?: FastifyRequest }): Promise<any> {
		try {
			const user = this.usersRepository.create(createUserDto);

			const uniqueFieldFound = await this.checkUserUniqueFields(createUserDto);
			if (uniqueFieldFound)
				return this.checkUserUniqueFieldsError(uniqueFieldFound);

			await this.usersRepository.save(user);
			const { password, ...result } = user;

			// await this.eventEmitter.emitAsync('action.log', {
			// 	old_values: {},
			// 	new_values: result,
			// 	action_name: 'add_user',
			// 	related_id: result.id,
			// 	action_user_id: options.req?.user?.id || 0,
			// 	req: options.req,
			// });

			return result;
		} catch (ex) {
			throw ex;
		}
	}

	async update(id: number, fields: UpdateUserDto, options?: { req?: FastifyRequest }): Promise<any> {
		try {
			const allowedFields = [
				'name',
				'email',
				'role',
				'entity_id',
			];

			const user = (await this.getUsersInfo([id]))[0];

			// Check uniqueness
			const uniqueFieldFound = await this.checkUserUniqueFields(fields, user);
			if (uniqueFieldFound)
				return this.checkUserUniqueFieldsError(uniqueFieldFound);

			if (fields.email)
				fields.email = fields.email.toLowerCase().trim();

			const updateFields: UpdateUserDto = {};

			for (const field in fields) {
				if (allowedFields.includes(field))
					updateFields[field] = fields[field];
			}

			if (!Object.keys(updateFields).length)
				return { err: 'no_changes', res: null };

			await this.usersRepository.createQueryBuilder().update().set(updateFields).where('id = :id', { id }).execute();

			// await this.eventEmitter.emitAsync('action.log', {
			// 	old_values: user,
			// 	new_values: updateFields,
			// 	action_name: 'edit_user',
			// 	related_id: user.id,
			// 	action_user_id: options.req?.user?.id || 0,
			// 	req: options.req,
			// });

			const { ...updatedFields } = updateFields;
			return { err: null, res: updatedFields };
		} catch (ex) {
			throw ex;
		}
	}

	async changeUserPassword(userId: number, data: ChangeUserPasswordDto) {
		try {
			const { old_password: oldPassword, new_password: newPassword, confirmed_password: confirmPassword } = data;

			if (oldPassword == newPassword)
				return { err: ErrorKeys.NEW_PASSWORD_SAME_AS_OLD_PASSWORD };

			if (newPassword !== confirmPassword)
				return { err: ErrorKeys.NEW_PASSWORD_AND_CONFIRMED_PASSWORD_NOT_MATCHED };

			const user = (await this.getUsersInfo([userId], { includePassword: true }))[0];
			if (!user)
				return { err: ErrorKeys.INVALID_USER };

			const isOldPasswordValid = await comparePasswords(oldPassword, user.password);
			if (!isOldPasswordValid)
				return { err: ErrorKeys.INCORRECT_OLD_PASSWORD };

			return await this.updateUserPassword({ user_id: userId, password: newPassword, confirm_password: confirmPassword });
		} catch (ex) {
			throw ex;
		}
	}

	private checkUserUniqueFieldsError(field: string) {
		let errorKey = '';
		switch (field) {
			case 'email':
				errorKey = ErrorKeys.UNIQUE_VIOLATION_EMAIL;
				break;
			default:
				break;
		}
		return { err: errorKey };
	}

	private async checkUserUniqueFields(fields: UpdateUserDto, oldUserInfo?: UpdateUserDto): Promise<any> {
		try {
			// Check uniqueness
			const uniqueFields = ['email'];
			const conditions = [];
			const values = {};

			for (const field of uniqueFields) {
				if (field in fields && (!oldUserInfo || oldUserInfo[field] != fields[field])) {
					conditions.push(`${field} = :${field}`);
					values[field] = fields[field];
				}
			}

			if (conditions.length) {
				const user = await this.usersRepository.createQueryBuilder().where(conditions.join(' OR '), values).getOne();
				if (user) {
					for (const field of uniqueFields) {
						if (user[field] == fields[field])
							return field;
					}
				}
			}
			return null;
		} catch (ex) {
			throw ex;
		}
	}

	async getUsersInfo(ids: number[], options: { selectColumns?: string, includePassword?: boolean, includeDeletedUsers?: boolean, entityManager?: EntityManager } = {}): Promise<User[]> {
		try {
			options.selectColumns ||= '*';
			const repository = this.getUserRepository(options.entityManager);
			let qb = repository.createQueryBuilder().select(options.selectColumns).whereInIds(ids);

			if (options.includeDeletedUsers)
				qb.withDeleted();

			let result = await qb.getRawMany();

			if (!options.includePassword)
				result = result.map(({ password, ...rest }) => rest);

			return result;
		} catch (ex) {
			throw ex;
		}
	}

	async deleteUser(id: number, options: { entityManager?: EntityManager, req?: FastifyRequest } = {}): Promise<any> {
		try {
			const repository = this.getUserRepository(options.entityManager);

			await repository.createQueryBuilder().update()
				.set({
					email: () => "'del' || email || '-' || extract(epoch from now())::int",
					deleted_at: new Date()
				}).whereInIds([id]).execute();

			await this.eventEmitter.emitAsync('action.log', {
				old_values: {},
				new_values: {},
				action_name: 'delete_user',
				related_id: id,
				action_user_id: options.req?.user?.id || 0,
				forceLog: true,
				req: options.req,
			});

			return {};
		} catch (ex) {
			throw ex;

		}
	}

	async findOneByEmail(email: string) {
		try {
			return await this.usersRepository.findOne({ where: { email: email.toLowerCase().trim() } });
		} catch (ex) {
			throw ex;
		}
	}

	async getUsers(filters: ListUsersDto): Promise<User[]> {
		try {
			const criteria = {};
			if (filters && Object.keys(filters).length > 0) {
				for (const field in filters) {
					const value = filters[field];
					if (value !== null && value !== undefined && value !== '' && value !== 0)
						criteria[field] = value;
				}
			}

			const qb = this.usersRepository.createQueryBuilder().select('*');

			for (const field in criteria) {
				const params = { [field]: criteria[field] };
				switch (field) {
					case 'name':
					case 'email':
						params[field] = params[field].trim().toLowerCase();
						qb.andWhere(`LOWER(${field}) = :${field}`, params);
						break;
					case 'id':
						if (!Array.isArray(params[field]))
							params[field] = [params[field]];

						qb.andWhere(`${field} = ANY(:${field})`, params);
						break;
					default:
						break;
				}
			}

			const result = await qb.getRawMany();
			return result.map(({ password, ...rest }) => rest);
		} catch (ex) {
			throw ex;
		}
	}

	async forgotPassword(body: ForgotPasswordDto, options: { req: FastifyRequest }): Promise<{ err: string, res: null }> {
		try {
			const checkCaptcha = await this.authCaptchaService.verifyCaptcha(body.captcha_key, body.captcha_text);
			if (!checkCaptcha)
				return { err: ErrorKeys.INVALID_CAPTCHA, res: null };

			const userInfoExist = await this.getUsers({ email: body.email });
			if (!userInfoExist.length)
				return { err: ErrorKeys.INVALID_USER, res: null };

			const userInfo = userInfoExist[0];
			const siteBaseURL = getSiteBaseURL();
			const forgotPassSalt = process.env.FORGOT_PASSWORD_SALT;

			const emailContentToEncrypt = `${userInfo.id},${body.email},${moment().utc().format('X')}`;
			const encryptedData = encrypt(emailContentToEncrypt, forgotPassSalt);

			await this.redisService.set(this.CACHE_KEYS.FORGOT_PASSWORD_EMAIL_CONTENT, encryptedData, RESET_PASSWORD_LINK_TTL, false, userInfo.id);
			const resetPasswordLink = siteBaseURL + '/reset-password/' + userInfo.id + '/?enc=' + encryptedData;

			const envelope = {
				'subject': translate('users.password_reset_email_title'),
				'to': body.email
			};

			const viewParams = {
				firstName: userInfo.name,
				link: resetPasswordLink
			};

			// await this.mailerService.sendMailTemplate('forgotPassword', viewParams, envelope);

			return { err: null, res: null };
		} catch (ex) {
			throw ex;
		}
	}

	async resetUserPassword(changePasswordData: ResetUserPasswordDto, options: { req: FastifyRequest }): Promise<{ err: string, res: null }> {
		try {
			const { userId, encKey, newPassword, confirmPassword } = changePasswordData;
			const forgotPasswordKey = this.CACHE_KEYS.FORGOT_PASSWORD_EMAIL_CONTENT;

			const userInfoEncrypted = await this.redisService.get(forgotPasswordKey, userId);
			if (!userInfoEncrypted || (userInfoEncrypted != encKey))
				return { err: ErrorKeys.RESET_PASSWORD_LINK_EXPIRED, res: null };

			if (newPassword !== confirmPassword)
				return { err: ErrorKeys.NEW_PASSWORD_AND_CONFIRMED_PASSWORD_NOT_MATCHED, res: null };

			const userInfo = (await this.getUsersInfo([userId], { includePassword: true }))[0];
			if (!userInfo)
				return { err: ErrorKeys.INVALID_USER, res: null };

			await this.redisService.del([forgotPasswordKey + '_' + userId]);

			return await this.updateUserPassword({ user_id: userId, password: newPassword, confirm_password: confirmPassword }, { req: options.req });
		} catch (ex) {
			throw ex;
		}
	}

	async updateUserPassword(userPassword: UpdateUserPasswordDto, options?: { req?: FastifyRequest }): Promise<any> {
		try {
			const { user_id, password, confirm_password } = userPassword;

			if (password !== confirm_password)
				return { err: ErrorKeys.NEW_PASSWORD_AND_CONFIRMED_PASSWORD_NOT_MATCHED, res: null };

			const user = (await this.getUsersInfo([user_id]))[0];
			if (!user)
				return { err: ErrorKeys.INVALID_USER, res: null };

			const hashedPassword = await hashPassword(password);
			const updateFields = { password: hashedPassword };

			await this.usersRepository.createQueryBuilder().update().set(updateFields).where('id = :id', { id: user_id }).execute();

			await this.eventEmitter.emitAsync('action.log', {
				old_values: user,
				new_values: updateFields,
				action_name: 'change_user_password',
				related_id: user.id,
				action_user_id: options.req?.user?.id || 0,
				req: options.req,
			});

			return { err: null, res: updateFields };
		} catch (ex) {
			throw ex;
		}
	}

	async mapUsersEntity(users: User[]) {
		try {
			const shopIds = [];
			const companyIds = [];

			let shops: any = [];
			let companies: any = [];

			for (const user of users) {
				if (user.entity_id && [USER_ROLE.SHOP].includes(user.role))
					shopIds.push(user.entity_id);

				if (user.entity_id && [USER_ROLE.COMPANY, USER_ROLE.DRIVER].includes(user.role))
					companyIds.push(user.entity_id);
			}

			if (shopIds.length)
				shops = await this.shopsService.getShops({ id: shopIds });

			if (companyIds.length)
				companies = await this.companiesService.getCompanies({ id: companyIds });

			shops = keyBy(shops, 'id');
			companies = keyBy(companies, 'id');

			for (const user of users) {
				if (user.entity_id && [USER_ROLE.SHOP].includes(user.role))
					user.entity_name = shops[user.entity_id]?.name;

				if (user.entity_id && [USER_ROLE.COMPANY, USER_ROLE.DRIVER].includes(user.role))
					user.entity_name = companies[user.entity_id]?.name;
			}

			return users;
		} catch (ex) {
			throw ex;
		}
	}

}
