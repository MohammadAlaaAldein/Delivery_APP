import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { AccessFunctionsDto } from './update-access-functions.dto';
import { ENTITY_TYPE, USER_ROLE } from 'src/modules/user-roles/user-roles.service';

export class CreateUserDto {
	@IsString()
	@MinLength(1)
	@MaxLength(100)
	@Transform(({ value }) => value.trim())
	name: string;

	@IsEmail()
	@MaxLength(256)
	@IsNotEmpty()
	@Transform(({ value }) => value.trim())
	email: string;

	@IsBoolean()
	is_active: boolean;

	@IsString()
	@MinLength(4)
	password: string;

	@IsOptional()
	access_functions: AccessFunctionsDto;

	@IsEnum(USER_ROLE)
	role: USER_ROLE

	@IsEnum(ENTITY_TYPE)
	entity_type: ENTITY_TYPE
}