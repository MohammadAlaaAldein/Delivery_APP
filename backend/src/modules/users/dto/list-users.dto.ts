import { Transform } from 'class-transformer';
import { IsOptional, IsInt, IsString, IsEmail, MaxLength, IsEnum } from 'class-validator';
import { USER_ROLE } from '../users.service';

export class ListUsersDto {
	@IsOptional()
	@Transform(({ value }) => parseInt(value))
	@IsInt()
	id?: number;

	@IsOptional()
	@IsString()
	@MaxLength(100)
	name?: string;

	@IsOptional()
	@IsEmail()
	@Transform(({ value }) => (value === '' ? undefined : value))
	email?: string;

	@IsString()
	@MaxLength(100)
	@IsOptional()
	role?: USER_ROLE;

	@IsOptional()
	entity_id?: number;
}
