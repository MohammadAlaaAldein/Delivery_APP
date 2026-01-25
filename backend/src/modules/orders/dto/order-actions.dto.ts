import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

// For company to take an order
export class TakeOrderDto {
    @IsOptional()
    @IsString()
    company_notes?: string;
}

// For company to assign order to driver
export class AssignDriverDto {
    @IsNotEmpty()
    @IsNumber()
    driver_id: number;

    @IsOptional()
    @IsString()
    company_notes?: string;
}

// For updating order status
export class UpdateStatusDto {
    @IsOptional()
    @IsString()
    notes?: string;
}

// For cancelling order
export class CancelOrderDto {
    @IsNotEmpty()
    @IsString()
    cancellation_reason: string;
}
