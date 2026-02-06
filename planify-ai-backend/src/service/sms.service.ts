import { Injectable } from '@nestjs/common';

@Injectable()
export class SMSService {
    /**
     * Sends an OTP via SMS.
     * Stub implementation: logs OTP to console (for development).
     * @param mobile Recipient mobile number
     * @param otp The one-time password
     */
    async sendTextOTP(mobile: string, otp: string): Promise<string> {
        console.log(`[SMS stub] OTP for ${mobile}: ${otp}`);
        return otp;
    }
}
