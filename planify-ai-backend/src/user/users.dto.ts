//users.dto.ts
import { IsNotEmpty, IsOptional, IsString, IsEmail, IsEnum } from 'class-validator';

export enum UserRole {
    Admin = 'Admin',
    Vendor = 'Vendor',
}

export enum UserStatus {
    Active = 'Active',
    Inactive = 'Inactive',
}

export enum Gender {
    Male = 'Male',
    Female = 'Female',
    Other = 'Other',
}

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    firstName!: string;

    @IsString()
    @IsNotEmpty()
    lastName!: string;

    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @IsString()
    @IsNotEmpty()
    mobile!: string;

    @IsEnum(Gender)
    @IsNotEmpty()
    gender!: Gender;
}

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    mobile?: string;

    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender;
}
