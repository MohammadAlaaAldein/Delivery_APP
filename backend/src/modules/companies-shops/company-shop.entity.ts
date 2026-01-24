import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('companies_shops')
export class CompanyShop {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'integer' })
    company_id: number;

    @Column({ type: 'integer' })
    shop_id: number;

    @CreateDateColumn({ type: 'timestamp without time zone' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp without time zone' })
    updated_at: Date;

    @DeleteDateColumn({ type: 'timestamp without time zone', nullable: true })
    deleted_at: Date;
}
