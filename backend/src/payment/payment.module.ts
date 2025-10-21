import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './controllers/payment.controller';
import { WebhookController } from './controllers/webhook.controller';
import { PaymentService } from './services/payment.service';
import { WompiService } from './services/wompi.service';
import { MercadoPagoService } from './services/mercado-pago.service';
import { PaymentProcessorFactory } from './services/payment-processor.factory';
import { WebhookService } from './services/webhook.service';
import { Payment } from '../common/entities/payment.entity';
import { PaymentTransaction } from '../common/entities/payment-transaction.entity';
import { PaymentRefund } from '../common/entities/payment-refund.entity';
import { OrderEntity } from '../common/entities/order.entity';
import { UserEntity } from '../common/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forFeature([
      Payment,
      PaymentTransaction,
      PaymentRefund,
      OrderEntity,
      UserEntity,
    ]),
    AuthModule,
    OrderModule,
  ],
  controllers: [PaymentController, WebhookController],
  providers: [
    PaymentService,
    WompiService,
    MercadoPagoService,
    PaymentProcessorFactory,
    WebhookService,
  ],
  exports: [
    PaymentService,
    WompiService,
    MercadoPagoService,
    PaymentProcessorFactory,
  ],
})
export class PaymentModule {}