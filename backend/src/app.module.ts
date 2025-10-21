import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
// import { OrdersModule } from './orders/orders.module';
// import { PaymentsModule } from './payments/payments.module';
// import { ChatModule } from './chat/chat.module';
// import { ReviewsModule } from './reviews/reviews.module';
// import { NotificationsModule } from './notifications/notifications.module';
// import { BillingModule } from './billing/billing.module';
// import { CommonModule } from './common/common.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database - PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: process.env.NODE_ENV === 'development',
        logging: process.env.NODE_ENV === 'development',
        ssl: process.env.NODE_ENV === 'production',
      }),
      inject: [ConfigService],
    }),

    // Feature Modules (Core Only - MVP)
    AuthModule,
    UsersModule,
    // OrdersModule,      // TODO: Implementar en Sprint 2
    // PaymentsModule,     // TODO: Implementar en Sprint 2
    // ChatModule,         // TODO: Implementar en Sprint 2
    // ReviewsModule,      // TODO: Implementar en Sprint 2
    // NotificationsModule, // TODO: Implementar en Sprint 2
    // BillingModule,      // TODO: Implementar en Sprint 2
    // CommonModule,       // TODO: Implementar en Sprint 2
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}