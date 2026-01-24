import { IsDateString, IsEmail, IsEnum, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { VehicleType } from '../../drivers/entities/driver.entity';

export class CreateDriverRequestDto {
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    @Transform(({ value }) => value.trim())
    name: string;

    @IsOptional()
    @IsString()
    @IsEmail()
    @MaxLength(255)
    email?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    national_id?: string;

    @IsOptional()
    @IsDateString()
    birth_date?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    phone?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    city?: string;

    @IsOptional()
    @IsString()
    personal_image?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    license_number?: string;

    @IsOptional()
    @IsDateString()
    license_expiry_date?: string;

    @IsOptional()
    @IsString()
    license_image?: string;

    @IsOptional()
    @IsEnum(VehicleType)
    vehicle_type?: VehicleType;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    vehicle_brand?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    vehicle_model?: string;

    @IsOptional()
    @IsNumber()
    vehicle_year?: number;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    vehicle_color?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    plate_number?: string;

    @IsOptional()
    @IsString()
    vehicle_image?: string;
}
