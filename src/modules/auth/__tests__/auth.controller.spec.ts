import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { CreateUserMapper } from '../mappers/create-user.mapper';
import { LoginUserMapper } from '../mappers/login-user.mapper';

describe('AuthController', () => {
    let controller: AuthController;
    let service: AuthService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: {
                        register: jest.fn(),
                        login: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get(AuthController);
        service = module.get(AuthService);
    });

    describe('register', () => {
        it('should propagate register errors', async () => {
            jest.spyOn(service, 'register').mockRejectedValue(new ConflictException());

            await expect(controller.register({} as any)).rejects.toThrow(ConflictException);
        });

        it('should run the full register flow with mappers', async () => {
            const fromDtoSpy = jest.spyOn(CreateUserMapper, 'fromDto');
            const toResponseSpy = jest.spyOn(CreateUserMapper, 'toResponse');

            jest.spyOn(service, 'register').mockResolvedValue({
                id: '1',
                name: 'a',
                email: 'b',
                role: 'user',
            } as any);

            const dto = { name: 'a', email: 'b', password: 'c', role: 'user' };
            const res = await controller.register(dto as any);

            expect(fromDtoSpy).toHaveBeenCalledWith(dto);
            expect(service.register).toHaveBeenCalled();
            expect(toResponseSpy).toHaveBeenCalled();
            expect(res).toHaveProperty('id', '1');
            expect(res).toHaveProperty('email', 'b');
        });
    });

    describe('login', () => {
        it('should propagate login errors', async () => {
            jest.spyOn(service, 'login').mockRejectedValue(new UnauthorizedException());

            await expect(controller.login({ email: 'a', password: 'b' } as any)).rejects.toThrow(UnauthorizedException);
        });

        it('should run the full login flow with mapper', async () => {
            const toResponseSpy = jest.spyOn(LoginUserMapper, 'toResponse');

            jest.spyOn(service, 'login').mockResolvedValue({
                accessToken: 'a',
                refreshToken: 'b',
                expiresIn: 123,
            });

            const dto = { email: 'a', password: 'b' };
            const res = await controller.login(dto as any);

            expect(service.login).toHaveBeenCalledWith(dto.email, dto.password);
            expect(toResponseSpy).toHaveBeenCalled();
            expect(res).toHaveProperty('accessToken', 'a');
            expect(res).toHaveProperty('refreshToken', 'b');
            expect(res).toHaveProperty('expiresIn', 123);
        });
    });
});
