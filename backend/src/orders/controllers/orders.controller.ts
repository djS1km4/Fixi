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
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from '../services/orders.service';
import { CreateOrderDto, UpdateOrderDto } from '../dto/create-order.dto';
import { OrderEntity } from '../../common/entities/order.entity';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { JwtAuthGuard, Roles } from '../../auth/guards/jwt.guard';
import { UserRole } from '../../auth/decorators/roles.decorator';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @ApiOperation({ summary: 'Get all orders (paginated)' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiBearerAuth()
  @Get()
  async findAll(@Query() getOrdersDto: GetOrdersDto) {
    return await this.ordersService.findAll(getOrdersDto);
  }

  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiBearerAuth()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.ordersService.findOne(id);
  }

  @ApiOperation({ summary: 'Get customer orders' })
  @ApiResponse({ status: 200, description: 'Customer orders retrieved successfully' })
  @ApiBearerAuth()
  @Get('customer/:customerId')
  async getCustomerOrders(
    @Param('customerId') customerId: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return await this.ordersService.findByCustomer(customerId, page, limit);
  }

  @ApiOperation({ summary: 'Get technician orders' })
  @ApiResponse({ status: 200, description: 'Technician orders retrieved successfully' })
  @ApiBearerAuth()
  @Get('technician/:technicianId')
  async getTechnicianOrders(
    @Param('technicianId') technicianId: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('status') status?: OrderStatus,
  ) {
    return await this.ordersService.findByTechnician(technicianId, page, limit, status);
  }

  @ApiOperation({ summary: 'Create new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBearerAuth()
  @Roles(UserRole.CLIENT)
  @Post()
  async create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    createOrderDto.customerId = req.user.userId;
    return await this.ordersService.create(createOrderDto);
  }

  @ApiOperation({ summary: 'Assign technician to order' })
  @ApiResponse({ status: 200, description: 'Technician assigned successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBearerAuth()
  @Put(':id/assign-technician')
  async assignTechnician(
    @Param('id') id: string,
    @Body('technicianId') technicianId: { technicianId: string },
    @Request() req,
  ) {
    // Verify technician can only be assigned by admin or customer
    if (req.user.role !== UserRole.ADMIN && req.user.userId !== req.body.customerId) {
      throw new UnauthorizedException('Only admin or order owner can assign technician');
    }

    return await this.ordersService.assignTechnician(id, technicianId);
  }

  @ApiOperation({ summary: 'Accept order' })
  @ApiResponse({ status: 200, description: 'Order accepted successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBearerAuth()
  @Put(':id/accept')
  async acceptOrder(@Param('id') id: string, @Request() req) {
    // Verify technician can only accept their own assigned orders
    if (req.user.role === UserRole.CLIENT) {
      throw new UnauthorizedException('Only technicians can accept orders');
    }

    return await this.ordersService.acceptOrder(id, req.user.userId);
  }

  @ApiOperation({ summary: 'Complete order' })
  @ApiResponse({ status: 200, description: 'Order completed successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBearerAuth()
  @Put(':id/complete')
  async completeOrder(
    @Param('id') id: string,
    @Body('completionData') completionData: any,
    @Request() req,
  ) {
    // Verify technician can only complete their own assigned orders
    if (req.user.role === UserRole.CLIENT) {
      throw new UnauthorizedException('Only technicians can complete orders');
    }

    return await this.ordersService.completeOrder(id, req.user.userId, completionData);
  }

  @ApiOperation({ summary: 'Cancel order' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBearerAuth()
  @Put(':id/cancel')
  async cancelOrder(
    @Param('id') id: string,
    @Body('cancellationReason') cancellationReason: { cancellationReason: string },
    @Request() req,
  ) {
    return await this.ordersService.cancelOrder(id, req.user.userId, cancellationReason);
  }

  @ApiOperation({ summary: 'Get active orders' })
  @ApiResponse({ status: 200, description: 'Active orders retrieved successfully' })
  @ApiBearerAuth()
  @Get('active')
  async getActiveOrders() {
    return await this.ordersService.getActiveOrders();
  }

  @ApiOperation({ summary: 'Get order statistics' })
  @ApiResponse({ status: 200, description: 'Order statistics retrieved successfully' })
  @ApiBearerAuth()
  @Get('statistics')
  async getStatistics(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('technicianId') technicianId?: string,
  ) {
    // Only technicians and admins can view statistics
    if (req.user.role === UserRole.CLIENT && req.user.userId !== technicianId) {
      throw new UnauthorizedException('Insufficient permissions');
    }

    return await this.ordersService.getOrderStatistics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      technicianId,
    );
  }

  @ApiOperation({ summary: 'Search orders' })
  @ApiResponse({ status: 200, description: 'Order search results' })
  @ApiBearerAuth()
  @Get('search')
  async search(
    @Query('q') query: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Request() req,
  ) {
    // Apply search filters based on user role
    if (req.user.role === UserRole.CLIENT) {
      return await this.ordersService.searchOrders(query, page, limit, req.user.userId);
    } else if (req.user.role === UserRole.TECHNICIAN) {
      return await this.ordersService.searchOrders(query, page, limit, undefined, req.user.userId);
    } else {
      return await this.ordersService.searchOrders(query, page, limit);
    }
  }
}