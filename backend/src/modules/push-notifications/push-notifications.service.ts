import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as admin from 'firebase-admin';
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
        const titles = {
            [NotificationType.ORDER_CREATED]: 'New Order Created',
            [NotificationType.ORDER_ASSIGNED]: 'Order Assigned',
            [NotificationType.ORDER_PICKED_UP]: 'Order Picked Up',
            [NotificationType.ORDER_IN_TRANSIT]: 'Order In Transit',
            [NotificationType.ORDER_DELIVERED]: 'Order Delivered',
            [NotificationType.ORDER_CANCELLED]: 'Order Cancelled',
            [NotificationType.ORDER_UPDATED]: 'Order Updated',
            [NotificationType.DRIVER_ASSIGNED]: 'Driver Assigned',
            [NotificationType.DRIVER_UNASSIGNED]: 'Driver Unassigned',
            [NotificationType.NEW_ORDER_AVAILABLE]: 'New Order Available',
        };

        const bodies = {
            [NotificationType.ORDER_CREATED]: 'A new order has been created.',
            [NotificationType.ORDER_ASSIGNED]: 'Your order has been assigned to a delivery company.',
            [NotificationType.ORDER_PICKED_UP]: 'Your order has been picked up for delivery.',
            [NotificationType.ORDER_IN_TRANSIT]: 'Your order is on its way.',
            [NotificationType.ORDER_DELIVERED]: 'Your order has been delivered.',
            [NotificationType.ORDER_CANCELLED]: 'Your order has been cancelled.',
            [NotificationType.ORDER_UPDATED]: 'Your order has been updated.',
            [NotificationType.DRIVER_ASSIGNED]: 'A driver has been assigned to your order.',
            [NotificationType.DRIVER_UNASSIGNED]: 'The driver has been unassigned from your order.',
            [NotificationType.NEW_ORDER_AVAILABLE]: 'A new order is available for pickup.',
        };

        await this.sendToUsers(userIds, {
            title: customTitle || titles[type] || 'Order Update',
            body: customBody || bodies[type] || 'Your order status has changed.',
            type,
            data: {
                orderId,
                type: 'order_update',
            },
        });
    }
}
