import { Transform } from 'class-transformer';
import { IsOptional, IsInt, IsString, MaxLength } from 'class-validator';

export class ListCompanyDto {
	@IsOptional()
	@Transform(({ value }) => parseInt(value))
	@IsInt()
	id?: number | number[];

	@IsOptional()
	@IsString()
	@MaxLength(100)
	name?: string;
}
