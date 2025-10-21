import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceEntity } from '../entities/service.entity';
import { CreateServiceDto, UpdateServiceDto } from '../dto/create-service.dto';
import { ServiceCategory } from '../../common/enums/service-category.enum';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceEntity)
    private servicesRepository: Repository<ServiceEntity>,
  ) {}

  async create(createServiceDto: CreateServiceDto, technicianId: string): Promise<ServiceEntity> {
    // Check if technician exists and is active
    const technician = await this.servicesRepository.manager
      .getRepository('users')
      .findOne({
        where: {
          id: technicianId,
          status: 'ACTIVE',
          role: 'TECHNICIAN',
        },
      });

    if (!technician) {
      throw new NotFoundException('Technician not found or not active');
    }

    // Check if service with same name already exists for this technician
    const existingService = await this.servicesRepository.findOne({
      where: {
        name: createServiceDto.name,
        technician: { id: technicianId },
      },
    });

    if (existingService) {
      throw new ConflictException('Service with this name already exists for this technician');
    }

    const service = this.servicesRepository.create({
      ...createServiceDto,
      technician,
      isActive: true,
      popularityScore: 0,
      totalOrders: 0,
      averageRating: 0,
    });

    return await this.servicesRepository.save(service);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: {
      category?: ServiceCategory;
      workArea?: string;
      technicianId?: string;
      isActive?: boolean;
      minPrice?: number;
      maxPrice?: number;
      search?: string;
    },
  ): Promise<{ services: ServiceEntity[]; total: number }> {
    const queryBuilder = this.servicesRepository.createQueryBuilder('service');

    // Apply filters
    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere('service.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (filters?.category) {
      queryBuilder.andWhere('service.category = :category', {
        category: filters.category,
      });
    }

    if (filters?.workArea) {
      queryBuilder.andWhere('service.workAreas && :workArea', {
        workArea: filters.workArea,
      });
    }

    if (filters?.technicianId) {
      queryBuilder.andWhere('service.technicianId = :technicianId', {
        technicianId: filters.technicianId,
      });
    }

    if (filters?.minPrice) {
      queryBuilder.andWhere('service.basePrice >= :minPrice', {
        minPrice: filters.minPrice,
      });
    }

    if (filters?.maxPrice) {
      queryBuilder.andWhere('service.basePrice <= :maxPrice', {
        maxPrice: filters.maxPrice,
      });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(service.name ILIKE :search OR service.description ILIKE :search OR service.serviceTags && :search)',
        {
          search: `%${filters.search}%`,
        },
      );
    }

    queryBuilder
      .leftJoinAndSelect('technician', 'user', 'user.id = service.technicianId')
      .leftJoinAndSelect('technician.reviews', 'review', 'review.technicianId = service.technicianId')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('service.popularityScore', 'DESC');

    const [services, total] = await queryBuilder.getManyAndCount();

    return { services, total };
  }

  async findOne(id: string): Promise<ServiceEntity> {
    const service = await this.servicesRepository.findOne({
      where: { id, isActive: true },
      relations: ['technician'],
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return service;
  }

  async findByTechnician(
    technicianId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ services: ServiceEntity[]; total: number }> {
    const [services, total] = await this.servicesRepository.findAndCount({
      where: { technicianId, isActive: true },
      order: { popularityScore: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['technician'],
    });

    return { services, total };
  }

  async findByCategory(
    category: ServiceCategory,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ services: ServiceEntity[]; total: number }> {
    const [services, total] = await this.servicesRepository.findAndCount({
      where: { category, isActive: true },
      order: { popularityScore: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['technician'],
    });

    return { services, total };
  }

  async searchServices(
    query: string,
    filters?: {
      workArea?: string;
      category?: ServiceCategory;
      minPrice?: number;
      maxPrice?: number;
      deviceType?: string;
    },
    page: number = 1,
    limit: number = 10,
  ): Promise<{ services: ServiceEntity[]; total: number }> {
    const queryBuilder = this.servicesRepository.createQueryBuilder('service');

    queryBuilder
      .where('service.name ILIKE :query OR service.description ILIKE :query', {
        query: `%${query}%`,
      })
      .andWhere('service.isActive = :isActive', {
        isActive: true,
      })
      .leftJoinAndSelect('technician', 'user', 'user.id = service.technicianId')
      .leftJoinAndSelect('technician.reviews', 'review', 'review.technicianId = service.technicianId')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('service.popularityScore', 'DESC');

    // Apply additional filters
    if (filters?.workArea) {
      queryBuilder.andWhere('service.workAreas && :workArea', {
        workArea: filters.workArea,
      });
    }

    if (filters?.category) {
      queryBuilder.andWhere('service.category = :category', {
        category: filters.category,
      });
    }

    if (filters?.minPrice) {
      queryBuilder.andWhere('service.basePrice >= :minPrice', {
        minPrice: filters.minPrice,
      });
    }

    if (filters?.maxPrice) {
      queryBuilder.andWhere('service.basePrice <= :maxPrice', {
        maxPrice: filters.maxPrice,
      });
    }

    if (filters?.deviceType) {
      queryBuilder.andWhere('service.deviceTypes && :deviceType', {
        deviceType: filters.deviceType,
      });
    }

    const [services, total] = await queryBuilder.getManyAndCount();

    return { services, total };
  }

  async update(id: string, updateServiceDto: UpdateServiceDto, technicianId?: string): Promise<ServiceEntity> {
    const service = await this.findOne(id);

    // Check permissions: only technician who owns the service can update it
    if (service.technician.id !== technicianId) {
      throw new UnauthorizedException('Only the service owner can update this service');
    }

    await this.servicesRepository.update(id, updateServiceDto);

    return await this.findOne(id);
  }

  async remove(id: string, technicianId?: string): Promise<void> {
    const service = await this.findOne(id);

    // Check permissions: only technician who owns the service can delete it
    if (service.technician.id !== technicianId) {
      throw new UnauthorizedException('Only the service owner can delete this service');
    }

    await this.servicesRepository.update(id, {
      isActive: false,
      updatedAt: new Date(),
    });
  }

  async getPopularServices(limit: number = 10): Promise<ServiceEntity[]> {
    return await this.servicesRepository.find({
      where: { isActive: true },
      order: { popularityScore: 'DESC', totalOrders: 'DESC' },
      take: limit,
      relations: ['technician'],
    });
  }

  async getServicesByWorkArea(workArea: string, page: number = 1, limit: number = 10): Promise<{ services: ServiceEntity[]; total: number }> {
    const [services, total] = await this.servicesRepository.findAndCount({
      where: {
        workAreas: { $contains: workArea },
        isActive: true,
      },
      order: { popularityScore: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['technician'],
    });

    return { services, total };
  }

  async updateServiceStatistics(serviceId: string): Promise<void> {
    const service = await this.servicesRepository.findOne({
      where: { id: serviceId },
      relations: ['orders'],
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const totalOrders = service.orders?.length || 0;
    const averageRating = service.orders?.reduce((sum, order) => sum + (order.customerRating || 0), 0) / totalOrders;

    await this.servicesRepository.update(serviceId, {
      totalOrders,
      averageRating,
    });
  }

  async updatePopularityScore(): Promise<void> {
    // This could be run periodically to update popularity based on views, bookings, etc.
    const services = await this.servicesRepository.find({
      where: { isActive: true },
      order: { totalOrders: 'DESC' },
      take: 100, // Limit to top services
    });

    for (const service of services) {
      const score = this.calculatePopularityScore(service);
      await this.servicesRepository.update(service.id, {
        popularityScore: score,
      });
    }
  }

  private calculatePopularityScore(service: ServiceEntity): number {
    // Simple algorithm: based on orders, rating, and recent activity
    const ordersScore = Math.log(service.totalOrders + 1) * 10;
    const ratingScore = (service.averageRating || 0) * 15;
    const recentActivityScore = service.updatedAt ?
      Math.max(0, 30 - Math.floor((Date.now() - service.updatedAt.getTime()) / (1000 * 60 * 60 * 24))) * 5 : 0;

    return Math.round(ordersScore + ratingScore + recentActivityScore);
  }
}