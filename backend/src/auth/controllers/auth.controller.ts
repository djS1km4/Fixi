import {
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
  Response,
  Body,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LoginDto, RegisterDto, ChangePasswordDto } from '../dto/auth.dto';
import { CreateUserDto } from '../../common/dto/create-user.dto';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { Roles, UserRole } from '../decorators/roles.decorator';
import { UserEntity } from '../../common/entities/user.entity';

@ApiTags('authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Response() res,
  ) {
    const result = await this.authService.login(loginDto);

    // Set refresh token in HTTP-only cookie
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(HttpStatus.OK).json({
      message: 'Login successful',
      access_token: result.accessToken,
      user: result.user,
    });
  }

  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.authService.register(createUserDto);

    // Remove password from response
    const { password: _, ...result } = user;

    return {
      message: 'User created successfully',
      user: result,
    };
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @Post('refresh')
  async refreshToken(@Request() req) {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    const result = await this.authService.refreshToken(refreshToken);
    return {
      message: 'Token refreshed successfully',
      access_token: result.accessToken,
    };
  }

  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Response() res) {
    // Clear refresh token cookie
    res.clearCookie('refresh_token');

    return {
      message: 'Logout successful',
    };
  }

  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const user = req.user;

    const result = await this.authService.changePassword(
      user.userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );

    return result;
  }

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return {
      message: 'Profile retrieved successfully',
      user: req.user,
    };
  }

  @ApiOperation({ summary: 'Forgot password' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: { email: string }) {
    // TODO: Implementar envío de email con token de recuperación
    return {
      message: 'Password reset instructions sent to email',
    };
  }

  @ApiOperation({ summary: 'Reset password' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: { token: string; password: string }) {
    // TODO: Implementar validación de token y actualización de contraseña
    return {
      message: 'Password reset successful',
    };
  }
}