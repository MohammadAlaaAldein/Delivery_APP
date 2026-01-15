import { Transform } from 'class-transformer';
import { IsOptional, IsInt, IsString, IsEmail, MaxLength } from 'class-validator';

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

	@IsOptional()
	@IsString()
	domain?: string;
}
