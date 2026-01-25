import { IsNotEmpty, IsOptional, IsNumber, IsString, IsEnum, IsEmail, Min, IsDateString } from 'class-validator';
import { PaymentMethod } from '../entities/order.entity';

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
    @IsEmail()
    customer_email?: string;

    // Delivery Address
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

    // Order Details
    @IsOptional()
    @IsString()
    order_description?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    items_count?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    order_amount?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
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
    @IsNumber()
    company_id?: number;
}
