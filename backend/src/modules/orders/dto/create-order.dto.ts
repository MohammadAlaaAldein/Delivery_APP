import { IsNotEmpty, IsOptional, IsNumber, IsString, IsEnum, IsEmail, Min, IsDateString, IsBoolean, IsArray, ValidateNested, ValidateIf } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PaymentMethod, OrderItemType } from '../entities/order.entity';

// DTO for individual order items
export class OrderItemDto {
    @IsNotEmpty()
    @IsString()
    type: OrderItemType | string;

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    count: number;

    @IsOptional()
    @IsString()
    size?: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class CreateOrderDto {
    // Customer Information (required)
    @IsNotEmpty()
    @IsString()
    customer_name: string;

    @IsNotEmpty()
    @IsString()
    customer_phone: string;

    @IsOptional()
    @IsString()
    customer_phone_alt?: string;

    @IsOptional()
    @ValidateIf((o) => o.customer_email !== '' && o.customer_email !== null && o.customer_email !== undefined)
    @IsEmail()
    @Transform(({ value }) => value === '' ? undefined : value)
    customer_email?: string;

    // Delivery Address (all optional for flexibility)
    @IsOptional()
    @IsString()
    delivery_city?: string;

    @IsOptional()
    @IsString()
    delivery_area?: string;

    @IsOptional()
    @IsString()
    delivery_street?: string;

    @IsOptional()
    @IsString()
    delivery_building?: string;

    @IsOptional()
    @IsString()
    delivery_address?: string;

    @IsOptional()
    @IsNumber()
    delivery_latitude?: number;

    @IsOptional()
    @IsNumber()
    delivery_longitude?: number;

    @IsOptional()
    @IsString()
    delivery_notes?: string;

    // Order Items (JSON array) - simplified order details
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    order_items?: OrderItemDto[];

    // Large vehicle requirement
    @IsOptional()
    @IsBoolean()
    requires_large_vehicle?: boolean;

    @IsOptional()
    @ValidateIf((o) => o.order_amount !== '' && o.order_amount !== null && o.order_amount !== undefined)
    @IsNumber()
    @Min(0)
    @Transform(({ value }) => (value === '' || value === null || value === undefined) ? undefined : Number(value))
    order_amount?: number;

    @IsOptional()
    @ValidateIf((o) => o.delivery_fee !== '' && o.delivery_fee !== null && o.delivery_fee !== undefined)
    @IsNumber()
    @Min(0)
    @Transform(({ value }) => (value === '' || value === null || value === undefined) ? undefined : Number(value))
    delivery_fee?: number;

    // Payment
    @IsOptional()
    @IsEnum(PaymentMethod)
    payment_method?: PaymentMethod;

    // Scheduling
    @IsOptional()
    @IsDateString()
    scheduled_pickup_time?: string;

    @IsOptional()
    @IsDateString()
    scheduled_delivery_time?: string;

    @IsOptional()
    @IsNumber()
    priority?: number;

    // Notes
    @IsOptional()
    @IsString()
    shop_notes?: string;

    // Optional: Specify company (if shop wants specific company)
    @IsOptional()
    @Transform(({ value }) => (value === null || value === undefined || value === '') ? undefined : Number(value))
    @IsNumber()
    company_id?: number;
}
