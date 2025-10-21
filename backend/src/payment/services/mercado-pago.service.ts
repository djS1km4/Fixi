import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentMethod, PaymentStatus } from '../../entities/payment.entity';
import { PaymentRefund, RefundStatus } from '../../entities/payment-refund.entity';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

export interface MercadoPagoCardRequest {
  token: string;
  description: string;
  installments: number;
  payment_method_id: string;
  issuer_id?: string;
  transaction_amount: number;
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
}

export interface MercadoPagoPseRequest {
  transaction_amount: number;
  description: string;
  payment_method_id: 'pse';
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
    entity_type: 'individual' | 'association';
    first_name: string;
    last_name?: string;
  };
  additional_info?: {
    ip_address?: string;
  };
  callback_url?: string;
}

export interface MercadoPagoNequiRequest {
  transaction_amount: number;
  description: string;
  payment_method_id: 'nequi';
  payer: {
    email: string;
    phone: {
      area_code: string;
      number: string;
    };
    identification: {
      type: string;
      number: string;
    };
  };
}

export interface MercadoPagoResponse {
  id: number;
  status: string;
  status_detail: string;
  payment_method_id: string;
  payment_type_id: string;
  issuer_id?: string;
  processing_mode?: string;
  merchant_account_id?: number;
  description: string;
  live_mode: boolean;
  amount_refunded: number;
  collector_id: number;
  payer: {
    id?: number;
    email: string;
    identification: {
      type: string;
      number: string;
    };
    type: string;
  };
  metadata?: any;
  order?: any;
  external_reference?: string;
  transaction_amount: number;
  transaction_amount_refunded?: number;
  coupon_amount?: number;
  differential_pricing_id?: number;
  deduction_schema?: number;
  transaction_details: {
    payment_method_id: string;
    transaction_amount: number;
    net_received_amount: number;
    total_paid_amount: number;
    overpaid_amount: number;
    external_resource_url?: string;
    installment_amount?: number;
    financial_institution?: string;
    payable_deferral_period?: number;
    acquirer_reference?: string;
    paymet_method_option_id?: string;
  };
  fee_details: Array<{
    type: string;
    amount: number;
    fee_payer?: string;
  }>;
  captured: boolean;
  binary_mode: boolean;
  call_for_authorize_id?: number;
  statement_descriptor?: string;
  installments: number;
  card?: {
    id: string;
    first_six_digits: string;
    last_four_digits: string;
    expiration_month: number;
    expiration_year: number;
    date_created: string;
    date_last_updated: string;
    cardholder: {
      name: string;
      identification: {
        type: string;
        number: string;
      };
    };
    user_id: number;
  };
  notification_url?: string;
  refunds?: any[];
  date_created: string;
  date_last_updated: string;
  date_approved?: string;
  money_release_date?: string;
  operation_type: string;
  taxes_amount?: number;
  franchise_fee?: number;
  net_amount: number;
  counter_currency?: string;
  amount_original?: number;
  currency_id: string;
  currency_rate?: number;
  integrator_id?: string;
  platform_id?: string;
  corporation_id?: string;
  collector: any;
  marketplace?: string;
  authorization_code?: string;
  capture_mode?: string;
  processing_mode?: string;
}

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly accessToken: string;
  private readonly isProduction: boolean;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    this.baseUrl = this.isProduction
      ? 'https://api.mercadopago.com'
      : 'https://api.mercadopago.com'; // Sandbox usa misma URL pero con token de sandbox

    this.accessToken = this.configService.get<string>('MERCADO_PAGO_ACCESS_TOKEN') || '';

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': crypto.randomUUID(),
      },
      timeout: 30000,
    });
  }

  async processCardPayment(payment: Payment, createPaymentDto: CreatePaymentDto): Promise<{
    status: PaymentStatus;
    externalTransactionId: string | null;
    provider: string;
    response: any;
    approvalCode: string | null;
    message: string;
    redirectUrl: string | null;
  }> {
    try {
      if (!createPaymentDto.card) {
        throw new Error('Datos de tarjeta no proporcionados');
      }

      const paymentMethodId = this.detectPaymentMethodId(createPaymentDto.card.cardNumber);

      const request: MercadoPagoCardRequest = {
        token: createPaymentDto.card.cardToken || await this.createCardToken(createPaymentDto.card),
        description: `Pago Fixi - Orden ${payment.orderId}`,
        installments: 1,
        payment_method_id: paymentMethodId,
        issuer_id: await this.getIssuerId(paymentMethodId),
        transaction_amount: payment.amount,
        payer: {
          email: createPaymentDto.email || payment.user?.email || 'customer@example.com',
          identification: {
            type: this.mapDocumentType(createPaymentDto.card.documentId || 'CC'),
            number: createPaymentDto.card.documentId || '123456789',
          },
        },
      };

      this.logger.log(`Procesando pago con tarjeta Mercado Pago para orden ${payment.orderId}`);

      const response = await this.axiosInstance.post('/v1/payments', request);
      const mercadoPagoResponse: MercadoPagoResponse = response.data;

      return this.parseMercadoPagoResponse(mercadoPagoResponse);
    } catch (error) {
      this.logger.error(`Error en pago con tarjeta Mercado Pago: ${error.message}`, error.stack);
      return {
        status: PaymentStatus.FAILED,
        externalTransactionId: null,
        provider: 'MercadoPago',
        response: error.response?.data || error,
        approvalCode: null,
        message: error.response?.data?.message || error.message,
        redirectUrl: null,
      };
    }
  }

  async processPsePayment(payment: Payment, createPaymentDto: CreatePaymentDto): Promise<{
    status: PaymentStatus;
    externalTransactionId: string | null;
    provider: string;
    response: any;
    approvalCode: string | null;
    message: string;
    redirectUrl: string | null;
  }> {
    try {
      if (!createPaymentDto.pse) {
        throw new Error('Datos PSE no proporcionados');
      }

      const request: MercadoPagoPseRequest = {
        transaction_amount: payment.amount,
        description: `Pago Fixi PSE - Orden ${payment.orderId}`,
        payment_method_id: 'pse',
        payer: {
          email: createPaymentDto.pse.email,
          identification: {
            type: this.mapDocumentType(createPaymentDto.pse.documentType),
            number: createPaymentDto.pse.documentNumber,
          },
          entity_type: createPaymentDto.pse.personType === 'juridica' ? 'association' : 'individual',
          first_name: createPaymentDto.pse.firstName,
          last_name: createPaymentDto.pse.lastName,
        },
        additional_info: {
          ip_address: createPaymentDto.ipAddress,
        },
        callback_url: `${this.configService.get<string>('FRONTEND_URL')}/payment/return`,
      };

      this.logger.log(`Procesando pago PSE Mercado Pago para orden ${payment.orderId}`);

      const response = await this.axiosInstance.post('/v1/payments', request);
      const mercadoPagoResponse: MercadoPagoResponse = response.data;

      return this.parseMercadoPagoResponse(mercadoPagoResponse);
    } catch (error) {
      this.logger.error(`Error en pago PSE Mercado Pago: ${error.message}`, error.stack);
      return {
        status: PaymentStatus.FAILED,
        externalTransactionId: null,
        provider: 'MercadoPago',
        response: error.response?.data || error,
        approvalCode: null,
        message: error.response?.data?.message || error.message,
        redirectUrl: null,
      };
    }
  }

  async processNequiPayment(payment: Payment, createPaymentDto: CreatePaymentDto): Promise<{
    status: PaymentStatus;
    externalTransactionId: string | null;
    provider: string;
    response: any;
    approvalCode: string | null;
    message: string;
    redirectUrl: string | null;
  }> {
    try {
      if (!createPaymentDto.nequi) {
        throw new Error('Datos Nequi no proporcionados');
      }

      const phoneNumber = createPaymentDto.nequi.phoneNumber;
      const areaCode = '57'; // Colombia

      const request: MercadoPagoNequiRequest = {
        transaction_amount: payment.amount,
        description: `Pago Fixi Nequi - Orden ${payment.orderId}`,
        payment_method_id: 'nequi',
        payer: {
          email: createPaymentDto.email || payment.user?.email || 'customer@example.com',
          phone: {
            area_code,
            number: phoneNumber.replace(/^57/, ''), // Quitar 57 si ya está incluido
          },
          identification: {
            type: 'CC',
            number: '123456789', // Nequi no requiere documento
          },
        },
      };

      this.logger.log(`Procesando pago Nequi Mercado Pago para orden ${payment.orderId}`);

      const response = await this.axiosInstance.post('/v1/payments', request);
      const mercadoPagoResponse: MercadoPagoResponse = response.data;

      return this.parseMercadoPagoResponse(mercadoPagoResponse);
    } catch (error) {
      this.logger.error(`Error en pago Nequi Mercado Pago: ${error.message}`, error.stack);
      return {
        status: PaymentStatus.FAILED,
        externalTransactionId: null,
        provider: 'MercadoPago',
        response: error.response?.data || error,
        approvalCode: null,
        message: error.response?.data?.message || error.message,
        redirectUrl: null,
      };
    }
  }

  async processRefund(payment: Payment, refund: PaymentRefund): Promise<{
    status: RefundStatus;
    externalRefundId: string | null;
    response: any;
    authorizationCode: string | null;
    failureReason: string | null;
  }> {
    try {
      if (!payment.externalTransactionId) {
        throw new Error('No se encuentra la transacción externa para reembolsar');
      }

      this.logger.log(`Procesando reembolso Mercado Pago para pago ${payment.externalTransactionId}`);

      const response = await this.axiosInstance.post(`/v1/payments/${payment.externalTransactionId}/refunds`, {
        amount: refund.amount,
      });

      const mercadoPagoResponse = response.data;

      return {
        status: RefundStatus.COMPLETED,
        externalRefundId: mercadoPagoResponse.id?.toString() || null,
        response: mercadoPagoResponse,
        authorizationCode: mercadoPagoResponse.id?.toString() || null,
        failureReason: null,
      };
    } catch (error) {
      this.logger.error(`Error en reembolso Mercado Pago: ${error.message}`, error.stack);
      return {
        status: RefundStatus.FAILED,
        externalRefundId: null,
        response: error.response?.data || error,
        authorizationCode: null,
        failureReason: error.response?.data?.message || error.message,
      };
    }
  }

  async checkPaymentStatus(externalTransactionId: string): Promise<{
    status: PaymentStatus;
    response: any;
    message: string | null;
  }> {
    try {
      this.logger.log(`Verificando estado de transacción Mercado Pago ${externalTransactionId}`);

      const response = await this.axiosInstance.get(`/v1/payments/${externalTransactionId}`);
      const mercadoPagoResponse: MercadoPagoResponse = response.data;

      return {
        status: this.mapMercadoPagoStatus(mercadoPagoResponse.status),
        response: mercadoPagoResponse,
        message: mercadoPagoResponse.status_detail,
      };
    } catch (error) {
      this.logger.error(`Error verificando estado Mercado Pago: ${error.message}`, error.stack);
      return {
        status: PaymentStatus.FAILED,
        response: error.response?.data || error,
        message: error.response?.data?.message || error.message,
      };
    }
  }

  private async createCardToken(cardData: any): Promise<string> {
    try {
      const response = await this.axiosInstance.post('/v1/card_tokens', {
        card_number: cardData.cardNumber,
        security_code: cardData.cvv,
        expiration_month: parseInt(cardData.expiryMonth),
        expiration_year: parseInt(cardData.expiryYear),
        cardholder: {
          name: cardData.cardholderName,
          identification: {
            type: this.mapDocumentType(cardData.documentId || 'CC'),
            number: cardData.documentId || '123456789',
          },
        },
      });

      return response.data.id;
    } catch (error) {
      this.logger.error(`Error creando token de tarjeta: ${error.message}`);
      throw new Error('No se pudo crear el token de la tarjeta');
    }
  }

  private async getIssuerId(paymentMethodId: string): Promise<string | undefined> {
    try {
      const response = await this.axiosInstance.get(`/v1/payment_methods/card_issuers`, {
        params: {
          payment_method_id: paymentMethodId,
          marketplace: 'none',
        },
      });

      if (response.data && response.data.length > 0) {
        // Retornar el primer emisor (bancos principales)
        return response.data[0].id?.toString();
      }
    } catch (error) {
      this.logger.error(`Error obteniendo issuer ID: ${error.message}`);
    }
    return undefined;
  }

  private detectPaymentMethodId(cardNumber: string): string {
    const firstDigit = cardNumber[0];
    const firstTwoDigits = cardNumber.slice(0, 2);

    // Visa
    if (firstDigit === '4') {
      return 'visa';
    }

    // Mastercard
    if (firstTwoDigits >= '51' && firstTwoDigits <= '55') {
      return 'master';
    }

    // American Express
    if (firstTwoDigits === '34' || firstTwoDigits === '37') {
      return 'amex';
    }

    // Diners Club
    if (firstTwoDigits >= '36' && firstTwoDigits <= '39') {
      return 'diners';
    }

    return 'visa'; // Por defecto
  }

  private mapDocumentType(documentType: string): string {
    const types: Record<string, string> = {
      'CC': 'CC',
      'CE': 'CE',
      'NIT': 'NIT',
      'TI': 'TI',
      'PP': 'PP',
      'IDC': 'IDC',
      'CEL': 'CEL',
      'RC': 'RC',
      'DE': 'DE',
    };

    return types[documentType.toUpperCase()] || 'CC';
  }

  private parseMercadoPagoResponse(mercadoPagoResponse: MercadoPagoResponse): {
    status: PaymentStatus;
    externalTransactionId: string | null;
    provider: string;
    response: any;
    approvalCode: string | null;
    message: string;
    redirectUrl: string | null;
  } {
    const redirectUrl = mercadoPagoResponse.transaction_details?.external_resource_url || null;

    return {
      status: this.mapMercadoPagoStatus(mercadoPagoResponse.status),
      externalTransactionId: mercadoPagoResponse.id.toString(),
      provider: 'MercadoPago',
      response: mercadoPagoResponse,
      approvalCode: mercadoPagoResponse.authorization_code,
      message: mercadoPagoResponse.status_detail || 'Transacción procesada',
      redirectUrl,
    };
  }

  private mapMercadoPagoStatus(mercadoPagoStatus: string): PaymentStatus {
    switch (mercadoPagoStatus) {
      case 'approved':
        return PaymentStatus.COMPLETED;
      case 'pending':
      case 'in_process':
      case 'in_mediation':
        return PaymentStatus.PENDING;
      case 'rejected':
      case 'cancelled':
      case 'refunded':
      case 'charged_back':
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.FAILED;
    }
  }

  async getPaymentMethods(): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get('/v1/payment_methods');
      return response.data;
    } catch (error) {
      this.logger.error(`Error obteniendo métodos de pago: ${error.message}`);
      return [];
    }
  }

  async getAvailableBanks(): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get('/v1/payment_methods/card_issuers');
      return response.data;
    } catch (error) {
      this.logger.error(`Error obteniendo bancos: ${error.message}`);
      return [];
    }
  }
}