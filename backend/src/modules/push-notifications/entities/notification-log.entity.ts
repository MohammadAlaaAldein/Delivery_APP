import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
} from 'typeorm';
import { NotificationType } from '../dto/push-notification.dto';

@Entity('notification_logs')
export class NotificationLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', nullable: true })
    @Index()
    userId: string;

    @Column({ name: 'title' })
    title: string;

    @Column({ name: 'body' })
    body: string;

    @Column({ name: 'type', type: 'enum', enum: NotificationType, default: NotificationType.GENERAL })
    type: NotificationType;

    @Column({ name: 'data', type: 'json', nullable: true })
    data: Record<string, any>;

    @Column({ name: 'topic', nullable: true })
    topic: string;

    @Column({ name: 'success', default: true })
    success: boolean;

    @Column({ name: 'error_message', nullable: true })
    errorMessage: string;

    @Column({ name: 'sent_at' })
    @Index()
    sentAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
