import { Body, Controller, Delete, ForbiddenException, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUserRequestDto } from './dtos/create-user.request.dto';
import { CreateUserResponseDto } from './dtos/create-user.response.dto';
import { GetUserResponseDto } from './dtos/get-user.response.dto';
import { GetUsersQueryDto } from './dtos/get-users.query.dto';
import { PaginatedUsersResponseDto } from './dtos/paginated-users.response.dto';
import { UpdateUserRequestDto } from './dtos/update-user.request.dto';
import { UpdateUserResponseDto } from './dtos/update-user.response.dto';
import { CreateUserMapper } from './mappers/create-user.mapper';
import { GetUserMapper } from './mappers/get-user.mapper';
import { UpdateUserMapper } from './mappers/update-user.mapper';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Create a new user', description: 'Admin only endpoint to create a new user account.' })
    @ApiBody({ type: CreateUserRequestDto })
    @ApiResponse({ status: 201, type: CreateUserResponseDto })
    @ApiResponse({ status: 409, description: 'Email already in use' })
    @ApiResponse({ status: 400, description: 'Validation failed' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
    async create(@Body() dto: CreateUserRequestDto): Promise<CreateUserResponseDto> {
        const requestCmd = CreateUserMapper.fromDto(dto);

        const createdUser = await this.usersService.create(requestCmd);

        return CreateUserMapper.toResponse(createdUser);
    }

    @Get()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get all users', description: 'Admin only endpoint to retrieve all users with optional filters and pagination.' })
    @ApiQuery({ name: 'role', required: false, enum: UserRole, description: 'Filter by user role' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name or email' })
    @ApiQuery({ name: 'orderBy', required: false, enum: ['name', 'createdAt'], description: 'Field to order by' })
    @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'], description: 'Order direction' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (1-based)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)' })
    @ApiResponse({ status: 200, type: PaginatedUsersResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
    async findAll(@Query() query: GetUsersQueryDto): Promise<PaginatedUsersResponseDto> {
        const { users, total } = await this.usersService.findAll(query);

        const page = query.page || 1;
        const limit = query.limit || 20;
        const totalPages = Math.ceil(total / limit);

        return {
            data: GetUserMapper.toListResponse(users),
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        };
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.USER)
    @ApiOperation({ summary: 'Get user by ID', description: 'Get a specific user by their ID. Admins can get any user, regular users can only get their own data.' })
    @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
    @ApiResponse({ status: 200, type: GetUserResponseDto })
    @ApiResponse({ status: 404, description: 'User not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Cannot access other user data' })
    async findOne(@Param('id', UuidValidationPipe) id: string, @Request() req: any): Promise<GetUserResponseDto> {
        const currentUser = req.user;

        // If not admin, can only access own data
        if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
            throw new ForbiddenException('You can only access your own user data');
        }

        const user = await this.usersService.findOne(id);

        return GetUserMapper.toResponse(user);
    }

    @Put(':id')
    @Roles(UserRole.ADMIN, UserRole.USER)
    @ApiOperation({ summary: 'Update user', description: 'Update user information. Admins can update any user, regular users can only update their own data.' })
    @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
    @ApiBody({ type: UpdateUserRequestDto })
    @ApiResponse({ status: 200, type: UpdateUserResponseDto })
    @ApiResponse({ status: 404, description: 'User not found' })
    @ApiResponse({ status: 409, description: 'Email already in use' })
    @ApiResponse({ status: 400, description: 'Validation failed' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Cannot update other user data or role' })
    async update(@Param('id', UuidValidationPipe) id: string, @Body() dto: UpdateUserRequestDto, @Request() req: any): Promise<UpdateUserResponseDto> {
        const currentUser = req.user;

        // If not admin, can only update own data
        if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
            throw new ForbiddenException('You can only update your own user data');
        }

        // Regular users cannot change their role
        if (currentUser.role !== UserRole.ADMIN && dto.role !== undefined) {
            throw new ForbiddenException('You cannot change your own role');
        }

        const requestCmd = UpdateUserMapper.fromDto(dto, id);

        const updatedUser = await this.usersService.update(requestCmd);

        return UpdateUserMapper.toResponse(updatedUser);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete user', description: 'Admin only endpoint to delete a user account.' })
    @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
    @ApiResponse({ status: 204, description: 'User successfully deleted' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
    async remove(@Param('id', UuidValidationPipe) id: string): Promise<void> {
        await this.usersService.remove(id);
    }
}