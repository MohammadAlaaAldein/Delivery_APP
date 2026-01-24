import { PartialType } from '@nestjs/mapped-types';
import { CreateDriverRequestDto } from './create-driver-request.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DriverRequestStatus } from '../entities/driver-request.entity';

export class UpdateDriverRequestDto extends PartialType(CreateDriverRequestDto) {
    @IsOptional()
    @IsEnum(DriverRequestStatus)
    status?: DriverRequestStatus;

    @IsOptional()
    @IsString()
    admin_notes?: string;
}
