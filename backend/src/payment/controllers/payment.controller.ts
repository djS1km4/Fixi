import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/types/user-role.enum';
import { PaymentService } from '../services/payment.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { RefundPaymentDto } from '../dto/refund-payment.dto';
import { QueryPaymentsDto } from '../dto/query-payments.dto';
import { Payment, PaymentMethod, PaymentStatus } from '../../common/entities/payment.entity';
import { PaymentRefund, RefundStatus } from '../../common/entities/payment-refund.entity';
import { WompiService } from '../services/wompi.service';
import { MercadoPagoService } from '../services/mercado-pago.service';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly wompiService: WompiService,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  @Post()
  @Roles(UserRole.CUSTOMER, UserRole.TECHNICIAN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo pago', description: 'Crea un nuevo pago para una orden con el método especificado' })
  @ApiResponse({ status: 201, description: 'Pago creado exitosamente', type: Payment })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Orden no encontrada' })
  async createPayment(@Body() createPaymentDto: CreatePaymentDto, @Request() req): Promise<Payment> {
    return await this.paymentService.createPayment(createPaymentDto, req.user.userId);
  }

  @Get()
  @Roles(UserRole.CUSTOMER, UserRole.TECHNICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener lista de pagos', description: 'Retorna una lista paginada de pagos con filtros' })
  @ApiResponse({ status: 200, description: 'Lista de pagos obtenida exitosamente' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Elementos por página', example: 20 })
  @ApiQuery({ name: 'method', required: false, enum: PaymentMethod, description: 'Método de pago' })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus, description: 'Estado del pago' })
  @ApiQuery({ name: 'orderId', required: false, description: 'ID de la orden' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Fecha de inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Fecha de fin (YYYY-MM-DD)' })
  @ApiQuery({ name: 'minAmount', required: false, description: 'Monto mínimo' })
  @ApiQuery({ name: 'maxAmount', required: false, description: 'Monto máximo' })
  @ApiQuery({ name: 'search', required: false, description: 'Término de búsqueda' })
  async getPayments(
    @Query() queryDto: QueryPaymentsDto,
    @Request() req,
  ): Promise<{ payments: Payment[]; total: number; page: number; limit: number }> {
    const userId = req.user.role === UserRole.ADMIN ? undefined : req.user.userId;
    return await this.paymentService.getPayments(queryDto, userId);
  }

  @Get(':id')
  @Roles(UserRole.CUSTOMER, UserRole.TECHNICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener pago por ID', description: 'Retorna los detalles de un pago específico' })
  @ApiParam({ name: 'id', description: 'ID del pago' })
  @ApiResponse({ status: 200, description: 'Pago encontrado exitosamente', type: Payment })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  async getPaymentById(@Param('id', ParseUUIDPipe) id: string): Promise<Payment> {
    return await this.paymentService.getPaymentById(id);
  }

  @Post('refund')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Reembolsar un pago', description: 'Procesa el reembolso total o parcial de un pago' })
  @ApiResponse({ status: 201, description: 'Reembolso procesado exitosamente', type: PaymentRefund })
  @ApiResponse({ status: 400, description: 'Datos inválidos o reembolso no permitido' })
  async refundPayment(@Body() refundDto: RefundPaymentDto, @Request() req): Promise<PaymentRefund> {
    return await this.paymentService.refundPayment(refundDto, req.user.userId);
  }

  @Get('statistics/summary')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Obtener estadísticas de pagos', description: 'Retorna estadísticas generales de pagos' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente' })
  async getPaymentStatistics(@Request() req): Promise<{
    total: number;
    completed: number;
    pending: number;
    failed: number;
    refunded: number;
    methodBreakdown: Record<string, number>;
  }> {
    const userId = req.user.role === UserRole.ADMIN ? undefined : req.user.userId;
    return await this.paymentService.getPaymentStatistics(userId);
  }

  @Get('verify/:transactionId')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Verificar estado de transacción externa', description: 'Verifica el estado de una transacción con el proveedor externo' })
  @ApiParam({ name: 'transactionId', description: 'ID de transacción externa' })
  @ApiResponse({ status: 200, description: 'Estado verificado exitosamente', type: Payment })
  @ApiResponse({ status: 404, description: 'Transacción no encontrada' })
  async verifyPaymentStatus(
    @Param('transactionId') transactionId: string,
  ): Promise<Payment> {
    return await this.paymentService.verifyPaymentStatus(transactionId);
  }

  @Get('providers/wompi/banks')
  @Roles(UserRole.CUSTOMER, UserRole.TECHNICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener bancos disponibles PSE - Wompi', description: 'Retorna la lista de bancos disponibles para PSE en Wompi' })
  @ApiResponse({ status: 200, description: 'Lista de bancos obtenida exitosamente' })
  async getWompiPseBanks(): Promise<any[]> {
    return await this.wompiService.getAvailablePseBanks();
  }

  @Get('providers/mercadopago/payment-methods')
  @Roles(UserRole.CUSTOMER, UserRole.TECHNICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener métodos de pago - Mercado Pago', description: 'Retorna los métodos de pago disponibles en Mercado Pago' })
  @ApiResponse({ status: 200, description: 'Métodos de pago obtenidos exitosamente' })
  async getMercadoPagoPaymentMethods(): Promise<any[]> {
    return await this.mercadoPagoService.getPaymentMethods();
  }

  @Get('providers/mercadopago/banks')
  @Roles(UserRole.CUSTOMER, UserRole.TECHNICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener bancos disponibles - Mercado Pago', description: 'Retorna la lista de bancos disponibles en Mercado Pago' })
  @ApiResponse({ status: 200, description: 'Lista de bancos obtenida exitosamente' })
  async getMercadoPagoBanks(): Promise<any[]> {
    return await this.mercadoPagoService.getAvailableBanks();
  }

  @Get('providers/wompi/transaction/:transactionId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener detalles de transacción Wompi', description: 'Obtiene los detalles completos de una transacción en Wompi' })
  @ApiParam({ name: 'transactionId', description: 'ID de transacción Wompi' })
  @ApiResponse({ status: 200, description: 'Detalles de transacción obtenidos exitosamente' })
  async getWompiTransactionDetails(@Param('transactionId') transactionId: string): Promise<any> {
    return await this.wompiService.getTransactionStatus(transactionId);
  }

  @Put(':id/cancel')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar pago (Admin)', description: 'Cancela un pago pendiente o lo marca para revisión manual' })
  @ApiParam({ name: 'id', description: 'ID del pago a cancelar' })
  @ApiResponse({ status: 200, description: 'Pago cancelado exitosamente', type: Payment })
  @ApiResponse({ status: 400, description: 'No se puede cancelar el pago' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  async cancelPayment(@Param('id', ParseUUIDPipe) id: string): Promise<Payment> {
    return await this.paymentService.cancelPayment(id);
  }

  @Put(':id/confirm-manual')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmar pago manualmente (Admin)', description: 'Confirma un pago que requiere revisión manual' })
  @ApiParam({ name: 'id', description: 'ID del pago a confirmar' })
  @ApiResponse({ status: 200, description: 'Pago confirmado exitosamente', type: Payment })
  @ApiResponse({ status: 400, description: 'No se puede confirmar el pago' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  async confirmPaymentManually(@Param('id', ParseUUIDPipe) id: string): Promise<Payment> {
    return await this.paymentService.confirmManualPayment(id);
  }

  @Get('my-payments/:userId')
  @Roles(UserRole.CUSTOMER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Obtener mis pagos', description: 'Retorna los pagos del usuario autenticado' })
  @ApiParam({ name: 'userId', description: 'ID del usuario (debe coincidir con el usuario autenticado)' })
  @ApiResponse({ status: 200, description: 'Pagos obtenidos exitosamente' })
  @ApiResponse({ status: 403, description: 'No autorizado para ver estos pagos' })
  async getMyPayments(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() queryDto: QueryPaymentsDto,
    @Request() req,
  ): Promise<{ payments: Payment[]; total: number; page: number; limit: number }> {
    if (req.user.userId !== userId && req.user.role !== UserRole.ADMIN) {
      throw new Error('No autorizado para ver estos pagos');
    }
    return await this.paymentService.getPayments(queryDto, userId);
  }

  @Get('order/:orderId')
  @Roles(UserRole.CUSTOMER, UserRole.TECHNICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener pagos por orden', description: 'Retorna todos los pagos asociados a una orden' })
  @ApiParam({ name: 'orderId', description: 'ID de la orden' })
  @ApiResponse({ status: 200, description: 'Pagos de la orden obtenidos exitosamente' })
  async getPaymentsByOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Query() queryDto: QueryPaymentsDto,
    @Request() req,
  ): Promise<{ payments: Payment[]; total: number; page: number; limit: number }> {
    const userId = req.user.role === UserRole.ADMIN ? undefined : req.user.userId;
    queryDto.orderId = orderId;
    return await this.paymentService.getPayments(queryDto, userId);
  }
}