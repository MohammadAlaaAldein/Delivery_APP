import { IsNotEmpty, IsString, IsOptional, IsArray, IsObject, IsEnum } from 'class-validator';

export enum NotificationType {
    ORDER_CREATED = 'ORDER_CREATED',
    ORDER_ASSIGNED = 'ORDER_ASSIGNED',
    ORDER_PICKED_UP = 'ORDER_PICKED_UP',
    ORDER_IN_TRANSIT = 'ORDER_IN_TRANSIT',
    ORDER_DELIVERED = 'ORDER_DELIVERED',
    ORDER_CANCELLED = 'ORDER_CANCELLED',
    ORDER_UPDATED = 'ORDER_UPDATED',
    DRIVER_ASSIGNED = 'DRIVER_ASSIGNED',
    DRIVER_UNASSIGNED = 'DRIVER_UNASSIGNED',
    NEW_ORDER_AVAILABLE = 'NEW_ORDER_AVAILABLE',
    GENERAL = 'GENERAL',
}

export class RegisterDeviceDto {
    @IsString()
    @IsNotEmpty()
    token: string;

    @IsString()
    @IsNotEmpty()
    platform: string; // 'ios' | 'android' | 'web'

    @IsString()
    @IsOptional()
    deviceId?: string;

    @IsString()
    @IsOptional()
    deviceName?: string;
}

export class SendNotificationDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    body: string;

    @IsObject()
    @IsOptional()
    data?: Record<string, any>;

    @IsEnum(NotificationType)
    @IsOptional()
    type?: NotificationType;
}

export class SendToUserDto extends SendNotificationDto {
    @IsString()
    @IsNotEmpty()
    userId: string;
}

export class SendToUsersDto extends SendNotificationDto {
    @IsArray()
    @IsString({ each: true })
    userIds: string[];
}

export class SendToTopicDto extends SendNotificationDto {
    @IsString()
    @IsNotEmpty()
    topic: string;
}

export class UnregisterDeviceDto {
    @IsString()
    @IsNotEmpty()
    token: string;
}
