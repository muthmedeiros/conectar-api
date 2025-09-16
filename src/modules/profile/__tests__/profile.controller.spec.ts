import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from '../profile.controller';
import { ProfileService } from '../profile.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ProfileUpdateRequestDto } from '../dtos/profile-update.request.dto';
import { ProfileResponseDto } from '../dtos/profile.response.dto';
import { ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../../common/enums/user-role.enum';

describe('ProfileController', () => {
  let controller: ProfileController;
  let service: ProfileService;

  const mockProfileService = {
    updateProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        { provide: ProfileService, useValue: mockProfileService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: (context: ExecutionContext) => true })
      .compile();

    controller = module.get(ProfileController);
    service = module.get(ProfileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call service.updateProfile with correct params', async () => {
    const dto: ProfileUpdateRequestDto = {
      name: 'Test',
      email: 'test@example.com',
      currentPassword: 'pass',
    };
    const req = { user: { id: 'user-1' } };
    const expected: ProfileResponseDto = {
      id: 'user-1',
      name: 'Test',
      email: 'test@example.com',
  role: UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (service.updateProfile as jest.Mock).mockResolvedValue(expected);
    const result = await controller.updateProfile(dto, req);
    expect(service.updateProfile).toHaveBeenCalledWith('user-1', dto);
    expect(result).toEqual(expected);
  });
});
