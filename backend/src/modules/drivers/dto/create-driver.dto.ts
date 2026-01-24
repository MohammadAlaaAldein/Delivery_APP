import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { VehicleType } from '../entities/driver.entity';

export class CreateDriverDto {
    @IsNumber()
    user_id: number;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;

    @IsOptional()
    @IsNumber()
    company_id?: number;

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

    // TODO: Implement file upload functionality later
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

    // TODO: Implement file upload functionality later
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

    // TODO: Implement file upload functionality later
    @IsOptional()
    @IsString()
    vehicle_image?: string;
}
