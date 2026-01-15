import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { USER_ROLE } from '../users.service';

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

	@IsString()
	@MinLength(4)
	password: string;

	@IsEnum(USER_ROLE)
	role: USER_ROLE
}