import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ShopRequestStatus } from '../entities/shop-request.entity';

export class ListShopRequestDto {
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
    @IsEnum(ShopRequestStatus)
    status?: ShopRequestStatus;
}
