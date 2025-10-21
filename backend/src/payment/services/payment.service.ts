import { Injectable, Logger, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../common/entities/payment.entity';
import { OrderEntity } from '../../common/entities/order.entity';
import { PaymentTransaction, TransactionType, TransactionStatus } from '../../common/entities/payment-transaction.entity';
import { PaymentRefund, RefundStatus } from '../../common/entities/payment-refund.entity';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { RefundPaymentDto } from '../dto/refund-payment.dto';
import { QueryPaymentsDto } from '../dto/query-payments.dto';
import { PaymentMethod } from '../../common/types/payment-method.enum';
import { PaymentStatus } from '../../common/types/payment-status.enum';
import { RefundReason } from '../../common/entities/payment-refund.entity';
import { WompiService } from './wompi.service';
import { MercadoPagoService } from './mercado-pago.service';
import { PaymentProcessorFactory } from './payment-processor.factory';
import { RefundReason } from '../../common/entities/payment-refund.entity';
import { TransactionType, TransactionStatus } from '../../common/entities/payment-transaction.entity';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(PaymentTransaction)
    private readonly transactionRepository: Repository<PaymentTransaction>,
    @InjectRepository(PaymentRefund)
    private readonly refundRepository: Repository<PaymentRefund>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    private readonly wompiService: WompiService,
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly paymentProcessorFactory: PaymentProcessorFactory,
  ) {}

  async createPayment(createPaymentDto: CreatePaymentDto, userId: string): Promise<Payment> {
    this.logger.log(`Creando pago para orden ${createPaymentDto.orderId} con método ${createPaymentDto.method}`);

    // Validar que la orden exista y esté en estado correcto
    const order = await this.orderRepository.findOne({
      where: { id: createPaymentDto.orderId },
      relations: ['user', 'service', 'technician'],
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    if (order.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException('La orden no está lista para pago');
    }

    // Verificar que el monto coincida con el total de la orden
    if (createPaymentDto.amount !== order.totalAmount) {
      throw new BadRequestException('El monto del pago no coincide con el total de la orden');
    }

    try {
      // Crear el registro de pago
      const payment = this.paymentRepository.create({
        orderId: createPaymentDto.orderId,
        userId: userId,
        method: createPaymentDto.method,
        amount: createPaymentDto.amount,
        taxAmount: order.taxAmount || 0,
        platformFee: order.platformFee || 0,
        netAmount: order.technicianAmount || order.totalAmount - order.platformFee,
        ipAddress: createPaymentDto.ipAddress,
        userAgent: createPaymentDto.userAgent,
        notes: createPaymentDto.notes,
        status: PaymentStatus.PENDING,
      });

      // Guardar información específica del método de pago
      await this.savePaymentMethodDetails(payment, createPaymentDto);

      const savedPayment = await this.paymentRepository.save(payment);

      // Procesar el pago con el proveedor correspondiente
      const processorResult = await this.processPayment(savedPayment, createPaymentDto);

      // Actualizar el pago con el resultado del procesamiento
      savedPayment.status = processorResult.status;
      savedPayment.externalTransactionId = processorResult.externalTransactionId;
      savedPayment.provider = processorResult.provider;
      savedPayment.processorResponse = processorResult.response;
      savedPayment.approvalCode = processorResult.approvalCode;
      savedPayment.responseMessage = processorResult.message;
      savedPayment.redirectUrl = processorResult.redirectUrl;

      if (processorResult.status === PaymentStatus.COMPLETED) {
        savedPayment.approvedAt = new Date();

        // Actualizar el estado de la orden
        order.status = 'PAID';
        order.paidAt = new Date();
        await this.orderRepository.save(order);
      } else if (processorResult.status === PaymentStatus.FAILED) {
        savedPayment.failedAt = new Date();
        savedPayment.failureReason = processorResult.message;
      }

      // Crear transacción de registro
      await this.createTransaction(savedPayment, TransactionType.CHARGE, savedPayment.amount);

      return await this.paymentRepository.save(savedPayment);
    } catch (error) {
      this.logger.error(`Error al crear pago: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al procesar el pago');
    }
  }

  private async savePaymentMethodDetails(payment: Payment, createPaymentDto: CreatePaymentDto): Promise<void> {
    switch (createPaymentDto.method) {
      case PaymentMethod.CREDIT_CARD:
      case PaymentMethod.DEBIT_CARD:
        if (createPaymentDto.card) {
          payment.cardLastFour = createPaymentDto.card.cardNumber.slice(-4);
          payment.cardBrand = this.detectCardBrand(createPaymentDto.card.cardNumber);
          payment.cardBank = createPaymentDto.card.cardholderName;
          payment.cardToken = await this.tokenizeCard(createPaymentDto.card);
        }
        break;

      case PaymentMethod.PSE:
        if (createPaymentDto.pse) {
          payment.pseBank = createPaymentDto.pse.bank;
          payment.psePersonType = createPaymentDto.pse.personType;
          payment.pseIdentificationNumber = createPaymentDto.pse.documentNumber;
        }
        break;

      case PaymentMethod.NEQUI:
      case PaymentMethod.DAVIPLATA:
        if (createPaymentDto.nequi || createPaymentDto.daviplata) {
          payment.phoneNumber = createPaymentDto.method === PaymentMethod.NEQUI
            ? createPaymentDto.nequi.phoneNumber
            : createPaymentDto.daviplata.phoneNumber;
        }
        break;

      case PaymentMethod.SHORT_TERM_CREDIT:
      case PaymentMethod.INSTALMENT_CREDIT:
        if (createPaymentDto.credit) {
          payment.creditEntity = createPaymentDto.credit.creditEntity;
          payment.creditInstallments = createPaymentDto.credit.installments;
          payment.creditInterestRate = createPaymentDto.credit.interestRate;
        }
        break;

      case PaymentMethod.CASH:
      case PaymentMethod.BALOTO:
      case PaymentMethod.EFECTY:
        if (createPaymentDto.cash) {
          payment.notificationEmail = createPaymentDto.cash.email;
        }
        break;
    }
  }

  private detectCardBrand(cardNumber: string): string {
    const firstDigit = cardNumber[0];
    const firstTwoDigits = cardNumber.slice(0, 2);
    const firstThreeDigits = cardNumber.slice(0, 3);
    const firstFourDigits = cardNumber.slice(0, 4);

    // Visa
    if (firstDigit === '4') {
      return 'VISA';
    }

    // Mastercard
    if (firstTwoDigits >= '51' && firstTwoDigits <= '55') {
      return 'MASTERCARD';
    }

    // American Express
    if (firstTwoDigits === '34' || firstTwoDigits === '37') {
      return 'AMERICAN_EXPRESS';
    }

    // Discover
    if (firstFourDigits === '6011' || (firstTwoDigits >= '64' && firstTwoDigits <= '65')) {
      return 'DISCOVER';
    }

    // Diners Club
    if (firstTwoDigits >= '36' && firstTwoDigits <= '39') {
      return 'DINERS_CLUB';
    }

    return 'UNKNOWN';
  }

  private async tokenizeCard(cardData: any): Promise<string> {
    // Aquí iría la lógica para tokenizar la tarjeta con el proveedor
    // Por ahora retornamos un token simulado
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async processPayment(payment: Payment, createPaymentDto: CreatePaymentDto): Promise<{
    status: PaymentStatus;
    externalTransactionId: string | null;
    provider: string;
    response: any;
    approvalCode: string | null;
    message: string;
    redirectUrl: string | null;
  }> {
    const processor = this.paymentProcessorFactory.getProcessor(payment.method);

    try {
      switch (payment.method) {
        case PaymentMethod.CREDIT_CARD:
        case PaymentMethod.DEBIT_CARD:
          return await processor.processCardPayment(payment, createPaymentDto);

        case PaymentMethod.PSE:
          return await processor.processPsePayment(payment, createPaymentDto);

        case PaymentMethod.NEQUI:
        case PaymentMethod.DAVIPLATA:
          return await processor.processDigitalWalletPayment(payment, createPaymentDto);

        case PaymentMethod.SHORT_TERM_CREDIT:
        case PaymentMethod.INSTALMENT_CREDIT:
          return await processor.processCreditPayment(payment, createPaymentDto);

        case PaymentMethod.CASH:
        case PaymentMethod.BALOTO:
        case PaymentMethod.EFECTY:
          return await processor.processCashPayment(payment, createPaymentDto);

        default:
          throw new BadRequestException(`Método de pago no soportado: ${payment.method}`);
      }
    } catch (error) {
      this.logger.error(`Error procesando pago con ${processor.name}: ${error.message}`, error.stack);
      return {
        status: PaymentStatus.FAILED,
        externalTransactionId: null,
        provider: processor.name,
        response: error,
        approvalCode: null,
        message: error.message,
        redirectUrl: null,
      };
    }
  }

  private async createTransaction(
    payment: Payment,
    type: TransactionType,
    amount: number,
    fee: number = 0,
  ): Promise<PaymentTransaction> {
    const transaction = this.transactionRepository.create({
      paymentId: payment.id,
      type,
      status: TransactionStatus.PENDING,
      amount,
      fee,
      provider: payment.provider,
    });

    return await this.transactionRepository.save(transaction);
  }

  async getPayments(queryDto: QueryPaymentsDto, userId?: string): Promise<{ payments: Payment[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC' } = queryDto;

    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order')
      .leftJoinAndSelect('payment.user', 'user');

    // Aplicar filtros
    if (queryDto.orderId) {
      queryBuilder.andWhere('payment.orderId = :orderId', { orderId: queryDto.orderId });
    }

    if (userId) {
      queryBuilder.andWhere('payment.userId = :userId', { userId });
    }

    if (queryDto.method) {
      queryBuilder.andWhere('payment.method = :method', { method: queryDto.method });
    }

    if (queryDto.status) {
      queryBuilder.andWhere('payment.status = :status', { status: queryDto.status });
    }

    if (queryDto.provider) {
      queryBuilder.andWhere('payment.provider = :provider', { provider: queryDto.provider });
    }

    if (queryDto.externalTransactionId) {
      queryBuilder.andWhere('payment.externalTransactionId = :externalTransactionId', {
        externalTransactionId: queryDto.externalTransactionId,
      });
    }

    if (queryDto.minAmount) {
      queryBuilder.andWhere('payment.amount >= :minAmount', { minAmount: queryDto.minAmount });
    }

    if (queryDto.maxAmount) {
      queryBuilder.andWhere('payment.amount <= :maxAmount', { maxAmount: queryDto.maxAmount });
    }

    if (queryDto.startDate) {
      queryBuilder.andWhere('payment.createdAt >= :startDate', { startDate: queryDto.startDate });
    }

    if (queryDto.endDate) {
      queryBuilder.andWhere('payment.createdAt <= :endDate', { endDate: queryDto.endDate });
    }

    if (queryDto.search) {
      queryBuilder.andWhere(
        '(payment.externalTransactionId ILIKE :search OR payment.approvalCode ILIKE :search OR payment.responseMessage ILIKE :search)',
        { search: `%${queryDto.search}%` }
      );
    }

    // Ordenamiento y paginación
    queryBuilder.orderBy(`payment.${sortBy}`, sortOrder);
    queryBuilder.skip((page - 1) * limit);
    queryBuilder.take(limit);

    const [payments, total] = await queryBuilder.getManyAndCount();

    return {
      payments,
      total,
      page,
      limit,
    };
  }

  async getPaymentById(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['order', 'user', 'transactions', 'refunds'],
    });

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    return payment;
  }

  async cancelPayment(id: string): Promise<Payment> {
    const payment = await this.getPaymentById(id);

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Solo se pueden cancelar pagos pendientes');
    }

    payment.status = PaymentStatus.FAILED;
    payment.failureReason = 'Cancelado manualmente por administrador';
    payment.failedAt = new Date();

    return await this.paymentRepository.save(payment);
  }

  async confirmManualPayment(id: string): Promise<Payment> {
    const payment = await this.getPaymentById(id);

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Solo se pueden confirmar pagos pendientes');
    }

    payment.status = PaymentStatus.COMPLETED;
    payment.approvedAt = new Date();
    payment.approvalCode = 'MANUAL_CONFIRM';
    payment.responseMessage = 'Pago confirmado manualmente';
    payment.requiresReview = false;

    // Actualizar estado de la orden
    if (payment.orderId) {
      const order = await this.orderRepository.findOne({
        where: { id: payment.orderId },
      });

      if (order) {
        order.status = 'PAID';
        order.paidAt = new Date();
        await this.orderRepository.save(order);
      }
    }

    return await this.paymentRepository.save(payment);
  }

  async refundPayment(refundDto: RefundPaymentDto, userId: string): Promise<PaymentRefund> {
    this.logger.log(`Procesando reembolso para pago ${refundDto.paymentId} por monto ${refundDto.amount}`);

    const payment = await this.getPaymentById(refundDto.paymentId);

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Solo se pueden reembolsar pagos completados');
    }

    const totalRefunded = payment.refunds
      .filter(r => r.status === RefundStatus.COMPLETED)
      .reduce((sum, r) => sum + r.netAmount, 0);

    if (totalRefunded + refundDto.amount > payment.amount) {
      throw new BadRequestException('El monto a reembolsar excede el monto del pago');
    }

    try {
      const refund = this.refundRepository.create({
        paymentId: refundDto.paymentId,
        status: RefundStatus.PENDING,
        reason: refundDto.reason,
        amount: refundDto.amount,
        description: refundDto.description,
        notes: refundDto.notes,
        requestedBy: userId,
        netAmount: refundDto.amount - (refundDto.amount * 0.03), // 3% de comisión de reembolso
        fee: refundDto.amount * 0.03,
      });

      const savedRefund = await this.refundRepository.save(refund);

      // Procesar el reembolso con el proveedor
      await this.processRefund(payment, savedRefund);

      return savedRefund;
    } catch (error) {
      this.logger.error(`Error al procesar reembolso: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al procesar el reembolso');
    }
  }

  private async processRefund(payment: Payment, refund: PaymentRefund): Promise<void> {
    try {
      const processor = this.paymentProcessorFactory.getProcessor(payment.method);
      const refundResult = await processor.processRefund(payment, refund);

      refund.status = refundResult.status;
      refund.externalRefundId = refundResult.externalRefundId;
      refund.processorResponse = refundResult.response;
      refund.authorizationCode = refundResult.authorizationCode;
      refund.processedAt = new Date();

      if (refundResult.status === RefundStatus.COMPLETED) {
        refund.completedAt = new Date();

        // Actualizar el estado del pago si es un reembolso total
        const totalRefunded = await this.getTotalRefunded(payment.id);
        if (totalRefunded >= payment.amount) {
          payment.status = PaymentStatus.REFUNDED;
          payment.refundedAt = new Date();
          await this.paymentRepository.save(payment);
        }
      } else {
        refund.failureReason = refundResult.failureReason;
      }

      await this.refundRepository.save(refund);
    } catch (error) {
      refund.status = RefundStatus.FAILED;
      refund.failureReason = error.message;
      await this.refundRepository.save(refund);
      throw error;
    }
  }

  private async getTotalRefunded(paymentId: string): Promise<number> {
    const result = await this.refundRepository
      .createQueryBuilder('refund')
      .select('SUM(refund.netAmount)', 'total')
      .where('refund.paymentId = :paymentId', { paymentId })
      .andWhere('refund.status = :status', { status: RefundStatus.COMPLETED })
      .getRawOne();

    return result?.total || 0;
  }

  async getPaymentStatistics(userId?: string): Promise<{
    total: number;
    completed: number;
    pending: number;
    failed: number;
    refunded: number;
    methodBreakdown: Record<string, number>;
  }> {
    const queryBuilder = this.paymentRepository.createQueryBuilder('payment');

    if (userId) {
      queryBuilder.where('payment.userId = :userId', { userId });
    }

    const payments = await queryBuilder.getMany();

    const statistics = {
      total: payments.length,
      completed: payments.filter(p => p.status === PaymentStatus.COMPLETED).length,
      pending: payments.filter(p => p.status === PaymentStatus.PENDING).length,
      failed: payments.filter(p => p.status === PaymentStatus.FAILED).length,
      refunded: payments.filter(p => p.status === PaymentStatus.REFUNDED).length,
      methodBreakdown: payments.reduce((acc, p) => {
        acc[p.method] = (acc[p.method] || 0) + 1;
        return acc;
      }, {}),
    };

    return statistics;
  }

  async verifyPaymentStatus(externalTransactionId: string): Promise<Payment> {
    this.logger.log(`Verificando estado del pago con transacción externa ${externalTransactionId}`);

    const payment = await this.paymentRepository.findOne({
      where: { externalTransactionId },
    });

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    try {
      const processor = this.paymentProcessorFactory.getProcessor(payment.method);
      const statusResult = await processor.checkPaymentStatus(externalTransactionId);

      if (statusResult.status !== payment.status) {
        payment.status = statusResult.status;
        payment.processorResponse = statusResult.response;

        if (statusResult.status === PaymentStatus.COMPLETED && !payment.approvedAt) {
          payment.approvedAt = new Date();

          // Actualizar estado de la orden
          const order = await this.orderRepository.findOne({
            where: { id: payment.orderId },
          });
          if (order) {
            order.status = 'PAID';
            order.paidAt = new Date();
            await this.orderRepository.save(order);
          }
        } else if (statusResult.status === PaymentStatus.FAILED && !payment.failedAt) {
          payment.failedAt = new Date();
          payment.failureReason = statusResult.message;
        }

        await this.paymentRepository.save(payment);
      }

      return payment;
    } catch (error) {
      this.logger.error(`Error verificando estado del pago: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al verificar estado del pago');
    }
  }
}