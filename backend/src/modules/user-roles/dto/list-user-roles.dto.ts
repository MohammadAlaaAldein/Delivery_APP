import { Transform, Type } from 'class-transformer';
import { IsOptional, IsInt, IsString, IsEmail, MaxLength, IsPositive, MinLength, IsEnum } from 'class-validator';
import { ENTITY_TYPE, USER_ROLE } from '../user-roles.service';

export class ListUsersRolesDto {
	@IsOptional()
	@Transform(({ value }) => parseInt(value))
	@IsInt()
	id?: number;

	@IsInt()
	@IsPositive()
	@Type(() => Number)
	user_id?: number;

	@IsString()
	@MinLength(1)
	@MaxLength(50)
	@Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
	role?: USER_ROLE;

	@IsEnum(ENTITY_TYPE)
	@Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
	entity_type?: ENTITY_TYPE;

	@IsOptional()
	@IsInt()
	@IsPositive()
	@Type(() => Number)
	entity_id?: number;
}
