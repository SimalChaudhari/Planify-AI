//users.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserEntity, UserRole, UserStatus } from './users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddressEntity } from './../addresses/addresses.entity';
import { ERROR_MESSAGES } from './../utils/constants/error-messages.constant';


@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity)
        private userRepository: Repository<UserEntity>,
        @InjectRepository(AddressEntity)
        private addressRepository: Repository<AddressEntity>,
    ) { }

    async updateUserStatus(id: string, status: UserStatus): Promise<UserEntity> {
        const user = await this.userRepository.findOne({ where: { id } });

        if (!user) {
            throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND_OR_DELETED);
        }

        if (!Object.values(UserStatus).includes(status)) {
            throw new BadRequestException(ERROR_MESSAGES.STATUS_INVALID);
        }

        user.status = status;
        await this.userRepository.save(user);

        return user;
    }

    async getAdminState(): Promise<string | null> {
        // Admin state no longer stored on user; return null for backward compatibility
        return null;
    }

    async getAll(): Promise<UserEntity[]> {
        return await this.userRepository.find({
            where: { isDeleted: false },
            relations: ['addresses'], // Ensure addresses are loaded
        });
    }

    async findAllVendors(): Promise<UserEntity[]> {
        return this.userRepository.find({ where: { role: UserRole.Vendor } });
    }



    async getById(id: string): Promise<UserEntity> {
        const user = await this.userRepository.findOne({ where: { id, isDeleted: false } }); // Correct way to find by ID
        if (!user) {
            throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND_OR_DELETED);
        }
        return user;
    }

    async delete(id: string): Promise<{ message: string }> {
        const user = await this.userRepository.findOne({ where: { id } }); // Correct way to find by ID
        if (!user) {
            throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND_OR_DELETED);
        }

        user.isDeleted = true;
        await this.userRepository.save(user);
        // await this.userRepository.remove(user);
        return { message: ERROR_MESSAGES.DELETED_SUCCESS };
    }
}
