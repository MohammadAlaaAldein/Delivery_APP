import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import * as admin from 'firebase-admin';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DeviceToken } from './entities/device-token.entity';
import { NotificationLog } from './entities/notification-log.entity';
import {
    RegisterDeviceDto,
    SendNotificationDto,
    NotificationType,
} from './dto/push-notification.dto';

@Injectable()
export class PushNotificationsService implements OnModuleInit {
    private readonly logger = new Logger(PushNotificationsService.name);
    private firebaseApp: admin.app.App;

    constructor(
        @InjectRepository(DeviceToken)
        private readonly deviceTokenRepository: Repository<DeviceToken>,
        @InjectRepository(NotificationLog)
        private readonly notificationLogRepository: Repository<NotificationLog>,
    ) { }

    onModuleInit() {
        try {
            // Initialize Firebase Admin SDK
            // You can use a service account JSON file or environment variables
            const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
                ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
                : null;

            if (serviceAccount) {
                this.firebaseApp = admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });
                this.logger.log('Firebase Admin SDK initialized successfully');
            } else {
                this.logger.warn(
                    'Firebase service account not configured. Push notifications will be disabled.',
                );
            }
        } catch (error) {
            this.logger.error('Failed to initialize Firebase Admin SDK', error);
        }
    }

    /**
     * Register a device token for push notifications
     */
    async registerDevice(userId: string, dto: RegisterDeviceDto): Promise<DeviceToken> {
        // Check if token already exists
        let deviceToken = await this.deviceTokenRepository.findOne({
            where: { token: dto.token },
        });

        if (deviceToken) {
            // Update existing token
            deviceToken.userId = userId;
            deviceToken.platform = dto.platform;
            deviceToken.deviceId = dto.deviceId;
            deviceToken.deviceName = dto.deviceName;
            deviceToken.isActive = true;
            deviceToken.lastUsedAt = new Date();
        } else {
            // Create new token
            deviceToken = this.deviceTokenRepository.create({
                userId,
                token: dto.token,
                platform: dto.platform,
                deviceId: dto.deviceId,
                deviceName: dto.deviceName,
                isActive: true,
                lastUsedAt: new Date(),
            });
        }

        return this.deviceTokenRepository.save(deviceToken);
    }

    /**
     * Unregister a device token
     */
    async unregisterDevice(token: string): Promise<boolean> {
        const result = await this.deviceTokenRepository.update(
            { token },
            { isActive: false },
        );
        return result.affected > 0;
    }

    /**
     * Get all active device tokens for a user
     */
    async getUserDeviceTokens(userId: string): Promise<string[]> {
        const tokens = await this.deviceTokenRepository.find({
            where: { userId, isActive: true },
            select: ['token'],
        });
        return tokens.map((t) => t.token);
    }

    /**
     * Send notification to a specific user
     */
    async sendToUser(
        userId: string,
        notification: SendNotificationDto,
    ): Promise<{ success: boolean; failedTokens?: string[] }> {
        const tokens = await this.getUserDeviceTokens(userId);

        if (tokens.length === 0) {
            this.logger.warn(`No device tokens found for user ${userId}`);
            return { success: false };
        }

        return this.sendToTokens(tokens, notification, userId);
    }

    /**
     * Send notification to multiple users
     */
    async sendToUsers(
        userIds: string[],
        notification: SendNotificationDto,
    ): Promise<{ success: boolean; failedTokens?: string[] }> {
        const tokens = await this.deviceTokenRepository.find({
            where: { userId: In(userIds), isActive: true },
            select: ['token'],
        });

        if (tokens.length === 0) {
            this.logger.warn('No device tokens found for users');
            return { success: false };
        }

        return this.sendToTokens(
            tokens.map((t) => t.token),
            notification,
        );
    }

    /**
     * Send notification to a topic
     */
    async sendToTopic(
        topic: string,
        notification: SendNotificationDto,
    ): Promise<{ success: boolean; messageId?: string }> {
        if (!this.firebaseApp) {
            this.logger.warn('Firebase not configured. Skipping notification.');
            return { success: false };
        }

        try {
            const message: admin.messaging.Message = {
                topic,
                notification: {
                    title: notification.title,
                    body: notification.body,
                },
                data: this.prepareData(notification.data, notification.type),
                android: {
                    priority: 'high',
                    notification: {
                        channelId: 'delivery_notifications',
                        priority: 'high',
                        defaultSound: true,
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1,
                        },
                    },
                },
            };

            const response = await admin.messaging().send(message);

            await this.logNotification({
                title: notification.title,
                body: notification.body,
                type: notification.type || NotificationType.GENERAL,
                data: notification.data,
                topic,
                success: true,
            });

            return { success: true, messageId: response };
        } catch (error) {
            this.logger.error(`Failed to send notification to topic ${topic}`, error);

            await this.logNotification({
                title: notification.title,
                body: notification.body,
                type: notification.type || NotificationType.GENERAL,
                data: notification.data,
                topic,
                success: false,
                errorMessage: error.message,
            });

            return { success: false };
        }
    }

    /**
     * Subscribe user to a topic
     */
    async subscribeToTopic(userId: string, topic: string): Promise<boolean> {
        if (!this.firebaseApp) {
            return false;
        }

        const tokens = await this.getUserDeviceTokens(userId);
        if (tokens.length === 0) {
            return false;
        }

        try {
            await admin.messaging().subscribeToTopic(tokens, topic);
            return true;
        } catch (error) {
            this.logger.error(`Failed to subscribe user ${userId} to topic ${topic}`, error);
            return false;
        }
    }

    /**
     * Unsubscribe user from a topic
     */
    async unsubscribeFromTopic(userId: string, topic: string): Promise<boolean> {
        if (!this.firebaseApp) {
            return false;
        }

        const tokens = await this.getUserDeviceTokens(userId);
        if (tokens.length === 0) {
            return false;
        }

        try {
            await admin.messaging().unsubscribeFromTopic(tokens, topic);
            return true;
        } catch (error) {
            this.logger.error(`Failed to unsubscribe user ${userId} from topic ${topic}`, error);
            return false;
        }
    }

    /**
     * Send notification to specific tokens
     */
    private async sendToTokens(
        tokens: string[],
        notification: SendNotificationDto,
        userId?: string,
    ): Promise<{ success: boolean; failedTokens?: string[] }> {
        if (!this.firebaseApp) {
            this.logger.warn('Firebase not configured. Skipping notification.');
            return { success: false };
        }

        try {
            const message: admin.messaging.MulticastMessage = {
                tokens,
                notification: {
                    title: notification.title,
                    body: notification.body,
                },
                data: this.prepareData(notification.data, notification.type),
                android: {
                    priority: 'high',
                    notification: {
                        channelId: 'delivery_notifications',
                        priority: 'high',
                        defaultSound: true,
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1,
                        },
                    },
                },
            };

            const response = await admin.messaging().sendEachForMulticast(message);

            // Handle failed tokens
            const failedTokens: string[] = [];
            if (response.failureCount > 0) {
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        failedTokens.push(tokens[idx]);
                        // Deactivate invalid tokens
                        if (
                            resp.error?.code === 'messaging/invalid-registration-token' ||
                            resp.error?.code === 'messaging/registration-token-not-registered'
                        ) {
                            this.deviceTokenRepository.update(
                                { token: tokens[idx] },
                                { isActive: false },
                            );
                        }
                    }
                });
            }

            await this.logNotification({
                userId,
                title: notification.title,
                body: notification.body,
                type: notification.type || NotificationType.GENERAL,
                data: notification.data,
                success: response.successCount > 0,
                errorMessage:
                    response.failureCount > 0
                        ? `${response.failureCount} tokens failed`
                        : undefined,
            });

            return {
                success: response.successCount > 0,
                failedTokens: failedTokens.length > 0 ? failedTokens : undefined,
            };
        } catch (error) {
            this.logger.error('Failed to send push notification', error);

            await this.logNotification({
                userId,
                title: notification.title,
                body: notification.body,
                type: notification.type || NotificationType.GENERAL,
                data: notification.data,
                success: false,
                errorMessage: error.message,
            });

            return { success: false };
        }
    }

    /**
     * Prepare data payload for notification
     */
    private prepareData(
        data?: Record<string, any>,
        type?: NotificationType,
    ): Record<string, string> {
        const result: Record<string, string> = {};

        if (type) {
            result.type = type;
        }

        if (data) {
            Object.entries(data).forEach(([key, value]) => {
                result[key] = typeof value === 'string' ? value : JSON.stringify(value);
            });
        }

        return result;
    }

    /**
     * Log notification for debugging and analytics
     */
    private async logNotification(log: {
        userId?: string;
        title: string;
        body: string;
        type: NotificationType;
        data?: Record<string, any>;
        topic?: string;
        success: boolean;
        errorMessage?: string;
    }): Promise<void> {
        try {
            await this.notificationLogRepository.save({
                ...log,
                sentAt: new Date(),
            });
        } catch (error) {
            this.logger.error('Failed to log notification', error);
        }
    }

    /**
     * Send order-related notifications
     */
    async sendOrderNotification(
        orderId: string,
        type: NotificationType,
        userIds: string[],
        customTitle?: string,
        customBody?: string,
    ): Promise<void> {
        // Arabic titles for notifications
        const titles = {
            [NotificationType.ORDER_CREATED]: 'طلب جديد',
            [NotificationType.ORDER_ASSIGNED]: 'تم تعيين الطلب',
            [NotificationType.ORDER_PICKED_UP]: 'تم استلام الطلب',
            [NotificationType.ORDER_IN_TRANSIT]: 'الطلب في الطريق',
            [NotificationType.ORDER_DELIVERED]: 'تم تسليم الطلب',
            [NotificationType.ORDER_CANCELLED]: 'تم إلغاء الطلب',
            [NotificationType.ORDER_UPDATED]: 'تم تحديث الطلب',
            [NotificationType.DRIVER_ASSIGNED]: 'تم تعيين سائق',
            [NotificationType.DRIVER_UNASSIGNED]: 'تم إلغاء تعيين السائق',
            [NotificationType.NEW_ORDER_AVAILABLE]: 'طلب جديد متاح',
        };

        // Arabic bodies for notifications
        const bodies = {
            [NotificationType.ORDER_CREATED]: 'تم إنشاء طلب جديد.',
            [NotificationType.ORDER_ASSIGNED]: 'تم تعيين طلبك لشركة توصيل.',
            [NotificationType.ORDER_PICKED_UP]: 'تم استلام طلبك للتوصيل.',
            [NotificationType.ORDER_IN_TRANSIT]: 'طلبك في الطريق إليك.',
            [NotificationType.ORDER_DELIVERED]: 'تم تسليم طلبك بنجاح.',
            [NotificationType.ORDER_CANCELLED]: 'تم إلغاء طلبك.',
            [NotificationType.ORDER_UPDATED]: 'تم تحديث طلبك.',
            [NotificationType.DRIVER_ASSIGNED]: 'تم تعيين سائق لطلبك.',
            [NotificationType.DRIVER_UNASSIGNED]: 'تم إلغاء تعيين السائق من طلبك.',
            [NotificationType.NEW_ORDER_AVAILABLE]: 'يوجد طلب جديد متاح للاستلام.',
        };

        await this.sendToUsers(userIds, {
            title: customTitle || titles[type] || 'تحديث الطلب',
            body: customBody || bodies[type] || 'تم تغيير حالة طلبك.',
            type,
            data: {
                orderId,
                type: 'order_update',
            },
        });
    }

    /**
     * Cleanup expired/inactive device tokens
     * Runs daily at 3:00 AM
     */
    @Cron(CronExpression.EVERY_DAY_AT_3AM)
    async cleanupExpiredTokens(): Promise<{ deleted: number }> {
        try {
            this.logger.log('Starting cleanup of expired device tokens...');

            // Calculate the cutoff date (30 days ago)
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 30);

            // Delete tokens that are:
            // 1. Inactive (marked as invalid)
            // 2. Not used for more than 30 days
            const inactiveResult = await this.deviceTokenRepository.delete({
                isActive: false,
            });

            const expiredResult = await this.deviceTokenRepository.delete({
                lastUsedAt: LessThan(cutoffDate),
            });

            // Also delete tokens that were created more than 30 days ago but never used
            const unusedResult = await this.deviceTokenRepository
                .createQueryBuilder()
                .delete()
                .from(DeviceToken)
                .where('last_used_at IS NULL')
                .andWhere('created_at < :cutoffDate', { cutoffDate })
                .execute();

            const totalDeleted =
                (inactiveResult.affected || 0) +
                (expiredResult.affected || 0) +
                (unusedResult.affected || 0);

            this.logger.log(
                `Cleanup completed. Deleted ${totalDeleted} tokens: ` +
                `${inactiveResult.affected || 0} inactive, ` +
                `${expiredResult.affected || 0} expired, ` +
                `${unusedResult.affected || 0} unused`,
            );

            return { deleted: totalDeleted };
        } catch (error) {
            this.logger.error('Failed to cleanup expired tokens', error);
            return { deleted: 0 };
        }
    }

    /**
     * Get token statistics for monitoring
     */
    async getTokenStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        byPlatform: Record<string, number>;
    }> {
        try {
            const total = await this.deviceTokenRepository.count();
            const active = await this.deviceTokenRepository.count({
                where: { isActive: true },
            });
            const inactive = total - active;

            // Count by platform
            const platformStats = await this.deviceTokenRepository
                .createQueryBuilder('token')
                .select('token.platform', 'platform')
                .addSelect('COUNT(*)', 'count')
                .groupBy('token.platform')
                .getRawMany();

            const byPlatform: Record<string, number> = {};
            platformStats.forEach((stat) => {
                byPlatform[stat.platform] = parseInt(stat.count, 10);
            });

            return { total, active, inactive, byPlatform };
        } catch (error) {
            this.logger.error('Failed to get token stats', error);
            return { total: 0, active: 0, inactive: 0, byPlatform: {} };
        }
    }

    /**
     * Update last used timestamp when sending notifications
     */
    private async updateLastUsed(tokens: string[]): Promise<void> {
        try {
            await this.deviceTokenRepository.update(
                { token: In(tokens), isActive: true },
                { lastUsedAt: new Date() },
            );
        } catch (error) {
            this.logger.error('Failed to update last used timestamp', error);
        }
    }
}
