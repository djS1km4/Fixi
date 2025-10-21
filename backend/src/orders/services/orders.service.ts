import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { OrderEntity } from '../../common/entities/order.entity';
import { CreateOrderDto, UpdateOrderDto, GetOrdersDto } from '../dto/create-order.dto';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { UserEntity } from '../../common/entities/user.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private ordersRepository: Repository<OrderEntity>,
  ) {}

  async create(createOrderDto: CreateOrderDto, userId: string): Promise<OrderEntity> {
    // Check if technician is available and has capacity
    const technician = await this.ordersRepository.manager
      .getRepository(UserEntity)
      .findOne({
        where: {
          id: createOrderDto.preferredTechnicianId,
          status: 'ACTIVE',
          role: 'TECHNICIAN',
        },
      });

    if (!technician) {
      throw new NotFoundException('Technician not found or not available');
    }

    // Create the order
    const order = this.ordersRepository.create({
      ...createOrderDto,
      customerId: userId,
      status: OrderStatus.PENDING,
      createdAt: new Date(),
    });

    return await this.ordersRepository.save(order);
  }

  async findAll(
    getOrdersDto: GetOrdersDto,
    userId?: string,
  ): Promise<{ orders: OrderEntity[]; total: number }> {
    const queryBuilder = this.ordersRepository.createQueryBuilder('order');

    // Apply filters
    if (getOrdersDto.status) {
      queryBuilder.andWhere('order.status = :status', {
        status: getOrdersDto.status,
      });
    }

    if (getOrdersDto.customerId) {
      queryBuilder.andWhere('order.customerId = :customerId', {
        customerId: getOrdersDto.customerId,
      });
    }

    if (getOrdersDto.technicianId) {
      queryBuilder.andWhere('order.technicianId = :technicianId', {
        technicianId: getOrdersDto.technicianId,
      });
    }

    if (getOrdersDto.dateFrom && getOrdersDto.dateTo) {
      queryBuilder.andWhere('order.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: getOrdersDto.dateFrom,
        dateTo: getOrdersDto.dateTo,
      });
    }

    // Apply pagination
    queryBuilder
      .skip((getOrdersDto.page - 1) * getOrdersDto.limit)
      .take(getOrdersDto.limit)
      .orderBy('order.createdAt', 'DESC')
      .leftJoinAndSelect('customer', 'user', 'user.id = order.customerId')
      .leftJoinAndSelect('technician', 'user', 'user.id = order.technicianId');

    const [orders, total] = await queryBuilder.getManyAndCount();

    return { orders, total };
  }

  async findOne(id: string): Promise<OrderEntity> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['customer', 'technician'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async findByCustomer(
    customerId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ orders: OrderEntity[]; total: number }> {
    const [orders, total] = await this.ordersRepository.findAndCount({
      where: { customerId },
      relations: ['technician'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { orders, total };
  }

  async findByTechnician(
    technicianId: string,
    page: number = 1,
    limit: number = 10,
    status?: OrderStatus,
  ): Promise<{ orders: OrderEntity[]; total: number }> {
    const whereCondition: { technicianId };

    if (status) {
      whereCondition.status = status;
    }

    const [orders, total] = await this.ordersRepository.findAndCount({
      where: whereCondition,
      relations: ['customer'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { orders, total };
  }

  async updateStatus(id: string, status: OrderStatus): Promise<OrderEntity> {
    const order = await this.findOne(id);

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Validate status transitions
    if (!this.isValidStatusTransition(order.status, status)) {
      throw new BadRequestException(`Cannot update order from ${order.status} to ${status}`);
    }

    const lastStatusChangeAt = new Date();

    await this.ordersRepository.update(id, {
      status,
      lastStatusChangeAt,
    });

    return await this.findOne(id);
  }

  async assignTechnician(orderId: string, technicianId: string): Promise<OrderEntity> {
    const order = await this.findOne(orderId);

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order must be in PENDING status to assign technician');
    }

    // Check if technician is available
    const technician = await this.ordersRepository.manager
      .getRepository(UserEntity)
      .findOne({
        where: {
          id: technicianId,
          status: 'ACTIVE',
          role: 'TECHNICIAN',
        },
      });

    if (!technician) {
      throw new NotFoundException('Technician not found or not available');
    }

    await this.ordersRepository.update(orderId, {
      technicianId,
      status: OrderStatus.CONFIRMED,
      confirmedAt: new Date(),
    });

    return await this.findOne(orderId);
  }

  async acceptOrder(orderId: string, technicianId: string): Promise<OrderEntity> {
    const order = await this.findOne(orderId);

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException('Order must be in CONFIRMED status to be accepted');
    }

    if (order.technicianId !== technicianId) {
      throw new BadRequestException('Only assigned technician can accept order');
    }

    await this.ordersRepository.update(orderId, {
      status: OrderStatus.IN_PROGRESS,
      startedAt: new Date(),
    });

    return await this.findOne(orderId);
  }

  async completeOrder(
    orderId: string,
    technicianId: string,
    completionData?: {
      workPerformed?: string;
      partsUsed?: string[];
      notes?: string;
    },
  ): Promise<OrderEntity> {
    const order = await this.findOne(orderId);

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.status !== OrderStatus.IN_PROGRESS) {
      throw new BadRequestException('Order must be in IN_PROGRESS status to be completed');
    }

    if (order.technicianId !== technicianId) {
      throw new BadRequestException('Only assigned technician can complete order');
    }

    const completionDataToSave = {
      workPerformed: completionData?.workPerformed || 'Service completed',
      partsUsed: completionData?.partsUsed || [],
      notes: completionData?.notes || '',
    };

    await this.ordersRepository.update(orderId, {
      status: OrderStatus.COMPLETED,
      completedAt: new Date(),
      workPerformed: completionDataToSave.workPerformed,
      partsUsed: completionDataToSave.partsUsed,
      technicianNotes: completionDataToSave.notes,
    });

    // Update technician's completed jobs count
    await this.ordersRepository.manager
      .getRepository(UserEntity)
      .increment({ id: technicianId }, 'completedJobs');

    return await this.findOne(orderId);
  }

  async cancelOrder(
    orderId: string,
    userId: string,
    cancellationReason: string,
  ): Promise<OrderEntity> {
    const order = await this.findOne(orderId);

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.customerId !== userId) {
      throw new BadRequestException('Only customer can cancel their own order');
    }

    if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order cannot be cancelled');
    }

    await this.ordersRepository.update(orderId, {
      status: OrderStatus.CANCELLED,
      cancelledAt: new Date(),
      cancellationReason,
    });

    return await this.findOne(orderId);
  }

  async getCustomerOrders(
    customerId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ orders: OrderEntity[]; total: number }> {
    return await this.findByCustomer(customerId, page, limit);
  }

  async getTechnicianOrders(
    technicianId: string,
    page: number = 1,
    limit: number = 10,
    status?: OrderStatus,
  ): Promise<{ orders: OrderEntity[]; total: number }> {
    return await this.findByTechnician(technicianId, page, limit, status);
  }

  private isValidStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ): boolean {
    const validTransitions = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
      [OrderStatus.IN_PROGRESS]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      [OrderStatus.COMPLETED]: [], // Final state
      [OrderStatus.CANCELLED]: [], // Final state
      [OrderStatus.REFUNDED]: [OrderStatus.PENDING], // Can retry
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  async getActiveOrders(): Promise<OrderEntity[]> {
    return await this.ordersRepository.find({
      where: {
        status: In([OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.IN_PROGRESS]),
      },
      order: { createdAt: 'ASC' },
      relations: ['customer', 'technician'],
    });
  }

  async getOrdersByStatus(
    status: OrderStatus,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ orders: OrderEntity[]; total: number }> {
    const [orders, total] = await this.ordersRepository.findAndCount({
      where: { status },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['customer', 'technician'],
    });

    return { orders, total };
  }

  async searchOrders(
    query: string,
    userId?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ orders: OrderEntity[]; total: number }> {
    const queryBuilder = this.ordersRepository.createQueryBuilder('order');

    queryBuilder
      .where('order.title ILIKE :query OR order.description ILIKE :query')
      .leftJoinAndSelect('customer', 'user', 'user.id = order.customerId')
      .leftJoinAndSelect('technician', 'user', 'user.id = order.technicianId');

    if (userId) {
      queryBuilder.andWhere('order.customerId = :userId', { userId });
    }

    queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('order.createdAt', 'DESC');

    const [orders, total] = await queryBuilder.getManyAndCount();

    return { orders, total };
  }

  async getOrderStatistics(
    startDate?: Date,
    endDate?: Date,
    technicianId?: string,
  ): Promise<any> {
    const queryBuilder = this.ordersRepository.createQueryBuilder('order');

    if (startDate && endDate) {
      queryBuilder.andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    if (technicianId) {
      queryBuilder.andWhere('order.technicianId = :technicianId', {
        technicianId,
      });
    }

    const statistics = await queryBuilder
      .select([
        'COUNT(*) as total_orders',
        'COUNT(CASE WHEN order.status = :completed THEN 1 ELSE 0 END) as completed_orders',
        'COUNT(CASE WHEN order.status = :cancelled THEN 1 ELSE 0 END) as cancelled_orders',
        'AVG(order.finalPrice) as average_order_value',
      ])
      .setParameters({
        completed: OrderStatus.COMPLETED,
        cancelled: OrderStatus.CANCELLED,
      })
      .groupBy('order.technicianId')
      .orderBy('average_order_value', 'DESC')
      .getRawMany();

    return statistics;
  }
}