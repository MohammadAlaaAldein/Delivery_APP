import { PartialType } from '@nestjs/mapped-types';
import { CreateShopRequestDto } from './create-shop-request.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ShopRequestStatus } from '../entities/shop-request.entity';

export class UpdateShopRequestDto extends PartialType(CreateShopRequestDto) {
    @IsOptional()
    @IsEnum(ShopRequestStatus)
    status?: ShopRequestStatus;

    @IsOptional()
    @IsString()
    admin_notes?: string;
}
