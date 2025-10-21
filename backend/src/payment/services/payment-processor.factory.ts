import { Injectable } from '@nestjs/common';
import { PaymentMethod } from '../../common/types/payment-method.enum';
import { Payment, PaymentStatus } from '../../entities/payment.entity';
import { PaymentRefund, RefundStatus } from '../../entities/payment-refund.entity';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { WompiService } from './wompi.service';
import { MercadoPagoService } from './mercado-pago.service';

export interface PaymentProcessor {
  name: string;
  processCardPayment(
    payment: Payment,
    createPaymentDto: CreatePaymentDto,
  ): Promise<{
    status: PaymentStatus;
    externalTransactionId: string | null;
    provider: string;
    response: any;
    approvalCode: string | null;
    message: string;
    redirectUrl: string | null;
  }>;

  processPsePayment(
    payment: Payment,
    createPaymentDto: CreatePaymentDto,
  ): Promise<{
    status: PaymentStatus;
    externalTransactionId: string | null;
    provider: string;
    response: any;
    approvalCode: string | null;
    message: string;
    redirectUrl: string | null;
  }>;

  processDigitalWalletPayment(
    payment: Payment,
    createPaymentDto: CreatePaymentDto,
  ): Promise<{
    status: PaymentStatus;
    externalTransactionId: string | null;
    provider: string;
    response: any;
    approvalCode: string | null;
    message: string;
    redirectUrl: string | null;
  }>;

  processCreditPayment(
    payment: Payment,
    createPaymentDto: CreatePaymentDto,
  ): Promise<{
    status: PaymentStatus;
    externalTransactionId: string | null;
    provider: string;
    response: any;
    approvalCode: string | null;
    message: string;
    redirectUrl: string | null;
  }>;

  processCashPayment(
    payment: Payment,
    createPaymentDto: CreatePaymentDto,
  ): Promise<{
    status: PaymentStatus;
    externalTransactionId: string | null;
    provider: string;
    response: any;
    approvalCode: string | null;
    message: string;
    redirectUrl: string | null;
  }>;

  processRefund(
    payment: Payment,
    refund: PaymentRefund,
  ): Promise<{
    status: RefundStatus;
    externalRefundId: string | null;
    response: any;
    authorizationCode: string | null;
    failureReason: string | null;
  }>;

  checkPaymentStatus(externalTransactionId: string): Promise<{
    status: PaymentStatus;
    response: any;
    message: string | null;
  }>;
}

class WompiProcessor implements PaymentProcessor {
  name = 'Wompi';

  constructor(private readonly wompiService: WompiService) {}

  async processCardPayment(payment: Payment, createPaymentDto: CreatePaymentDto) {
    return this.wompiService.processCardPayment(payment, createPaymentDto);
  }

  async processPsePayment(payment: Payment, createPaymentDto: CreatePaymentDto) {
    return this.wompiService.processPsePayment(payment, createPaymentDto);
  }

  async processDigitalWalletPayment(payment: Payment, createPaymentDto: CreatePaymentDto) {
    // Wompi soporta Nequi
    if (createPaymentDto.nequi) {
      return this.wompiService.processNequiPayment(payment, createPaymentDto);
    }

    throw new Error('Método de billetera digital no soportado por Wompi');
  }

  async processCreditPayment(payment: Payment, createPaymentDto: CreatePaymentDto) {
    // Wompi no tiene soporte nativo para créditos de consumo
    // Se puede integrar con servicios de terceros o usar tarjeta de crédito con cuotas
    if (createPaymentDto.credit?.creditEntity === 'wompi_credit') {
      return this.processCardPayment(payment, {
        ...createPaymentDto,
        card: createPaymentDto.card, // Procesar como tarjeta de crédito
      });
    }

    throw new Error('Crédito de consumo no soportado por Wompi');
  }

  async processCashPayment(payment: Payment, createPaymentDto: CreatePaymentDto) {
    // Wompi soporta pagos en efectivo con Baloto
    if (createPaymentDto.cash?.cashType === 'BALOTO') {
      // Generar referencia de pago en efectivo
      const reference = `FIXI_${payment.orderId}_${Date.now()}`;
      return {
        status: PaymentStatus.PENDING,
        externalTransactionId: reference,
        provider: 'Wompi',
        response: { reference, cashType: 'BALOTO' },
        approvalCode: null,
        message: 'Generada referencia para pago en efectivo',
        redirectUrl: null,
      };
    }

    throw new Error('Tipo de pago en efectivo no soportado por Wompi');
  }

  async processRefund(payment: Payment, refund: PaymentRefund) {
    return this.wompiService.processRefund(payment, refund);
  }

  async checkPaymentStatus(externalTransactionId: string) {
    return this.wompiService.checkPaymentStatus(externalTransactionId);
  }
}

class MercadoPagoProcessor implements PaymentProcessor {
  name = 'MercadoPago';

  constructor(private readonly mercadoPagoService: MercadoPagoService) {}

  async processCardPayment(payment: Payment, createPaymentDto: CreatePaymentDto) {
    return this.mercadoPagoService.processCardPayment(payment, createPaymentDto);
  }

  async processPsePayment(payment: Payment, createPaymentDto: CreatePaymentDto) {
    return this.mercadoPagoService.processPsePayment(payment, createPaymentDto);
  }

  async processDigitalWalletPayment(payment: Payment, createPaymentDto: CreatePaymentDto) {
    if (createPaymentDto.nequi) {
      return this.mercadoPagoService.processNequiPayment(payment, createPaymentDto);
    }

    if (createPaymentDto.daviplata) {
      // Mercado Pago no soporta Daviplata directamente
      // Se puede integrar con API de Daviplata o usar método alternativo
      throw new Error('Daviplata no soportado directamente por Mercado Pago');
    }

    throw new Error('Método de billetera digital no soportado por Mercado Pago');
  }

  async processCreditPayment(payment: Payment, createPaymentDto: CreatePaymentDto) {
    // Mercado Pago tiene soporte para financiamiento
    if (createPaymentDto.credit) {
      // Usar el método de crédito de Mercado Pago
      return this.processCardPayment(payment, {
        ...createPaymentDto,
        card: createPaymentDto.card, // Procesar como tarjeta con cuotas
      });
    }

    throw new Error('Crédito de consumo no soportado por Mercado Pago');
  }

  async processCashPayment(payment: Payment, createPaymentDto: CreatePaymentDto) {
    // Mercado Pago soporta pagos en efectivo con OXXO, Baloto, etc.
    if (createPaymentDto.cash) {
      const reference = `FIXI_${payment.orderId}_${Date.now()}`;
      return {
        status: PaymentStatus.PENDING,
        externalTransactionId: reference,
        provider: 'MercadoPago',
        response: { reference, cashType: createPaymentDto.cash.cashType },
        approvalCode: null,
        message: 'Generada referencia para pago en efectivo',
        redirectUrl: null,
      };
    }

    throw new Error('Tipo de pago en efectivo no soportado por Mercado Pago');
  }

  async processRefund(payment: Payment, refund: PaymentRefund) {
    return this.mercadoPagoService.processRefund(payment, refund);
  }

  async checkPaymentStatus(externalTransactionId: string) {
    return this.mercadoPagoService.checkPaymentStatus(externalTransactionId);
  }
}

class DirectProcessor implements PaymentProcessor {
  name = 'Direct';

  async processCardPayment(payment: Payment, createPaymentDto: CreatePaymentDto) {
    // Procesamiento directo con pasarelas bancarias o integración directa
    // Este método se puede implementar con APIs de bancos colombianos
    return {
      status: PaymentStatus.PENDING,
      externalTransactionId: `DIRECT_${Date.now()}`,
      provider: 'Direct',
      response: { message: 'Procesamiento directo iniciado' },
      approvalCode: null,
      message: 'Pago iniciado para procesamiento directo',
      redirectUrl: null,
    };
  }

  async processPsePayment(payment: Payment, createPaymentDto: CreatePaymentDto) {
    // Integración directa con PSE (ACH Colombia)
    return {
      status: PaymentStatus.PENDING,
      externalTransactionId: `PSE_DIRECT_${Date.now()}`,
      provider: 'Direct',
      response: { message: 'Procesamiento PSE directo iniciado' },
      approvalCode: null,
      message: 'Pago PSE iniciado para procesamiento directo',
      redirectUrl: 'https://redireccion-pse-banco.com',
    };
  }

  async processDigitalWalletPayment(payment: Payment, createPaymentDto: CreatePaymentDto) {
    if (createPaymentDto.nequi) {
      return {
        status: PaymentStatus.PENDING,
        externalTransactionId: `NEQUI_DIRECT_${Date.now()}`,
        provider: 'Direct',
        response: { message: 'Procesamiento Nequi directo iniciado' },
        approvalCode: null,
        message: 'Pago Nequi iniciado para procesamiento directo',
        redirectUrl: null,
      };
    }

    if (createPaymentDto.daviplata) {
      return {
        status: PaymentStatus.PENDING,
        externalTransactionId: `DAVIPLATA_DIRECT_${Date.now()}`,
        provider: 'Direct',
        response: { message: 'Procesamiento Daviplata directo iniciado' },
        approvalCode: null,
        message: 'Pago Daviplata iniciado para procesamiento directo',
        redirectUrl: null,
      };
    }

    throw new Error('Método de billetera digital no soportado');
  }

  async processCreditPayment(payment: Payment, createPaymentDto: CreatePaymentDto) {
    // Integración directa con entidades de crédito colombianas
    if (createPaymentDto.credit) {
      return {
        status: PaymentStatus.PENDING,
        externalTransactionId: `CREDIT_DIRECT_${Date.now()}`,
        provider: 'Direct',
        response: { message: 'Procesamiento crédito directo iniciado' },
        approvalCode: null,
        message: `Crédito con ${createPaymentDto.credit.creditEntity} iniciado`,
        redirectUrl: null,
      };
    }

    throw new Error('Crédito de consumo no soportado');
  }

  async processCashPayment(payment: Payment, createPaymentDto: CreatePaymentDto) {
    if (createPaymentDto.cash) {
      return {
        status: PaymentStatus.PENDING,
        externalTransactionId: `CASH_DIRECT_${Date.now()}`,
        provider: 'Direct',
        response: { message: 'Referencia de pago en efectivo generada' },
        approvalCode: null,
        message: 'Referencia generada para pago en efectivo',
        redirectUrl: null,
      };
    }

    throw new Error('Tipo de pago en efectivo no soportado');
  }

  async processRefund(payment: Payment, refund: PaymentRefund) {
    // Procesamiento de reembolsos directo
    return {
      status: RefundStatus.PENDING,
      externalRefundId: `REFUND_DIRECT_${Date.now()}`,
      response: { message: 'Reembolso directo iniciado' },
      authorizationCode: null,
      failureReason: null,
    };
  }

  async checkPaymentStatus(externalTransactionId: string) {
    return {
      status: PaymentStatus.PENDING,
      response: { message: 'Verificación de estado iniciada' },
      message: 'Estado del pago en verificación',
    };
  }
}

@Injectable()
export class PaymentProcessorFactory {
  private readonly processors: Map<string, PaymentProcessor>;

  constructor(
    private readonly wompiService: WompiService,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {
    this.processors = new Map([
      ['wompi', new WompiProcessor(this.wompiService)],
      ['mercadopago', new MercadoPagoProcessor(this.mercadoPagoService)],
      ['direct', new DirectProcessor()],
    ]);
  }

  getProcessor(method: PaymentMethod): PaymentProcessor {
    // Lógica de selección de procesador basada en método de pago
    const processorMap: Record<PaymentMethod, string> = {
      [PaymentMethod.CREDIT_CARD]: 'wompi', // Priorizar Wompi para tarjetas
      [PaymentMethod.DEBIT_CARD]: 'wompi',
      [PaymentMethod.NEQUI]: 'wompi', // Wompi tiene mejor soporte para Nequi
      [PaymentMethod.DAVIPLATA]: 'mercadopago', // Mercado Pago puede tener mejor integración
      [PaymentMethod.PSE]: 'wompi', // Wompi tiene buen soporte PSE
      [PaymentMethod.BANK_TRANSFER]: 'direct',
      [PaymentMethod.ACH_TRANSFER]: 'direct',
      [PaymentMethod.CASH]: 'wompi', // Wompi soporta Baloto
      [PaymentMethod.BALOTO]: 'wompi',
      [PaymentMethod.EFECTY]: 'mercadopago',
      [PaymentMethod.SHORT_TERM_CREDIT]: 'direct',
      [PaymentMethod.INSTALMENT_CREDIT]: 'direct',
      [PaymentMethod.DIGITAL_WALLET]: 'wompi',
      [PaymentMethod.CRYPTOCURRENCY]: 'direct',
    };

    const processorName = processorMap[method];
    const processor = this.processors.get(processorName);

    if (!processor) {
      throw new Error(`No hay procesador disponible para el método de pago: ${method}`);
    }

    return processor;
  }

  getAllProcessors(): PaymentProcessor[] {
    return Array.from(this.processors.values());
  }

  getProcessorByName(name: string): PaymentProcessor | undefined {
    return this.processors.get(name);
  }
}