import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class ChangeUserPasswordDto {
	@IsString()
	@IsNotEmpty()
	old_password: string;

	@IsString()
	@MinLength(4)
	new_password: string;

	@IsNotEmpty()
	@IsString()
	confirmed_password: string;
}
