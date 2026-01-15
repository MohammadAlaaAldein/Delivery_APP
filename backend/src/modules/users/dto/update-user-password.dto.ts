import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class UpdateUserPasswordDto {
	@IsNotEmpty()
	user_id: number;

	@IsString()
	@MinLength(4)
	password: string;

	@IsString()
	@MinLength(4)
	confirm_password: string;
}