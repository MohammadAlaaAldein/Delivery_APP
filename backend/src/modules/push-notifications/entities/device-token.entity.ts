import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';

@Entity('device_tokens')
export class DeviceToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id' })
    @Index()
    userId: string;

    @Column({ name: 'token', unique: true })
    token: string;

    @Column({ name: 'platform' })
    platform: string; // 'ios' | 'android' | 'web'

    @Column({ name: 'device_id', nullable: true })
    deviceId: string;

    @Column({ name: 'device_name', nullable: true })
    deviceName: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'last_used_at', nullable: true })
    lastUsedAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
