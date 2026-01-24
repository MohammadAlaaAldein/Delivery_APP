import { IsArray, IsEmail, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCompanyDto {
	@IsString()
	@MinLength(1)
	@MaxLength(100)
	@Transform(({ value }) => value.trim())
	name: string;

	@IsOptional()
	@IsArray()
	@IsNumber({}, { each: true })
	shop_ids?: number[];

	// Location fields
	@IsOptional()
	@IsString()
	@MaxLength(100)
	city?: string;

	@IsOptional()
	@IsString()
	address?: string;

	// Contact fields
	@IsOptional()
	@IsString()
	@MaxLength(30)
	phone?: string;

	@IsOptional()
	@IsString()
	@IsEmail()
	@MaxLength(255)
	email?: string;

	@IsOptional()
	@IsString()
	@MaxLength(255)
	website?: string;

	// Company info
	@IsOptional()
	@IsString()
	@MaxLength(50)
	company_type?: string;

	// License fields
	@IsOptional()
	@IsString()
	@MaxLength(100)
	license_number?: string;

	@IsOptional()
	@IsString()
	license_expiry_date?: string;
}