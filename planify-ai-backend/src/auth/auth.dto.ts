// src/auth/auth.dto.ts
import { IsEmail, IsEnum, IsMobilePhone, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Gender } from '../user/users.entity';

export class AuthDto {
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

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsString()
  @IsOptional()
  otp?: string; // OTP for verification

  @IsString()
  @IsOptional()
  contact?: string; // email or mobile for login/verify-otp
}

export class ForgotPasswordDto {
  @IsString()
  @IsNotEmpty()
  contact!: string; // email or mobile
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  contact!: string;

  @IsString()
  @IsNotEmpty()
  otp!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  newPassword!: string;
}

export class VerifyAccountDto {
  @IsString()
  @IsNotEmpty()
  contact!: string;

  @IsString()
  @IsNotEmpty()
  otp!: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refresh_token!: string;
}
