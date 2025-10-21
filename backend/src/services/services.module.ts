import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesService } from './services/services.service';
import { ServicesController } from './controllers/services.controller';
import { ServiceEntity } from '../common/entities/service.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceEntity])],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}