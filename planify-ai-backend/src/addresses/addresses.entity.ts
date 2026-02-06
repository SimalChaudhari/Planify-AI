import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { UserEntity } from './../user/users.entity';

@Entity('addresses')
export class AddressEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255 })
    mobile!: string;

    @Column({ type: 'varchar', length: 255 })
    street_address!: string;

    // @Column({ type: 'varchar', length: 255 })
    // city!: string;

    @Column({ type: 'varchar', length: 255 })
    state!: string;

    @Column({ type: 'varchar', length: 10 })
    zip_code!: string;

    @Column({ type: 'varchar', length: 100 })
    country!: string;

    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at!: Date;

    @ManyToOne(() => UserEntity, (user) => user.addresses, { nullable: false, onDelete: 'CASCADE' })
    user!: UserEntity;
}
