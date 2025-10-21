import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PaymentService } from './payment.service';
import { Payment, PaymentStatus } from '../../common/entities/payment.entity';
import { PaymentRefund, RefundStatus } from '../../common/entities/payment-refund.entity';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly wompiEventsSecret: string;
  private readonly mercadoPagoSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly paymentService: PaymentService,
  ) {
    this.wompiEventsSecret = this.configService.get<string>('WOMPI_EVENT_KEY') || '';
    this.mercadoPagoSecret = this.configService.get<string>('MERCADO_PAGO_ACCESS_TOKEN') || '';
  }

  async verifyWompiSignature(payload: any, signature: string): Promise<boolean> {
    try {
      if (!signature) {
        return false;
      }

      const computedSignature = crypto
        .createHmac('sha256', this.wompiEventsSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(computedSignature)
      );
    } catch (error) {
      this.logger.error(`Error verificando firma Wompi: ${error.message}`);
      return false;
    }
  }

  async verifyMercadoPagoSignature(payload: any, signature: string): Promise<boolean> {
    try {
      if (!signature) {
        return false;
      }

      // Mercado Pago usa x-signature con formato: ts=v1:hash=abcdef123
      const parts = signature.split(',');
      let ts = '';
      let hash = '';

      for (const part of parts) {
        const [key, value] = part.split('=');
        if (key === 'ts') {
          ts = value;
        } else if (key.startsWith('hash')) {
          hash = value;
        }
      }

      const manifest = `id:${payload.id};request-id:${payload['request_id']};ts:${ts}`;
      const computedHash = crypto
        .createHmac('sha256', this.mercadoPagoSecret)
        .update(manifest)
        .digest('hex');

      return hash === computedHash;
    } catch (error) {
      this.logger.error(`Error verificando firma Mercado Pago: ${error.message}`);
      return false;
    }
  }

  async verifyNequiToken(token: string): Promise<boolean> {
    try {
      const expectedToken = this.configService.get<string>('NEQUI_WEBHOOK_TOKEN');
      return token === expectedToken;
    } catch (error) {
      this.logger.error(`Error verificando token Nequi: ${error.message}`);
      return false;
    }
  }

  async verifyDaviplataToken(token: string): Promise<boolean> {
    try {
      const expectedToken = this.configService.get<string>('DAVIPLATA_WEBHOOK_TOKEN');
      return token === expectedToken;
    } catch (error) {
      this.logger.error(`Error verificando token Daviplata: ${error.message}`);
      return false;
    }
  }

  async verifyPseSignature(payload: any, signature: string): Promise<boolean> {
    try {
      const pseSecret = this.configService.get<string>('PSE_WEBHOOK_TOKEN');
      if (!pseSecret) {
        return false;
      }

      const computedSignature = crypto
        .createHmac('sha256', pseSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      return signature === computedSignature;
    } catch (error) {
      this.logger.error(`Error verificando firma PSE: ${error.message}`);
      return false;
    }
  }

  async processWompiEvent(event: any): Promise<void> {
    this.logger.log(`Procesando evento Wompi: ${event.event}`);

    try {
      switch (event.event) {
        case 'transaction.updated':
          await this.handleWompiTransactionUpdate(event.data.transaction);
          break;
        case 'token.updated':
          await this.handleWompiTokenUpdate(event.data.token);
          break;
        default:
          this.logger.warn(`Evento Wompi no manejado: ${event.event}`);
      }
    } catch (error) {
      this.logger.error(`Error procesando evento Wompi: ${error.message}`, error.stack);
    }
  }

  async processMercadoPagoEvent(event: any): Promise<void> {
    this.logger.log(`Procesando evento Mercado Pago: ${event.type}`);

    try {
      switch (event.type) {
        case 'payment':
          await this.handleMercadoPagoPayment(event.data);
          break;
        case 'payment_updated':
          await this.handleMercadoPagoPaymentUpdate(event.data);
          break;
        case 'merchant_order':
          await this.handleMercadoPagoMerchantOrder(event.data);
          break;
        default:
          this.logger.warn(`Evento Mercado Pago no manejado: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Error procesando evento Mercado Pago: ${error.message}`, error.stack);
    }
  }

  async processNequiEvent(event: any): Promise<void> {
    this.logger.log(`Procesando evento Nequi: ${event.eventType}`);

    try {
      switch (event.eventType) {
        case 'PAYMENT_SUCCESS':
          await this.handleNequiPaymentSuccess(event);
          break;
        case 'PAYMENT_FAILED':
          await this.handleNequiPaymentFailure(event);
          break;
        case 'PAYMENT_PENDING':
          await this.handleNequiPaymentPending(event);
          break;
        default:
          this.logger.warn(`Evento Nequi no manejado: ${event.eventType}`);
      }
    } catch (error) {
      this.logger.error(`Error procesando evento Nequi: ${error.message}`, error.stack);
    }
  }

  async processDaviplataEvent(event: any): Promise<void> {
    this.logger.log(`Procesando evento Daviplata: ${event.eventType}`);

    try {
      switch (event.eventType) {
        case 'PAYMENT_CONFIRMED':
          await this.handleDaviplataPaymentConfirmed(event);
          break;
        case 'PAYMENT_REJECTED':
          await this.handleDaviplataPaymentRejected(event);
          break;
        default:
          this.logger.warn(`Evento Daviplata no manejado: ${event.eventType}`);
      }
    } catch (error) {
      this.logger.error(`Error procesando evento Daviplata: ${error.message}`, error.stack);
    }
  }

  async processPseEvent(event: any): Promise<void> {
    this.logger.log(`Procesando evento PSE: ${event.eventType}`);

    try {
      switch (event.eventType) {
        case 'PAYMENT_APPROVED':
          await this.handlePsePaymentApproved(event);
          break;
        case 'PAYMENT_REJECTED':
          await this.handlePsePaymentRejected(event);
          break;
        case 'PAYMENT_PENDING':
          await this.handlePsePaymentPending(event);
          break;
        default:
          this.logger.warn(`Evento PSE no manejado: ${event.eventType}`);
      }
    } catch (error) {
      this.logger.error(`Error procesando evento PSE: ${error.message}`, error.stack);
    }
  }

  // Métodos de manejo de eventos específicos
  private async handleWompiTransactionUpdate(transaction: any): Promise<void> {
    try {
      const payment = await this.paymentService.verifyPaymentStatus(transaction.id);

      // Notificar al cliente y técnico sobre actualización del pago
      if (payment.status === PaymentStatus.COMPLETED) {
        await this.notifyPaymentSuccess(payment);
      } else if (payment.status === PaymentStatus.FAILED) {
        await this.notifyPaymentFailure(payment, transaction.status_message);
      }
    } catch (error) {
      this.logger.error(`Error manejando actualización de transacción Wompi: ${error.message}`);
    }
  }

  private async handleWompiTokenUpdate(token: any): Promise<void> {
    this.logger.log(`Token Wompi actualizado: ${token.id}`);
  }

  private async handleMercadoPagoPayment(payment: any): Promise<void> {
    try {
      const paymentId = payment.external_reference;
      if (paymentId) {
        await this.paymentService.verifyPaymentStatus(paymentId);

        // Procesar según estado
        if (payment.status === 'approved') {
          await this.notifyPaymentSuccess(payment);
        } else if (payment.status === 'rejected') {
          await this.notifyPaymentFailure(payment, payment.status_detail);
        }
      }
    } catch (error) {
      this.logger.error(`Error manejando pago Mercado Pago: ${error.message}`);
    }
  }

  private async handleMercadoPagoPaymentUpdate(payment: any): Promise<void> {
    this.logger.log(`Pago Mercado Pago actualizado: ${payment.id}`);
  }

  private async handleMercadoPagoMerchantOrder(order: any): Promise<void> {
    this.logger.log(`Orden de comerciante Mercado Pago: ${order.id}`);
  }

  private async handleNequiPaymentSuccess(event: any): Promise<void> {
    try {
      const payment = await this.paymentService.verifyPaymentStatus(event.transactionId);
      await this.notifyPaymentSuccess(payment);
    } catch (error) {
      this.logger.error(`Error manejando pago exitoso Nequi: ${error.message}`);
    }
  }

  private async handleNequiPaymentFailure(event: any): Promise<void> {
    try {
      const payment = await this.paymentService.verifyPaymentStatus(event.transactionId);
      await this.notifyPaymentFailure(payment, event.errorMessage);
    } catch (error) {
      this.logger.error(`Error manejando pago fallido Nequi: ${error.message}`);
    }
  }

  private async handleNequiPaymentPending(event: any): Promise<void> {
    this.logger.log(`Pago Nequi pendiente: ${event.transactionId}`);
  }

  private async handleDaviplataPaymentConfirmed(event: any): Promise<void> {
    try {
      const payment = await this.paymentService.verifyPaymentStatus(event.transactionId);
      await this.notifyPaymentSuccess(payment);
    } catch (error) {
      this.logger.error(`Error manejando pago confirmado Daviplata: ${error.message}`);
    }
  }

  private async handleDaviplataPaymentRejected(event: any): Promise<void> {
    try {
      const payment = await this.paymentService.verifyPaymentStatus(event.transactionId);
      await this.notifyPaymentFailure(payment, event.rejectReason);
    } catch (error) {
      this.logger.error(`Error manejando pago rechazado Daviplata: ${error.message}`);
    }
  }

  private async handlePsePaymentApproved(event: any): Promise<void> {
    try {
      const payment = await this.paymentService.verifyPaymentStatus(event.transactionId);
      await this.notifyPaymentSuccess(payment);
    } catch (error) {
      this.logger.error(`Error manejando pago aprobado PSE: ${error.message}`);
    }
  }

  private async handlePsePaymentRejected(event: any): Promise<void> {
    try {
      const payment = await this.paymentService.verifyPaymentStatus(event.transactionId);
      await this.notifyPaymentFailure(payment, event.rejectReason);
    } catch (error) {
      this.logger.error(`Error manejando pago rechazado PSE: ${error.message}`);
    }
  }

  private async handlePsePaymentPending(event: any): Promise<void> {
    this.logger.log(`Pago PSE pendiente: ${event.transactionId}`);
  }

  // Métodos de notificación
  private async notifyPaymentSuccess(payment: Payment): Promise<void> {
    // Aquí se implementarían las notificaciones (email, SMS, push notifications)
    this.logger.log(`Pago exitoso notificado: ${payment.id}`);

    // Implementar lógica de notificación:
    // - Enviar email de confirmación al cliente
    // - Enviar notificación al técnico
    // - Actualizar estado de la orden
    // - Enviar receipt por email
  }

  private async notifyPaymentFailure(payment: Payment, reason: string): Promise<void> {
    // Aquí se implementarían las notificaciones de fallo
    this.logger.log(`Pago fallido notificado: ${payment.id} - ${reason}`);

    // Implementar lógica de notificación:
    // - Enviar email de error al cliente
    // - Mantener orden en estado pendiente de pago
    // - Ofrecer métodos de pago alternativos
  }
}