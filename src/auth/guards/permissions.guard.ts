import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { SCOPES_KEY } from '../decorators/scopes.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(
      SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles && !requiredScopes) {
      return true;
    }

    const { authUser } = context.switchToHttp().getRequest();

    if (!authUser) {
      throw new UnauthorizedException('You are not authenticated.');
    }

    if (requiredRoles && authUser.roles?.length) {
      const hasRole = requiredRoles.some((role) =>
        authUser.roles.includes(role),
      );
      if (hasRole) return true;
    }

    if (requiredScopes && authUser.scopes?.length) {
      const hasScope = requiredScopes.some((scope) =>
        authUser.scopes.includes(scope),
      );
      if (hasScope) return true;
    }

    throw new ForbiddenException(
      'You do not have the required permissions to access this resource.',
    );
  }
}
