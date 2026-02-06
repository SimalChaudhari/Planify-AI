// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import * as dotenv from 'dotenv';
import { UserEntity } from './../user/users.entity';

import { EmailService } from './../service/email.service';
import { AddressEntity } from './../addresses/addresses.entity';
import { AddressesModule } from './../addresses/addresses.module';
import { SMSService } from './../service/sms.service';
import { CloudinaryService } from './../service/cloudinary.service';

dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, AddressEntity]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
    AddressesModule,
  ],
  providers: [AuthService, EmailService, SMSService, CloudinaryService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
