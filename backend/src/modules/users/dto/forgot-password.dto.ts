import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsNumber, IsString, MaxLength, minLength, MinLength } from "class-validator";

export class ForgotPasswordDto {
	@IsEmail()
	@MaxLength(256)
	@IsNotEmpty()
	email: string;

	@IsNotEmpty()
	@IsString()
	captcha_key: string;

	@IsNotEmpty()
	@IsString()
	captcha_text: string;
}

export class ResetUserPasswordDto {
	@IsNotEmpty()
	@IsNumber()
	@Transform(({ value }) => parseInt(value))
	userId: number;

	@IsNotEmpty()
	@MinLength(4)
	newPassword: string;

	@IsNotEmpty()
	@MinLength(4)
	confirmPassword: string;

	@IsNotEmpty()
	@IsString()
	encKey: string;
}