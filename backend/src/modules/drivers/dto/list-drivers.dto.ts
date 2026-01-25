import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListDriversDto {
    @IsOptional()
    @IsNumber()
    @Transform(({ value }) => parseInt(value))
    user_id?: number;

    @IsOptional()
    @IsNumber()
    @Transform(({ value }) => parseInt(value))
    company_id?: number;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    license_number?: string;

    @IsOptional()
    @IsString()
    plate_number?: string;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    is_active?: boolean;
}
