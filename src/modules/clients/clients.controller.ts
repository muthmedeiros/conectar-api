import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUsersQueryDto } from '../users/dtos/get-users.query.dto';
import { UsersService } from '../users/users.service';
import { ClientsService } from './clients.service';
import { CreateClientRequestDto } from './dtos/create-client.request.dto';
import { CreateClientResponseDto } from './dtos/create-client.response.dto';
import { GetClientResponseDto } from './dtos/get-client.response.dto';
import { GetClientsQueryDto } from './dtos/get-clients.query.dto';
import { PaginatedClientsResponseDto } from './dtos/paginated-clients.response.dto';
import { UpdateClientRequestDto } from './dtos/update-client.request.dto';
import { UpdateClientResponseDto } from './dtos/update-client.response.dto';
import { UserOptionResponseDto } from './dtos/user-option.response.dto';
import { CreateClientMapper } from './mappers/create-client.mapper';
import { GetClientMapper } from './mappers/get-client.mapper';
import { UpdateClientMapper } from './mappers/update-client.mapper';
import { UserOptionMapper } from './mappers/user-option.mapper';

@ApiTags('clients')
@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ClientsController {
    constructor(
        private readonly clientsService: ClientsService,
        private readonly usersService: UsersService,
    ) { }

    @Post()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Create a new client', description: 'Admin only endpoint to create a new client.' })
    @ApiBody({ type: CreateClientRequestDto })
    @ApiResponse({ status: 201, type: CreateClientResponseDto })
    @ApiResponse({ status: 409, description: 'CNPJ already in use' })
    @ApiResponse({ status: 400, description: 'Validation failed' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
    async create(@Body() dto: CreateClientRequestDto): Promise<CreateClientResponseDto> {
        const requestCmd = CreateClientMapper.fromDto(dto);

        const createdClient = await this.clientsService.create(requestCmd);

        return CreateClientMapper.toResponse(createdClient);
    }

    @Get('users-options')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'List users for dropdown', description: 'Returns a lightweight list of users to populate dropdowns (e.g., adminUserId).' })
    @ApiQuery({ name: 'role', required: false, enum: UserRole, description: 'Filter by user role (default ADMIN)' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name or email' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limit number of results (max 100)', example: 50 })
    @ApiResponse({ status: 200, type: [UserOptionResponseDto] })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
    async listUserOptions(@Query() query: GetUsersQueryDto): Promise<UserOptionResponseDto[]> {
        const q: GetUsersQueryDto = {
            ...query,
            orderBy: 'name',
            order: 'ASC',
            page: 1,
        };
        q.limit = Math.min(query.limit ?? 100, 100);
        q.role = query.role ?? UserRole.ADMIN;

        const { users } = await this.usersService.findAll(q);
        return UserOptionMapper.toListResponse(users).map(({ id, name }) => ({ id, name }));
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.USER)
    @ApiOperation({
        summary: 'Get all clients',
        description: 'Retrieve clients with optional filters and pagination. Admins can see all clients, regular users can only see clients they are related to.'
    })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name or CNPJ' })
    @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive'], description: 'Filter by client status' })
    @ApiQuery({ name: 'conectarPlus', required: false, type: Boolean, description: 'Filter by conectarPlus status' })
    @ApiQuery({ name: 'orderBy', required: false, enum: ['corporateReason', 'name', 'createdAt'], description: 'Field to order by' })
    @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'], description: 'Order direction' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (1-based)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)' })
    @ApiResponse({ status: 200, type: PaginatedClientsResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async findAll(@Query() query: GetClientsQueryDto, @Request() req: any): Promise<PaginatedClientsResponseDto> {
        const currentUser = req.user;
        const { clients, total } = await this.clientsService.findAll(query, currentUser);

        const page = query.page || 1;
        const limit = query.limit || 20;
        const totalPages = Math.ceil(total / limit);

        return {
            clients: GetClientMapper.toResponseList(clients),
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        };
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.USER)
    @ApiOperation({
        summary: 'Get client by ID',
        description: 'Get a specific client by ID. Admins can access any client, regular users can only access clients they are related to.'
    })
    @ApiParam({ name: 'id', description: 'Client ID', type: 'string' })
    @ApiResponse({ status: 200, type: GetClientResponseDto })
    @ApiResponse({ status: 404, description: 'Client not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Cannot access this client' })
    async findOne(@Param('id', UuidValidationPipe) id: string, @Request() req: any): Promise<GetClientResponseDto> {
        const currentUser = req.user;

        const client = await this.clientsService.findOne(id, currentUser);

        return GetClientMapper.toResponse(client);
    }

    @Put(':id')
    @Roles(UserRole.ADMIN, UserRole.USER)
    @ApiOperation({
        summary: 'Update client',
        description: 'Update client information. Admins can update any client, regular users can only update clients they are related to.'
    })
    @ApiParam({ name: 'id', description: 'Client ID', type: 'string' })
    @ApiBody({ type: UpdateClientRequestDto })
    @ApiResponse({ status: 200, type: UpdateClientResponseDto })
    @ApiResponse({ status: 404, description: 'Client not found' })
    @ApiResponse({ status: 409, description: 'CNPJ already in use' })
    @ApiResponse({ status: 400, description: 'Validation failed' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Cannot update this client' })
    async update(@Param('id', UuidValidationPipe) id: string, @Body() dto: UpdateClientRequestDto, @Request() req: any): Promise<UpdateClientResponseDto> {
        const currentUser = req.user;
        const requestCmd = UpdateClientMapper.fromDto(id, dto);

        const updatedClient = await this.clientsService.update(requestCmd, currentUser);

        return UpdateClientMapper.toResponse(updatedClient);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete client', description: 'Admin only endpoint to delete a client.' })
    @ApiParam({ name: 'id', description: 'Client ID', type: 'string' })
    @ApiResponse({ status: 204, description: 'Client successfully deleted' })
    @ApiResponse({ status: 404, description: 'Client not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
    async remove(@Param('id', UuidValidationPipe) id: string): Promise<void> {
        await this.clientsService.remove(id);
    }

    @Post(':id/users/:userId')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Add user to client', description: 'Admin only endpoint to associate a user with a client.' })
    @ApiParam({ name: 'id', description: 'Client ID', type: 'string' })
    @ApiParam({ name: 'userId', description: 'User ID', type: 'string' })
    @ApiResponse({ status: 204, description: 'User successfully added to client' })
    @ApiResponse({ status: 404, description: 'Client or user not found' })
    @ApiResponse({ status: 409, description: 'User already associated with client' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
    async addUserToClient(
        @Param('id', UuidValidationPipe) clientId: string,
        @Param('userId', UuidValidationPipe) userId: string,
    ): Promise<void> {
        await this.clientsService.addUserToClient(clientId, userId);
    }

    @Delete(':id/users/:userId')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Remove user from client', description: 'Admin only endpoint to remove user association from a client.' })
    @ApiParam({ name: 'id', description: 'Client ID', type: 'string' })
    @ApiParam({ name: 'userId', description: 'User ID', type: 'string' })
    @ApiResponse({ status: 204, description: 'User successfully removed from client' })
    @ApiResponse({ status: 404, description: 'Client not found' })
    @ApiResponse({ status: 409, description: 'Cannot remove admin user from client' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
    async removeUserFromClient(
        @Param('id', UuidValidationPipe) clientId: string,
        @Param('userId', UuidValidationPipe) userId: string,
    ): Promise<void> {
        await this.clientsService.removeUserFromClient(clientId, userId);
    }
}