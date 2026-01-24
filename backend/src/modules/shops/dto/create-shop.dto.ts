import { IsArray, IsEmail, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateShopDto {
	@IsString()
	@MinLength(1)
	@MaxLength(100)
	@Transform(({ value }) => value.trim())
	name: string;

	@IsOptional()
	@IsArray()
	@IsNumber({}, { each: true })
	company_ids?: number[];

	// Location fields
	@IsOptional()
	@IsString()
	@MaxLength(100)
	city?: string;

	@IsOptional()
	@IsString()
	@MaxLength(100)
	area?: string;

	@IsOptional()
	@IsString()
	@MaxLength(255)
	street?: string;

	@IsOptional()
	@IsString()
	@MaxLength(100)
	building?: string;

	@IsOptional()
	@Transform(({ value }) => value === '' || value === null ? null : parseFloat(value))
	@IsNumber()
	latitude?: number;

	@IsOptional()
	@Transform(({ value }) => value === '' || value === null ? null : parseFloat(value))
	@IsNumber()
	longitude?: number;

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
	@MaxLength(30)
	whatsapp?: string;

	@IsOptional()
	@IsString()
	@IsEmail()
	@MaxLength(255)
	email?: string;

	// License fields
	@IsOptional()
	@IsString()
	@MaxLength(100)
	license_number?: string;

	@IsOptional()
	@IsString()
	@MaxLength(100)
	license_type?: string;

	@IsOptional()
	@IsString()
	license_expiry_date?: string;
}