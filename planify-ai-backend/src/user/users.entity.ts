import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

import { AddressEntity } from './../addresses/addresses.entity';

export enum UserStatus {
    Active = 'Active',
    Inactive = 'Inactive',
}

export enum UserRole {
    Admin = 'Admin',
    Vendor = 'Vendor',
}

export enum Gender {
    Male = 'Male',
    Female = 'Female',
    Other = 'Other',
}

@Entity('users')
export class UserEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar' })
    firstName!: string;

    @Column({ type: 'varchar' })
    lastName!: string;

    @Column({ type: 'varchar' })
    email!: string;

    @Column({ type: 'varchar' })
    mobile!: string;

    @Column({
        type: 'enum',
        enum: Gender,
        nullable: true,
    })
    gender?: Gender;

    @Column({ type: 'varchar', length: 500, nullable: true })
    profile?: string | null;

    @Column({ type: 'varchar', nullable: true })
    password?: string | null;

    @Column({ default: false })
    isVerified!: boolean;

    @Column({ nullable: true, type: 'varchar' })
    refreshToken?: string | null;

    @Column({ nullable: true, type: 'varchar' })
    resetPasswordToken?: string | null;

    @Column({ nullable: true, type: 'timestamp' })
    resetPasswordExpires?: Date | null;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.Vendor,
    })
    role?: UserRole;

    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.Active,
    })
    status?: UserStatus;

    @Column({ nullable: true, type: 'varchar' })
    otp?: string | null;

    @Column({ nullable: true, type: 'timestamp' })
    otpExpires?: Date | null;

    @Column({ default: false })
    isDeleted!: boolean;

    @OneToMany(() => AddressEntity, (address) => address.user)
    addresses?: AddressEntity[];

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    @Column({ nullable: true, type: 'varchar' })
    sessionToken?: string | null;
}
