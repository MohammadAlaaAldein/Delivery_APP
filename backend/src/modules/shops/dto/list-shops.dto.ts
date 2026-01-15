import { Transform } from 'class-transformer';
import { IsOptional, IsInt, IsString, IsEmail, MaxLength } from 'class-validator';

export class ListShopDto {
	@IsOptional()
	@Transform(({ value }) => parseInt(value))
	@IsInt()
	id?: number;

	@IsOptional()
	@IsString()
	@MaxLength(100)
	name?: string;
}
