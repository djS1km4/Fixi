import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MessageEntity, MessageType, MessageStatus } from '../../common/entities/message.entity';
import { MessageAttachment, AttachmentType } from '../../common/entities/message-attachment.entity';
import { MessageRead } from '../../common/entities/message-read.entity';
import { ConversationEntity, ConversationType, ConversationStatus } from '../../common/entities/conversation.entity';
import { UserEntity } from '../../common/entities/user.entity';
import { OrderEntity } from '../../common/entities/order.entity';
import { CreateMessageDto } from '../dto/create-message.dto';
import { QueryMessagesDto } from '../dto/query-messages.dto';
import { CreateConversationDto } from '../dto/create-conversation.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    @InjectRepository(MessageAttachment)
    private readonly attachmentRepository: Repository<MessageAttachment>,
    @InjectRepository(MessageRead)
    private readonly messageReadRepository: Repository<MessageRead>,
    @InjectRepository(ConversationEntity)
    private readonly conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async createConversation(createConversationDto: CreateConversationDto, userId: string): Promise<ConversationEntity> {
    this.logger.log(`Creando conversación para usuarios ${createConversationDto.participant1Id} y ${createConversationDto.participant2Id}`);

    // Validar que los usuarios existan
    const [participant1, participant2] = await Promise.all([
      this.userRepository.findOne({ where: { id: createConversationDto.participant1Id } }),
      this.userRepository.findOne({ where: { id: createConversationDto.participant2Id } }),
    ]);

    if (!participant1 || !participant2) {
      throw new NotFoundException('Uno o ambos participantes no existen');
    }

    // Verificar si ya existe una conversación entre estos usuarios
    const existingConversation = await this.findExistingConversation(
      createConversationDto.participant1Id,
      createConversationDto.participant2Id
    );

    if (existingConversation) {
      return existingConversation;
    }

    try {
      const conversation = this.conversationRepository.create({
        participant1Id: createConversationDto.participant1Id,
        participant2Id: createConversationDto.participant2Id,
        orderId: createConversationDto.orderId,
        type: createConversationDto.type || ConversationType.DIRECT,
        title: createConversationDto.title,
        description: createConversationDto.description,
        status: ConversationStatus.ACTIVE,
      });

      const savedConversation = await this.conversationRepository.save(conversation);
      this.logger.log(`Conversación creada exitosamente: ${savedConversation.id}`);
      return savedConversation;
    } catch (error) {
      this.logger.error(`Error creando conversación: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al crear conversación');
    }
  }

  async createMessage(createMessageDto: CreateMessageDto, userId: string): Promise<MessageEntity> {
    this.logger.log(`Creando mensaje para conversación ${createMessageDto.conversationId}`);

    // Validar que la conversación exista
    const conversation = await this.conversationRepository.findOne({
      where: { id: createMessageDto.conversationId },
      relations: ['participant1', 'participant2'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversación no encontrada');
    }

    // Validar que el usuario sea participante de la conversación
    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      throw new BadRequestException('No eres participante de esta conversación');
    }

    try {
      const message = this.messageRepository.create({
        conversationId: createMessageDto.conversationId,
        orderId: createMessageDto.orderId,
        senderId: userId,
        receiverId: conversation.participant1Id === userId ? conversation.participant2Id : conversation.participant1Id,
        type: createMessageDto.type || MessageType.TEXT,
        content: createMessageDto.content,
        metadata: createMessageDto.metadata,
        status: MessageStatus.SENT,
        ipAddress: createMessageDto.ipAddress,
        userAgent: createMessageDto.userAgent,
        country: createMessageDto.country,
        city: createMessageDto.city,
        replyToId: createMessageDto.replyToId,
        externalMessageId: createMessageDto.externalMessageId,
        externalPlatform: createMessageDto.externalPlatform,
      });

      const savedMessage = await this.messageRepository.save(message);

      // Actualizar último mensaje de la conversación
      await this.updateConversationLastMessage(conversation.id, savedMessage);

      // Si hay adjuntos, crearlos
      if (createMessageDto.attachments && createMessageDto.attachments.length > 0) {
        await this.createMessageAttachments(savedMessage.id, createMessageDto.attachments);
      }

      this.logger.log(`Mensaje creado exitosamente: ${savedMessage.id}`);
      return savedMessage;
    } catch (error) {
      this.logger.error(`Error creando mensaje: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al crear mensaje');
    }
  }

  async getConversations(userId: string, page: number = 1, limit: number = 20): Promise<{
    conversations: ConversationEntity[];
    total: number;
    page: number;
    limit: number;
  }> {
    this.logger.log(`Obteniendo conversaciones para usuario ${userId}`);

    try {
      const queryBuilder = this.conversationRepository
        .createQueryBuilder('conversation')
        .leftJoinAndSelect('conversation.participant1', 'participant1')
        .leftJoinAndSelect('conversation.participant2', 'participant2')
        .leftJoinAndSelect('conversation.lastMessage', 'lastMessage')
        .leftJoinAndSelect('conversation.order', 'order')
        .where('conversation.participant1Id = :userId OR conversation.participant2Id = :userId', { userId })
        .andWhere('conversation.status != :status', { status: ConversationStatus.DELETED })
        .orderBy('conversation.lastMessageAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit);

      const [conversations, total] = await queryBuilder.getManyAndCount();

      return {
        conversations,
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Error obteniendo conversaciones: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al obtener conversaciones');
    }
  }

  async getMessages(
    conversationId: string,
    userId: string,
    queryDto: QueryMessagesDto,
  ): Promise<{ messages: MessageEntity[]; total: number; page: number; limit: number }> {
    this.logger.log(`Obteniendo mensajes para conversación ${conversationId}`);

    // Validar que el usuario sea participante de la conversación
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversación no encontrada');
    }

    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      throw new BadRequestException('No eres participante de esta conversación');
    }

    try {
      const { page = 1, limit = 50, search, type } = queryDto;
      const queryBuilder = this.messageRepository
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.sender', 'sender')
        .leftJoinAndSelect('message.receiver', 'receiver')
        .leftJoinAndSelect('message.attachments', 'attachments')
        .leftJoinAndSelect('message.replyTo', 'replyTo')
        .where('message.conversationId = :conversationId', { conversationId })
        .andWhere('message.isDeleted = false');

      if (search) {
        queryBuilder.andWhere('message.content ILIKE :search', { search: `%${search}%` });
      }

      if (type) {
        queryBuilder.andWhere('message.type = :type', { type });
      }

      queryBuilder
        .orderBy('message.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit);

      const [messages, total] = await queryBuilder.getManyAndCount();

      // Marcar mensajes como leídos si el usuario es el receptor
      await this.markMessagesAsRead(messages, userId);

      return {
        messages: messages.reverse(), // Ordenar más antiguo primero
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Error obteniendo mensajes: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al obtener mensajes');
    }
  }

  async markMessageAsRead(messageId: string, userId: string, deviceInfo?: any): Promise<void> {
    this.logger.log(`Marcando mensaje ${messageId} como leído para usuario ${userId}`);

    try {
      const message = await this.messageRepository.findOne({
        where: { id: messageId },
        relations: ['conversation'],
      });

      if (!message) {
        throw new NotFoundException('Mensaje no encontrado');
      }

      if (message.receiverId !== userId) {
        throw new BadRequestException('Solo puedes marcar como leídos los mensajes recibidos');
      }

      // Verificar si ya fue leído
      const existingRead = await this.messageReadRepository.findOne({
        where: { messageId, userId },
      });

      if (existingRead) {
        return; // Ya fue leído
      }

      const messageRead = this.messageReadRepository.create({
        messageId,
        userId,
        readAt: new Date(),
        device: deviceInfo?.device,
        userAgent: deviceInfo?.userAgent,
        ipAddress: deviceInfo?.ipAddress,
        country: deviceInfo?.country,
        city: deviceInfo?.city,
      });

      await this.messageReadRepository.save(messageRead);

      // Actualizar estado del mensaje
      message.status = MessageStatus.READ;
      message.readAt = new Date();
      await this.messageRepository.save(message);

      // Actualizar contador de no leídos de la conversación
      await this.updateConversationUnreadCount(message.conversationId, userId);

      this.logger.log(`Mensaje ${messageId} marcado como leído`);
    } catch (error) {
      this.logger.error(`Error marcando mensaje como leído: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al marcar mensaje como leído');
    }
  }

  async editMessage(messageId: string, userId: string, newContent: string): Promise<MessageEntity> {
    this.logger.log(`Editando mensaje ${messageId}`);

    try {
      const message = await this.messageRepository.findOne({ where: { id: messageId } });

      if (!message) {
        throw new NotFoundException('Mensaje no encontrado');
      }

      if (message.senderId !== userId) {
        throw new BadRequestException('Solo puedes editar tus propios mensajes');
      }

      if (message.type !== MessageType.TEXT) {
        throw new BadRequestException('Solo se pueden editar mensajes de texto');
      }

      if (message.isDeleted) {
        throw new BadRequestException('No se pueden editar mensajes eliminados');
      }

      message.content = newContent;
      message.isEdited = true;
      message.editedAt = new Date();

      const editedMessage = await this.messageRepository.save(message);
      this.logger.log(`Mensaje ${messageId} editado exitosamente`);
      return editedMessage;
    } catch (error) {
      this.logger.error(`Error editando mensaje: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al editar mensaje');
    }
  }

  async deleteMessage(messageId: string, userId: string, permanent: boolean = false): Promise<void> {
    this.logger.log(`Eliminando mensaje ${messageId} (permanente: ${permanent})`);

    try {
      const message = await this.messageRepository.findOne({ where: { id: messageId } });

      if (!message) {
        throw new NotFoundException('Mensaje no encontrado');
      }

      if (message.senderId !== userId) {
        throw new BadRequestException('Solo puedes eliminar tus propios mensajes');
      }

      if (permanent) {
        // Eliminación permanente
        await this.messageRepository.remove(message);
      } else {
        // Eliminación suave
        message.isDeleted = true;
        message.deletedAt = new Date();
        await this.messageRepository.save(message);
      }

      this.logger.log(`Mensaje ${messageId} eliminado exitosamente`);
    } catch (error) {
      this.logger.error(`Error eliminando mensaje: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al eliminar mensaje');
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const result = await this.conversationRepository
        .createQueryBuilder('conversation')
        .leftJoin('conversation.messages', 'message')
        .where(
          '(conversation.participant1Id = :userId OR conversation.participant2Id = :userId)',
          { userId }
        )
        .andWhere('message.receiverId = :userId', { userId })
        .andWhere('message.status != :status', { status: MessageStatus.READ })
        .andWhere('message.isDeleted = false')
        .getCount();

      return result;
    } catch (error) {
      this.logger.error(`Error obteniendo contador de no leídos: ${error.message}`, error.stack);
      return 0;
    }
  }

  // Métodos privados
  private async findExistingConversation(
    participant1Id: string,
    participant2Id: string,
  ): Promise<ConversationEntity | null> {
    return await this.conversationRepository.findOne({
      where: [
        { participant1Id, participant2Id },
        { participant1Id: participant2Id, participant2Id: participant1Id },
      ],
      andWhere: { status: ConversationStatus.ACTIVE },
    });
  }

  private async updateConversationLastMessage(
    conversationId: string,
    message: MessageEntity,
  ): Promise<void> {
    await this.conversationRepository.update(conversationId, {
      lastMessageId: message.id,
      lastMessageAt: message.createdAt,
      totalMessages: () => 'totalMessages + 1',
    });
  }

  private async updateConversationUnreadCount(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    // Esta lógica depende del diseño específico de cómo manejar no leídos por conversación
    // Por ahora se puede implementar como un contador en la conversación
  }

  private async markMessagesAsRead(messages: MessageEntity[], userId: string): Promise<void> {
    const unreadMessages = messages.filter(
      msg => msg.receiverId === userId && msg.status !== MessageStatus.READ && !msg.isDeleted
    );

    if (unreadMessages.length === 0) {
      return;
    }

    const reads = unreadMessages.map(message =>
      this.messageReadRepository.create({
        messageId: message.id,
        userId,
        readAt: new Date(),
      })
    );

    await this.messageReadRepository.save(reads);

    // Actualizar estado de los mensajes
    const messageIds = unreadMessages.map(msg => msg.id);
    await this.messageRepository.update(messageIds, {
      status: MessageStatus.READ,
      readAt: new Date(),
    });
  }

  private async createMessageAttachments(
    messageId: string,
    attachments: any[],
  ): Promise<void> {
    const messageAttachments = attachments.map(attachment =>
      this.attachmentRepository.create({
        messageId,
        type: attachment.type,
        url: attachment.url,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        size: attachment.size,
        thumbnailUrl: attachment.thumbnailUrl,
        width: attachment.width,
        height: attachment.height,
        duration: attachment.duration,
        metadata: attachment.metadata,
        storageProvider: attachment.storageProvider,
        storageFileId: attachment.storageFileId,
      })
    );

    await this.attachmentRepository.save(messageAttachments);
  }

  async createSupportConversation(orderId: string, userId: string): Promise<ConversationEntity> {
    this.logger.log(`Creando conversación de soporte para orden ${orderId}`);

    // Validar que la orden exista
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['customer', 'technician'],
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    // Verificar si ya existe una conversación de soporte para esta orden
    const existingSupportConversation = await this.conversationRepository.findOne({
      where: {
        orderId,
        type: ConversationType.ORDER_SUPPORT,
      },
    });

    if (existingSupportConversation) {
      return existingSupportConversation;
    }

    try {
      const conversation = this.conversationRepository.create({
        orderId,
        participant1Id: order.customerId,
        participant2Id: order.technicianId,
        type: ConversationType.ORDER_SUPPORT,
        title: `Soporte - Orden #${orderId.slice(0, 8)}`,
        description: `Conversación de soporte para la orden #${orderId.slice(0, 8)}`,
        status: ConversationStatus.ACTIVE,
      });

      const savedConversation = await this.conversationRepository.save(conversation);
      this.logger.log(`Conversación de soporte creada: ${savedConversation.id}`);
      return savedConversation;
    } catch (error) {
      this.logger.error(`Error creando conversación de soporte: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al crear conversación de soporte');
    }
  }
}