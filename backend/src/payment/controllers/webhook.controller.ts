import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentService } from '../services/payment.service';
import { WebhookService } from '../services/webhook.service';
import { Payment, PaymentStatus } from '../../common/entities/payment.entity';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly webhookService: WebhookService,
  ) {}

  @Post('wompi')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook de Wompi',
    description: 'Recibe notificaciones de eventos de pago de Wompi'
  })
  async handleWompiWebhook(
    @Body() payload: any,
    @Headers('x-wompi-signature') signature: string,
  ): Promise<{ status: string }> {
    try {
      this.logger.log('Webhook de Wompi recibido');

      // Verificar firma del webhook
      const isValid = await this.webhookService.verifyWompiSignature(payload, signature);
      if (!isValid) {
        this.logger.warn('Firma de webhook Wompi inválida');
        throw new Error('Firma inválida');
      }

      // Procesar evento
      await this.webhookService.processWompiEvent(payload);

      return { status: 'received' };
    } catch (error) {
      this.logger.error(`Error procesando webhook Wompi: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('mercadopago')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook de Mercado Pago',
    description: 'Recibe notificaciones de eventos de pago de Mercado Pago'
  })
  async handleMercadoPagoWebhook(
    @Body() payload: any,
    @Headers('x-signature') signature: string,
  ): Promise<{ status: string }> {
    try {
      this.logger.log('Webhook de Mercado Pago recibido');

      // Verificar firma del webhook
      const isValid = await this.webhookService.verifyMercadoPagoSignature(payload, signature);
      if (!isValid) {
        this.logger.warn('Firma de webhook Mercado Pago inválida');
        throw new Error('Firma inválida');
      }

      // Procesar evento
      await this.webhookService.processMercadoPagoEvent(payload);

      return { status: 'received' };
    } catch (error) {
      this.logger.error(`Error procesando webhook Mercado Pago: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('nequi')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook de Nequi',
    description: 'Recibe notificaciones de eventos de pago de Nequi'
  })
  async handleNequiWebhook(
    @Body() payload: any,
    @Headers('x-nequi-token') token: string,
  ): Promise<{ status: string }> {
    try {
      this.logger.log('Webhook de Nequi recibido');

      // Verificar token de seguridad
      const isValid = await this.webhookService.verifyNequiToken(token);
      if (!isValid) {
        this.logger.warn('Token de webhook Nequi inválido');
        throw new Error('Token inválido');
      }

      // Procesar evento
      await this.webhookService.processNequiEvent(payload);

      return { status: 'received' };
    } catch (error) {
      this.logger.error(`Error procesando webhook Nequi: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('daviplata')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook de Daviplata',
    description: 'Recibe notificaciones de eventos de pago de Daviplata'
  })
  async handleDaviplataWebhook(
    @Body() payload: any,
    @Headers('x-daviplata-token') token: string,
  ): Promise<{ status: string }> {
    try {
      this.logger.log('Webhook de Daviplata recibido');

      // Verificar token de seguridad
      const isValid = await this.webhookService.verifyDaviplataToken(token);
      if (!isValid) {
        this.logger.warn('Token de webhook Daviplata inválido');
        throw new Error('Token inválido');
      }

      // Procesar evento
      await this.webhookService.processDaviplataEvent(payload);

      return { status: 'received' };
    } catch (error) {
      this.logger.error(`Error procesando webhook Daviplata: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('pse')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook de PSE',
    description: 'Recibe notificaciones de eventos de pago de PSE'
  })
  async handlePseWebhook(
    @Body() payload: any,
    @Headers('x-pse-signature') signature: string,
  ): Promise<{ status: string }> {
    try {
      this.logger.log('Webhook de PSE recibido');

      // Verificar firma del webhook
      const isValid = await this.webhookService.verifyPseSignature(payload, signature);
      if (!isValid) {
        this.logger.warn('Firma de webhook PSE inválida');
        throw new Error('Firma inválida');
      }

      // Procesar evento
      await this.webhookService.processPseEvent(payload);

      return { status: 'received' };
    } catch (error) {
      this.logger.error(`Error procesando webhook PSE: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('payment-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook genérico de estado de pago',
    description: 'Recibe actualizaciones de estado de pago genéricas'
  })
  async handlePaymentStatusUpdate(@Body() payload: any): Promise<{ status: string }> {
    try {
      this.logger.log('Actualización de estado de pago recibida');

      // Validar estructura del payload
      if (!payload.transactionId || !payload.status) {
        throw new Error('Payload inválido');
      }

      // Actualizar estado del pago
      await this.paymentService.verifyPaymentStatus(payload.transactionId);

      return { status: 'updated' };
    } catch (error) {
      this.logger.error(`Error actualizando estado de pago: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('health-check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Health check de webhooks',
    description: 'Verifica que los endpoints de webhook estén funcionando'
  })
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}