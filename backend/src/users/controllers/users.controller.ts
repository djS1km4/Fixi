import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  Body,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { CreateUserDto, UpdateUserDto } from '../../common/dto/create-user.dto';
import { UserEntity } from '../../common/entities/user.entity';
import { UserRole, UserStatus } from '../../common/enums/user-role.enum';
import { JwtAuthGuard, Roles } from '../../auth/guards/jwt.guard';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({ summary: 'Get all users (paginated)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Get()
  async findAll(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return await this.usersService.findAll(page, limit);
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.usersService.findOne(id);
  }

  @ApiOperation({ summary: 'Get user by email' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiBearerAuth()
  @Get('email/:email')
  async findByEmail(@Param('email') email: string) {
    return await this.usersService.findByEmail(email);
  }

  @ApiOperation({ summary: 'Get users by role' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Get('role/:role')
  async findByRole(
    @Param('role') role: UserRole,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return await this.usersService.findByRole(role, page, limit);
  }

  @ApiOperation({ summary: 'Search users' })
  @ApiResponse({ status: 200, description: 'Search results' })
  @ApiBearerAuth()
  @Get('search')
  async search(
    @Query('q') query: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return await this.usersService.search(query, page, limit);
  }

  @ApiOperation({ summary: 'Get top rated technicians' })
  @ApiResponse({ status: 200, description: 'Top technicians retrieved successfully' })
  @ApiBearerAuth()
  @Get('technicians/top-rated')
  async getTopRatedTechnicians(
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return await this.usersService.getTopRatedTechnicians(limit);
  }

  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto);
  }

  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth()
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    // Users can only update their own profile, admins can update anyone
    if (req.user.role !== UserRole.ADMIN && req.user.userId !== id) {
      throw new UnauthorizedException('You can only update your own profile');
    }

    return await this.usersService.updateProfile(id, updateUserDto);
  }

  @ApiOperation({ summary: 'Update user (admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Put('admin/:id')
  async updateAdmin(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.usersService.update(id, updateUserDto);
  }

  @ApiOperation({ summary: 'Delete user (soft delete)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: 'User deleted successfully' };
  }

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiBearerAuth()
  @Get('profile')
  async getProfile(@Request() req) {
    return await this.usersService.findOne(req.user.userId);
  }

  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiBearerAuth()
  @Put('profile')
  async updateProfile(
    @Request() req,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.usersService.updateProfile(req.user.userId, updateUserDto);
  }
}