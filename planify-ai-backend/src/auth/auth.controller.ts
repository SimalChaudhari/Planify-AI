// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { AuthService } from './auth.service';
import {
  AuthDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyAccountDto,
  RefreshTokenDto,
} from './auth.dto';
import { Response } from 'express';

const memoryStorage = multer.memoryStorage();
const maxSize = 5 * 1024 * 1024; // 5MB

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: memoryStorage,
      limits: { fileSize: maxSize },
      fileFilter: (_, file, cb) => {
        if (!file || !file.mimetype.startsWith('image/')) {
          return cb(new Error('Only image files are allowed') as any, false);
        }
        cb(null, true);
      },
    }),
  )
  async register(
    @Res() response: Response,
    @Body() authDto: AuthDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const file = files && files.length > 0 ? files[0] : undefined;
    const result = await this.authService.register(authDto, file);
    return response.status(HttpStatus.OK).json({
      message: result.message,
      user: result.user,
    });
  }

  @Post('verify-otp')
  async verifyOtp(@Body() authDto: AuthDto) {
    return this.authService.verifyOtp(authDto);
  }

  @Post('verify-account')
  async verifyAccount(@Body() dto: VerifyAccountDto) {
    return this.authService.verifyAccount(dto);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('login')
  async login(@Body() authDto: AuthDto, @Res() response: Response) {
    const result = await this.authService.login(authDto);
    return response.status(HttpStatus.OK).json(result);
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto, @Res() response: Response) {
    const result = await this.authService.refreshToken(dto.refresh_token);
    return response.status(HttpStatus.OK).json(result);
  }
}
