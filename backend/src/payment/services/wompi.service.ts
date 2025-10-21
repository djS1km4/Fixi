import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentMethod, PaymentStatus } from '../../entities/payment.entity';
import { PaymentRefund, RefundStatus } from '../../entities/payment-refund.entity';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import axios, { AxiosInstance } from 'axios';

export interface WompiCardRequest {
  token: string;
  customer_email: string;
  installments: number;
  currency: string;
  amount_in_cents: number;
  acceptance_token: string;
  reference: string;
}

export interface WompiPseRequest {
  type: string;
  country: string;
  financial_institution_code: string;
  payment_method_type: 'PSE';
  user_type: string;
  user_legal_id_type: string;
  user_legal_id: string;
  user_full_name: string;
  user_email: string;
  user_phone_number: string;
  redirect_url: string;
  acceptance_token: string;
  reference: string;
  currency: string;
  amount_in_cents: number;
}

export interface WompiNequiRequest {
  phone_number: string;
  acceptance_token: string;
  reference: string;
  currency: string;
  amount_in_cents: number;
}

export interface WompiResponse {
  id: string;
  status: string;
  reference: string;
  amount_in_cents: number;
  currency: string;
  payment_method_type: string;
  payment_method: any;
  customer_email: string;
  created_at: string;
  finalized_at: string | null;
  transaction_id: string | null;
  status_message: string | null;
  redirect_url: string | null;
  payment_link: string | null;
  payment_source_id: string | null;
  payment_intention: any;
  error_message: string | null;
}

@Injectable()
export class WompiService {
  private readonly logger = new Logger(WompiService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly apiUrl = 'https://production.wompi.co/v1';
  private readonly sandboxUrl = 'https://sandbox.wompi.co/v1';

  constructor(private readonly configService: ConfigService) {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const baseUrl = isProduction ? this.apiUrl : this.sandboxUrl;
    const privateKey = this.configService.get<string>('WOMPI_PRIVATE_KEY');

    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${privateKey}`,
        'Content-Type': 'application/json',
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

      // Obtener acceptance token
      const acceptanceToken = await this.getAcceptanceToken();

      // Tokenizar tarjeta
      const cardToken = await this.tokenizeCard({
        number: createPaymentDto.card.cardNumber,
        cvc: createPaymentDto.card.cvv,
        exp_month: parseInt(createPaymentDto.card.expiryMonth),
        exp_year: parseInt(createPaymentDto.card.expiryYear),
        card_holder: createPaymentDto.card.cardholderName,
      });

      const request: WompiCardRequest = {
        token: cardToken.id,
        customer_email: createPaymentDto.email || payment.user?.email || 'customer@example.com',
        installments: 1,
        currency: 'COP',
        amount_in_cents: Math.round(payment.amount * 100),
        acceptance_token: acceptanceToken,
        reference: `FIXI_${payment.orderId}_${Date.now()}`,
      };

      this.logger.log(`Procesando pago con tarjeta Wompi para orden ${payment.orderId}`);

      const response = await this.axiosInstance.post('/transactions', request);
      const wompiResponse: WompiResponse = response.data.data;

      return this.parseWompiResponse(wompiResponse);
    } catch (error) {
      this.logger.error(`Error en pago con tarjeta Wompi: ${error.message}`, error.stack);
      return {
        status: PaymentStatus.FAILED,
        externalTransactionId: null,
        provider: 'Wompi',
        response: error.response?.data || error,
        approvalCode: null,
        message: error.response?.data?.error?.message || error.message,
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

      const acceptanceToken = await this.getAcceptanceToken();

      const request: WompiPseRequest = {
        type: createPaymentDto.pse.personType === 'natural' ? 'PERSONA_NATURAL' : 'PERSONA_JURIDICA',
        country: 'CO',
        financial_institution_code: createPaymentDto.pse.bank,
        payment_method_type: 'PSE',
        user_type: createPaymentDto.pse.personType === 'natural' ? 'PERSONA_NATURAL' : 'PERSONA_JURIDICA',
        user_legal_id_type: createPaymentDto.pse.documentType,
        user_legal_id: createPaymentDto.pse.documentNumber,
        user_full_name: `${createPaymentDto.pse.firstName} ${createPaymentDto.pse.lastName || ''}`,
        user_email: createPaymentDto.pse.email,
        user_phone_number: createPaymentDto.pse.phone,
        redirect_url: `${this.configService.get<string>('FRONTEND_URL')}/payment/return`,
        acceptance_token: acceptanceToken,
        reference: `FIXI_${payment.orderId}_${Date.now()}`,
        currency: 'COP',
        amount_in_cents: Math.round(payment.amount * 100),
      };

      this.logger.log(`Procesando pago PSE Wompi para orden ${payment.orderId}`);

      const response = await this.axiosInstance.post('/transactions', request);
      const wompiResponse: WompiResponse = response.data.data;

      return this.parseWompiResponse(wompiResponse);
    } catch (error) {
      this.logger.error(`Error en pago PSE Wompi: ${error.message}`, error.stack);
      return {
        status: PaymentStatus.FAILED,
        externalTransactionId: null,
        provider: 'Wompi',
        response: error.response?.data || error,
        approvalCode: null,
        message: error.response?.data?.error?.message || error.message,
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

      const acceptanceToken = await this.getAcceptanceToken();

      const request: WompiNequiRequest = {
        phone_number: createPaymentDto.nequi.phoneNumber,
        acceptance_token: acceptanceToken,
        reference: `FIXI_${payment.orderId}_${Date.now()}`,
        currency: 'COP',
        amount_in_cents: Math.round(payment.amount * 100),
      };

      this.logger.log(`Procesando pago Nequi Wompi para orden ${payment.orderId}`);

      const response = await this.axiosInstance.post('/transactions', request);
      const wompiResponse: WompiResponse = response.data.data;

      return this.parseWompiResponse(wompiResponse);
    } catch (error) {
      this.logger.error(`Error en pago Nequi Wompi: ${error.message}`, error.stack);
      return {
        status: PaymentStatus.FAILED,
        externalTransactionId: null,
        provider: 'Wompi',
        response: error.response?.data || error,
        approvalCode: null,
        message: error.response?.data?.error?.message || error.message,
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

      this.logger.log(`Procesando reembolso Wompi para transacción ${payment.externalTransactionId}`);

      const response = await this.axiosInstance.post(`/transactions/${payment.externalTransactionId}/void`, {
        amount_in_cents: Math.round(refund.amount * 100),
      });

      const wompiResponse = response.data.data;

      return {
        status: wompiResponse.status === 'APPROVED' ? RefundStatus.COMPLETED : RefundStatus.FAILED,
        externalRefundId: wompiResponse.id,
        response: wompiResponse,
        authorizationCode: wompiResponse.transaction_id,
        failureReason: wompiResponse.status_message,
      };
    } catch (error) {
      this.logger.error(`Error en reembolso Wompi: ${error.message}`, error.stack);
      return {
        status: RefundStatus.FAILED,
        externalRefundId: null,
        response: error.response?.data || error,
        authorizationCode: null,
        failureReason: error.response?.data?.error?.message || error.message,
      };
    }
  }

  async checkPaymentStatus(externalTransactionId: string): Promise<{
    status: PaymentStatus;
    response: any;
    message: string | null;
  }> {
    try {
      this.logger.log(`Verificando estado de transacción Wompi ${externalTransactionId}`);

      const response = await this.axiosInstance.get(`/transactions/${externalTransactionId}`);
      const wompiResponse: WompiResponse = response.data.data;

      return {
        status: this.mapWompiStatus(wompiResponse.status),
        response: wompiResponse,
        message: wompiResponse.status_message,
      };
    } catch (error) {
      this.logger.error(`Error verificando estado Wompi: ${error.message}`, error.stack);
      return {
        status: PaymentStatus.FAILED,
        response: error.response?.data || error,
        message: error.response?.data?.error?.message || error.message,
      };
    }
  }

  private async getAcceptanceToken(): Promise<string> {
    try {
      const response = await this.axiosInstance.get('/merchants');
      return response.data.data.presigned_acceptance.acceptance_token;
    } catch (error) {
      this.logger.error(`Error obteniendo acceptance token: ${error.message}`);
      throw new Error('No se pudo obtener el token de aceptación');
    }
  }

  private async tokenizeCard(cardData: {
    number: string;
    cvc: string;
    exp_month: number;
    exp_year: number;
    card_holder: string;
  }): Promise<{ id: string; brand: string; last_four: string }> {
    try {
      const response = await this.axiosInstance.post('/tokens/cards', {
        number: cardData.number,
        cvc: cardData.cvc,
        exp_month: cardData.exp_month,
        exp_year: cardData.exp_year,
        card_holder: cardData.card_holder,
      });

      return response.data.data;
    } catch (error) {
      this.logger.error(`Error tokenizando tarjeta: ${error.message}`);
      throw new Error('No se pudo tokenizar la tarjeta');
    }
  }

  private parseWompiResponse(wompiResponse: WompiResponse): {
    status: PaymentStatus;
    externalTransactionId: string | null;
    provider: string;
    response: any;
    approvalCode: string | null;
    message: string;
    redirectUrl: string | null;
  } {
    return {
      status: this.mapWompiStatus(wompiResponse.status),
      externalTransactionId: wompiResponse.id,
      provider: 'Wompi',
      response: wompiResponse,
      approvalCode: wompiResponse.transaction_id,
      message: wompiResponse.status_message || 'Transacción procesada',
      redirectUrl: wompiResponse.redirect_url,
    };
  }

  private mapWompiStatus(wompiStatus: string): PaymentStatus {
    switch (wompiStatus) {
      case 'APPROVED':
      case 'APPROVED_PARTIAL_SUMMARY':
        return PaymentStatus.COMPLETED;
      case 'PENDING':
      case 'PENDING_VALIDATION':
      case 'PENDING_ANTIFRAUD':
        return PaymentStatus.PENDING;
      case 'DECLINED':
      case 'ERROR':
      case 'VOIDED':
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.FAILED;
    }
  }

  async getAvailablePseBanks(): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get('/pse_financial_institutions');
      return response.data.data;
    } catch (error) {
      this.logger.error(`Error obteniendo bancos PSE: ${error.message}`);
      return [];
    }
  }

  async getTransactionStatus(transactionId: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get(`/transactions/${transactionId}`);
      return response.data.data;
    } catch (error) {
      this.logger.error(`Error obteniendo estado de transacción: ${error.message}`);
      throw error;
    }
  }
}