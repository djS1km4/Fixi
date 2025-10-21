import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ChatService } from './services/chat.service';
import { ChatController } from './controllers/chat.controller';
import { MessageEntity } from '../common/entities/message.entity';
import { MessageAttachment } from '../common/entities/message-attachment.entity';
import { MessageRead } from '../common/entities/message-read.entity';
import { ConversationEntity } from '../common/entities/conversation.entity';
import { UserEntity } from '../common/entities/user.entity';
import { OrderEntity } from '../common/entities/order.entity';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forFeature([
      MessageEntity,
      MessageAttachment,
      MessageRead,
      ConversationEntity,
      UserEntity,
      OrderEntity,
    ]),
    AuthModule,
    UserModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}