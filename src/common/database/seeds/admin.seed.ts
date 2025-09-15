import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UserEntity } from '../../../modules/users/entities/user.entity';
import { UserRole } from '../../enums/user-role.enum';

@Injectable()
export class AdminSeed implements OnApplicationBootstrap {
    constructor(
        @InjectRepository(UserEntity) private readonly repo: Repository<UserEntity>,
    ) { }

    async onApplicationBootstrap() {
        const adminExists = await this.repo.findOne({ where: { role: UserRole.ADMIN } });
        if (!adminExists) {
            const passwordHash = await bcrypt.hash('admin123', 12);
            const admin = this.repo.create({
                name: 'Super Admin',
                email: 'admin@conectar.com',
                passwordHash,
                role: UserRole.ADMIN,
            });
            await this.repo.save(admin);
            console.log('✅ Default admin created: email=admin@conectar.com, password=admin123');
        }
    }
}
