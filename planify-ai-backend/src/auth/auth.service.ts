// src/auth/auth.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthDto, ForgotPasswordDto, ResetPasswordDto, VerifyAccountDto } from './auth.dto';
import { JwtService } from '@nestjs/jwt';
import { CreateAddressDto } from './../addresses/addresses.dto';
import { UserEntity } from './../user/users.entity';
import { UserRole, UserStatus } from './../user/users.entity';
import { AddressEntity } from './../addresses/addresses.entity';
import { EmailService } from './../service/email.service';
import { AddressesService } from './../addresses/addresses.service';
import { SMSService } from './../service/sms.service';
import { CloudinaryService } from './../service/cloudinary.service';
import { v4 as uuidv4 } from 'uuid';
import { ERROR_MESSAGES } from './../utils/constants/error-messages.constant';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const validateEmail = (input: string | undefined): boolean => {
  if (!input) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(input);
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private readonly dataSource: DataSource,
    private readonly JwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly smsService: SMSService,
    private readonly addressesService: AddressesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async register(
    authDto: AuthDto,
    file?: Express.Multer.File,
  ): Promise<{ message: string; user: UserEntity }> {
    if (!authDto.firstName?.trim()) throw new BadRequestException(ERROR_MESSAGES.REQUIRED_FIRSTNAME);
    if (!authDto.lastName?.trim()) throw new BadRequestException(ERROR_MESSAGES.REQUIRED_LASTNAME);
    if (!authDto.email?.trim()) throw new BadRequestException(ERROR_MESSAGES.REQUIRED_EMAIL);
    if (!authDto.mobile?.trim()) throw new BadRequestException(ERROR_MESSAGES.REQUIRED_MOBILE);

    const existingUser = await this.userRepository.findOne({
      where: [{ email: authDto.email }, { mobile: authDto.mobile }],
    });
    if (existingUser) {
      throw new BadRequestException(ERROR_MESSAGES.ALREADY_EXISTS);
    }

    const firstName = authDto.firstName.trim();
    const lastName = authDto.lastName.trim();

    // Upload profile first; if any error, do not create user
    let profileUrl: string | null = null;
    if (file) {
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        throw new BadRequestException(ERROR_MESSAGES.PROFILE_UPLOAD_NOT_CONFIGURED);
      }
      profileUrl = await this.cloudinaryService.uploadImage(file);
    }

    const newUser = this.userRepository.create({
      firstName,
      lastName,
      email: authDto.email,
      mobile: authDto.mobile,
      gender: authDto.gender,
      profile: profileUrl ?? undefined,
      role: UserRole.Vendor,
      isDeleted: false,
    });

    const createAddressDto = {
      mobile: authDto.mobile ?? '',
      street_address: authDto.address ?? '',
      state: authDto.state ?? '',
      zip_code: authDto.pincode ?? '',
      country: authDto.country ?? '',
    };

    // Save user and address in one transaction; if any step fails, nothing is created
    const savedUser = await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(UserEntity);
      const addressRepo = manager.getRepository(AddressEntity);
      const user = await userRepo.save(newUser);

      const address = addressRepo.create({
        ...createAddressDto,
        user,
      });
      await addressRepo.save(address);

      return user;
    });

    return { message: 'User data Added successfully', user: savedUser };
  }

  async verifyOtp(authDto: AuthDto): Promise<{ message: string }> {
    const contact = authDto.contact;
    if (!contact) throw new BadRequestException(ERROR_MESSAGES.CONTACT_REQUIRED);

    const isEmail = validateEmail(contact);
    const whereCondition = isEmail
      ? { email: contact, isDeleted: false }
      : { mobile: contact, isDeleted: false };
    const user = await this.userRepository.findOne({ where: whereCondition });
    if (!user) throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    if (user.status === UserStatus.Inactive) {
      throw new UnauthorizedException(ERROR_MESSAGES.ACCOUNT_INACTIVE);
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    user.otp = await bcrypt.hash(otp, 10);
    user.otpExpires = otpExpires;
    await this.userRepository.save(user);

    isEmail
      ? await this.emailService.sendOTP(user.email, otp)
      : await this.smsService.sendTextOTP(user.mobile, otp);

    return { message: 'OTP sent successfully' };
  }

  async verifyAccount(dto: VerifyAccountDto): Promise<{ message: string }> {
    const isEmail = validateEmail(dto.contact);
    const whereCondition = isEmail
      ? { email: dto.contact, isDeleted: false }
      : { mobile: dto.contact, isDeleted: false };
    const user = await this.userRepository.findOne({ where: whereCondition });
    if (!user) throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    if (!user.otp || !user.otpExpires || user.otpExpires < new Date()) {
      throw new UnauthorizedException(ERROR_MESSAGES.OTP_INVALID_EXPIRED);
    }
    const valid = await bcrypt.compare(dto.otp, user.otp);
    if (!valid) throw new UnauthorizedException(ERROR_MESSAGES.OTP_INVALID_EXPIRED);

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await this.userRepository.save(user);
    return { message: 'Account verified successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const isEmail = validateEmail(dto.contact);
    const whereCondition = isEmail
      ? { email: dto.contact, isDeleted: false }
      : { mobile: dto.contact, isDeleted: false };
    const user = await this.userRepository.findOne({ where: whereCondition });
    if (!user) throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min for password reset
    user.otp = await bcrypt.hash(otp, 10);
    user.otpExpires = otpExpires;
    await this.userRepository.save(user);

    isEmail
      ? await this.emailService.sendOTP(user.email, otp)
      : await this.smsService.sendTextOTP(user.mobile, otp);

    return { message: 'Password reset OTP sent successfully' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const isEmail = validateEmail(dto.contact);
    const whereCondition = isEmail
      ? { email: dto.contact, isDeleted: false }
      : { mobile: dto.contact, isDeleted: false };
    const user = await this.userRepository.findOne({ where: whereCondition });
    if (!user) throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    if (!user.otp || !user.otpExpires || user.otpExpires < new Date()) {
      throw new UnauthorizedException(ERROR_MESSAGES.OTP_INVALID_EXPIRED);
    }
    const valid = await bcrypt.compare(dto.otp, user.otp);
    if (!valid) throw new UnauthorizedException(ERROR_MESSAGES.OTP_INVALID_EXPIRED);

    user.password = await bcrypt.hash(dto.newPassword, 10);
    user.otp = null;
    user.otpExpires = null;
    await this.userRepository.save(user);
    return { message: 'Password reset successfully' };
  }

  async login(
    authDto: AuthDto,
  ): Promise<{
    message: string;
    access_token: string;
    refresh_token: string;
    user: Partial<UserEntity>;
  }> {
    const contact = authDto.contact;
    if (!contact) throw new BadRequestException(ERROR_MESSAGES.CONTACT_REQUIRED);

    const isEmail = validateEmail(contact);
    const whereCondition = isEmail
      ? { email: contact, isDeleted: false }
      : { mobile: contact, isDeleted: false };
    const user = await this.userRepository.findOne({ where: whereCondition });
    if (!user) throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);

    if (!user.otp || !user.otpExpires || user.otpExpires < new Date()) {
      throw new UnauthorizedException(ERROR_MESSAGES.OTP_INVALID_EXPIRED);
    }
    if (!authDto.otp) throw new UnauthorizedException(ERROR_MESSAGES.OTP_REQUIRED);
    const isOtpValid = await bcrypt.compare(authDto.otp, user.otp);
    if (!isOtpValid) throw new UnauthorizedException(ERROR_MESSAGES.OTP_INVALID_EXPIRED);

    const newSessionToken = uuidv4();
    user.otp = null;
    user.otpExpires = null;
    user.sessionToken = newSessionToken;
    await this.userRepository.save(user);

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
    const payload = {
      email: user.email,
      id: user.id,
      role: user.role,
      name: fullName,
      sessionToken: newSessionToken,
    };

    const access_token = this.JwtService.sign(payload, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refresh_token = this.JwtService.sign(
      { id: user.id, type: 'refresh' },
      { expiresIn: REFRESH_TOKEN_EXPIRY },
    );
    user.refreshToken = await bcrypt.hash(refresh_token, 10);
    await this.userRepository.save(user);

    const { otp, otpExpires, isDeleted, sessionToken, password, refreshToken, ...userWithoutSensitive } = user;
    return {
      message: 'User Logged in successfully',
      access_token,
      refresh_token,
      user: userWithoutSensitive,
    };
  }

  async refreshToken(
    refresh_token: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      const decoded = this.JwtService.verify(refresh_token, {
        ignoreExpiration: false,
      }) as { id: string; type?: string };
      if (decoded.type !== 'refresh') throw new UnauthorizedException(ERROR_MESSAGES.REFRESH_TOKEN_INVALID);

      const user = await this.userRepository.findOne({
        where: { id: decoded.id, isDeleted: false },
      });
      if (!user || !user.refreshToken) throw new UnauthorizedException(ERROR_MESSAGES.REFRESH_TOKEN_INVALID);

      const tokenValid = await bcrypt.compare(refresh_token, user.refreshToken);
      if (!tokenValid) throw new UnauthorizedException(ERROR_MESSAGES.REFRESH_TOKEN_INVALID);

      const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
      const payload = {
        email: user.email,
        id: user.id,
        role: user.role,
        name: fullName,
        sessionToken: user.sessionToken,
      };
      const newAccessToken = this.JwtService.sign(payload, { expiresIn: ACCESS_TOKEN_EXPIRY });
      const newRefreshToken = this.JwtService.sign(
        { id: user.id, type: 'refresh' },
        { expiresIn: REFRESH_TOKEN_EXPIRY },
      );
      user.refreshToken = await bcrypt.hash(newRefreshToken, 10);
      await this.userRepository.save(user);

      return { access_token: newAccessToken, refresh_token: newRefreshToken };
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      throw new UnauthorizedException(ERROR_MESSAGES.REFRESH_TOKEN_INVALID);
    }
  }
}
