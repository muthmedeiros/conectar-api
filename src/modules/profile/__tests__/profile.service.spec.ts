import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileService } from '../profile.service';
import { UsersService } from '../../users/users.service';
import { UserEntity } from '../../users/entities/user.entity';
import { ProfileUpdateRequestDto } from '../dtos/profile-update.request.dto';
import { UserRole } from '../../../common/enums/user-role.enum';
import { BadRequestException } from '@nestjs/common';
import { EncryptionUtil } from '../../../common/utils/encryption.util';

jest.mock('../../../common/utils/encryption.util');

describe('ProfileService', () => {
  let service: ProfileService;
  let userRepository: Repository<UserEntity>;

  const mockUser: UserEntity = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hashed',
    role: UserRole.USER,
    lastLogin: null,
    clients: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as UserEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: UsersService, useValue: {} },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ProfileService);
    userRepository = module.get(getRepositoryToken(UserEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should update name and email if current password matches', async () => {
    (userRepository.findOne as jest.Mock).mockResolvedValue({ ...mockUser });
    (EncryptionUtil.comparePassword as jest.Mock).mockResolvedValue(true);
    (userRepository.save as jest.Mock).mockImplementation(async (u) => u);

    const dto: ProfileUpdateRequestDto = {
      name: 'New Name',
      email: 'new@example.com',
      currentPassword: 'password',
    };

    const result = await service.updateProfile('user-1', dto);
    expect(result.name).toBe('New Name');
    expect(result.email).toBe('new@example.com');
    expect(userRepository.save).toHaveBeenCalled();
  });

  it('should update password if newPassword is provided', async () => {
    (userRepository.findOne as jest.Mock).mockResolvedValue({ ...mockUser });
    (EncryptionUtil.comparePassword as jest.Mock).mockResolvedValue(true);
    (EncryptionUtil.hashPassword as jest.Mock).mockResolvedValue('newhash');
    (userRepository.save as jest.Mock).mockImplementation(async (u) => u);

    const dto: ProfileUpdateRequestDto = {
      currentPassword: 'password',
      newPassword: 'newpass123',
    };

    const result = await service.updateProfile('user-1', dto);
    expect(result).toHaveProperty('id', 'user-1');
    expect(userRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ passwordHash: 'newhash' })
    );
  });

  it('should throw if user not found', async () => {
    (userRepository.findOne as jest.Mock).mockResolvedValue(undefined);
    await expect(
      service.updateProfile('user-1', { currentPassword: 'x' })
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw if current password is incorrect', async () => {
    (userRepository.findOne as jest.Mock).mockResolvedValue({ ...mockUser });
    (EncryptionUtil.comparePassword as jest.Mock).mockResolvedValue(false);
    await expect(
      service.updateProfile('user-1', { currentPassword: 'wrong' })
    ).rejects.toThrow(BadRequestException);
  });
});
