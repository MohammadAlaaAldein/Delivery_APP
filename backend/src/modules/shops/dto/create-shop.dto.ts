import { IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateShopDto {
	@IsString()
	@MinLength(1)
	@MaxLength(100)
	@Transform(({ value }) => value.trim())
	name: string;
}