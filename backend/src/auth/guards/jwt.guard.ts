import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    return true;
  }
}

@Injectable()
export class RolesGuard {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', context.getHandler());
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    const hasRequiredRole = requiredRoles.some(role => user.role === role);
    return hasRequiredRole;
  }
}

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles, target);