import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../common/entities/user.entity';
import { LoginDto } from '../dto/auth.dto';
import { CreateUserDto } from '../../common/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { email, status: 'ACTIVE' },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(pass, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Remove password from response
    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    // Update last login
    await this.usersRepository.update(
      { id: user.id },
      { lastLoginAt: new Date() }
    );

    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified,
      },
    };
  }

  async register(createUserDto: CreateUserDto): Promise<UserEntity> {
    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new UnauthorizedException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    // Create user entity
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role || 'CLIENT',
    });

    return await this.usersRepository.save(user);
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken);
      const user = await this.usersRepository.findOne({
        where: { id: decoded.sub, status: 'ACTIVE' },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const payload = {
        email: user.email,
        sub: user.id,
        role: user.role,
      };

      return {
        accessToken: this.jwtService.sign(payload),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId, status: 'ACTIVE' },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await this.usersRepository.update(
      { id: userId },
      { password: hashedNewPassword }
    );

    return { message: 'Password changed successfully' };
  }

  async validatePasswordStrength(password: string): Promise<boolean> {
    // Basic password strength validation
    if (password.length < 8) {
      return false;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length >= 3;
  }
}