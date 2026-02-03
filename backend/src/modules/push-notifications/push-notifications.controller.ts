import {
    Controller,
    Post,
    Delete,
    Body,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PushNotificationsService } from './push-notifications.service';
import { RegisterDeviceDto, UnregisterDeviceDto } from './dto/push-notification.dto';
import { JwtGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Push Notifications')
@Controller('push-notifications')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class PushNotificationsController {
    constructor(
        private readonly pushNotificationsService: PushNotificationsService,
    ) { }

    @Post('register')
    @ApiOperation({ summary: 'Register device for push notifications' })
    @ApiResponse({ status: 201, description: 'Device registered successfully' })
    async registerDevice(
        @Request() req,
        @Body() dto: RegisterDeviceDto,
    ) {
        const deviceToken = await this.pushNotificationsService.registerDevice(
            req.user.id,
            dto,
        );
        return {
            success: true,
            message: 'Device registered successfully',
            data: {
                id: deviceToken.id,
                platform: deviceToken.platform,
            },
        };
    }

    @Delete('unregister')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Unregister device from push notifications' })
    @ApiResponse({ status: 200, description: 'Device unregistered successfully' })
    async unregisterDevice(@Body() dto: UnregisterDeviceDto) {
        await this.pushNotificationsService.unregisterDevice(dto.token);
        return {
            success: true,
            message: 'Device unregistered successfully',
        };
    }

    @Post('subscribe/:topic')
    @ApiOperation({ summary: 'Subscribe to a notification topic' })
    @ApiResponse({ status: 200, description: 'Subscribed successfully' })
    async subscribeToTopic(
        @Request() req,
        @Body('topic') topic: string,
    ) {
        const result = await this.pushNotificationsService.subscribeToTopic(
            req.user.id,
            topic,
        );
        return {
            success: result,
            message: result ? 'Subscribed successfully' : 'Failed to subscribe',
        };
    }

    @Delete('unsubscribe/:topic')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Unsubscribe from a notification topic' })
    @ApiResponse({ status: 200, description: 'Unsubscribed successfully' })
    async unsubscribeFromTopic(
        @Request() req,
        @Body('topic') topic: string,
    ) {
        const result = await this.pushNotificationsService.unsubscribeFromTopic(
            req.user.id,
            topic,
        );
        return {
            success: result,
            message: result ? 'Unsubscribed successfully' : 'Failed to unsubscribe',
        };
    }
}
