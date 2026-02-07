import {
    Controller,
    Post,
    Delete,
    Body,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
    Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PushNotificationsService } from './push-notifications.service';
import { RegisterDeviceDto, UnregisterDeviceDto, SendNotificationDto, NotificationType } from './dto/push-notification.dto';
import { JwtGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Push Notifications')
@Controller('push-notifications')
@ApiBearerAuth()
export class PushNotificationsController {
    constructor(
        private readonly pushNotificationsService: PushNotificationsService,
    ) { }

    @Post('register')
    @UseGuards(JwtGuard)
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
    @UseGuards(JwtGuard)
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
    @UseGuards(JwtGuard)
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

    @Post('test')
    @UseGuards(JwtGuard)
    @ApiOperation({ summary: 'Send a test notification to the current user' })
    @ApiResponse({ status: 200, description: 'Test notification sent' })
    async sendTestNotification(@Request() req) {
        const result = await this.pushNotificationsService.sendToUser(req.user.id, {
            title: '🔔 Test Notification',
            body: 'This is a test notification from your Delivery App! If you see this, notifications are working perfectly! 🎉',
            type: NotificationType.GENERAL,
            data: {
                testId: Date.now().toString(),
                timestamp: new Date().toISOString(),
            },
        });
        return {
            success: result.success,
            message: result.success
                ? 'Test notification sent successfully!'
                : 'Failed to send test notification. Make sure you have registered your device.',
        };
    }

    @Get('stats')
    @UseGuards(JwtGuard)
    @ApiOperation({ summary: 'Get notification statistics' })
    @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
    async getStats() {
        const stats = await this.pushNotificationsService.getTokenStats();
        return {
            success: true,
            data: stats,
        };
    }
}
