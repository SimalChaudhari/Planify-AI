import {
    Controller,
    Get,
    Post,
    Param,
    Put,
    Delete,
    Body,
    Res,
    HttpStatus,
    UseGuards,
    Req,
    UnauthorizedException,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto, UpdateAddressDto } from './addresses.dto';
import { Request, Response } from 'express';
import { JwtAuthGuard } from './../jwt/jwt-auth.guard';
import { ERROR_MESSAGES } from './../utils/constants/error-messages.constant';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
    constructor(private readonly addressesService: AddressesService) { }

    @Get()
    async getAllAddresses(@Req() request: Request, @Res() response: Response) {
        if (!request.user) throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
        const userId = request.user.id;
        const addresses = await this.addressesService.findByUserAll(userId);
        return response.status(HttpStatus.OK).json(addresses);
    }

    @Post('create')
    async createAddress(
        @Body() createAddressDto: CreateAddressDto,
        @Req() request: Request,
        @Res() response: Response
    ) {
        if (!request.user) throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
        const userId = createAddressDto.userId || request.user.id;
        const address = await this.addressesService.create(createAddressDto, userId);
        return response.status(HttpStatus.CREATED).json(address);
    }

    @Get('get/:id')
    async getAddressById(@Param('id') id: string, @Res() response: Response) {
        const address = await this.addressesService.getById(id);
        return response.status(HttpStatus.OK).json(address);
    }
    @Put('update/:id')
    async updateAddress(
        @Param('id') id: string,
        @Body() updateAddressDto: UpdateAddressDto,
        @Res() response: Response
    ) {
        const address = await this.addressesService.update(id, updateAddressDto);
        return response.status(HttpStatus.OK).json(address);
    }

    @Delete('delete/:id')
    async deleteAddress(@Param('id') id: string, @Res() response: Response) {
        await this.addressesService.delete(id);
        return response.status(HttpStatus.OK).json({ message: 'Address deleted successfully' });
    }
}
