import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  Body,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ServicesService } from '../services/services.service';
import { CreateServiceDto, UpdateServiceDto } from '../dto/create-service.dto';
import { ServiceEntity } from '../../common/entities/service.entity';
import { ServiceCategory } from '../../common/enums/service-category.enum';
import { JwtAuthGuard, Roles } from '../../auth/guards/jwt.guard';
import { UserRole } from '../../auth/decorators/roles.decorator';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @ApiOperation({ summary: 'Get all services (paginated)' })
  @ApiResponse({ status: 200, description: 'Services retrieved successfully' })
  @Get()
  async findAll(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('category') category?: ServiceCategory,
    @Query('workArea') workArea?: string,
    @Query('technicianId') technicianId?: string,
    @Query('isActive') isActive?: boolean,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('search') search?: string,
  ) {
    const filters = {
      category,
      workArea,
      technicianId,
      isActive,
      minPrice,
      maxPrice,
      search,
    };

    return await this.servicesService.findAll(page, limit, filters);
  }

  @ApiOperation({ summary: 'Get service by ID' })
  @ApiResponse({ status: 200, description: 'Service retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.servicesService.findOne(id);
  }

  @ApiOperation({ summary: 'Search services' })
  @ApiResponse({ status: 200, description: 'Search results' })
  @Get('search')
  async search(
    @Query('q') query: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('category') category?: ServiceCategory,
    @Query('workArea') workArea?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('deviceType') deviceType?: string,
  ) {
    const filters = {
      category,
      workArea,
      minPrice,
      maxPrice,
      deviceType,
    };

    return await this.servicesService.searchServices(query, filters, page, limit);
  }

  @ApiOperation({ summary: 'Get services by category' })
  @ApiResponse({ status: 200, description: 'Services retrieved successfully' })
  @Get('category/:category')
  async findByCategory(
    @Param('category') category: ServiceCategory,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return await this.servicesService.findByCategory(category, page, limit);
  }

  @ApiOperation({ summary: 'Get services by work area' })
  @ApiResponse({ status: 200, description: 'Services retrieved successfully' })
  @Get('work-area/:workArea')
  async findByWorkArea(
    @Param('workArea') workArea: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return await this.servicesService.getServicesByWorkArea(workArea, page, limit);
  }

  @ApiOperation({ summary: 'Get popular services' })
  @ApiResponse({ status: 200, description: 'Popular services retrieved successfully' })
  @Get('popular')
  async getPopularServices(@Query('limit', ParseIntPipe) limit: number = 10) {
    return await this.servicesService.getPopularServices(limit);
  }

  @ApiOperation({ summary: 'Create new service' })
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  @ApiResponse({ status: 409, description: 'Service already exists' })
  @ApiBearerAuth()
  @Roles(UserRole.TECHNICIAN)
  @Post()
  async create(@Body() createServiceDto: CreateServiceDto, @Request() req) {
    return await this.servicesService.create(createServiceDto, req.user.userId);
  }

  @ApiOperation({ summary: 'Update service' })
  @ApiResponse({ status: 200, description: 'Service updated successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiBearerAuth()
  @Roles(UserRole.TECHNICIAN)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @Request() req,
  ) {
    return await this.servicesService.update(id, updateServiceDto, req.user.userId);
  }

  @ApiOperation({ summary: 'Delete service (soft delete)' })
  @ApiResponse({ status: 200, description: 'Service deleted successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiBearerAuth()
  @Roles(UserRole.TECHNICIAN)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    await this.servicesService.remove(id, req.user.userId);
    return { message: 'Service deleted successfully' };
  }

  @ApiOperation({ summary: 'Get services for technician' })
  @ApiResponse({ status: 200, description: 'Technician services retrieved successfully' })
  @ApiBearerAuth()
  @Roles(UserRole.TECHNICIAN)
  @Get('technician/:technicianId')
  async getTechnicianServices(
    @Param('technicianId') technicianId: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Request() req,
  ) {
    // Verify technician is requesting their own services
    if (req.user.role === UserRole.TECHNICIAN && req.user.userId !== technicianId) {
      throw new UnauthorizedException('You can only view your own services');
    }

    return await this.servicesService.findByTechnician(technicianId, page, limit);
  }

  @ApiOperation({ summary: 'Get services by technician' })
  @ApiResponse({ status: 200, description: 'Services retrieved successfully' })
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Get('admin/technician/:technicianId')
  async getServicesByTechnicianAdmin(
    @Param('technicianId') technicianId: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  @Query('status') status?: 'true' | 'false',
  ) {
    const services = await this.servicesService.findByTechnician(
      technicianId,
      page,
      limit,
      status === 'true' ? true : undefined,
    );

    return { services, total: services.length };
  }
}