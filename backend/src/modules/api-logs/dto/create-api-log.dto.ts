import { IsNumber, IsString } from "class-validator";

export class CreateApiLogDto {
	@IsNumber()
	user_id: number;

	@IsString()
	end_point: string;

	@IsString()
	body_request: string;

	@IsString()
	query_request: string;

	@IsString()
	response: string;
}
