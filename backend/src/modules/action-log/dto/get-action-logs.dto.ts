import { Type } from "class-transformer";
import { IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class GetActionLogDto {
	@Type(() => Number)
	@IsInt()
	@Min(1)
	current_page: number;

	@Type(() => Number)
	@IsInt()
	@Min(1)
	limit: number;

	@IsOptional()
	@IsString()
	action_name?: string;

	@IsOptional()
	@IsString()
	log_month?: string;

	@IsOptional()
	@IsString()
	related_id?: string;

	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	action_user_id?: number;

	@IsOptional()
	@IsString()
	generic_id_search?: string;
}