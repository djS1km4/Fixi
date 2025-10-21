import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../common/entities/user.entity';
import { CreateUserDto, UpdateUserDto } from '../../common/dto/create-user.dto';
import { UserStatus, UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = this.usersRepository.create(createUserDto);
    return await this.usersRepository.save(user);
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{ users: UserEntity[]; total: number }> {
    const [users, total] = await this.usersRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      where: { status: UserStatus.ACTIVE },
      relations: ['services'],
    });

    return { users, total };
  }

  async findOne(id: string): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({
      where: { id, status: UserStatus.ACTIVE },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({
      where: { email, status: UserStatus.ACTIVE },
    });

    return user;
  }

  async findByRole(role: UserRole, page: number = 1, limit: number = 10): Promise<{ users: UserEntity[]; total: number }> {
    const [users, total] = await this.usersRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      where: { role, status: UserStatus.ACTIVE },
    });

    return { users, total };
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.findOne(id);

    // Remove fields that shouldn't be updated directly
    const { email, role, password, id: userId, ...cleanData } = updateUserDto;

    await this.usersRepository.update(id, cleanData);

    return await this.findOne(id);
  }

  async updateProfile(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.findOne(id);

    // Only update profile fields, not role or status
    const { email, role, password, id: userId, ...profileData } = updateUserDto;

    await this.usersRepository.update(id, profileData);

    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);

    await this.usersRepository.update(id, {
      status: UserStatus.DELETED,
      deletedAt: new Date(),
    });
  }

  async search(query: string, page: number = 1, limit: number = 10): Promise<{ users: UserEntity[]; total: number }> {
    const [users, total] = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.firstName ILIKE :query OR user.lastName ILIKE :query OR user.email ILIKE :query', {
        query: `%${query}%`,
      })
      .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { users, total };
  }

  async getTopRatedTechnicians(limit: number = 10): Promise<UserEntity[]> {
    return await this.usersRepository.find({
      where: {
        role: UserRole.TECHNICIAN,
        status: UserStatus.ACTIVE,
        rating: { not: null }
      },
      order: { rating: 'DESC' },
      take: limit,
    });
  }

  async updateUserStatus(id: string, status: UserStatus): Promise<UserEntity> {
    await this.usersRepository.update(id, { status });
    return await this.findOne(id);
  }

  async updateRating(technicianId: string, newRating: number): Promise<void> {
    await this.usersRepository.update(technicianId, { rating: newRating });
  }

  async updateCompletedJobs(userId: string): Promise<void> {
    const user = await this.findOne(userId);
    await this.usersRepository.update(userId, {
      completedJobs: user.completedJobs + 1
    });
  }
}