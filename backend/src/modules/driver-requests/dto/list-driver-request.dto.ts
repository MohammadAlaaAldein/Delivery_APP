import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { DriverRequestStatus } from '../entities/driver-request.entity';

export class ListDriverRequestDto {
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    id?: number;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    requesting_company_id?: number;

    @IsOptional()
    @Transform(({ value }) => value === '' ? undefined : value)
    @IsEnum(DriverRequestStatus)
    status?: DriverRequestStatus;
}
