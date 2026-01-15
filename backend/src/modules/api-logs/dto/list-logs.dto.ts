import { Transform } from 'class-transformer';
import { IsOptional, IsInt, IsString, MaxLength, IsDateString } from 'class-validator';

export class ListApiLogsDto {
	@IsOptional()
	@Transform(({ value }) => parseInt(value))
	@IsInt()
	user_id?: number;

	@IsOptional()
	@IsString()
	@MaxLength(100)
	end_point?: string;
}